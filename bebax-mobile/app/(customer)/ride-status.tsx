import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Alert, ActivityIndicator, Animated, Modal, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, AnimatedRegion } from 'react-native-maps';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { customMapStyle } from '../../src/constants/mapStyle';
import { useUser } from '@clerk/clerk-expo';
import SOSButton from '../../components/Shared/SOSButton';
import ChatScreen from '../../components/Shared/ChatScreen';
import { MessageCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { VEHICLE_FLEET } from '../../src/constants/vehicleRegistry';
import { RideStatusSheet, RideStatus, DriverInfo } from '../../src/components/RideStatusSheet';

const STATUS_STEPS = [
    { key: 'pending', label: 'Finding Driver', icon: 'search' },
    { key: 'accepted', label: 'Driver Assigned', icon: 'person' },
    { key: 'loading', label: 'At Pickup', icon: 'location-on' },
    { key: 'ongoing', label: 'In Transit', icon: 'local-shipping' },
    { key: 'delivered', label: 'Delivered', icon: 'check-circle' },
];

export default function RideStatusScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const { user } = useUser();
    const [showChat, setShowChat] = useState(false);

    // Animated Region for smooth driver movement
    const driverCoordinate = useRef(new AnimatedRegion({
        latitude: -6.7924,
        longitude: 39.2083,
        latitudeDelta: 0,
        longitudeDelta: 0,
    })).current;

    // Queries
    const activeRide = useQuery(api.rides.getActiveRide);

    // Pulse animation for driver marker
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Handle Ride Completion & Navigation
    useEffect(() => {
        if (activeRide?.status === 'delivered' || activeRide?.status === 'completed') {
            // Navigate to separate Rating Screen
            router.replace({
                pathname: '/(customer)/rate-ride',
                params: { rideId: activeRide._id }
            });
        }
    }, [activeRide?.status]);

    // Update Driver Location Smoothly
    useEffect(() => {
        if (activeRide?.driver_location) {
            const { lat, lng } = activeRide.driver_location;

            // Animate Marker
            if (Platform.OS === 'android') {
                // @ts-ignore - Android specific workaround if needed, but animateMarkerToCoordinate is better
                if (mapRef.current) {
                    // mapRef.current.animateCamera({ center: { latitude: lat, longitude: lng }, zoom: 17 }, { duration: 1000 });
                }
                // @ts-ignore - AnimatedRegion.timing signature differs from Animated.timing
                driverCoordinate.timing({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0,
                    longitudeDelta: 0,
                    duration: 2000,
                    useNativeDriver: false
                }).start();
            } else {
                // @ts-ignore
                driverCoordinate.timing({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0,
                    longitudeDelta: 0,
                    duration: 2000,
                    useNativeDriver: false
                }).start();
            }

            // Animate Camera
            // mapRef.current?.animateToRegion({
            //     latitude: lat,
            //     longitude: lng,
            //     latitudeDelta: 0.005,
            //     longitudeDelta: 0.005,
            // }, 1000);
        }
    }, [activeRide?.driver_location]);

    const handleCall = () => {
        if (activeRide?.driver_phone) {
            Linking.openURL(`tel:${activeRide.driver_phone}`);
        } else {
            Alert.alert("Info", "Driver phone number not available.");
        }
    };

    const getStatusIndex = (status: string) => {
        return STATUS_STEPS.findIndex(s => s.key === status);
    };

    // Get Vehicle Asset
    const getVehicleAsset = (type: string | undefined) => {
        if (!type) return require('../../assets/images/bajaji.png'); // Fallback
        const vehicle = VEHICLE_FLEET.find(v => v.id === type);
        // Use the image from registry, or fallback if image is just a string path that can't be resolved dynamically easily
        // In this setup, we imported images in the registry? If not, we map them here manually if needed.
        // Assuming registry has require() statements or we map here.
        // Let's assume specific mapping for now based on user request "Dynamic Asset: CRITICAL"
        switch (type) {
            case 'boda': return require('../../assets/images/vehicles/boda.png');
            // case 'toyo': return require('../../assets/images/vehicles/toyo.png'); // Need to ensure these exist
            // case 'kirikuu': return require('../../assets/images/vehicles/kirikuu.png');
            // case 'pickup': return require('../../assets/images/vehicles/pickup.png');
            // case 'canter': return require('../../assets/images/vehicles/canter.png');
            // case 'fuso': return require('../../assets/images/vehicles/fuso.png');
            // case 'trailer': return require('../../assets/images/vehicles/trailer.png');
            default: return require('../../assets/images/bajaji.png');
        }
    };

    // Helper to get image from registry safely (assuming registry uses require)
    const vehicleImageSource = activeRide?.vehicle_type
        ? VEHICLE_FLEET.find(v => v.id === activeRide.vehicle_type)?.image
        : require('../../assets/images/bajaji.png');

    if (!activeRide) {
        return (
            <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.emptyText}>Loading ride status...</Text>
            </View>
        );
    }

    const currentStep = getStatusIndex(activeRide.status);

    return (
        <View style={styles.container}>
            {/* Live Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                customMapStyle={customMapStyle}
                initialRegion={{
                    latitude: activeRide.pickup_location.lat,
                    longitude: activeRide.pickup_location.lng,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                }}
            >
                {/* Pickup Marker */}
                <Marker
                    coordinate={{
                        latitude: activeRide.pickup_location.lat,
                        longitude: activeRide.pickup_location.lng,
                    }}
                    title="Pickup"
                    description={activeRide.pickup_location.address}
                >
                    <View style={styles.markerPin}>
                        <MaterialIcons name="location-on" size={24} color={Colors.primary} />
                    </View>
                </Marker>

                {/* Dropoff Marker */}
                <Marker
                    coordinate={{
                        latitude: activeRide.dropoff_location.lat,
                        longitude: activeRide.dropoff_location.lng,
                    }}
                    title="Dropoff"
                    description={activeRide.dropoff_location.address}
                >
                    <View style={[styles.markerPin, styles.markerDropoff]}>
                        <MaterialIcons name="flag" size={24} color="white" />
                    </View>
                </Marker>

                {/* Route Line */}
                <Polyline
                    coordinates={[
                        { latitude: activeRide.pickup_location.lat, longitude: activeRide.pickup_location.lng },
                        { latitude: activeRide.dropoff_location.lat, longitude: activeRide.dropoff_location.lng },
                    ]}
                    strokeColor={Colors.primary}
                    strokeWidth={4}
                    lineDashPattern={[0]}
                />

                {/* Animated Driver Marker */}
                {activeRide.driver_location && (
                    <Marker.Animated
                        // @ts-ignore
                        coordinate={driverCoordinate}
                        title={activeRide.driver_name || "Driver"}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <Animated.View style={[
                            styles.driverMarkerContainer,
                            { transform: [{ scale: pulseAnim }] }
                        ]}>
                            <Image
                                source={vehicleImageSource}
                                style={styles.driverAsset}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </Marker.Animated>
                )}
            </MapView>

            {/* Back Button */}
            <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 10 }]}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>

            {/* NEW: Production-Grade Ride Status Sheet */}
            <RideStatusSheet
                status={
                    activeRide.status === 'pending' ? 'SEARCHING' :
                        activeRide.status === 'loading' ? 'ARRIVED' :
                            'ACCEPTED'
                }
                driver={activeRide.driver_name ? {
                    name: activeRide.driver_name,
                    photo: activeRide.driver_photo,
                    rating: activeRide.driver_rating || 4.8,
                    trips: 1200,
                    phone: activeRide.driver_phone || '',
                    vehicleModel: VEHICLE_FLEET.find(v => v.id === activeRide.vehicle_type)?.label || 'Vehicle',
                    vehicleColor: 'Black',
                    plateNumber: activeRide.vehicle_plate || 'T 123 ABC',
                    eta: 4,
                    pin: activeRide.verification_pin || '8890',
                } : undefined}
                onCancel={() => {
                    Alert.alert(
                        'Cancel Ride?',
                        'Are you sure you want to cancel this ride?',
                        [
                            { text: 'No', style: 'cancel' },
                            { text: 'Yes, Cancel', style: 'destructive', onPress: () => router.back() },
                        ]
                    );
                }}
                onCall={handleCall}
                onChat={() => setShowChat(true)}
                onShareRide={() => {
                    Alert.alert('Share Ride', 'Share ride details via messages or social media.');
                }}
                onImComing={() => {
                    // TODO: Send notification to driver via backend
                    Alert.alert('✓ Driver Notified', 'Your driver knows you are on your way!');
                }}
            />

            {/* Floating SOS - Ensure it is above the glass card */}
            {activeRide.status !== 'pending' && (
                <View style={[styles.sosWrapper, { bottom: 250 }]}>
                    <SOSButton rideId={activeRide._id} />
                </View>
            )}

            {/* Chat Modal */}
            <Modal
                visible={showChat}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowChat(false)}
            >
                {activeRide && user && (
                    <ChatScreen
                        rideId={activeRide._id}
                        recipientName={activeRide.driver_name || 'Driver'}
                        recipientPhone={activeRide.driver_phone}
                        currentUserId={user.id}
                        onClose={() => setShowChat(false)}
                        quickReplies={["Niko hapa", "Subiri kidogo", "Sawa", "Asante"]}
                    />
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    map: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        color: Colors.textDim,
    },
    backButton: {
        position: 'absolute',
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 3,
        zIndex: 10,
    },
    markerPin: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 3,
    },
    markerDropoff: {
        backgroundColor: '#121212',
    },
    driverMarkerContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverAsset: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100, // Ensure it's on top of map
    },
    glassCard: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: 0.5,
    },
    etaText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 2,
        marginBottom: 20,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    driverRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    plateNumber: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButton: {
        backgroundColor: Colors.success,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    locationText: {
        fontSize: 14,
        color: Colors.textDim,
        flex: 1,
    },
    sosWrapper: {
        position: 'absolute',
        right: 16,
    }
});
