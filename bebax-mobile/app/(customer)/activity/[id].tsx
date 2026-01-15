import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/Colors';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../../src/convex/_generated/api';

export default function ActivityDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Fetch real ride data
    // @ts-ignore
    const ride = useQuery(api.rides.getRide, { ride_id: id as any });

    if (ride === undefined) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={{ marginTop: 16, color: Colors.textDim }}>Loading connection...</Text>
            </View>
        );
    }

    if (ride === null) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: Colors.text }}>Trip not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: Colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <View style={styles.container}>
            {/* Map Header */}
            <View style={styles.mapContainer}>
                <MapView
                    provider={PROVIDER_DEFAULT}
                    style={styles.map}
                    initialRegion={{
                        latitude: ride.pickup_location?.lat || -6.771,
                        longitude: ride.pickup_location?.lng || 39.240,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                >
                    {ride.pickup_location && (
                        <Marker coordinate={{ latitude: ride.pickup_location.lat, longitude: ride.pickup_location.lng }} pinColor={Colors.primary} />
                    )}
                    {ride.dropoff_location && (
                        <Marker coordinate={{ latitude: ride.dropoff_location.lat, longitude: ride.dropoff_location.lng }} pinColor="green" />
                    )}
                </MapView>

                {/* Header Overlay */}
                <View style={[styles.headerOverlay, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Trip Details</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Content Body */}
            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Status & Date */}
                <View style={styles.section}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.dateText}>{formatDate(ride.created_at)}</Text>
                        <View style={[styles.statusBadge, ride.status === 'cancelled' ? styles.badgeCancelled : styles.badgeCompleted]}>
                            <Text style={[styles.statusText, ride.status === 'cancelled' ? styles.textCancelled : styles.textCompleted]}>
                                {ride.status?.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Driver Info - Only show if driver assigned */}
                {ride.driver_details && (
                    <View style={styles.driverCard}>
                        <Image
                            source={{ uri: ride.driver_details.photo || 'https://i.pravatar.cc/150' }}
                            style={styles.driverImage}
                        />
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>{ride.driver_details.name || 'Unknown Driver'}</Text>
                            <Text style={styles.vehicleInfo}>
                                {ride.vehicle_type?.toUpperCase()} • {ride.driver_details.rating} ★
                            </Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceText}>
                                TSh {(ride.final_fare || ride.fare_estimate).toLocaleString()}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Route */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeader}>ROUTE</Text>
                    <View style={styles.routeRow}>
                        <View style={styles.timeline}>
                            <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                            <View style={styles.line} />
                            <View style={[styles.dot, { backgroundColor: 'black' }]} />
                        </View>
                        <View style={styles.addresses}>
                            <View style={styles.addressBlock}>
                                <Text style={styles.addressLabel}>Pickup</Text>
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {ride.pickup_location?.address}
                                </Text>
                            </View>
                            <View style={styles.addressBlock}>
                                <Text style={styles.addressLabel}>Dropoff</Text>
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {ride.dropoff_location?.address}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Cargo Details */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeader}>CARGO DETAILS</Text>
                    <View style={styles.itemsRow}>
                        <FontAwesome5 name="box-open" size={20} color={Colors.primary} />
                        <Text style={styles.itemsText}>
                            {ride.cargo_description || 'No description provided'}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.mainButton}>
                        <Text style={styles.mainButtonText}>Rebook Ride</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryAction}>
                        <MaterialIcons name="flag" size={16} color={Colors.textDim} style={{ marginRight: 6 }} />
                        <Text style={styles.secondaryActionText}>Report an issue with this trip</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header Map
    mapContainer: { height: 250, backgroundColor: '#eee' },
    map: { ...StyleSheet.absoluteFillObject },
    headerOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 16
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'white', justifyContent: 'center', alignItems: 'center',
        shadowColor: 'black', shadowOpacity: 0.1, shadowRadius: 5, elevation: 5
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#000', backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },

    content: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, backgroundColor: Colors.background, paddingTop: 24 },
    section: { paddingHorizontal: 20, marginBottom: 20 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 16, fontWeight: '600', color: Colors.text },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    badgeCompleted: { backgroundColor: '#E3FCEF' },
    badgeCancelled: { backgroundColor: '#FFEBE6' },
    statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    textCompleted: { color: '#006644' },
    textCancelled: { color: '#BF2600' },

    driverCard: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 20, padding: 16, marginBottom: 24,
        backgroundColor: 'white', borderRadius: 16,
        shadowColor: 'black', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
    },
    driverImage: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', marginRight: 16 },
    driverInfo: { flex: 1 },
    driverName: { fontSize: 16, fontWeight: '700', color: Colors.text },
    vehicleInfo: { fontSize: 14, color: Colors.textDim, marginTop: 2 },
    priceContainer: { alignItems: 'flex-end' },
    priceText: { fontSize: 16, fontWeight: '800', color: Colors.primary },

    sectionCard: {
        marginHorizontal: 20, marginBottom: 20,
        backgroundColor: 'white', borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: '#f0f0f0'
    },
    sectionHeader: { fontSize: 12, fontWeight: '700', color: Colors.textDim, marginBottom: 16, letterSpacing: 1 },
    routeRow: { flexDirection: 'row' },
    timeline: { alignItems: 'center', marginRight: 16, paddingTop: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    line: { width: 2, height: 40, backgroundColor: '#eee', marginVertical: 4 },
    addresses: { flex: 1 },
    addressBlock: { height: 60, justifyContent: 'flex-start' },
    addressLabel: { fontSize: 12, color: Colors.textDim, marginBottom: 2 },
    addressText: { fontSize: 15, fontWeight: '600', color: Colors.text },

    itemsRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 12 },
    itemsText: { marginLeft: 12, fontSize: 15, color: Colors.text, fontWeight: '500' },

    actionContainer: {
        paddingHorizontal: 20,
        marginTop: 12,
        marginBottom: 20,
    },
    mainButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 16,
    },
    mainButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    secondaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    secondaryActionText: {
        color: Colors.textDim,
        fontSize: 14,
        fontWeight: '600',
    },
});
