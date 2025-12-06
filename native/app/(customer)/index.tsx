import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Dimensions, StatusBar, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { VehicleSelectionSheet } from '@/components/VehicleSelectionSheet';
import { MapPin, Loader2 } from 'lucide-react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as Haptics from 'expo-haptics';
import { mapUiTypeToBackend } from '@/utils/vehicleMapping';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

// --- 1. PREMIUM CLEAN MAP STYLE (Desaturated Silver) ---
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

// Memoized Map Component to prevent re-renders
const OptimizedMap = React.memo(({ location, mapPadding }: any) => {
    return (
        <MapView
            provider={PROVIDER_GOOGLE}
            style={{ width: '100%', height: '100%' }}
            customMapStyle={MAP_STYLE}
            initialRegion={{
                latitude: location?.coords.latitude || -6.7924,
                longitude: location?.coords.longitude || 39.2083,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            followsUserLocation={true}
            mapPadding={mapPadding}
            toolbarEnabled={false} // Disable toolbar for performance
            loadingEnabled={true}
            loadingBackgroundColor="#F5F5F5"
            loadingIndicatorColor="#FF5722"
        >
            {/* Driver markers would go here */}
        </MapView>
    );
}, (prev, next) => {
    // Only re-render if location changes significantly or padding changes
    return prev.location === next.location && prev.mapPadding === next.mapPadding;
});

export default function CustomerHomeScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [isBooking, setIsBooking] = useState(false);

    // Booking State (Simplified for MVP, ideally from inputs)
    const [pickupAddress, setPickupAddress] = useState("Current Location");
    const [dropoffAddress, setDropoffAddress] = useState("Select Destination"); // Placeholder
    const [cargoDetails, setCargoDetails] = useState("General Goods"); // Placeholder

    // B2B State
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    const [insuranceTier, setInsuranceTier] = useState<string>('basic');
    const [cargoPhoto, setCargoPhoto] = useState<string | null>(null);

    const createRide = useMutation(api.rides.create);
    const userProfile = useQuery(api.users.getCurrentProfile);

    // Dynamic Map Padding (Safe Zone)
    // Bottom padding = Sheet Height (~300) + TabBar/Safe Area (~80)
    const mapPadding = useMemo(() => ({
        top: 50,
        right: 0,
        bottom: selectedVehicle ? 400 : 300, // Increased for B2B UI
        left: 0
    }), [selectedVehicle]);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, []);

    const handleVehicleSelect = useCallback((id: string) => {
        setSelectedVehicle(id);
        Haptics.selectionAsync(); // Light tick on selection
    }, []);

    const handleBookRide = async () => {
        if (!location || !selectedVehicle) {
            Alert.alert("Error", "Please select a vehicle and ensure location is enabled.");
            return;
        }

        // Haptic Feedback: Heavy Thud
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        setIsBooking(true);

        try {
            // 1. Map UI Type to Backend Type
            const backendVehicleType = mapUiTypeToBackend(selectedVehicle);

            // 2. Create Ride (Async)
            await createRide({
                pickup_location: {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    address: pickupAddress,
                },
                dropoff_location: {
                    lat: location.coords.latitude + 0.01, // Dummy dropoff for MVP demo
                    lng: location.coords.longitude + 0.01,
                    address: "Demo Dropoff",
                },
                vehicle_type: backendVehicleType,
                cargo_details: cargoDetails,
                payment_method: paymentMethod,
                insurance_opt_in: true, // Always opted in for now (Basic is default)
                insurance_tier_id: insuranceTier,
                cargo_photos: cargoPhoto ? [cargoPhoto] : undefined,
                fare_estimate: 5000, // Dummy estimate
                distance: 5.2, // Dummy distance
            });

            Alert.alert("Success", "Ride Requested! Finding a driver...");
            setSelectedVehicle(null); // Reset selection
            setPaymentMethod('cash'); // Reset defaults
            setInsuranceTier('basic');
            setCargoPhoto(null);
        } catch (error: any) {
            console.error("Booking Failed:", error);
            Alert.alert("Booking Failed", error.message || "Please try again.");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <StyledView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Map Layer */}
            <View className="flex-1">
                {location ? (
                    <OptimizedMap location={location} mapPadding={mapPadding} />
                ) : (
                    <View className="flex-1 items-center justify-center bg-white">
                        <StyledText className="text-[#FF5722] font-bold">Locating...</StyledText>
                    </View>
                )}
            </View>

            {/* Floating UI: Search Bar */}
            <SafeAreaView className="absolute top-0 w-full px-4" edges={['top']}>
                <StyledView className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-200 flex-row items-center shadow-lg">
                    <View className="bg-[#FF5722]/10 p-2 rounded-full mr-3">
                        <MapPin size={20} color="#FF5722" />
                    </View>
                    <View>
                        <StyledText className="text-gray-500 text-xs font-bold">WHERE TO?</StyledText>
                        <StyledText className="text-[#121212] font-bold text-lg">Enter Destination</StyledText>
                    </View>
                </StyledView>
            </SafeAreaView>

            {/* Bottom Sheet: Vehicle Selection */}
            <View className="absolute bottom-0 w-full">
                <VehicleSelectionSheet
                    onSelectVehicle={handleVehicleSelect}
                    userProfile={userProfile}
                    onPaymentChange={setPaymentMethod}
                    onInsuranceChange={(tier, photo) => {
                        setInsuranceTier(tier);
                        if (photo) setCargoPhoto(photo);
                    }}
                />

                {/* Request Button (Only visible when vehicle selected) */}
                {selectedVehicle && (
                    <View className="absolute bottom-8 left-6 right-6">
                        <StyledTouchableOpacity
                            className={`w-full py-4 rounded-xl items-center shadow-lg ${isBooking ? 'bg-gray-400' : 'bg-[#FF5722]'}`}
                            onPress={handleBookRide}
                            disabled={isBooking}
                        >
                            {isBooking ? (
                                <Loader2 color="#FFFFFF" className="animate-spin" />
                            ) : (
                                <StyledText className="text-white font-bold text-xl uppercase">
                                    REQUEST RIDE
                                </StyledText>
                            )}
                        </StyledTouchableOpacity>
                    </View>
                )}
            </View>
        </StyledView>
    );
}
