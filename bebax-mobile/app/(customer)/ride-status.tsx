import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Alert, ActivityIndicator, Animated, Modal } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
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
    const [showRating, setShowRating] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [rating, setRating] = useState(5);
    const [submittingRating, setSubmittingRating] = useState(false);

    // Queries
    const activeRide = useQuery(api.rides.getActiveRide);
    const rateRide = useMutation(api.rides.rateRide);

    // Pulse animation for driver marker
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Show rating modal when ride is delivered
    useEffect(() => {
        if (activeRide?.status === 'delivered' || activeRide?.status === 'completed') {
            setShowRating(true);
        }
    }, [activeRide?.status]);

    // Center map on driver location updates
    useEffect(() => {
        if (activeRide?.driver_location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: activeRide.driver_location.lat,
                longitude: activeRide.driver_location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    }, [activeRide?.driver_location]);

    const handleCall = () => {
        if (activeRide?.driver_phone) {
            Linking.openURL(`tel:${activeRide.driver_phone}`);
        } else {
            Alert.alert("Info", "Driver phone number not available.");
        }
    };

    const handleNavigate = () => {
        if (activeRide?.pickup_location) {
            const { lat, lng } = activeRide.pickup_location;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            Linking.openURL(url);
        }
    };

    const handleSubmitRating = async () => {
        if (!activeRide) return;
        setSubmittingRating(true);
        try {
            await rateRide({
                ride_id: activeRide._id,
                rating: rating,
            });
            Alert.alert("✅ Asante!", "Thank you for your rating.");
            setShowRating(false);
            router.replace('/(customer)/dashboard');
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit rating.");
        } finally {
            setSubmittingRating(false);
        }
    };

    const getStatusIndex = (status: string) => {
        return STATUS_STEPS.findIndex(s => s.key === status);
    };

    if (!activeRide) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialIcons name="local-taxi" size={64} color={Colors.textDim} />
                <Text style={styles.emptyTitle}>No Active Ride</Text>
                <Text style={styles.emptyText}>Book a ride to see tracking here</Text>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => router.replace('/(customer)/dashboard')}
                >
                    <Text style={styles.bookButtonText}>Book a Ride</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentStep = getStatusIndex(activeRide.status);
    const driverLocation = activeRide.driver_location;

    return (
        <View style={styles.container}>
            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                customMapStyle={customMapStyle}
                initialRegion={{
                    latitude: activeRide.pickup_location.lat,
                    longitude: activeRide.pickup_location.lng,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
            >
                {/* Pickup Marker */}
                <Marker
                    coordinate={{
                        latitude: activeRide.pickup_location.lat,
                        longitude: activeRide.pickup_location.lng,
                    }}
                    title="Pickup"
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
                    strokeColor="#121212"
                    strokeWidth={4}
                />

                {/* Driver Marker */}
                {driverLocation && (
                    <Marker
                        coordinate={{
                            latitude: driverLocation.lat,
                            longitude: driverLocation.lng,
                        }}
                        title="Driver"
                    >
                        <Animated.View style={[styles.driverMarker, { transform: [{ scale: pulseAnim }] }]}>
                            <Image
                                source={require('../../assets/images/bajaji.png')}
                                style={styles.driverImage}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </Marker>
                )}
            </MapView>

            {/* Back Button */}
            <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 10 }]}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>

            {/* Bottom Card */}
            <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 20 }]}>
                {/* Progress Steps */}
                <View style={styles.progressContainer}>
                    {STATUS_STEPS.map((step, index) => (
                        <View key={step.key} style={styles.stepContainer}>
                            <View style={[
                                styles.stepDot,
                                index <= currentStep && styles.stepDotActive,
                                index === currentStep && styles.stepDotCurrent,
                            ]}>
                                {index < currentStep && (
                                    <MaterialIcons name="check" size={12} color="white" />
                                )}
                            </View>
                            <Text style={[
                                styles.stepLabel,
                                index === currentStep && styles.stepLabelActive,
                            ]}>
                                {step.label}
                            </Text>
                            {index < STATUS_STEPS.length - 1 && (
                                <View style={[
                                    styles.stepLine,
                                    index < currentStep && styles.stepLineActive,
                                ]} />
                            )}
                        </View>
                    ))}
                </View>

                {/* Driver Info */}
                {activeRide.driver_name && (
                    <View style={styles.driverInfo}>
                        <View style={styles.driverAvatar}>
                            <Text style={styles.driverInitials}>
                                {activeRide.driver_name?.split(' ').map((n: string) => n[0]).join('')}
                            </Text>
                        </View>
                        <View style={styles.driverDetails}>
                            <Text style={styles.driverName}>{activeRide.driver_name}</Text>
                            <Text style={styles.vehicleInfo}>
                                {activeRide.vehicle_type?.toUpperCase()} • {activeRide.vehicle_plate || 'T 123 ABC'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.chatButton} onPress={() => setShowChat(true)}>
                            <MessageCircle size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                            <Ionicons name="call" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Destination */}
                <View style={styles.destinationRow}>
                    <View style={styles.destDot} />
                    <Text style={styles.destText} numberOfLines={1}>
                        {activeRide.dropoff_location.address}
                    </Text>
                </View>

                {/* Fare */}
                <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Estimated Fare</Text>
                    <Text style={styles.fareValue}>
                        Tsh {(activeRide.fare_estimate || 0).toLocaleString()}
                    </Text>
                </View>
            </View>

            {/* Rating Modal */}
            {showRating && (
                <View style={styles.ratingOverlay}>
                    <View style={styles.ratingCard}>
                        <Text style={styles.ratingTitle}>🎉 Safari Imemalizika!</Text>
                        <Text style={styles.ratingSubtitle}>How was your ride?</Text>

                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                >
                                    <MaterialIcons
                                        name={star <= rating ? 'star' : 'star-border'}
                                        size={48}
                                        color={star <= rating ? '#FFD700' : '#ccc'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmitRating}
                            disabled={submittingRating}
                        >
                            {submittingRating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>SUBMIT RATING</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {
                            setShowRating(false);
                            router.replace('/(customer)/dashboard');
                        }}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* SOS Button - Always visible during active ride */}
            {activeRide && activeRide.status !== 'pending' && <SOSButton rideId={activeRide._id} />}

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
        backgroundColor: Colors.background,
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textLight,
        marginTop: 16,
    },
    emptyText: {
        color: Colors.textDim,
        marginTop: 8,
    },
    bookButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 24,
    },
    bookButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    markerPin: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    markerDropoff: {
        backgroundColor: '#121212',
    },
    driverMarker: {
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    driverImage: {
        width: 35,
        height: 35,
    },
    bottomCard: {
        backgroundColor: 'white',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    stepContainer: {
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepDotActive: {
        backgroundColor: Colors.success,
    },
    stepDotCurrent: {
        backgroundColor: Colors.primary,
        borderWidth: 3,
        borderColor: '#FFF5F0',
    },
    stepLabel: {
        fontSize: 9,
        color: Colors.textDim,
        marginTop: 4,
        textAlign: 'center',
    },
    stepLabelActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    stepLine: {
        position: 'absolute',
        top: 11,
        right: -20,
        width: 40,
        height: 2,
        backgroundColor: '#E0E0E0',
    },
    stepLineActive: {
        backgroundColor: Colors.success,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
    },
    driverAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverInitials: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    driverDetails: {
        flex: 1,
        marginLeft: 14,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    vehicleInfo: {
        fontSize: 13,
        color: Colors.textDim,
        marginTop: 2,
    },
    callButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    chatButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    destinationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    destDot: {
        width: 12,
        height: 12,
        borderRadius: 2,
        backgroundColor: '#121212',
        marginRight: 12,
    },
    destText: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
    },
    fareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    fareLabel: {
        fontSize: 14,
        color: Colors.textDim,
    },
    fareValue: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
    },
    // Rating Modal
    ratingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    ratingCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        alignItems: 'center',
    },
    ratingTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },
    ratingSubtitle: {
        fontSize: 16,
        color: Colors.textDim,
        marginBottom: 24,
    },
    starsRow: {
        flexDirection: 'row',
        marginBottom: 32,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    skipText: {
        color: Colors.textDim,
        marginTop: 16,
        fontWeight: '500',
    },
});
