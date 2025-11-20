import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle, ShieldAlert, FileText, User } from 'lucide-react-native';

export default function AdminDashboard() {
    const router = useRouter();
    const unverifiedDrivers = useQuery(api.drivers.listUnverified);
    const verifyDriver = useMutation(api.drivers.verifyDriver);

    const handleVerify = async (driverId: any) => {
        try {
            await verifyDriver({ driver_id: driverId });
            Alert.alert("Success", "Driver verified successfully!");
        } catch (error) {
            Alert.alert("Error", "Failed to verify driver.");
        }
    };

    if (unverifiedDrivers === undefined) {
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
                    <Text className="text-xl font-bold text-primary">Admin Dashboard</Text>
                    <View className="w-10" />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                {/* SOS Alerts Section */}
                <SOSAlertsSection />

                <View className="mb-6">
                    <Text className="text-2xl font-bold text-text-primary">Pending Verifications</Text>
                    <Text className="text-text-secondary">Review and approve driver documents.</Text>
                </View>

                {unverifiedDrivers.length === 0 ? (
                    <View className="items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <View className="w-20 h-20 bg-green-50 rounded-full justify-center items-center mb-4">
                            <CheckCircle size={40} color="#16A34A" />
                        </View>
                        <Text className="text-lg font-bold text-text-primary">All Caught Up!</Text>
                        <Text className="text-text-secondary mt-1">No pending verifications at the moment.</Text>
                    </View>
                ) : (
                    unverifiedDrivers.map((driver: any) => (
                        <View key={driver._id} className="bg-white p-5 rounded-3xl mb-6 shadow-lg border border-gray-100">
                            <View className="flex-row justify-between items-start mb-4 border-b border-gray-50 pb-4">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-blue-50 rounded-full justify-center items-center mr-3">
                                        <User size={24} color="#1E3A8A" />
                                    </View>
                                    <View>
                                        <Text className="text-lg font-bold text-text-primary">{driver.name}</Text>
                                        <Text className="text-text-secondary text-sm">{driver.phone}</Text>
                                    </View>
                                </View>
                                <View className="bg-yellow-50 px-3 py-1 rounded-full flex-row items-center">
                                    <ShieldAlert size={12} color="#EAB308" className="mr-1" />
                                    <Text className="text-yellow-700 font-bold text-xs uppercase">Pending</Text>
                                </View>
                            </View>

                            <View className="flex-row mb-4 space-x-4">
                                <View className="flex-1 bg-gray-50 p-3 rounded-xl">
                                    <Text className="text-xs text-text-secondary uppercase font-bold mb-1">License</Text>
                                    <Text className="font-medium text-text-primary">{driver.license_number}</Text>
                                </View>
                                <View className="flex-1 bg-gray-50 p-3 rounded-xl">
                                    <Text className="text-xs text-text-secondary uppercase font-bold mb-1">NIDA</Text>
                                    <Text className="font-medium text-text-primary">{driver.nida_number}</Text>
                                </View>
                            </View>

                            <Text className="font-bold text-text-primary mb-3 flex-row items-center">
                                <FileText size={16} color="#64748B" className="mr-2" /> Documents
                            </Text>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
                                <DocPreview label="NIDA" storageId={driver.documents?.nida_photo} />
                                <DocPreview label="License" storageId={driver.documents?.license_photo} />
                                <DocPreview label="Insurance" storageId={driver.documents?.insurance_photo} />
                                <DocPreview label="Permit" storageId={driver.documents?.road_permit_photo} />
                            </ScrollView>

                            <TouchableOpacity
                                onPress={() => handleVerify(driver._id)}
                                className="bg-success py-3 rounded-xl shadow-md flex-row justify-center items-center"
                            >
                                <CheckCircle size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">Approve Driver</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}



function SOSAlertsSection() {
    const alerts = useQuery(api.sos.listActive) || [];
    const resolveAlert = useMutation(api.sos.resolve);

    if (alerts.length === 0) return null;

    return (
        <View className="mb-8 bg-red-50 p-4 rounded-3xl border border-red-100">
            <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-red-100 rounded-full justify-center items-center mr-3 animate-pulse">
                    <ShieldAlert size={24} color="#DC2626" />
                </View>
                <View>
                    <Text className="text-xl font-bold text-red-800">Active SOS Alerts</Text>
                    <Text className="text-red-600">Immediate attention required!</Text>
                </View>
            </View>

            {alerts.map((alert: any) => (
                <View key={alert._id} className="bg-white p-4 rounded-2xl mb-3 shadow-sm">
                    <View className="flex-row justify-between items-start">
                        <View>
                            <Text className="font-bold text-gray-800">User ID: {alert.user_clerk_id.slice(0, 8)}...</Text>
                            <Text className="text-gray-500 text-xs">{new Date(alert.created_at).toLocaleString()}</Text>
                            <Text className="text-gray-500 text-xs mt-1">
                                Loc: {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(
                                    "Resolve Alert",
                                    "Are you sure you have handled this emergency?",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Resolve",
                                            style: "destructive",
                                            onPress: () => resolveAlert({ alert_id: alert._id })
                                        }
                                    ]
                                );
                            }}
                            className="bg-red-600 px-4 py-2 rounded-xl"
                        >
                            <Text className="text-white font-bold">Resolve</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );
}

function DocPreview({ label, storageId }: { label: string, storageId?: string }) {
    if (!storageId) return null;
    return (
        <View className="mr-4">
            <StorageImage storageId={storageId} />
            <Text className="text-center text-xs mt-2 text-text-secondary font-medium">{label}</Text>
        </View>
    );
}

function StorageImage({ storageId }: { storageId: any }) {
    const url = useQuery(api.drivers.getImageUrl, { storageId });
    if (!url) return <View className="w-28 h-28 bg-gray-100 rounded-xl animate-pulse" />;
    return (
        <Image
            source={{ uri: url }}
            className="w-28 h-28 rounded-xl bg-gray-100 border border-gray-200"
            resizeMode="cover"
        />
    );
}
