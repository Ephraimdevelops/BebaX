import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { Send, Phone, X, MessageCircle } from 'lucide-react-native';
import { Id } from '../../src/convex/_generated/dataModel';

interface ChatScreenProps {
    rideId: Id<"rides">;
    recipientName: string;
    recipientPhone?: string;
    currentUserId: string;
    onClose: () => void;
    quickReplies?: string[];
}

interface Message {
    _id: Id<"messages">;
    sender_clerk_id: string;
    message: string;
    timestamp: string;
    read: boolean;
    type?: "text" | "audio" | "image";
}

export default function ChatScreen({
    rideId,
    recipientName,
    recipientPhone,
    currentUserId,
    onClose,
    quickReplies = ["Niko njiani", "Nimefika", "Subiri kidogo"],
}: ChatScreenProps) {
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Real-time messages subscription
    const messages = useQuery(api.messages.getByRide, { ride_id: rideId }) || [];
    const sendMessage = useMutation(api.messages.send);
    const markAsRead = useMutation(api.messages.markAsRead);

    // Mark messages as read when opening chat
    useEffect(() => {
        if (rideId) {
            markAsRead({ ride_id: rideId }).catch(console.error);
        }
    }, [rideId, messages.length]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    const handleSend = async (text: string = inputText) => {
        if (!text.trim()) return;

        setSending(true);
        try {
            await sendMessage({
                ride_id: rideId,
                message: text.trim(),
                type: 'text',
            });
            setInputText('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleCall = () => {
        if (recipientPhone) {
            Linking.openURL(`tel:${recipientPhone}`);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender_clerk_id === currentUserId;
        const time = new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });

        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                    {item.message}
                </Text>
                <View style={styles.messageFooter}>
                    <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
                        {time}
                    </Text>
                    {isMe && item.read && (
                        <Text style={styles.readReceipt}>✓✓</Text>
                    )}
                </View>
            </View>
        );
    };

    const renderEmptyChat = () => (
        <View style={styles.emptyContainer}>
            <MessageCircle size={48} color={Colors.textDim} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Send a message to start the conversation</Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{recipientName}</Text>
                    <Text style={styles.headerStatus}>
                        {messages.length > 0 ? `${messages.length} messages` : 'Chat'}
                    </Text>
                </View>
                {recipientPhone && (
                    <TouchableOpacity onPress={handleCall} style={styles.callButton}>
                        <Phone size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                contentContainerStyle={[
                    styles.messagesList,
                    messages.length === 0 && styles.emptyList,
                ]}
                ListEmptyComponent={renderEmptyChat}
                showsVerticalScrollIndicator={false}
            />

            {/* Quick Replies */}
            <View style={styles.quickRepliesContainer}>
                {quickReplies.map((reply, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.quickReplyButton}
                        onPress={() => handleSend(reply)}
                        disabled={sending}
                    >
                        <Text style={styles.quickReplyText}>{reply}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Type a message..."
                    placeholderTextColor={Colors.textDim}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={() => handleSend()}
                    disabled={!inputText.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Send size={20} color="white" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    closeButton: {
        padding: 8,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    headerStatus: {
        fontSize: 13,
        color: Colors.textDim,
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    myMessage: {
        backgroundColor: Colors.primary,
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        backgroundColor: 'white',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    messageText: {
        fontSize: 15,
        color: Colors.text,
        lineHeight: 20,
    },
    myMessageText: {
        color: 'white',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    messageTime: {
        fontSize: 11,
        color: Colors.textDim,
    },
    myMessageTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    readReceipt: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textDim,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 4,
        textAlign: 'center',
    },
    quickRepliesContainer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 8,
    },
    quickReplyButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    quickReplyText: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.text,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: Colors.textDim,
    },
});
