import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Switch, Alert, FlatList, StatusBar, Image } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { customMapStyle } from '../../src/constants/mapStyle';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { Colors } from '../../src/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Default Location: Dar es Salaam
const DAR_ES_SALAAM = {
    latitude: -6.7924,
    longitude: 39.2083,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export default function DriverHome() {
    const [location, setLocation] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const insets = useSafeAreaInsets();

    // Real-time feeds
    const openRides = useQuery(api.rides.getOpenRides) || [];
    const acceptRide = useMutation(api.rides.acceptRide);
    const { userId } = useAuth();
    const userProfile = useQuery(api.users.getMyself);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocation(DAR_ES_SALAAM);
                return;
            }
            let loc = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.0121,
            });
        })();
    }, []);

    const handleToggleOnline = (val: boolean) => {
        setIsOnline(val);
        // NOTE: Wiring to actual driver status mutation would go here.
        // e.g. updateDriverStatus({ id: driverId, status: val ? 'active' : 'inactive' });
    };

    const handleAccept = async (rideId: string) => {
        try {
            if (!userProfile?.driver?._id) {
                Alert.alert("Error", "Driver profile not found.");
                return;
            }
            await acceptRide({
                ride_id: rideId,
                driver_id: userProfile.driver._id // Assuming linked
            });
            Alert.alert("Success", "Ride Accepted! Navigate to pickup.");
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to accept ride.");
        }
    };

    const renderRideRequest = ({ item }: { item: any }) => (
        <View style={styles.requestCard}>
            <LinearGradient
                colors={['#ffffff', '#fcfcfc']}
                style={styles.cardGradient}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>NEW REQUEST</Text>
                    </View>
                    <View style={styles.distanceBadge}>
                        <Ionicons name="location-sharp" size={12} color={Colors.textDim} />
                        <Text style={styles.distanceTag}>{item.distance} km</Text>
                    </View>
                </View>

                {/* Price */}
                <Text style={styles.priceTag}>TZS {item.fare_estimate.toLocaleString()}</Text>

                {/* Route */}
                <View style={styles.routeContainer}>
                    <View style={styles.routeRow}>
                        <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.routeText} numberOfLines={1}>{item.pickup_address || "Pickup Location"}</Text>
                    </View>
                    <View style={styles.verticalLine} />
                    <View style={styles.routeRow}>
                        <View style={[styles.dot, { backgroundColor: Colors.text }]} />
                        <Text style={styles.routeText} numberOfLines={1}>{item.dropoff_address || "Dropoff Location"}</Text>
                    </View>
                </View>

                {/* Items Description - HIGHLIGHTED */}
                {item.items_description ? (
                    <View style={styles.itemsContainer}>
                        <FontAwesome5 name="box" size={14} color={Colors.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.itemsText}>{item.items_description}</Text>
                    </View>
                ) : null}

                {/* Action */}
                <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item._id)}>
                    <Text style={styles.acceptButtonText}>ACCEPT RIDE</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <MapView
                provider={PROVIDER_DEFAULT}
                style={styles.map}
                initialRegion={DAR_ES_SALAAM}
                region={location || DAR_ES_SALAAM}
                customMapStyle={customMapStyle}
                showsUserLocation={true}
            />

            {/* HEADER - Floating Glass */}
            {isOnline && (
                <View style={[styles.header, { top: insets.top + 10 }]}>
                    <View style={styles.statusRow}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.statusText}>YOU ARE ONLINE</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsOnline(false)} style={styles.offlineBtn}>
                        <MaterialIcons name="power-settings-new" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {/* RIDE FEED - Bottom Sheet style */}
            {isOnline && openRides.length > 0 && (
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.1)']}
                    style={styles.feedWrapper}
                    pointerEvents="box-none"
                >
                    <FlatList
                        data={openRides}
                        keyExtractor={(item) => item._id}
                        renderItem={renderRideRequest}
                        contentContainerStyle={styles.feedContent}
                        showsVerticalScrollIndicator={false}
                    />
                </LinearGradient>
            )}

            {/* OFFLINE MODAL */}
            {!isOnline && (
                <View style={styles.offlineContainer}>
                    <LinearGradient
                        colors={[Colors.surface, '#f8f9fa']}
                        style={styles.offlineCard}
                    >
                        <View style={styles.offlineIconBox}>
                            <MaterialIcons name="local-shipping" size={40} color={Colors.textDim} />
                        </View>
                        <Text style={styles.offlineTitle}>Ready to work?</Text>
                        <Text style={styles.offlineSubtitle}>Go online to start receiving ride requests nearby.</Text>

                        <TouchableOpacity style={styles.goOnlineButton} onPress={() => handleToggleOnline(true)}>
                            <Text style={styles.goOnlineText}>GO ONLINE</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        position: 'absolute',
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    onlineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.success,
        marginRight: 10,
        shadowColor: Colors.success,
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    statusText: {
        color: Colors.text,
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    offlineBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65%',
        justifyContent: 'flex-end',
    },
    feedContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    requestCard: {
        marginBottom: 20,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
        backgroundColor: 'white',
    },
    cardGradient: {
        borderRadius: 24,
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badge: {
        backgroundColor: '#FFF0EB',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    badgeText: {
        color: Colors.primary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    distanceTag: {
        color: Colors.textDim,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    priceTag: {
        color: Colors.text,
        fontSize: 28,
        fontWeight: '800', // Heavy bold
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    routeContainer: {
        marginBottom: 16,
        backgroundColor: '#FCFCFC',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    routeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    verticalLine: { width: 2, height: 16, backgroundColor: '#E0E0E0', marginLeft: 3, marginVertical: 2 },
    routeText: { color: Colors.text, fontSize: 15, fontWeight: '500', flex: 1 },

    // Items Box
    itemsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF8F4', // Warm tint
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 99, 71, 0.1)',
    },
    itemsText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
    },

    acceptButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
        marginRight: 8,
    },

    // Offline
    offlineContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
    },
    offlineCard: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    offlineIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    offlineTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    offlineSubtitle: {
        fontSize: 15,
        color: Colors.textDim,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    goOnlineButton: {
        width: '100%',
        backgroundColor: Colors.text, // Black button for sleek look
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    goOnlineText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
