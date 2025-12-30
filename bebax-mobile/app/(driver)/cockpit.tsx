import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Dimensions, Image, Animated, PanResponder, Linking, Modal } from 'react-native';
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
import NavigationCard from '../../components/Driver/NavigationCard';
import { MessageCircle } from 'lucide-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 130;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.6;

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

    // Queries
    const driver = useQuery(api.drivers.getCurrentDriver);
    const userProfile = useQuery(api.users.getCurrentProfile); // Fallback for unverified drivers
    const activeRide = useQuery(api.rides.getDriverActiveRide);
    const availableRides = useQuery(api.rides.listAvailableRides);

    // Use driver data if available, otherwise use a minimal driver-like object from profile
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
                { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 50 },
                (location) => {
                    const { latitude, longitude } = location.coords;
                    updateLocation({
                        location: {
                            lat: latitude,
                            lng: longitude,
                            geohash: "gbsuv7", // DSM base
                        }
                    }).catch(err => console.log("Loc update failed", err));
                }
            );
        };
        if (isSignedIn && driverData?.is_online) {
            startTracking();
        }
        return () => {
            if (subscription) subscription.remove();
        };
    }, [isSignedIn, driverData?.is_online]);

    // Sheet Pan Responder
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                if (gesture.dy < 0 && !isExpanded) {
                    // Swiping up
                    const newHeight = Math.min(EXPANDED_HEIGHT, COLLAPSED_HEIGHT - gesture.dy);
                    sheetHeight.setValue(newHeight);
                } else if (gesture.dy > 0 && isExpanded) {
                    // Swiping down
                    const newHeight = Math.max(COLLAPSED_HEIGHT, EXPANDED_HEIGHT - gesture.dy);
                    sheetHeight.setValue(newHeight);
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy < -50 && !isExpanded) {
                    expandSheet();
                } else if (gesture.dy > 50 && isExpanded) {
                    collapseSheet();
                } else {
                    // Snap back
                    Animated.spring(sheetHeight, {
                        toValue: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    const expandSheet = () => {
        Animated.spring(sheetHeight, {
            toValue: EXPANDED_HEIGHT,
            useNativeDriver: false,
        }).start();
        setIsExpanded(true);
    };

    const collapseSheet = () => {
        Animated.spring(sheetHeight, {
            toValue: COLLAPSED_HEIGHT,
            useNativeDriver: false,
        }).start();
        setIsExpanded(false);
    };

    const toggleOnline = async () => {
        // Going online requires a verified driver record
        if (!driver) {
            Alert.alert(
                "Complete Registration",
                "To go online and accept rides, please complete your driver registration in the Profile section.",
                [
                    { text: "Later", style: "cancel" },
                    { text: "Go to Profile", onPress: () => router.push('/(driver)/profile') }
                ]
            );
            return;
        }
        setStatusLoading(true);
        try {
            await setOnline({ is_online: !driverData.is_online });
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleAccept = async (rideId: string) => {
        // Accepting rides requires a verified driver record
        if (!driver || !driver.verified) {
            Alert.alert(
                "Verification Required",
                "To accept rides, your driver profile must be verified. Please complete your registration and wait for admin approval.",
                [
                    { text: "OK", style: "cancel" },
                    { text: "Go to Profile", onPress: () => router.push('/(driver)/profile') }
                ]
            );
            return;
        }
        try {
            // @ts-ignore
            await acceptRide({ ride_id: rideId });
            Alert.alert("✅ Safari Imekubaliwa!", "Navigate to pickup location.");
            collapseSheet();
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    const handleStatusUpdate = async (status: string) => {
        if (!activeRide) return;
        try {
            // @ts-ignore
            await updateRideStatus({ ride_id: activeRide._id, status });
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!activeRide) return;
        try {
            // @ts-ignore
            await sendMessage({ ride_id: activeRide._id, message: text, type: 'text' });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCallCustomer = () => {
        if (activeRide?.customer_phone) {
            Linking.openURL(`tel:${activeRide.customer_phone}`);
        } else {
            Alert.alert("Info", "Customer phone number not available.");
        }
    };

    const handleNavigateToPickup = () => {
        if (activeRide?.pickup_location) {
            const { lat, lng } = activeRide.pickup_location;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
            Linking.openURL(url);
        }
    };

    const handleNavigateToDropoff = () => {
        if (activeRide?.dropoff_location) {
            const { lat, lng } = activeRide.dropoff_location;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
            Linking.openURL(url);
        }
    };

    // Still loading data
    if (!driverData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading Cockpit...</Text>
            </View>
        );
    }

    // Check if driver is verified (for showing banner)
    const isVerified = driver?.verified ?? false;

    const todayEarnings = 125000; // Mock - replace with real data

    return (
        <View style={styles.container}>
            {/* FULL SCREEN MAP */}
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_DEFAULT}
                customMapStyle={customMapStyle}
                showsUserLocation={true}
                followsUserLocation={true}
                initialRegion={{
                    latitude: -6.7924,
                    longitude: 39.2083,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            />

            {/* TOP STATUS HUD */}
            <View style={[styles.topHud, { paddingTop: insets.top + 8 }]}>
                {/* Logo */}
                <Image
                    source={require('../../assets/images/bebax_logo_black.png')}
                    style={styles.logoImage}
                />

                {/* Status Pill */}
                <TouchableOpacity
                    style={[styles.statusPill, driverData.is_online ? styles.statusOnline : styles.statusOffline]}
                    onPress={toggleOnline}
                    disabled={statusLoading}
                >
                    {statusLoading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <View style={[styles.statusDot, driverData.is_online && styles.statusDotOnline]} />
                            <Text style={styles.statusText}>
                                {driverData.is_online ? "ONLINE" : "OFFLINE"}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Earnings Badge */}
                <View style={styles.earningsBadge}>
                    <Text style={styles.earningsValue}>Tsh {todayEarnings.toLocaleString()}</Text>
                    <Text style={styles.earningsLabel}>Today</Text>
                </View>
            </View>

            {/* INCOMING RIDE MODAL (Dominant) */}
            {!activeRide && availableRides && availableRides.length > 0 && (
                <View style={styles.incomingRideOverlay}>
                    <View style={styles.incomingCard}>
                        <View style={styles.incomingHeader}>
                            <Text style={styles.incomingTitle}>🚨 INCOMING RIDE</Text>
                            <Text style={styles.incomingPrice}>
                                Tsh {availableRides[0]?.fare_estimate?.toLocaleString() || "0"}
                            </Text>
                        </View>

                        <View style={styles.incomingRoute}>
                            <View style={styles.routePoint}>
                                <View style={styles.pickupDot} />
                                <Text style={styles.routeAddress} numberOfLines={1}>
                                    {availableRides[0]?.pickup_location?.address || "Pickup"}
                                </Text>
                            </View>
                            <View style={styles.routeLine} />
                            <View style={styles.routePoint}>
                                <View style={styles.dropoffDot} />
                                <Text style={styles.routeAddress} numberOfLines={1}>
                                    {availableRides[0]?.dropoff_location?.address || "Dropoff"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.incomingMeta}>
                            <View style={styles.metaItem}>
                                <MaterialIcons name="local-shipping" size={16} color={Colors.textDim} />
                                <Text style={styles.metaText}>{availableRides[0]?.vehicle_type?.toUpperCase()}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() => handleAccept(availableRides[0]?._id)}
                        >
                            <Text style={styles.acceptButtonText}>POKEA SAFARI</Text>
                            <MaterialIcons name="check" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ACTIVE RIDE CARD */}
            {activeRide && (
                <View style={[styles.activeRideCard, { bottom: insets.bottom + 20 }]}>
                    <View style={styles.activeHeader}>
                        <Text style={styles.activeStatus}>{activeRide.status?.toUpperCase()}</Text>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.navButton} onPress={activeRide.status === 'accepted' ? handleNavigateToPickup : handleNavigateToDropoff}>
                                <MaterialIcons name="navigation" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.chatButton} onPress={() => setShowChat(true)}>
                                <MessageCircle size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
                                <Ionicons name="call" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.activeRoute}>
                        <Text style={styles.activeLabel}>Dropoff</Text>
                        <Text style={styles.activeAddress} numberOfLines={2}>
                            {activeRide.dropoff_location?.address}
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.activeActions}>
                        {activeRide.status === 'accepted' && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate('loading')}>
                                <Text style={styles.actionText}>NIMEFIKA</Text>
                            </TouchableOpacity>
                        )}
                        {activeRide.status === 'loading' && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate('ongoing')}>
                                <Text style={styles.actionText}>ANZA SAFARI</Text>
                            </TouchableOpacity>
                        )}
                        {activeRide.status === 'ongoing' && (
                            <TouchableOpacity style={[styles.actionBtn, styles.finishBtn]} onPress={() => handleStatusUpdate('delivered')}>
                                <Text style={styles.actionText}>MALIZA</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* SOS Button - Always visible during active ride */}
            {activeRide && <SOSButton rideId={activeRide._id} />}

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
                        recipientName={activeRide.customer_name || 'Customer'}
                        recipientPhone={activeRide.customer_phone}
                        currentUserId={user.id}
                        onClose={() => setShowChat(false)}
                        quickReplies={["Niko njiani", "Nimefika", "Subiri kidogo", "Nitachelewa"]}
                    />
                )}
            </Modal>

            {/* BOTTOM STATUS BAR (Swipeable) */}
            {!activeRide && (!availableRides || availableRides.length === 0) && (
                <Animated.View
                    style={[styles.bottomSheet, { height: sheetHeight, paddingBottom: insets.bottom }]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.sheetHandle} />

                    {/* Collapsed View */}
                    <View style={styles.collapsedContent}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Safari Leo</Text>
                        </View>
                        <View style={styles.onlineIndicator}>
                            <Text style={styles.onlineText}>
                                {driverData.is_online ? "Unasubiri oda..." : "Washa app kupata kazi"}
                            </Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>5.0</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                    </View>

                    {/* Expanded View */}
                    {isExpanded && (
                        <ScrollView style={styles.expandedContent}>
                            <Text style={styles.sectionTitle}>Oda Zinazosubiri</Text>
                            <Text style={styles.emptyText}>Hakuna oda kwa sasa. Subiri kidogo...</Text>
                        </ScrollView>
                    )}
                </Animated.View>
            )}

            {/* Job Opportunities FAB */}
            <TouchableOpacity
                style={styles.opportunitiesFab}
                onPress={() => router.push('/(driver)/opportunities')}
            >
                <MaterialIcons name="work" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 16,
        color: Colors.textDim,
    },

    // Top HUD
    topHud: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    logoImage: {
        width: 80,
        height: 28,
        resizeMode: 'contain',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    statusOnline: {
        backgroundColor: Colors.success,
    },
    statusOffline: {
        backgroundColor: '#666',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginRight: 8,
    },
    statusDotOnline: {
        backgroundColor: 'white',
    },
    statusText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 1,
    },
    earningsBadge: {
        alignItems: 'flex-end',
    },
    earningsValue: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },
    earningsLabel: {
        fontSize: 10,
        color: Colors.textDim,
        fontWeight: '600',
    },

    // Incoming Ride Modal (Dominant)
    incomingRideOverlay: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        zIndex: 100,
    },
    incomingCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
        borderWidth: 2,
        borderColor: Colors.success,
    },
    incomingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    incomingTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 0.5,
    },
    incomingPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.success,
    },
    incomingRoute: {
        marginBottom: 16,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickupDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
        marginRight: 12,
    },
    dropoffDot: {
        width: 12,
        height: 12,
        borderRadius: 3,
        backgroundColor: Colors.text,
        marginRight: 12,
    },
    routeLine: {
        width: 2,
        height: 24,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
        marginVertical: 4,
    },
    routeAddress: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    incomingMeta: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    metaText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textDim,
    },
    acceptButton: {
        backgroundColor: Colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
    },
    acceptButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        marginRight: 8,
        letterSpacing: 1,
    },

    // Active Ride Card
    activeRideCard: {
        position: 'absolute',
        left: 16,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    activeStatus: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    navButton: {
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButton: {
        backgroundColor: Colors.success,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatButton: {
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeRoute: {
        marginBottom: 16,
    },
    activeLabel: {
        fontSize: 12,
        color: Colors.textDim,
        fontWeight: '600',
        marginBottom: 4,
    },
    activeAddress: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    activeActions: {
        marginBottom: 16,
    },
    actionBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    finishBtn: {
        backgroundColor: Colors.success,
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },

    // Bottom Sheet
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    sheetHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    collapsedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textDim,
        fontWeight: '600',
    },
    onlineIndicator: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    onlineText: {
        fontSize: 13,
        color: Colors.textDim,
        textAlign: 'center',
        fontWeight: '500',
    },
    expandedContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textDim,
        fontSize: 14,
    },
    opportunitiesFab: {
        position: 'absolute',
        bottom: 180,
        left: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
