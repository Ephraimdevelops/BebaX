import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import ngeohash from 'ngeohash';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Navigation, DollarSign } from 'lucide-react-native';

export default function DriverHomeScreen() {
    const router = useRouter();
    const { location, errorMsg } = useDriverLocation();
    const [currentGeohash, setCurrentGeohash] = useState<string>('');

    // Update geohash when location changes
    useEffect(() => {
        if (location) {
            const hash = ngeohash.encode(location.coords.latitude, location.coords.longitude);
            console.log("📍 Driver Geohash:", hash); // VERIFICATION LOG
            setCurrentGeohash(hash);
        }
    }, [location]);

    // Subscribe to open rides
    const openRides = useQuery(api.rides.getOpenRides,
        currentGeohash ? { geohash: currentGeohash } : "skip"
    );

    const acceptRide = useMutation(api.rides.accept);
    const [selectedRide, setSelectedRide] = useState<any>(null);

    const handleAcceptRide = async (rideId: any) => {
        try {
            await acceptRide({ ride_id: rideId });
            // Navigate to active ride screen (to be implemented)
            // router.push('/(driver)/active-ride');
            alert('Ride Accepted! Navigate to pickup.');
        } catch (error) {
            console.error("Failed to accept ride:", error);
            alert('Failed to accept ride. It may have been taken.');
        }
    };

    if (!location) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text className="text-lg text-gray-600">Locating...</Text>
                {errorMsg && <Text className="text-red-500 mt-2">{errorMsg}</Text>}
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <MapView
                provider={PROVIDER_GOOGLE}
                className="w-full h-full"
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                followsUserLocation={true}
            >
                {/* Show markers for open rides */}
                {openRides?.map((ride) => (
                    <Marker
                        key={ride._id}
                        coordinate={{
                            latitude: ride.pickup_location.lat,
                            longitude: ride.pickup_location.lng,
                        }}
                        title="New Request"
                        description={`${ride.distance} km • ${ride.fare_estimate} TZS`}
                        onPress={() => setSelectedRide(ride)}
                        pinColor="green"
                    />
                ))}
            </MapView>

            {/* Ride Request Bottom Sheet */}
            {selectedRide && (
                <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg p-6 pb-10">
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-xl font-bold text-gray-900">New Request</Text>
                            <Text className="text-gray-500">{selectedRide.vehicle_type}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedRide(null)}>
                            <Text className="text-gray-400 text-lg">✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center mb-4">
                        <MapPin size={20} color="#00B14F" />
                        <Text className="ml-2 text-gray-800 flex-1" numberOfLines={1}>
                            {selectedRide.pickup_location.address}
                        </Text>
                    </View>

                    <View className="flex-row items-center mb-6">
                        <Navigation size={20} color="#00B14F" />
                        <Text className="ml-2 text-gray-800 flex-1" numberOfLines={1}>
                            {selectedRide.dropoff_location.address}
                        </Text>
                    </View>

                    <View className="flex-row justify-between items-center mb-6 bg-gray-50 p-4 rounded-xl">
                        <View className="items-center">
                            <Text className="text-gray-500 text-xs">DISTANCE</Text>
                            <Text className="font-bold text-gray-900">{selectedRide.distance} km</Text>
                        </View>
                        <View className="h-8 w-[1px] bg-gray-200" />
                        <View className="items-center">
                            <Text className="text-gray-500 text-xs">EST. FARE</Text>
                            <Text className="font-bold text-green-600">{selectedRide.fare_estimate.toLocaleString()} TZS</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        className="bg-[#00B14F] py-4 rounded-xl items-center shadow-md"
                        onPress={() => handleAcceptRide(selectedRide._id)}
                    >
                        <Text className="text-white font-bold text-lg">ACCEPT RIDE</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Status Bar Overlay */}
            <SafeAreaView className="absolute top-0 w-full" edges={['top']}>
                <View className="mx-4 mt-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm flex-row items-center self-start">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                    <Text className="text-xs font-medium text-gray-800">Online • Looking for rides</Text>
                </View>
            </SafeAreaView>
        </View>
    );
}
