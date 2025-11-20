import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { ChevronLeft, Send, Mic, Play, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';

function AudioMessage({ item, isMyMessage }: { item: any, isMyMessage: boolean }) {
    const [sound, setSound] = useState<Audio.Sound | undefined>(undefined);
    const [isPlaying, setIsPlaying] = useState(false);
    // @ts-ignore
    const audioUrl = useQuery(api.messages.getAudioUrl, { storageId: item.message });

    async function playSound() {
        if (!audioUrl) return;
        try {
            if (sound) {
                await sound.unloadAsync();
                setSound(undefined);
                setIsPlaying(false);
                return;
            }

            const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
            setSound(newSound);
            setIsPlaying(true);
            await newSound.playAsync();
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                    setSound(undefined);
                }
            });
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    }

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    return (
        <TouchableOpacity onPress={playSound} className="flex-row items-center space-x-2">
            <View className={`w-8 h-8 rounded-full justify-center items-center ${isMyMessage ? 'bg-white/20' : 'bg-gray-200'}`}>
                {isPlaying ? (
                    <Square size={12} color={isMyMessage ? 'white' : 'black'} />
                ) : (
                    <Play size={12} color={isMyMessage ? 'white' : 'black'} />
                )}
            </View>
            <Text className={`${isMyMessage ? 'text-white' : 'text-gray-800'} font-medium`}>
                Voice Message
            </Text>
        </TouchableOpacity>
    );
}

export default function ChatScreen() {
    const { rideId } = useLocalSearchParams<{ rideId: string }>();
    const router = useRouter();
    const { userId } = useAuth();
    const [newMessage, setNewMessage] = useState("");
    const flatListRef = useRef<FlatList>(null);

    // Convex hooks
    // @ts-ignore
    const messages = useQuery(api.messages.getByRide, { ride_id: rideId });
    // @ts-ignore
    const sendMessage = useMutation(api.messages.send);
    // @ts-ignore
    const markAsRead = useMutation(api.messages.markAsRead);
    // @ts-ignore
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    // @ts-ignore
    const getAudioUrl = useQuery(api.messages.getAudioUrl);

    const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [sound, setSound] = useState<Audio.Sound | undefined>(undefined);
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

    useEffect(() => {
        if (rideId) {
            // @ts-ignore
            markAsRead({ ride_id: rideId });
        }
    }, [rideId, messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        try {
            await sendMessage({
                // @ts-ignore
                ride_id: rideId,
                message: newMessage.trim(),
            });
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    async function startRecording() {
        try {
            if (permissionResponse?.status !== 'granted') {
                console.log('Requesting permission..');
                await requestPermission();
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Starting recording..');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        console.log('Stopping recording..');
        if (!recording) return;

        setRecording(undefined);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);

        if (uri) {
            await uploadAndSendAudio(uri);
        }
    }

    async function uploadAndSendAudio(uri: string) {
        try {
            // 1. Get upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload file
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": "audio/m4a" },
                body: { uri, name: "voice_note.m4a", type: "audio/m4a" } as any,
            });
            const { storageId } = await result.json();

            // 3. Send message
            await sendMessage({
                // @ts-ignore
                ride_id: rideId,
                message: storageId, // Store storageId in message body for audio
                type: "audio",
                format: "audio/m4a",
            });
        } catch (error) {
            console.error("Failed to upload audio:", error);
        }
    }

    async function playSound(storageId: string, messageId: string) {
        try {
            if (sound) {
                await sound.unloadAsync();
                setSound(undefined);
                setPlayingMessageId(null);
                if (playingMessageId === messageId) return; // Toggle off
            }

            // We need to fetch the URL first since we only have storageId
            // Ideally, we should have a way to get the URL.
            // For now, let's assume the message body IS the URL or we fetch it.
            // Wait, the backend `getAudioUrl` takes a storageId.
            // We can't call hooks inside this function.
            // We'll need a separate component for AudioMessage to handle its own state and fetching.
        } catch (error) {
            console.error("Failed to play sound", error);
        }
    }

    const renderMessage = ({ item }: { item: any }) => {
        const isMyMessage = item.sender_clerk_id === userId;
        return (
            <View className={`flex-row mb-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                <View
                    className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${isMyMessage
                        ? 'bg-primary rounded-tr-none'
                        : 'bg-surface-secondary rounded-tl-none border border-gray-100'
                        }`}
                >
                    {item.type === 'audio' ? (
                        <AudioMessage item={item} isMyMessage={isMyMessage} />
                    ) : (
                        <Text className={`text-base ${isMyMessage ? 'text-white' : 'text-text-primary'}`}>
                            {item.message}
                        </Text>
                    )}
                    <Text className={`text-[10px] mt-1.5 ${isMyMessage ? 'text-blue-200' : 'text-text-secondary'}`}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (messages === undefined) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color="#1E3A8A" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white/90 border-b border-white/20 shadow-soft z-10">
                <View className="p-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-50 rounded-full justify-center items-center mr-4"
                    >
                        <ChevronLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-xl font-bold text-primary">Chat</Text>
                        <Text className="text-xs text-text-secondary">Ride #{rideId?.slice(-4)}</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <SafeAreaView edges={['bottom']} className="bg-white border-t border-gray-100 shadow-lg">
                    <View className="p-4 flex-row items-center">
                        <TextInput
                            className="flex-1 bg-gray-50 rounded-xl px-5 py-4 mr-3 text-text-primary border border-gray-200 text-base"
                            placeholder="Type a message..."
                            placeholderTextColor="#94a3b8"
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                            maxLength={500}
                        />
                        {newMessage.trim() ? (
                            <TouchableOpacity
                                onPress={handleSend}
                                className="w-14 h-14 rounded-xl justify-center items-center shadow-md bg-accent"
                            >
                                <Send size={24} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={recording ? stopRecording : startRecording}
                                className={`w-14 h-14 rounded-xl justify-center items-center shadow-md ${recording ? 'bg-red-500' : 'bg-gray-200'}`}
                            >
                                {recording ? (
                                    <Square size={24} color="white" />
                                ) : (
                                    <Mic size={24} color="#4b5563" />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}
