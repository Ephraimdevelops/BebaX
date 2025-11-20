import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView, ActivityIndicator, Linking, Dimensions } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "expo-router";
import { Id } from "../../../convex/_generated/dataModel";
import { MapPin, Phone, MessageCircle, Navigation, DollarSign, User, History, ShieldCheck, ShieldAlert } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export default function DriverDashboard() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [isOnline, setIsOnline] = useState(false);

    const updateLocation = useMutation(api.drivers.updateLocation);
    const setOnlineStatus = useMutation(api.drivers.setOnlineStatus);
    const acceptRide = useMutation(api.rides.accept);
    const updateRideStatus = useMutation(api.rides.updateStatus);
    const triggerSOS = useMutation(api.sos.trigger);

    // Fetch available rides only when online
    const availableRides = useQuery(api.rides.listAvailableRides) || [];

    // Fetch active ride details (automatically updates when status changes)
    const activeRide = useQuery(api.rides.getDriverActiveRide);
    const driver = useQuery(api.drivers.getCurrentDriver);

    // Request permissions and get initial location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Denied", "Allow location access to drive.");
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, []);

    // Background location tracking    // Update driver location periodically when online
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isOnline) {
            interval = setInterval(async () => {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);

                if (loc) {
                    await updateLocation({
                        location: {
                            lat: loc.coords.latitude,
                            lng: loc.coords.longitude,
                        },
                    });
                }
            }, 10000); // Update every 10 seconds
        }
        return () => clearInterval(interval);
    }, [isOnline]);

    const handleGoOnline = async (value: boolean) => {
        try {
            await setOnlineStatus({ is_online: value });
            setIsOnline(value);
        } catch (error: any) {
            Alert.alert("Error", error.message);
            // Revert switch if failed
        }
    };

    const handleAcceptRide = async (rideId: Id<"rides">) => {
        try {
            await acceptRide({ ride_id: rideId });
            Alert.alert("Success", "Ride accepted! Navigate to pickup location.");
        } catch (error) {
            Alert.alert("Error", "Failed to accept ride.");
        }
    };

    const handleUpdateStatus = async (status: "loading" | "ongoing" | "delivered" | "completed" | "cancelled") => {
        if (!activeRide) return;
        try {
            await updateRideStatus({ ride_id: activeRide._id, status });
            if (status === "completed") {
                Alert.alert("Trip Completed", "Great job! You are now available for new rides.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update status.");
        }
    };

    if (!user || !driver) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color="#1E3A8A" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface-secondary">
            {/* Map Background - Always visible but covered by UI when needed */}
            <View className="absolute top-0 left-0 w-full h-full">
                {location ? (
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        className="w-full h-full"
                        initialRegion={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        showsUserLocation
                        userInterfaceStyle="light"
                    >
                        {activeRide && (
                            <>
                                <Marker
                                    coordinate={{
                                        latitude: activeRide.pickup_location.lat,
                                        longitude: activeRide.pickup_location.lng,
                                    }}
                                    title="Pickup"
                                    pinColor="#1E3A8A"
                                />
                                <Marker
                                    coordinate={{
                                        latitude: activeRide.dropoff_location.lat,
                                        longitude: activeRide.dropoff_location.lng,
                                    }}
                                    title="Dropoff"
                                    pinColor="#F97316"
                                />
                            </>
                        )}
                    </MapView>
                ) : (
                    <View className="flex-1 justify-center items-center bg-gray-100">
                        <ActivityIndicator color="#1E3A8A" />
                        <Text className="text-text-secondary mt-2">Locating...</Text>
                    </View>
                )}
            </View>

            {/* Header - Glassmorphism Style */}
            <SafeAreaView edges={['top']} className="absolute top-0 w-full z-50">
                <View className="mx-4 mt-2 p-4 bg-white/90 rounded-3xl shadow-soft flex-row justify-between items-center border border-white/20">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 bg-primary/10 rounded-full justify-center items-center">
                            <User size={20} color="#1E3A8A" />
                        </View>
                        <View>
                            <Text className="font-bold text-text-primary text-lg">{user.firstName || "Driver"}</Text>
                            <View className="flex-row items-center">
                                <View className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <Text className="text-text-secondary text-xs font-medium">
                                    {isOnline ? "Online" : "Offline"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                        {activeRide && (
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert(
                                        "Emergency SOS",
                                        "Are you in danger? This will alert our support team.",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                                text: "TRIGGER SOS",
                                                style: "destructive",
                                                onPress: async () => {
                                                    try {
                                                        await triggerSOS({
                                                            ride_id: activeRide._id,
                                                            location: {
                                                                lat: location?.coords.latitude || 0,
                                                                lng: location?.coords.longitude || 0,
                                                            }
                                                        });
                                                        Alert.alert("SOS Triggered", "Help is on the way. Support has been notified.");
                                                    } catch (err) {
                                                        Alert.alert("Error", "Failed to trigger SOS.");
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }}
                                className="bg-red-500 px-3 py-2 rounded-full shadow-soft border border-red-400"
                            >
                                <Text className="text-white font-bold text-xs">SOS</Text>
                            </TouchableOpacity>
                        )}

                        <Switch
                            value={isOnline}
                            onValueChange={handleGoOnline}
                            trackColor={{ false: "#E2E8F0", true: "#1E3A8A" }}
                            thumbColor={"#FFFFFF"}
                            ios_backgroundColor="#E2E8F0"
                            style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                        />
                    </View>
                </View>

                {/* Verification Warning Banner */}
                {!driver.verified && (
                    <View className="mx-4 mt-2 bg-red-50 border border-red-100 p-4 rounded-2xl shadow-sm flex-row items-center">
                        <ShieldAlert size={24} color="#DC2626" className="mr-3" />
                        <View className="flex-1">
                            <Text className="font-bold text-red-800">Verification Pending</Text>
                            <Text className="text-red-600 text-xs mt-0.5">
                                You cannot go online until verified.
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push("/(driver)/profile")}
                            className="bg-white px-3 py-2 rounded-xl border border-red-100"
                        >
                            <Text className="text-red-700 font-bold text-xs">Check Status</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>

            {/* Main Content Area */}
            <View className="flex-1 justify-end pb-8">

                {/* NO ACTIVE RIDE & ONLINE: Show Available Rides */}
                {isOnline && !activeRide && (
                    <View className="px-4 max-h-[60%]">
                        <Text className="text-xl font-bold text-white mb-4 shadow-md">
                            Available Rides ({availableRides.length})
                        </Text>

                        {availableRides.length === 0 ? (
                            <View className="bg-white p-6 rounded-3xl items-center shadow-lg">
                                <ActivityIndicator size="large" color="#1E3A8A" className="mb-4" />
                                <Text className="text-text-primary font-bold text-lg">Searching for rides...</Text>
                                <Text className="text-text-secondary text-center mt-2">
                                    Stay in high demand areas to get more requests.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                {availableRides.map((ride) => (
                                    <View key={ride._id} className="bg-white p-5 rounded-3xl shadow-lg mb-4 border border-gray-100">
                                        <View className="flex-row justify-between items-start mb-4">
                                            <View className="bg-blue-50 px-3 py-1 rounded-full">
                                                <Text className="text-primary font-bold text-xs uppercase tracking-wider">
                                                    {ride.vehicle_type}
                                                </Text>
                                            </View>
                                            <Text className="text-2xl font-bold text-accent">
                                                TSh {ride.fare_estimate?.toLocaleString() || "Negotiable"}
                                            </Text>
                                        </View>

                                        <View className="space-y-3 mb-6">
                                            <View className="flex-row items-start">
                                                <MapPin size={18} color="#1E3A8A" className="mt-1 mr-2" />
                                                <View className="flex-1">
                                                    <Text className="text-text-secondary text-xs uppercase">Pickup</Text>
                                                    <Text className="text-text-primary font-medium" numberOfLines={1}>
                                                        {ride.pickup_location.address}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="w-0.5 h-4 bg-gray-200 ml-2.5" />
                                            <View className="flex-row items-start">
                                                <MapPin size={18} color="#F97316" className="mt-1 mr-2" />
                                                <View className="flex-1">
                                                    <Text className="text-text-secondary text-xs uppercase">Dropoff</Text>
                                                    <Text className="text-text-primary font-medium" numberOfLines={1}>
                                                        {ride.dropoff_location.address}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => handleAcceptRide(ride._id)}
                                            className="bg-accent py-4 rounded-2xl shadow-md active:opacity-90"
                                        >
                                            <Text className="text-white text-center font-bold text-lg">Accept Ride</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* ACTIVE RIDE: Bottom Sheet UI */}
                {activeRide && (
                    <View className="bg-white rounded-t-3xl shadow-xl p-6 pb-10 border-t border-gray-100">
                        {/* Handle Bar */}
                        <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />

                        {/* Status & Actions Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-text-secondary text-xs uppercase font-bold tracking-wider mb-1">Current Status</Text>
                                <Text className="text-2xl font-bold text-primary capitalize">{activeRide.status}</Text>
                            </View>
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => {
                                        if (activeRide.customer_phone) {
                                            Linking.openURL(`tel:${activeRide.customer_phone}`);
                                        } else {
                                            Alert.alert("Error", "Phone number unavailable");
                                        }
                                    }}
                                    className="w-12 h-12 bg-green-50 rounded-full justify-center items-center border border-green-100"
                                >
                                    <Phone size={24} color="#16A34A" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => router.push(`/chat/${activeRide._id}`)}
                                    className="w-12 h-12 bg-blue-50 rounded-full justify-center items-center border border-blue-100"
                                >
                                    <MessageCircle size={24} color="#1E3A8A" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Ride Details */}
                        <View className="bg-surface-secondary p-4 rounded-2xl mb-6 border border-gray-100">
                            <View className="flex-row items-start mb-3">
                                <View className="w-2 h-2 bg-primary rounded-full mt-2 mr-3" />
                                <View className="flex-1">
                                    <Text className="text-text-secondary text-xs">PICKUP</Text>
                                    <Text className="text-text-primary font-medium">{activeRide.pickup_location.address}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-start">
                                <View className="w-2 h-2 bg-accent rounded-full mt-2 mr-3" />
                                <View className="flex-1">
                                    <Text className="text-text-secondary text-xs">DROPOFF</Text>
                                    <Text className="text-text-primary font-medium">{activeRide.dropoff_location.address}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Primary Action Button */}
                        {activeRide.status === "accepted" && (
                            <TouchableOpacity
                                onPress={() => handleUpdateStatus("loading")}
                                className="bg-primary py-4 rounded-2xl shadow-lg flex-row justify-center items-center"
                            >
                                <Navigation size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">Arrived at Pickup</Text>
                            </TouchableOpacity>
                        )}
                        {activeRide.status === "loading" && (
                            <TouchableOpacity
                                onPress={() => handleUpdateStatus("ongoing")}
                                className="bg-primary py-4 rounded-2xl shadow-lg"
                            >
                                <Text className="text-white text-center font-bold text-lg">Start Trip</Text>
                            </TouchableOpacity>
                        )}
                        {activeRide.status === "ongoing" && (
                            <TouchableOpacity
                                onPress={() => handleUpdateStatus("delivered")}
                                className="bg-accent py-4 rounded-2xl shadow-lg"
                            >
                                <Text className="text-white text-center font-bold text-lg">Arrived at Dropoff</Text>
                            </TouchableOpacity>
                        )}
                        {activeRide.status === "delivered" && (
                            <TouchableOpacity
                                onPress={() => handleUpdateStatus("completed")}
                                className="bg-black py-4 rounded-2xl shadow-lg"
                            >
                                <Text className="text-white text-center font-bold text-lg">Complete Trip</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Bottom Nav (Only when offline or idle) */}
                {!activeRide && !isOnline && (
                    <View className="absolute bottom-8 left-4 right-4 flex-row justify-between bg-white p-2 rounded-3xl shadow-xl border border-gray-100">
                        <TouchableOpacity
                            onPress={() => router.push("/(driver)/wallet")}
                            className="flex-1 items-center py-3"
                        >
                            <DollarSign size={24} color="#1E3A8A" />
                            <Text className="text-primary text-xs font-bold mt-1">Earnings</Text>
                        </TouchableOpacity>
                        <View className="w-[1px] bg-gray-100 my-2" />
                        <TouchableOpacity
                            onPress={() => router.push("/(driver)/history")}
                            className="flex-1 items-center py-3"
                        >
                            <History size={24} color="#64748B" />
                            <Text className="text-text-secondary text-xs font-medium mt-1">History</Text>
                        </TouchableOpacity>
                        <View className="w-[1px] bg-gray-100 my-2" />
                        <TouchableOpacity
                            onPress={() => router.push("/(driver)/profile")}
                            className="flex-1 items-center py-3"
                        >
                            <User size={24} color="#64748B" />
                            <Text className="text-text-secondary text-xs font-medium mt-1">Profile</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}
