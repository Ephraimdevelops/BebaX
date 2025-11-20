import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";

export default function CustomerProfile() {
    const router = useRouter();
    const { signOut } = useAuth();
    const profile = useQuery(api.users.getCurrentProfile);
    const updateProfile = useMutation(api.users.updateProfile);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setPhone(profile.phone || "");
            setEmail(profile.email || "");
            setAddress(profile.defaultAddress?.address || "");
        }
    }, [profile]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let locationData = undefined;

            // If address changed and is not empty, try to geocode it (mocked for now or use current location)
            if (address && address !== profile?.defaultAddress?.address) {
                // For simplicity in this version, we'll just save the text address with 0,0 coords
                // In a real app, we'd use Google Places API or Expo Location to geocode
                locationData = {
                    lat: 0,
                    lng: 0,
                    address: address
                };
            }

            await updateProfile({
                name,
                phone,
                email,
                defaultAddress: locationData
            });
            Alert.alert("Success", "Profile updated successfully!");
        } catch (err) {
            Alert.alert("Error", "Failed to update profile.");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteUser = useMutation(api.users.deleteUser);

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteUser();
                            Alert.alert("Account Deleted", "Your account has been deleted.");
                            await signOut();
                            router.replace("/");
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete account.");
                        }
                    }
                }
            ]
        );
    };

    if (!profile) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-bold">Edit Profile</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                <View className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <View className="items-center mb-6">
                        <View className="w-24 h-24 bg-blue-100 rounded-full justify-center items-center mb-2">
                            <Text className="text-4xl">👤</Text>
                        </View>
                        <Text className="text-gray-500">Tap to change photo</Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-600 mb-1 font-medium">Full Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                            placeholder="Enter your name"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-600 mb-1 font-medium">Phone Number</Text>
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-600 mb-1 font-medium">Email Address</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                            placeholder="Enter email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-gray-600 mb-1 font-medium">Default Address (Home/Work)</Text>
                        <TextInput
                            value={address}
                            onChangeText={setAddress}
                            className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                            placeholder="e.g. Mikocheni B, Dar es Salaam"
                        />
                        <Text className="text-xs text-gray-400 mt-1">
                            Used for faster pickup location selection
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isSaving}
                        className={`w-full py-4 rounded-xl ${isSaving ? "bg-gray-400" : "bg-blue-600"}`}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-bold text-lg">Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    className="p-4 rounded-xl border border-red-200 bg-red-50 mb-8"
                >
                    <Text className="text-red-600 text-center font-bold">Delete Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
