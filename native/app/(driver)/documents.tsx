import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import { Clock, CheckCircle, XCircle, Camera, ArrowLeft } from 'lucide-react-native';

export default function DriverDocuments() {
    const router = useRouter();
    const driver = useQuery(api.drivers.getCurrentDriver);
    const generateUploadUrl = useMutation(api.drivers.generateUploadUrl);
    const uploadDocuments = useMutation(api.drivers.uploadDocuments);

    const [uploading, setUploading] = useState(false);
    const [localImages, setLocalImages] = useState<{
        nida_photo?: string;
        license_photo?: string;
        insurance_photo?: string;
        road_permit_photo?: string;
    }>({});

    const pickImage = async (type: keyof typeof localImages) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0].uri) {
            setLocalImages(prev => ({ ...prev, [type]: result.assets[0].uri }));
        }
    };

    const uploadImageToConvex = async (uri: string) => {
        const postUrl = await generateUploadUrl();
        const response = await fetch(uri);
        const blob = await response.blob();
        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": blob.type },
            body: blob,
        });
        const { storageId } = await result.json();
        return storageId;
    };

    const handleSave = async () => {
        if (Object.keys(localImages).length === 0) {
            Alert.alert("Hakuna Mabadiliko", "Tafadhali chagua picha moja.");
            return;
        }

        setUploading(true);
        try {
            const updates: any = {};
            for (const [key, uri] of Object.entries(localImages)) {
                if (uri) {
                    const storageId = await uploadImageToConvex(uri);
                    updates[key] = storageId;
                }
            }
            await uploadDocuments(updates);
            Alert.alert("Imetumwa!", "Nyaraka zimepakiwa kikamilifu.");
            router.back();
        } catch (err) {
            Alert.alert("Kosa", "Imeshindikana kupakia nyaraka.");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    if (!driver) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    const DocumentCard = ({ title, type, currentStorageId }: { title: string, type: keyof typeof localImages, currentStorageId?: string }) => {
        const hasImage = localImages[type] || currentStorageId;
        const isPending = hasImage && !localImages[type]; // Assuming if it's on server it's pending verification unless we have a status field. 
        // For now, we'll just show "Uploaded" state. Real verification status would come from backend.
        // User asked for: Pending (Amber Clock), Approved (Green Check), Rejected (Red X).
        // Since we don't have verification status in the schema yet, we will simulate "Pending" for uploaded docs.

        return (
            <TouchableOpacity
                onPress={() => pickImage(type)}
                className="mb-4 bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-gray-100 active:border-orange-500"
            >
                <View className="p-4 flex-row items-center justify-between bg-gray-50 border-b border-gray-100">
                    <Text className="text-lg font-bold text-gray-900">{title}</Text>
                    {hasImage ? (
                        <View className="flex-row items-center bg-yellow-100 px-3 py-1 rounded-full">
                            <Clock size={16} color="#ca8a04" />
                            <Text className="text-yellow-700 font-bold ml-2 text-xs">INAHAKIKIWA</Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center bg-gray-200 px-3 py-1 rounded-full">
                            <View className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                            <Text className="text-gray-600 font-bold text-xs">WEKA PICHA</Text>
                        </View>
                    )}
                </View>

                <View className="p-4 items-center justify-center min-h-[160px]">
                    {localImages[type] ? (
                        <Image source={{ uri: localImages[type] }} className="w-full h-48 rounded-xl" resizeMode="cover" />
                    ) : currentStorageId ? (
                        <StorageImage storageId={currentStorageId} />
                    ) : (
                        <View className="items-center justify-center py-6">
                            <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-3">
                                <Camera size={32} color="#ea580c" />
                            </View>
                            <Text className="text-gray-500 font-medium">Bonyeza kupiga picha</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="px-4 py-4 bg-white border-b border-gray-200 flex-row items-center justify-between shadow-sm z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-100 rounded-full">
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-extrabold text-gray-900">Nyaraka / Documents</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 p-4">
                <View className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100 flex-row items-start">
                    <View className="mr-3 mt-1">
                        <CheckCircle size={20} color="#2563eb" />
                    </View>
                    <Text className="text-blue-800 flex-1 leading-5">
                        Hakikisha picha zinasomeka vizuri. Tunahakiki ndani ya masaa 24.
                    </Text>
                </View>

                <DocumentCard
                    title="Kitambulisho / ID"
                    type="nida_photo"
                    currentStorageId={driver.documents?.nida_photo}
                />
                <DocumentCard
                    title="Leseni / License"
                    type="license_photo"
                    currentStorageId={driver.documents?.license_photo}
                />
                <DocumentCard
                    title="Bima / Insurance"
                    type="insurance_photo"
                    currentStorageId={driver.documents?.insurance_photo}
                />
                <DocumentCard
                    title="Kibali / Permit"
                    type="road_permit_photo"
                    currentStorageId={driver.documents?.road_permit_photo}
                />

                <View className="h-24" />
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={uploading}
                    className={`w-full py-4 rounded-xl flex-row items-center justify-center ${uploading ? 'bg-gray-300' : 'bg-orange-600 shadow-lg shadow-orange-200'
                        }`}
                >
                    {uploading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <CheckCircle size={24} color="white" className="mr-2" />
                            <Text className="text-white text-lg font-bold ml-2">TUMA / SUBMIT</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function StorageImage({ storageId }: { storageId: any }) {
    const url = useQuery(api.drivers.getImageUrl, { storageId });
    if (!url) return <View className="w-full h-48 bg-gray-100 rounded-lg animate-pulse" />;
    return (
        <Image
            source={{ uri: url }}
            className="w-full h-48 rounded-lg bg-gray-100"
            resizeMode="cover"
        />
    );
}
