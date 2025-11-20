import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';

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
        // 1. Get upload URL
        const postUrl = await generateUploadUrl();

        // 2. Convert URI to Blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // 3. POST to Convex Storage
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
            Alert.alert("No Changes", "Please select at least one document to upload.");
            return;
        }

        setUploading(true);
        try {
            const updates: any = {};

            // Upload each selected image
            for (const [key, uri] of Object.entries(localImages)) {
                if (uri) {
                    const storageId = await uploadImageToConvex(uri);
                    updates[key] = storageId;
                }
            }

            // Save storage IDs to driver profile
            await uploadDocuments(updates);

            Alert.alert("Success", "Documents uploaded successfully!");
            router.back();
        } catch (err) {
            Alert.alert("Error", "Failed to upload documents.");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    if (!driver) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    // Helper component to display image from Storage ID or Local URI
    const DocumentImage = ({ storageId, localUri }: { storageId?: string, localUri?: string }) => {
        // If we have a local URI (newly selected), show it
        if (localUri) {
            return (
                <Image
                    source={{ uri: localUri }}
                    className="w-full h-48 rounded-lg bg-gray-100"
                    resizeMode="cover"
                />
            );
        }

        // If we have a storage ID (saved), we need to fetch the URL
        // Note: In a real app, we'd want to pre-fetch these URLs or use a component that handles it.
        // For simplicity, we'll use a separate component that queries the URL.
        if (storageId) {
            return <StorageImage storageId={storageId as any} />;
        }

        return (
            <View className="w-full h-48 bg-gray-100 rounded-lg mb-3 justify-center items-center border-2 border-dashed border-gray-300">
                <Text className="text-gray-400">No image selected</Text>
            </View>
        );
    };

    const renderDocSection = (title: string, type: keyof typeof localImages, currentStorageId?: string) => (
        <View className="mb-6 bg-white p-4 rounded-xl shadow-sm">
            <Text className="font-bold text-gray-800 mb-2">{title}</Text>

            <DocumentImage storageId={currentStorageId} localUri={localImages[type]} />

            <TouchableOpacity
                onPress={() => pickImage(type)}
                className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-3"
            >
                <Text className="text-blue-600 text-center font-medium">
                    {localImages[type] || currentStorageId ? "Change Photo" : "Select Photo"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-200 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Text className="text-2xl">←</Text>
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold">Documents</Text>
                </View>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={uploading}
                    className={`px-4 py-2 rounded-full ${uploading ? 'bg-gray-300' : 'bg-blue-600'}`}
                >
                    {uploading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text className="text-white font-bold">Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                <View className="bg-yellow-50 p-4 rounded-xl mb-6 border border-yellow-100">
                    <Text className="text-yellow-800 text-sm">
                        Please upload clear photos of your documents. Verification takes 24-48 hours.
                    </Text>
                </View>

                {renderDocSection("National ID (NIDA)", "nida_photo", driver.documents?.nida_photo)}
                {renderDocSection("Driver's License", "license_photo", driver.documents?.license_photo)}
                {renderDocSection("Vehicle Insurance", "insurance_photo", driver.documents?.insurance_photo)}
                {renderDocSection("Road Permit (LATRA)", "road_permit_photo", driver.documents?.road_permit_photo)}

                <View className="h-8" />
            </ScrollView>
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
