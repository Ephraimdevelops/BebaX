import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { User, Phone, Mail, ChevronLeft, Camera, ShieldCheck, ShieldAlert, Trash2, FileText, CreditCard } from "lucide-react-native";

export default function DriverProfile() {
    const router = useRouter();
    const { signOut } = useAuth();
    const profile = useQuery(api.users.getCurrentProfile);
    const driver = useQuery(api.drivers.getCurrentDriver);
    const updateProfile = useMutation(api.users.updateProfile);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setPhone(profile.phone || "");
            setEmail(profile.email || "");
        }
    }, [profile]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                name,
                phone,
                email,
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

    if (!profile || !driver) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color="#1E3A8A" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface-secondary">
            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-white/90 border-b border-white/20 shadow-soft z-10">
                <View className="p-4 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-50 rounded-full justify-center items-center"
                    >
                        <ChevronLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-primary">Driver Profile</Text>
                    <View className="w-10" />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6 items-center">
                    <View className="relative mb-4">
                        <View className="w-28 h-28 bg-blue-50 rounded-full justify-center items-center border-4 border-white shadow-sm">
                            <User size={48} color="#1E3A8A" />
                        </View>
                        <TouchableOpacity className="absolute bottom-0 right-0 bg-accent p-2 rounded-full border-2 border-white shadow-sm">
                            <Camera size={16} color="white" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-2xl font-bold text-text-primary mb-1">{profile.name || "Driver"}</Text>
                    <View className={`flex-row items-center px-3 py-1 rounded-full ${driver.verified ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        {driver.verified ? (
                            <>
                                <ShieldCheck size={14} color="#16A34A" className="mr-1" />
                                <Text className="text-green-700 font-bold text-xs uppercase">Verified Driver</Text>
                            </>
                        ) : (
                            <>
                                <ShieldAlert size={14} color="#EAB308" className="mr-1" />
                                <Text className="text-yellow-700 font-bold text-xs uppercase">Verification Pending</Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Personal Info Form */}
                <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
                    <Text className="text-lg font-bold text-text-primary mb-4">Personal Information</Text>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-text-secondary text-xs font-bold uppercase mb-2 ml-1">Full Name</Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                                <User size={20} color="#64748B" className="mr-3" />
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    className="flex-1 text-text-primary font-medium text-base"
                                    placeholder="Enter your name"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-text-secondary text-xs font-bold uppercase mb-2 ml-1">Phone Number</Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                                <Phone size={20} color="#64748B" className="mr-3" />
                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    className="flex-1 text-text-primary font-medium text-base"
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-text-secondary text-xs font-bold uppercase mb-2 ml-1">Email Address</Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                                <Mail size={20} color="#64748B" className="mr-3" />
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    className="flex-1 text-text-primary font-medium text-base"
                                    placeholder="Enter email"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving}
                            className={`w-full py-4 rounded-2xl shadow-md mt-2 ${isSaving ? "bg-gray-300" : "bg-primary"}`}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-center font-bold text-lg">Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Vehicle & Account Details */}
                <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
                    <Text className="text-lg font-bold text-text-primary mb-4">Vehicle & Account</Text>

                    <View className="space-y-4">
                        <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-blue-50 rounded-full justify-center items-center mr-3">
                                    <FileText size={16} color="#1E3A8A" />
                                </View>
                                <View>
                                    <Text className="text-text-secondary text-xs uppercase">License Number</Text>
                                    <Text className="text-text-primary font-medium">{driver.license_number}</Text>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-blue-50 rounded-full justify-center items-center mr-3">
                                    <ShieldCheck size={16} color="#1E3A8A" />
                                </View>
                                <View>
                                    <Text className="text-text-secondary text-xs uppercase">NIDA Number</Text>
                                    <Text className="text-text-primary font-medium">{driver.nida_number}</Text>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center py-2">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-blue-50 rounded-full justify-center items-center mr-3">
                                    <CreditCard size={16} color="#1E3A8A" />
                                </View>
                                <View>
                                    <Text className="text-text-secondary text-xs uppercase">Payout Method</Text>
                                    <Text className="text-text-primary font-medium">
                                        {driver.payout_method ? `${driver.payout_method.toUpperCase()} - ${driver.payout_number}` : "Not set"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <TouchableOpacity
                    onPress={() => router.push("/(driver)/documents")}
                    className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 mb-4 flex-row justify-between items-center"
                >
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-orange-50 rounded-full justify-center items-center mr-3">
                            <FileText size={20} color="#F97316" />
                        </View>
                        <Text className="font-bold text-text-primary text-lg">Manage Documents</Text>
                    </View>
                    <ChevronLeft size={20} color="#94a3b8" style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    className="bg-red-50 p-5 rounded-2xl border border-red-100 mb-8 flex-row justify-center items-center"
                >
                    <Trash2 size={20} color="#DC2626" className="mr-2" />
                    <Text className="text-red-600 font-bold text-lg">Delete Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
