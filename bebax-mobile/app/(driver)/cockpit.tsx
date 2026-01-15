import React, { useState, useEffect, useRef } from 'react';
import {
    View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert,
    ActivityIndicator, Dimensions, Image, Animated, PanResponder, Linking, Modal
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customMapStyle } from '../../src/constants/mapStyle';
import SOSButton from '../../components/Shared/SOSButton';
import ChatScreen from '../../components/Shared/ChatScreen';
import ReviewModal from '../../components/Driver/ReviewModal';
import { MessageCircle, Navigation, Lock, Unlock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SmartCargoSelector } from '../../src/components/SmartCargoSelector';
import { REFERENCE_OBJECTS, HOUSE_SIZES } from '../../src/constants/CargoReferences';
import { DriverJobCard } from '../../src/components/DriverJobCard';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 140;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.55;

export default function CockpitScreen() {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const { user } = useUser();
    const [statusLoading, setStatusLoading] = useState(false);
    const [sheetHeight] = useState(new Animated.Value(COLLAPSED_HEIGHT));
    const [isExpanded, setIsExpanded] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [lastCompletedRide, setLastCompletedRide] = useState<any>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); // Toggle for active ride card

    // Queries
    const driver = useQuery(api.drivers.getCurrentDriver);
    const userProfile = useQuery(api.users.getCurrentProfile);
    const activeRide = useQuery(api.rides.getDriverActiveRide);
    const availableRides = useQuery(api.rides.listAvailableRides);
    const earningsData = useQuery(api.drivers.getEarnings); // Moved here to fix hooks rule

    const driverData = driver || (userProfile ? {
        is_online: false,
        verified: false,
        rating: 5.0,
        total_trips: 0,
    } : null);

    // Mutations
    const setOnline = useMutation(api.drivers.setOnlineStatus);
    const acceptRide = useMutation(api.rides.accept);
    const updateRideStatus = useMutation(api.rides.updateStatus);
    const updateLocation = useMutation(api.drivers.updateLocation);
    const sendMessage = useMutation(api.messages.send);

    // Location Tracking
    useEffect(() => {
        let subscription: any;
        const startTracking = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            subscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
                (location) => {
                    const { latitude, longitude } = location.coords;
                    setCurrentLocation({ lat: latitude, lng: longitude });
                    updateLocation({
                        location: { lat: latitude, lng: longitude, geohash: "gbsuv7" }
                    }).catch(() => { });
                }
            );

            // Get initial location
            const loc = await Location.getCurrentPositionAsync({});
            setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        };
        if (isSignedIn && (driverData?.is_online || activeRide)) {
            startTracking();
        }
        return () => { if (subscription) subscription.remove(); };
    }, [isSignedIn, driverData?.is_online, activeRide]);

    // Fit map to show route when ride is active
    useEffect(() => {
        if (activeRide && mapRef.current) {
            const coords = [];
            if (activeRide.pickup_location) {
                coords.push({ latitude: activeRide.pickup_location.lat, longitude: activeRide.pickup_location.lng });
            }
            if (activeRide.dropoff_location) {
                coords.push({ latitude: activeRide.dropoff_location.lat, longitude: activeRide.dropoff_location.lng });
            }
            if (coords.length > 0) {
                mapRef.current.fitToCoordinates(coords, {
                    edgePadding: { top: 150, right: 50, bottom: 300, left: 50 },
                    animated: true,
                });
            }
        }
    }, [activeRide]);

    // Sheet Pan Responder
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                if (gesture.dy < 0 && !isExpanded) {
                    sheetHeight.setValue(Math.min(EXPANDED_HEIGHT, COLLAPSED_HEIGHT - gesture.dy));
                } else if (gesture.dy > 0 && isExpanded) {
                    sheetHeight.setValue(Math.max(COLLAPSED_HEIGHT, EXPANDED_HEIGHT - gesture.dy));
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy < -50 && !isExpanded) expandSheet();
                else if (gesture.dy > 50 && isExpanded) collapseSheet();
                else {
                    Animated.spring(sheetHeight, {
                        toValue: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    const expandSheet = () => {
        Animated.spring(sheetHeight, { toValue: EXPANDED_HEIGHT, useNativeDriver: false }).start();
        setIsExpanded(true);
    };

    const collapseSheet = () => {
        Animated.spring(sheetHeight, { toValue: COLLAPSED_HEIGHT, useNativeDriver: false }).start();
        setIsExpanded(false);
    };

    // Toggle Online - LOCKED during active ride
    const toggleOnline = async () => {
        // LOCK: Can't go offline during active ride
        if (activeRide) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
                "🔒 Ride in Progress",
                "You cannot go offline while you have an active delivery. Please complete the current trip first.",
                [{ text: "OK" }]
            );
            return;
        }

        if (!driver) {
            Alert.alert(
                "Complete Registration",
                "Please complete your driver registration in the Profile section.",
                [{ text: "Later" }, { text: "Go to Profile", onPress: () => router.push('/(driver)/profile') }]
            );
            return;
        }

        // Verification Check
        if (!driver.verified) {
            Alert.alert(
                "Verification Required",
                "You must verify your documents before you can go online.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Go to Documents", onPress: () => router.push('/(driver)/profile') }
                ]
            );
            return;
        }

        setStatusLoading(true);
        try {
            await setOnline({ is_online: !driverData.is_online });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleAccept = async (rideId: string) => {
        if (!driver || !driver.verified) {
            Alert.alert("Verification Required", "Your profile must be verified to accept rides.");
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        try {
            await acceptRide({ ride_id: rideId as any });
            Alert.alert("✅ Safari Imekubaliwa!", "Route is shown on map. Navigate to pickup.");
            collapseSheet();
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const handleStatusUpdate = async (status: string) => {
        if (!activeRide || isUpdatingStatus) return;
        setIsUpdatingStatus(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await updateRideStatus({ ride_id: activeRide._id, status });

            // Show review modal after delivery completion
            if (status === 'delivered') {
                setLastCompletedRide(activeRide);
                setTimeout(() => {
                    setShowReviewModal(true);
                }, 500);
            }
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleCallCustomer = () => {
        if (activeRide?.customer_phone) {
            Linking.openURL(`tel:${activeRide.customer_phone}`);
        }
    };

    // In-app focus destination on map
    const focusDestination = () => {
        if (!activeRide || !mapRef.current) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const dest = activeRide.status === 'accepted'
            ? activeRide.pickup_location
            : activeRide.dropoff_location;

        if (dest) {
            mapRef.current.animateToRegion({
                latitude: dest.lat,
                longitude: dest.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    };

    if (!driverData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading Cockpit...</Text>
            </View>
        );
    }

    const todayEarnings = earningsData?.today || 0;
    const isRideLocked = !!activeRide;

    // Helper to calculate Net Profit (100% pass-through for helpers, 85% for transport)
    const calculateNetProfit = (totalFare: number, helpers: number = 0) => {
        const helperFee = helpers * 5000;
        const transportFare = Math.max(0, totalFare - helperFee);
        const driverShare = (transportFare * 0.85) + helperFee;
        return driverShare;
    };

    // Legacy Fallback Constants
    const LEGACY_CARGO_SIZES = [
        { id: 'small', label: 'Small (Bag)', iconImage: require('../../assets/images/cargo/icon_small.png') },
        { id: 'medium', label: 'Medium (Box)', iconImage: require('../../assets/images/cargo/icon_medium.png') },
        { id: 'large', label: 'Large (Furniture)', iconImage: require('../../assets/images/cargo/icon_large.png') },
        { id: 'huge', label: 'Huge (Move)', iconImage: require('../../assets/images/cargo/icon_huge.png') },
    ];

    // Helper to get Cargo Icon Image Source
    const getCargoIconImage = (sizeId: string) => {
        const size = LEGACY_CARGO_SIZES.find(s => s.id === sizeId);
        return size?.iconImage ?? require('../../assets/images/cargo/icon_small.png');
    };

    // Helper to get Cargo Label
    const getCargoLabel = (sizeId: string) => {
        const size = LEGACY_CARGO_SIZES.find(s => s.id === sizeId);
        return size?.label ?? 'Cargo';
    };

    return (
        <View style={styles.container}>
            {/* FULL SCREEN MAP */}
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_DEFAULT}
                customMapStyle={customMapStyle}
                showsUserLocation={true}
                followsUserLocation={!activeRide}
                initialRegion={{
                    latitude: -6.7924, longitude: 39.2083,
                    latitudeDelta: 0.05, longitudeDelta: 0.05,
                }}
            >
                {/* Route Polyline for Active Ride */}
                {activeRide && activeRide.pickup_location && activeRide.dropoff_location && (
                    <Polyline
                        coordinates={[
                            { latitude: activeRide.pickup_location.lat, longitude: activeRide.pickup_location.lng },
                            { latitude: activeRide.dropoff_location.lat, longitude: activeRide.dropoff_location.lng },
                        ]}
                        strokeColor={Colors.primary}
                        strokeWidth={4}
                        lineDashPattern={[1]}
                    />
                )}
                {/* Pickup Marker */}
                {activeRide?.pickup_location && (
                    <Marker coordinate={{ latitude: activeRide.pickup_location.lat, longitude: activeRide.pickup_location.lng }}>
                        <View style={styles.pickupMarker}>
                            <MaterialIcons name="my-location" size={18} color="#FFF" />
                        </View>
                    </Marker>
                )}
                {/* Dropoff Marker */}
                {activeRide?.dropoff_location && (
                    <Marker coordinate={{ latitude: activeRide.dropoff_location.lat, longitude: activeRide.dropoff_location.lng }}>
                        <View style={styles.dropoffMarker}>
                            <MaterialIcons name="place" size={20} color="#FFF" />
                        </View>
                    </Marker>
                )}
            </MapView>

            {/* PREMIUM TOP HUD */}
            <View style={[styles.topHud, { paddingTop: insets.top + 8 }]}>
                {/* Driver Profile Image */}
                <TouchableOpacity onPress={() => router.push('/(driver)/profile')}>
                    <Image
                        source={userProfile?.profilePhoto
                            ? { uri: userProfile.profilePhoto }
                            : require('../../assets/images/avatar_placeholder.png')
                        }
                        style={styles.profileImage}
                    />
                    {driver?.verified && (
                        <View style={styles.verifiedBadge}>
                            <MaterialIcons name="verified" size={12} color="#FFF" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Status Toggle with Lock */}
                <TouchableOpacity
                    style={[
                        styles.statusPill,
                        driverData.is_online ? styles.statusOnline : styles.statusOffline,
                        isRideLocked && styles.statusLocked
                    ]}
                    onPress={toggleOnline}
                    disabled={statusLoading}
                >
                    {statusLoading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            {isRideLocked ? (
                                <Lock size={14} color="#FFF" />
                            ) : (
                                <View style={[styles.statusDot, driverData.is_online && styles.statusDotOnline]} />
                            )}
                            <Text style={styles.statusText}>
                                {isRideLocked ? "IN TRIP" : (driverData.is_online ? "ONLINE" : "OFFLINE")}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Earnings Badge - Tap to go to M-Pesa */}
                <TouchableOpacity style={styles.earningsBadge} onPress={() => router.push('/(driver)/earnings')}>
                    <Text style={styles.earningsValue}>Tsh {todayEarnings.toLocaleString()}</Text>
                    <Text style={styles.earningsLabel}>Leo • Today ›</Text>
                </TouchableOpacity>
            </View>

            {/* NEW: VISUAL TRUTH CARD (Incoming Request) */}
            {!activeRide && availableRides && availableRides.length > 0 && (
                <View style={[styles.incomingOverlayContainer, { bottom: insets.bottom + 10 }]}>
                    <DriverJobCard
                        ride={availableRides[0]}
                        onAccept={() => handleAccept(availableRides[0]._id)}
                        onDecline={() => {
                            // In real app, this might hide the ride locally or hit "reject" API
                            Alert.alert("Declined", "You have skipped this ride.");
                        }}
                    />
                </View>
            )}

            {/* COMPACT ACTIVE RIDE STRIP (Map-First Design) */}
            {activeRide && (
                <Animated.View style={[
                    styles.activeStrip,
                    {
                        bottom: insets.bottom + 16,
                        height: isDetailsExpanded ? 360 : 160 // Expanded height to accommodate cargo info
                    }
                ]}>
                    {/* TOGGLE HANDLE */}
                    <TouchableOpacity
                        style={styles.expandHandle}
                        onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.handleBar} />
                    </TouchableOpacity>

                    {/* Left: Status + Destination */}
                    <TouchableOpacity style={styles.stripLeft} onPress={focusDestination}>
                        <View style={styles.stripStatusDot} />
                        <View style={styles.stripInfo}>
                            <Text style={styles.stripStatus}>
                                {activeRide.status === 'accepted' ? 'PICKUP' :
                                    activeRide.status === 'loading' ? 'LOADING' :
                                        activeRide.status === 'ongoing' ? 'EN ROUTE' : activeRide.status?.toUpperCase()}
                            </Text>
                            <Text style={styles.stripAddr} numberOfLines={1}>
                                {activeRide.status === 'accepted' || activeRide.status === 'loading'
                                    ? activeRide.pickup_location?.address
                                    : activeRide.dropoff_location?.address}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}>
                            <MaterialIcons name={isDetailsExpanded ? "expand-more" : "expand-less"} size={24} color={Colors.textDim} />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* EXPANDED DETAILS */}
                    {isDetailsExpanded && (
                        <View style={styles.expandedDetails}>
                            {/* Trip Info Grid */}
                            <View style={styles.detailRow}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>CUSTOMER</Text>
                                    <Text style={styles.detailValue}>{activeRide.customer_name || activeRide.customer_phone || "Guest"}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>FARE</Text>
                                    <Text style={styles.detailValue}>Tsh {(activeRide.fare_estimate || 0).toLocaleString()}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>YOUR SHARE</Text>
                                    <Text style={[styles.detailValue, { color: '#16A34A' }]}>
                                        Tsh {calculateNetProfit(activeRide.fare_estimate || 0, activeRide.helpers_count).toLocaleString()}
                                    </Text>
                                </View>
                            </View>

                            {/* Alert Row: Cargo & Fragility */}
                            <View style={[styles.detailRow, { marginTop: 12, justifyContent: 'flex-start', gap: 10 }]}>
                                {/* Smart Cargo Icon (Visual Truth) */}
                                <View style={styles.cargoIconContainer}>
                                    {activeRide.mission_mode === 'move' ? (
                                        <Text style={styles.cargoIconRef}>{HOUSE_SIZES.find(h => h.id === activeRide.house_size_id)?.icon || '🏠'}</Text>
                                    ) : activeRide.cargo_ref_id ? (
                                        <Text style={styles.cargoIconRef}>{REFERENCE_OBJECTS.find(r => r.id === activeRide.cargo_ref_id)?.icon || '📦'}</Text>
                                    ) : (
                                        // Fallback Legacy
                                        <Image
                                            source={getCargoIconImage(activeRide.cargo_size || 'small')}
                                            style={styles.cargoIconImageBig}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>

                                <View style={styles.rideTexts}>
                                    {/* Visual Truth Label */}
                                    <Text style={styles.cargoLabel}>
                                        {activeRide.mission_mode === 'move'
                                            ? (HOUSE_SIZES.find(h => h.id === activeRide.house_size_id)?.label || 'House Move')
                                            : (activeRide.cargo_ref_id
                                                ? REFERENCE_OBJECTS.find(r => r.id === activeRide.cargo_ref_id)?.label + " (" + REFERENCE_OBJECTS.find(r => r.id === activeRide.cargo_ref_id)?.reference + ")"
                                                : (activeRide.cargo_details || getCargoLabel(activeRide.cargo_size || 'small')))
                                        }
                                    </Text>

                                    {/* Reference Check Badge */}
                                    {activeRide.cargo_photo_url && (
                                        <View style={styles.photoBadge}>
                                            <MaterialIcons name="verified" size={12} color="#16A34A" />
                                            <Text style={styles.photoBadgeText}>Photo Verified</Text>
                                        </View>
                                    )}
                                </View>
                                {activeRide.is_fragile && (
                                    <View style={styles.fragileBadge}>
                                        <Image source={require('../../assets/images/cargo/icon_fragile.png')} style={styles.cargoIconTiny} resizeMode="contain" />
                                        <Text style={styles.fragileText}>Fragile</Text>
                                    </View>
                                )}
                                {(activeRide.helpers_count || 0) > 0 && (
                                    <View style={styles.helperBadge}>
                                        <Image source={require('../../assets/images/cargo/icon_helper.png')} style={styles.cargoIconTiny} resizeMode="contain" />
                                        <Text style={styles.helperText}>{activeRide.helpers_count} Helpers</Text>
                                    </View>
                                )}
                            </View>

                            <View style={[styles.detailRow, { marginTop: 8 }]}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>DETAILS</Text>
                                    <Text style={styles.detailValue} numberOfLines={2}>{activeRide.cargo_details || "No special instructions"}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />
                        </View>
                    )}

                    {/* Right: Quick Actions (Visible always or moved in expanded?) - Keep consistent */}
                    <View style={styles.stripActions}>
                        <TouchableOpacity style={styles.stripActionBtn} onPress={() => setShowChat(true)}>
                            <MessageCircle size={18} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.stripActionBtn, styles.stripCall]} onPress={handleCallCustomer}>
                            <Ionicons name="call" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom: Action Button */}
                    <View style={styles.stripActionRow}>
                        {activeRide.status === 'accepted' && (
                            <TouchableOpacity style={styles.stripMainBtn} onPress={() => handleStatusUpdate('loading')} disabled={isUpdatingStatus}>
                                {isUpdatingStatus ? <ActivityIndicator color="#FFF" size="small" /> :
                                    <Text style={styles.stripMainBtnText}>NIMEFIKA • ARRIVED</Text>}
                            </TouchableOpacity>
                        )}
                        {activeRide.status === 'loading' && (
                            <TouchableOpacity style={styles.stripMainBtn} onPress={() => handleStatusUpdate('ongoing')} disabled={isUpdatingStatus}>
                                {isUpdatingStatus ? <ActivityIndicator color="#FFF" size="small" /> :
                                    <Text style={styles.stripMainBtnText}>ANZA SAFARI • START</Text>}
                            </TouchableOpacity>
                        )}
                        {activeRide.status === 'ongoing' && (
                            <TouchableOpacity style={[styles.stripMainBtn, styles.stripComplete]} onPress={() => handleStatusUpdate('delivered')} disabled={isUpdatingStatus}>
                                {isUpdatingStatus ? <ActivityIndicator color="#FFF" size="small" /> :
                                    <Text style={styles.stripMainBtnText}>MALIZA • COMPLETE</Text>}
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            )}

            {/* SOS Button */}
            {activeRide && <SOSButton rideId={activeRide._id} />}

            {/* Chat Modal */}
            <Modal visible={showChat} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowChat(false)}>
                {activeRide && user && (
                    <ChatScreen
                        rideId={activeRide._id}
                        recipientName={activeRide.customer_name || 'Customer'}
                        recipientPhone={activeRide.customer_phone}
                        currentUserId={user.id}
                        onClose={() => setShowChat(false)}
                        quickReplies={["Niko njiani", "Nimefika", "Subiri kidogo", "Nitachelewa"]}
                    />
                )}
            </Modal>

            {/* Review Modal - shows after delivery */}
            <ReviewModal
                visible={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                rideId={lastCompletedRide?._id}
                recipientName={lastCompletedRide?.customer_name || 'Customer'}
                recipientRole="customer"
            />

            {/* IDLE BOTTOM SHEET */}
            {!activeRide && (!availableRides || availableRides.length === 0) && (
                <Animated.View style={[styles.bottomSheet, { height: sheetHeight, paddingBottom: insets.bottom }]} {...panResponder.panHandlers}>
                    <View style={styles.sheetHandle} />
                    <View style={styles.sheetContent}>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>{driver?.total_trips || 0}</Text>
                            <Text style={styles.statLbl}>Safari Leo</Text>
                        </View>
                        <View style={styles.statusIndicator}>
                            <Text style={styles.statusMsg}>
                                {driverData.is_online ? "Unasubiri oda..." : "Washa app kupata kazi"}
                            </Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>{driver?.rating?.toFixed(1) || "5.0"}</Text>
                            <Text style={styles.statLbl}>Rating</Text>
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    loadingText: { marginTop: 16, color: Colors.textDim },

    // Position the Card Overlay
    incomingOverlayContainer: {
        position: 'absolute',
        left: 16, right: 16,
        // No background color needed, the Card has it.
    },

    // Map Markers
    pickupMarker: { backgroundColor: Colors.primary, padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#FFF' },
    dropoffMarker: { backgroundColor: '#121212', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#FFF' },

    // Top HUD
    topHud: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
    },
    profileImage: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.primary },
    verifiedBadge: {
        position: 'absolute', bottom: -2, right: -2,
        backgroundColor: '#10B981', borderRadius: 8, padding: 2,
    },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 10, paddingHorizontal: 18, borderRadius: 24,
    },
    statusOnline: { backgroundColor: '#10B981' },
    statusOffline: { backgroundColor: '#6B7280' },
    statusLocked: { backgroundColor: '#8B5CF6' },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
    statusDotOnline: { backgroundColor: '#FFF' },
    statusText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
    earningsBadge: { alignItems: 'flex-end' },
    earningsValue: { fontSize: 16, fontWeight: '900', color: '#121212' },
    earningsLabel: { fontSize: 11, color: Colors.textDim, fontWeight: '600' },

    // Incoming Ride Popup
    incomingOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
    },
    incomingBlur: { ...StyleSheet.absoluteFillObject },
    incomingCard: {
        backgroundColor: '#FFF', borderRadius: 28, padding: 24, width: '100%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.25, shadowRadius: 30, elevation: 20,
    },
    incomingPulse: { alignItems: 'center', marginBottom: 8 },
    pulseRing: {
        position: 'absolute', width: 60, height: 60, borderRadius: 30,
        backgroundColor: Colors.primary, opacity: 0.2,
    },
    incomingLabel: { textAlign: 'center', fontSize: 12, fontWeight: '800', color: Colors.textDim, letterSpacing: 2, marginBottom: 4 },
    incomingFare: { textAlign: 'center', fontSize: 36, fontWeight: '900', color: '#121212', marginBottom: 20 },
    routePreview: { marginBottom: 20 },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    routeInfo: { flex: 1 },
    routeLabel: { fontSize: 10, fontWeight: '700', color: Colors.textDim, letterSpacing: 1 },
    routeAddr: { fontSize: 15, fontWeight: '600', color: '#121212' },
    routeConnector: { width: 2, height: 24, backgroundColor: '#E5E7EB', marginLeft: 5, marginVertical: 4 },
    pickupDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
    dropoffDot: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#121212' },
    metaTags: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    metaTag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12,
    },
    metaTagText: { fontSize: 12, fontWeight: '700', color: Colors.text },
    bizTag: { backgroundColor: '#8B5CF610' },
    acceptBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
        backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 16,
    },
    acceptBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

    // Slim Incoming Ride Card (New Map-First Design)
    incomingSheet: {
        position: 'absolute', left: 16, right: 16,
        backgroundColor: '#FFF', borderRadius: 20, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
    },
    incomingHeader: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    },
    incomingPulseSmall: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: `${Colors.primary}15`,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    cargoIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cargoIconImageBig: { width: 40, height: 40 },
    cargoIconRef: { fontSize: 32 },
    photoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: '#F0FDF4', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    photoBadgeText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
    rideTexts: { flex: 1 },
    cargoLabel: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 2 },

    // Legacy Styles (Keep for safety)
    cargoIconSmall: { width: 24, height: 24 },
    cargoIconTiny: { width: 16, height: 16 },
    cargoLabelText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
    incomingHeaderText: { flex: 1 },
    incomingLabelSmall: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5 },
    incomingFareSmall: { fontSize: 22, fontWeight: '900', color: '#121212' },
    incomingMeta: { alignItems: 'flex-end' },
    metaDistance: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    bizBadgeSmall: {
        marginTop: 4, backgroundColor: '#8B5CF6', borderRadius: 8, padding: 4,
    },
    // Net Profit & Badge Styles
    netProfitBadge: { alignItems: 'flex-end' },
    netProfitLabel: { fontSize: 9, fontWeight: '700', color: '#16A34A', letterSpacing: 0.5 },
    netProfitValue: { fontSize: 13, fontWeight: '800', color: '#16A34A' },

    // Cargo Row & Badges
    cargoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12 },
    cargoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    cargoBadgeText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
    fragileBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
    fragileText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
    helperBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FED7AA' },
    helperText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
    routeCompact: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        borderRadius: 12, padding: 12, marginBottom: 12,
    },
    routeRowCompact: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    dotSmall: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    routeAddrCompact: { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },
    arrowIcon: { paddingHorizontal: 8 },
    acceptBtnCompact: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 14,
    },
    acceptBtnTextCompact: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },


    // Active Ride Card
    activeCard: {
        position: 'absolute', left: 16, right: 16,
        backgroundColor: '#FFF', borderRadius: 24, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 15,
    },
    activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    activeStatusBadge: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
    activeStatusText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
    activeActions: { flexDirection: 'row', gap: 10 },
    actionCircle: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    callCircle: { backgroundColor: '#10B981' },
    destInfo: { marginBottom: 16 },
    destLabel: { fontSize: 11, fontWeight: '700', color: Colors.textDim, letterSpacing: 1, marginBottom: 4 },
    destAddr: { fontSize: 16, fontWeight: '600', color: '#121212', lineHeight: 22 },
    focusBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 12, marginBottom: 16,
    },
    focusBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
    statusBtns: { gap: 10 },
    primaryBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    completeBtn: { backgroundColor: '#10B981' },
    primaryBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

    // Compact Active Ride Strip (New Map-First Design)
    activeStrip: {
        position: 'absolute', left: 16, right: 16,
        backgroundColor: '#FFF', borderRadius: 20, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12, shadowRadius: 16, elevation: 12,
        overflow: 'hidden' // Ensure expanded content doesn't bleed
    },
    expandHandle: {
        width: '100%', height: 20, alignItems: 'center', justifyContent: 'center',
        marginTop: -10, marginBottom: 5
    },
    handleBar: {
        width: 32, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2
    },
    expandedDetails: {
        marginTop: 10, marginBottom: 16, paddingHorizontal: 4
    },
    detailRow: { flexDirection: 'row', gap: 20 },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 10, fontWeight: '700', color: Colors.textDim, marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '600', color: '#121212' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
    stripLeft: {
        flexDirection: 'row', alignItems: 'center', flex: 1,
        marginBottom: 12, paddingRight: 8,
    },
    stripStatusDot: {
        width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary,
        marginRight: 10,
    },
    stripInfo: { flex: 1 },
    stripStatus: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 1.5 },
    stripAddr: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 2 },
    stripActions: { flexDirection: 'row', gap: 8, position: 'absolute', top: 16, right: 16 },
    stripActionBtn: {
        backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },
    stripCall: { backgroundColor: '#10B981' },
    stripActionRow: { marginTop: 4 },
    stripMainBtn: {
        backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14,
        alignItems: 'center',
    },
    stripComplete: { backgroundColor: '#10B981' },
    stripMainBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },


    // Bottom Sheet
    bottomSheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        shadowColor: '#000', shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1, shadowRadius: 15, elevation: 10,
    },
    sheetHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
    sheetContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
    statBox: { alignItems: 'center' },
    statVal: { fontSize: 24, fontWeight: '900', color: '#121212' },
    statLbl: { fontSize: 11, color: Colors.textDim, fontWeight: '600' },
    statusIndicator: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
    statusMsg: { fontSize: 14, color: Colors.textDim, textAlign: 'center', fontWeight: '500' },
});
