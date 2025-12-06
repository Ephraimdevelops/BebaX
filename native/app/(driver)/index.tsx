import React, { useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView, ActivityIndicator, Linking, Dimensions, StatusBar, AppState, AppStateStatus } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "expo-router";
import { Id } from "../../../convex/_generated/dataModel";
import { MapPin, Phone, MessageCircle, Navigation, DollarSign, User, History, ShieldCheck, ShieldAlert, Power, CheckCircle, Wallet } from "lucide-react-native";
import { styled } from "nativewind";
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming, withRepeat, withSequence, FadeInUp, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getIcon } from "../../components/VehicleIcons";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

// --- PREMIUM CLEAN MAP STYLE (Desaturated Silver) ---
const MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

// --- PULSING PUCK COMPONENT ---
const PulsingPuck = () => {
    const opacity = useSharedValue(0.3);
    const scale = useSharedValue(1);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                startAnimation();
            } else {
                stopAnimation();
            }
        });

        startAnimation();

        return () => {
            subscription.remove();
            stopAnimation();
        };
    }, []);

    const startAnimation = () => {
        opacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, false);
        scale.value = withRepeat(withTiming(2, { duration: 1500 }), -1, false);
    };

    const stopAnimation = () => {
        opacity.value = 0.3;
        scale.value = 1;
    };

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <View className="items-center justify-center">
            <Animated.View style={[animatedStyle, { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF5722', position: 'absolute' }]} />
            <View className="w-5 h-5 bg-[#FF5722] rounded-full border-2 border-white shadow-sm" />
        </View>
    );
};

export default function DriverDashboard() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [showPaidScreen, setShowPaidScreen] = useState(false);

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

    // Show Paid Screen Logic
    useEffect(() => {
        if (activeRide?.status === 'completed' && activeRide?.payment_method === 'wallet') {
            setShowPaidScreen(true);
        } else {
            setShowPaidScreen(false);
        }
    }, [activeRide]);

    const handleGoOnline = async (value: boolean) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await setOnlineStatus({ is_online: value });
            setIsOnline(value);
        } catch (error: any) {
            Alert.alert("Error", error.message);
            // Revert switch if failed
        }
    };

    const handleAcceptRide = async (rideId: Id<"rides">) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await acceptRide({ ride_id: rideId });
            Alert.alert("Success", "Ride accepted! Navigate to pickup location.");
        } catch (error) {
            Alert.alert("Error", "Failed to accept ride.");
        }
    };

    const handleUpdateStatus = async (status: "loading" | "ongoing" | "delivered" | "completed" | "cancelled") => {
        if (!activeRide) return;
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await updateRideStatus({ ride_id: activeRide._id, status });
            if (status === "completed" && activeRide.payment_method !== 'wallet') {
                Alert.alert("Trip Completed", "Collect Cash from Customer.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update status.");
        }
    };

    if (!user || !driver) {
        return (
            <StyledView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#FF5722" />
            </StyledView>
        );
    }

    // --- PAID BY WALLET SCREEN (B2B) ---
    if (showPaidScreen && activeRide) {
        return (
            <StyledView className="flex-1 bg-[#FF5722] items-center justify-center px-6">
                <StatusBar barStyle="light-content" backgroundColor="#FF5722" />

                <Animated.View entering={FadeInUp.springify()} className="items-center">
                    <View className="bg-white/20 p-6 rounded-full mb-6">
                        <CheckCircle size={64} color="#FFFFFF" />
                    </View>

                    <StyledText className="text-white font-bold text-3xl text-center mb-2">
                        PAID BY WALLET
                    </StyledText>
                    <StyledText className="text-white/90 text-lg text-center mb-8 font-medium">
                        DO NOT COLLECT CASH
                    </StyledText>

                    <View className="bg-white w-full p-6 rounded-3xl shadow-lg mb-8">
                        <View className="flex-row justify-between items-center mb-4">
                            <StyledText className="text-gray-500 font-bold uppercase text-xs">Amount Paid</StyledText>
                            <StyledText className="text-[#121212] font-bold text-2xl">
                                TZS {activeRide.final_fare?.toLocaleString() || activeRide.fare_estimate.toLocaleString()}
                            </StyledText>
                        </View>
                        <View className="w-full h-[1px] bg-gray-100 mb-4" />
                        <View className="flex-row justify-between items-center">
                            <StyledText className="text-gray-500 font-bold uppercase text-xs">Transaction ID</StyledText>
                            <StyledText className="text-gray-800 font-mono font-bold">
                                TX-{activeRide._id.slice(-4).toUpperCase()}
                            </StyledText>
                        </View>
                    </View>

                    <StyledText className="text-white/80 text-center mb-8 px-4">
                        This amount has been automatically added to your App Balance.
                    </StyledText>

                    <StyledTouchableOpacity
                        onPress={() => setShowPaidScreen(false)} // Dismiss locally, ride is already completed
                        className="bg-white w-full py-4 rounded-2xl shadow-lg"
                    >
                        <StyledText className="text-[#FF5722] font-bold text-center text-lg">
                            CLOSE & CONTINUE
                        </StyledText>
                    </StyledTouchableOpacity>
                </Animated.View>
            </StyledView>
        );
    }

    return (
        <StyledView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Map Background */}
            <View className="absolute top-0 left-0 w-full h-full">
                {location ? (
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ width: '100%', height: '100%' }}
                        customMapStyle={MAP_STYLE}
                        initialRegion={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        showsUserLocation={false} // We use custom puck
                    >
                        {/* Driver Puck */}
                        <Marker
                            coordinate={{
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            }}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <PulsingPuck />
                        </Marker>

                        {activeRide && activeRide.status !== 'completed' && (
                            <>
                                <Marker
                                    coordinate={{
                                        latitude: activeRide.pickup_location.lat,
                                        longitude: activeRide.pickup_location.lng,
                                    }}
                                    title="Pickup"
                                    pinColor="#FF5722"
                                />
                                <Marker
                                    coordinate={{
                                        latitude: activeRide.dropoff_location.lat,
                                        longitude: activeRide.dropoff_location.lng,
                                    }}
                                    title="Dropoff"
                                    pinColor="#121212"
                                />
                            </>
                        )}
                    </MapView>
                ) : (
                    <StyledView className="flex-1 justify-center items-center bg-white">
                        <ActivityIndicator color="#FF5722" />
                        <StyledText className="text-gray-400 mt-2">Locating...</StyledText>
                    </StyledView>
                )}
            </View>

            {/* Header - High Glance Style */}
            <SafeAreaView edges={['top']} className="absolute top-0 w-full z-50 pointer-events-box-none">
                <StyledView className="mx-4 mt-2 p-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-lg shadow-black/10 flex-row justify-between items-center border border-gray-100">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 bg-[#FF5722]/10 rounded-full justify-center items-center">
                            <User size={20} color="#FF5722" />
                        </View>
                        <View>
                            <StyledText className="font-bold text-[#121212] text-lg">{user.firstName || "Driver"}</StyledText>
                            <StyledText className={`text-xs font-bold uppercase ${isOnline ? 'text-[#00C853]' : 'text-gray-400'}`}>
                                {isOnline ? "Online" : "Offline"}
                            </StyledText>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                        {activeRide && activeRide.status !== 'completed' && (
                            <StyledTouchableOpacity
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
                                className="bg-red-50 px-3 py-2 rounded-full border border-red-100"
                            >
                                <StyledText className="text-red-600 font-bold text-xs">SOS</StyledText>
                            </StyledTouchableOpacity>
                        )}

                        {/* Sunlight Toggle */}
                        <StyledTouchableOpacity
                            onPress={() => handleGoOnline(!isOnline)}
                            className={`px-4 py-2 rounded-full border ${isOnline ? 'bg-[#00C853] border-[#00C853]' : 'bg-gray-100 border-gray-200'}`}
                        >
                            <StyledText className={`font-bold text-sm ${isOnline ? 'text-white' : 'text-gray-500'}`}>
                                {isOnline ? "GO OFFLINE" : "GO ONLINE"}
                            </StyledText>
                        </StyledTouchableOpacity>
                    </View>
                </StyledView>

                {/* Verification Warning Banner */}
                {!driver.verified && (
                    <StyledView className="mx-4 mt-2 bg-red-50 border border-red-100 p-4 rounded-2xl flex-row items-center shadow-sm">
                        <ShieldAlert size={24} color="#EF4444" className="mr-3" />
                        <View className="flex-1">
                            <StyledText className="font-bold text-red-600">Verification Pending</StyledText>
                            <StyledText className="text-red-500 text-xs mt-0.5">
                                You cannot go online until verified.
                            </StyledText>
                        </View>
                        <StyledTouchableOpacity
                            onPress={() => router.push("/(driver)/profile")}
                            className="bg-white px-3 py-2 rounded-xl border border-red-100"
                        >
                            <StyledText className="text-red-600 font-bold text-xs">Check Status</StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>
                )}
            </SafeAreaView>

            {/* Main Content Area */}
            <View className="flex-1 justify-end pb-8">

                {/* NO ACTIVE RIDE & ONLINE: Show Available Rides */}
                {isOnline && !activeRide && (
                    <View className="px-4 max-h-[60%]">
                        {availableRides.length === 0 ? (
                            <StyledView className="bg-white p-6 rounded-3xl items-center shadow-xl border border-gray-100 mx-4 mb-20">
                                <ActivityIndicator size="large" color="#FF5722" className="mb-4" />
                                <StyledText className="text-[#121212] font-bold text-lg">Searching for rides...</StyledText>
                                <StyledText className="text-gray-500 text-center mt-2">
                                    Stay in high demand areas to get more requests.
                                </StyledText>
                            </StyledView>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                {availableRides.map((ride) => {
                                    const VehicleIcon = getIcon(ride.vehicle_type);
                                    return (
                                        <Animated.View
                                            entering={SlideInUp.springify().damping(15)}
                                            key={ride._id}
                                            className="bg-white p-5 rounded-3xl shadow-xl mb-4 border border-gray-100"
                                        >
                                            <View className="flex-row justify-between items-start mb-4">
                                                <View className="flex-row items-center gap-2">
                                                    <View className="bg-gray-50 p-2 rounded-xl">
                                                        <VehicleIcon color="#121212" width={32} height={32} />
                                                    </View>
                                                    <View className="bg-[#FF5722]/10 px-3 py-1 rounded-full">
                                                        <StyledText className="text-[#FF5722] font-bold text-xs uppercase tracking-wider">
                                                            {ride.vehicle_type}
                                                        </StyledText>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Money Modal Typography */}
                                            <View className="mb-6">
                                                <StyledText className="text-4xl font-bold text-[#121212] tracking-tight">
                                                    TSh {ride.fare_estimate?.toLocaleString() || "Negotiable"}
                                                </StyledText>
                                                <StyledText className="text-gray-500 font-medium text-lg">
                                                    {ride.distance ? `${ride.distance.toFixed(1)} km total trip` : 'Distance calculating...'}
                                                </StyledText>
                                            </View>

                                            <View className="space-y-4 mb-6 bg-gray-50 p-4 rounded-2xl">
                                                <View className="flex-row items-start">
                                                    <MapPin size={20} color="#FF5722" className="mt-0.5 mr-3" />
                                                    <View className="flex-1">
                                                        <StyledText className="text-gray-400 text-xs uppercase font-bold mb-0.5">Pickup</StyledText>
                                                        <StyledText className="text-[#121212] font-semibold text-base" numberOfLines={2}>
                                                            {ride.pickup_location.address}
                                                        </StyledText>
                                                    </View>
                                                </View>
                                                <View className="w-full h-[1px] bg-gray-200" />
                                                <View className="flex-row items-start">
                                                    <MapPin size={20} color="#94A3B8" className="mt-0.5 mr-3" />
                                                    <View className="flex-1">
                                                        <StyledText className="text-gray-400 text-xs uppercase font-bold mb-0.5">Dropoff</StyledText>
                                                        <StyledText className="text-[#121212] font-semibold text-base" numberOfLines={2}>
                                                            {ride.dropoff_location.address}
                                                        </StyledText>
                                                    </View>
                                                </View>
                                            </View>

                                            <StyledTouchableOpacity
                                                onPress={() => handleAcceptRide(ride._id)}
                                                className="bg-[#FF5722] py-4 rounded-2xl shadow-lg shadow-orange-500/20 active:opacity-90"
                                            >
                                                <StyledText className="text-white text-center font-bold text-xl">ACCEPT RIDE</StyledText>
                                            </StyledTouchableOpacity>
                                        </Animated.View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* ACTIVE RIDE: Bottom Sheet UI */}
                {activeRide && activeRide.status !== 'completed' && (
                    <Animated.View entering={SlideInUp.springify()} className="bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-6 pb-10 border-t border-gray-100">
                        {/* Handle Bar */}
                        <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />

                        {/* Status & Actions Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <StyledText className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Current Status</StyledText>
                                <StyledText className="text-2xl font-bold text-[#FF5722] capitalize">{activeRide.status}</StyledText>
                            </View>
                            <View className="flex-row gap-3">
                                <StyledTouchableOpacity
                                    onPress={() => {
                                        if (activeRide.customer_phone) {
                                            Linking.openURL(`tel:${activeRide.customer_phone}`);
                                        } else {
                                            Alert.alert("Error", "Phone number unavailable");
                                        }
                                    }}
                                    className="w-12 h-12 bg-green-50 rounded-full justify-center items-center border border-green-100"
                                >
                                    <Phone size={24} color="#00C853" />
                                </StyledTouchableOpacity>
                                <StyledTouchableOpacity
                                    onPress={() => router.push(`/chat/${activeRide._id}`)}
                                    className="w-12 h-12 bg-blue-50 rounded-full justify-center items-center border border-blue-100"
                                >
                                    <MessageCircle size={24} color="#2979FF" />
                                </StyledTouchableOpacity>
                            </View>
                        </View>

                        {/* Ride Details */}
                        <StyledView className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                            <View className="flex-row items-start mb-4">
                                <View className="w-3 h-3 bg-[#FF5722] rounded-full mt-1.5 mr-3 shadow-sm" />
                                <View className="flex-1">
                                    <StyledText className="text-gray-400 text-xs font-bold uppercase mb-0.5">PICKUP</StyledText>
                                    <StyledText className="text-[#121212] font-semibold text-base">{activeRide.pickup_location.address}</StyledText>
                                </View>
                            </View>
                            <View className="flex-row items-start">
                                <View className="w-3 h-3 bg-gray-400 rounded-full mt-1.5 mr-3 shadow-sm" />
                                <View className="flex-1">
                                    <StyledText className="text-gray-400 text-xs font-bold uppercase mb-0.5">DROPOFF</StyledText>
                                    <StyledText className="text-[#121212] font-semibold text-base">{activeRide.dropoff_location.address}</StyledText>
                                </View>
                            </View>
                        </StyledView>

                        {/* Primary Action Button */}
                        {activeRide.status === "accepted" && (
                            <StyledTouchableOpacity
                                onPress={() => handleUpdateStatus("loading")}
                                className="bg-[#FF5722] py-4 rounded-2xl shadow-lg shadow-orange-500/20 flex-row justify-center items-center"
                            >
                                <Navigation size={20} color="white" className="mr-2" />
                                <StyledText className="text-white font-bold text-lg">ARRIVED AT PICKUP</StyledText>
                            </StyledTouchableOpacity>
                        )}
                        {activeRide.status === "loading" && (
                            <StyledTouchableOpacity
                                onPress={() => handleUpdateStatus("ongoing")}
                                className="bg-[#FF5722] py-4 rounded-2xl shadow-lg shadow-orange-500/20"
                            >
                                <StyledText className="text-white text-center font-bold text-lg">START TRIP</StyledText>
                            </StyledTouchableOpacity>
                        )}
                        {activeRide.status === "ongoing" && (
                            <StyledTouchableOpacity
                                onPress={() => handleUpdateStatus("delivered")}
                                className="bg-[#FF5722] py-4 rounded-2xl shadow-lg shadow-orange-500/20"
                            >
                                <StyledText className="text-white text-center font-bold text-lg">ARRIVED AT DROPOFF</StyledText>
                            </StyledTouchableOpacity>
                        )}
                        {activeRide.status === "delivered" && (
                            <StyledTouchableOpacity
                                onPress={() => handleUpdateStatus("completed")}
                                className="bg-[#00C853] py-4 rounded-2xl shadow-lg shadow-green-500/20"
                            >
                                <StyledText className="text-white text-center font-bold text-lg">COMPLETE TRIP</StyledText>
                            </StyledTouchableOpacity>
                        )}
                    </Animated.View>
                )}

                {/* Bottom Nav (Only when offline or idle) */}
                {!activeRide && !isOnline && (
                    <StyledView className="absolute bottom-8 left-4 right-4 flex-row justify-between bg-white p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
                        <StyledTouchableOpacity
                            onPress={() => router.push("/(driver)/wallet")}
                            className="flex-1 items-center py-3"
                        >
                            <DollarSign size={24} color="#FF5722" />
                            <StyledText className="text-[#FF5722] text-xs font-bold mt-1">Earnings</StyledText>
                        </StyledTouchableOpacity>
                        <View className="w-[1px] bg-gray-100 my-2" />
                        <StyledTouchableOpacity
                            onPress={() => router.push("/(driver)/history")}
                            className="flex-1 items-center py-3"
                        >
                            <History size={24} color="#94A3B8" />
                            <StyledText className="text-gray-400 text-xs font-medium mt-1">History</StyledText>
                        </StyledTouchableOpacity>
                        <View className="w-[1px] bg-gray-100 my-2" />
                        <StyledTouchableOpacity
                            onPress={() => router.push("/(driver)/profile")}
                            className="flex-1 items-center py-3"
                        >
                            <User size={24} color="#94A3B8" />
                            <StyledText className="text-gray-400 text-xs font-medium mt-1">Profile</StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>
                )}
            </View>
        </StyledView>
    );
}
