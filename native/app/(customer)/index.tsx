import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Modal, TextInput, ScrollView, Alert, Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function CustomerDashboard() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const createRide = useMutation(api.rides.create);
    const rateRide = useMutation(api.rides.rateRide);
    const triggerSOS = useMutation(api.sos.trigger);

    // Fetch active ride with driver location
    const activeRide = useQuery(api.rides.getActiveRide);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [pickupAddress, setPickupAddress] = useState("");
    const [dropoffAddress, setDropoffAddress] = useState("");
    const [vehicleType, setVehicleType] = useState("tricycle");
    const [cargoDetails, setCargoDetails] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [insuranceOptIn, setInsuranceOptIn] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    // Rating state
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState("");
    const [tip, setTip] = useState("");

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Denied", "Allow location access to book rides.");
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
            // Reverse geocode to get initial address (simplified)
            setPickupAddress("Current Location");
        })();
    }, []);

    // Show rating modal when ride is completed and not yet rated
    useEffect(() => {
        if (activeRide?.status === "completed" && !activeRide.driver_rating) {
            setRatingModalVisible(true);
        }
    }, [activeRide]);

    const handleSignOut = async () => {
        await signOut();
        router.replace("/");
    };

    const handleBookRide = async () => {
        if (!location || !pickupAddress || !dropoffAddress || !cargoDetails) {
            Alert.alert("Missing Info", "Please fill in all fields.");
            return;
        }

        setIsBooking(true);
        try {
            await createRide({
                pickup_location: {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    address: pickupAddress,
                },
                dropoff_location: {
                    lat: location.coords.latitude + 0.01, // Mock dropoff for now
                    lng: location.coords.longitude + 0.01,
                    address: dropoffAddress,
                },
                vehicle_type: vehicleType as any,
                cargo_details: cargoDetails,
                insurance_opt_in: insuranceOptIn,
                payment_method: paymentMethod as "cash" | "mobile_money",
            });

            Alert.alert("Success", "Ride requested! Waiting for drivers...");
            setBookingModalVisible(false);
            setDropoffAddress("");
            setCargoDetails("");
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to request ride. Please try again.");
        } finally {
            setIsBooking(false);
        }
    };

    const handleSubmitRating = async () => {
        if (!activeRide) return;
        try {
            await rateRide({
                ride_id: activeRide._id,
                rating: rating,
                review: review,
                tip_amount: tip ? parseInt(tip) : undefined,
            });
            setRatingModalVisible(false);
            Alert.alert("Thank you!", "Your feedback helps us improve.");
        } catch (err) {
            Alert.alert("Error", "Failed to submit rating.");
        }
    };

    if (!location) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-4 text-gray-500">Locating you...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface-secondary">
            {/* Floating Header */}
            <SafeAreaView className="absolute top-0 w-full z-10 pointer-events-none">
                <View className="px-4 pt-2 flex-row justify-between items-center pointer-events-auto">
                    <TouchableOpacity
                        onPress={() => router.push("/(customer)/profile")}
                        className="bg-white p-2 rounded-full shadow-soft border border-gray-100"
                    >
                        <View className="w-10 h-10 bg-primary-light rounded-full items-center justify-center">
                            <Text className="text-white font-bold text-lg">
                                {user?.firstName?.charAt(0) || "U"}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-soft border border-white/20">
                        <Text className="font-bold text-primary-dark">BebaX</Text>
                    </View>

                    <View className="flex-row gap-2">
                        {activeRide && (
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert(
                                        "Emergency SOS",
                                        "Are you in danger? This will alert our support team and your emergency contacts.",
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
                                className="bg-red-500 p-3 rounded-full shadow-soft border border-red-400 animate-pulse"
                            >
                                <Text className="text-white font-bold text-xs">SOS</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity className="bg-white p-3 rounded-full shadow-soft border border-gray-100">
                            <Text className="text-xl">🔔</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            {/* Map Layer */}
            <View className="flex-1">
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
                        customMapStyle={[
                            {
                                "featureType": "poi",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#747474" }, { "lightness": "40" }]
                            }
                        ]}
                    >
                        {/* Show Driver Marker if active ride exists and driver has location */}
                        {activeRide?.driver_location && activeRide.status !== 'completed' && (
                            <Marker
                                coordinate={{
                                    latitude: activeRide.driver_location.lat,
                                    longitude: activeRide.driver_location.lng,
                                }}
                                title="Your Driver"
                                description="On the way"
                            >
                                <View className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg">
                                    <Text className="text-white font-bold text-xs">🚚</Text>
                                </View>
                            </Marker>
                        )}
                    </MapView>
                ) : (
                    <View className="flex-1 justify-center items-center bg-gray-100">
                        <ActivityIndicator size="large" color="#1e3a8a" />
                    </View>
                )}
            </View>

            {/* Bottom Action Panel */}
            <View className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-card">
                {!activeRide ? (
                    <View className="p-6 pb-10">
                        <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />

                        <Text className="text-2xl font-bold text-primary-dark mb-6">Where to?</Text>

                        <View className="space-y-4">
                            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <Text className="text-green-500 mr-3 text-lg">●</Text>
                                <TextInput
                                    placeholder="Current Location"
                                    className="flex-1 font-medium text-gray-800"
                                    editable={false}
                                    value="Current Location"
                                />
                            </View>

                            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <Text className="text-red-500 mr-3 text-lg">📍</Text>
                                <TextInput
                                    placeholder="Enter Destination"
                                    className="flex-1 font-medium text-gray-800"
                                    value={dropoffAddress}
                                    onChangeText={setDropoffAddress}
                                />
                            </View>

                            {/* Vehicle Selection Scroll */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-4">
                                {[
                                    { id: 'tricycle', icon: '🛺', name: 'Tricycle', price: '15k' },
                                    { id: 'van', icon: '🚐', name: 'Van', price: '45k' },
                                    { id: 'truck', icon: '🚛', name: 'Truck', price: '120k' },
                                ].map((v) => (
                                    <TouchableOpacity
                                        key={v.id}
                                        onPress={() => setVehicleType(v.id)}
                                        className={`mr-4 p-4 rounded-2xl border-2 w-32 ${vehicleType === v.id
                                            ? 'border-primary bg-blue-50'
                                            : 'border-gray-100 bg-white'
                                            }`}
                                    >
                                        <Text className="text-3xl mb-2">{v.icon}</Text>
                                        <Text className={`font-bold ${vehicleType === v.id ? 'text-primary' : 'text-gray-600'}`}>
                                            {v.name}
                                        </Text>
                                        <Text className="text-xs text-gray-400">Est. {v.price}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity
                                onPress={handleBookRide}
                                disabled={!dropoffAddress}
                                className={`w-full p-5 rounded-2xl shadow-lg ${dropoffAddress ? 'bg-primary shadow-blue-900/25' : 'bg-gray-300'
                                    }`}
                            >
                                {isBooking ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-center font-bold text-xl">
                                        Request Ride
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    /* Active Ride Status Card */
                    <View className="p-6 pb-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-sm text-gray-500 uppercase font-bold tracking-wider">Status</Text>
                                <Text className="text-2xl font-bold text-primary-dark capitalize">{activeRide.status}</Text>
                            </View>
                            <View className="bg-blue-50 px-4 py-2 rounded-full">
                                <Text className="text-primary font-bold">5 min away</Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                            <View className="h-full bg-accent w-1/3 rounded-full" />
                        </View>

                        {/* Driver Info */}
                        <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl mb-4">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-gray-200 rounded-full mr-3" />
                                <View>
                                    <Text className="font-bold text-lg text-primary-dark">Your Driver</Text>
                                    <Text className="text-gray-500">4.9 ⭐ • Toyota Van</Text>
                                </View>
                            </View>
                            <TouchableOpacity className="bg-green-50 p-3 rounded-full">
                                <Text className="text-2xl">📞</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Booking Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={bookingModalVisible}
                    onRequestClose={() => setBookingModalVisible(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-3xl p-6 h-3/4">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-2xl font-bold">Request Ride</Text>
                                <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                                    <Text className="text-gray-500 text-lg">Close</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="space-y-4">
                                <View>
                                    <Text className="text-gray-600 mb-2 font-medium">Pickup</Text>
                                    <TextInput
                                        value={pickupAddress}
                                        onChangeText={setPickupAddress}
                                        className="bg-gray-100 p-4 rounded-xl"
                                        placeholder="Enter pickup location"
                                    />
                                </View>

                                <View>
                                    <Text className="text-gray-600 mb-2 font-medium">Dropoff</Text>
                                    <TextInput
                                        value={dropoffAddress}
                                        onChangeText={setDropoffAddress}
                                        className="bg-gray-100 p-4 rounded-xl"
                                        placeholder="Enter dropoff location"
                                    />
                                </View>

                                <View>
                                    <Text className="text-gray-600 mb-2 font-medium">Vehicle Type</Text>
                                    <View className="flex-row space-x-2">
                                        {["tricycle", "van", "truck"].map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => setVehicleType(type)}
                                                className={`px-4 py-2 rounded-full border ${vehicleType === type
                                                    ? "bg-blue-600 border-blue-600"
                                                    : "bg-white border-gray-300"
                                                    }`}
                                            >
                                                <Text
                                                    className={
                                                        vehicleType === type ? "text-white" : "text-gray-600"
                                                    }
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-600 mb-2 font-medium">Cargo Details</Text>
                                    <TextInput
                                        value={cargoDetails}
                                        onChangeText={setCargoDetails}
                                        className="bg-gray-100 p-4 rounded-xl h-24"
                                        placeholder="Describe your cargo (e.g., 2 boxes, 50kg)"
                                        multiline
                                    />
                                </View>

                                <View>
                                    <TouchableOpacity
                                        onPress={() => setInsuranceOptIn(!insuranceOptIn)}
                                        className={`flex-row items-center p-4 rounded-xl border ${insuranceOptIn ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        <View className={`w-6 h-6 rounded border mr-3 items-center justify-center ${insuranceOptIn ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                                            {insuranceOptIn && <Text className="text-white font-bold">✓</Text>}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-bold text-gray-800">Protect your Cargo 🛡️</Text>
                                            <Text className="text-xs text-gray-500">Get insurance coverage for just 2,000 TZS</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View>
                                    <Text className="text-gray-600 mb-2 font-medium">Payment Method</Text>
                                    <View className="flex-row space-x-2">
                                        {["cash", "mobile_money"].map((method) => (
                                            <TouchableOpacity
                                                key={method}
                                                onPress={() => setPaymentMethod(method)}
                                                className={`px-4 py-2 rounded-full border ${paymentMethod === method
                                                    ? "bg-green-600 border-green-600"
                                                    : "bg-white border-gray-300"
                                                    }`}
                                            >
                                                <Text
                                                    className={
                                                        paymentMethod === method ? "text-white" : "text-gray-600"
                                                    }
                                                >
                                                    {method === "cash" ? "Cash 💵" : "Mobile Money 📱"}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleBookRide}
                                    disabled={isBooking}
                                    className={`w-full py-4 rounded-xl mt-4 ${isBooking ? "bg-gray-400" : "bg-blue-600"
                                        }`}
                                >
                                    {isBooking ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white text-center font-bold text-lg">
                                            Request Ride
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Rating Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={ratingModalVisible}
                    onRequestClose={() => { }}
                >
                    <View className="flex-1 justify-center items-center bg-black/70 p-4">
                        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
                            <Text className="text-2xl font-bold text-center mb-2">Trip Completed!</Text>
                            <Text className="text-gray-500 text-center mb-6">How was your driver?</Text>

                            <View className="flex-row justify-center space-x-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                        <Text className="text-4xl">{star <= rating ? "⭐" : "☆"}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                value={review}
                                onChangeText={setReview}
                                className="bg-gray-100 p-4 rounded-xl mb-4 h-24"
                                placeholder="Write a review (optional)"
                                multiline
                            />

                            <TextInput
                                value={tip}
                                onChangeText={setTip}
                                className="bg-gray-100 p-4 rounded-xl mb-6"
                                placeholder="Add a tip (TSh) - Optional"
                                keyboardType="numeric"
                            />

                            <TouchableOpacity
                                onPress={handleSubmitRating}
                                className="bg-blue-600 py-4 rounded-xl"
                            >
                                <Text className="text-white text-center font-bold text-lg">Submit Rating</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>
    );
}
