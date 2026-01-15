import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

const { width, height } = Dimensions.get('window');

// Admin Dark Theme
const Colors = {
    background: '#0A0A0A',
    surface: '#141414',
    surfaceLight: '#1E1E1E',
    primary: '#FF6B35',
    accent: '#00D4AA',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#FFFFFF',
    textDim: '#6B7280',
    border: '#2D2D2D',
};

// Dark map style
const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];

type FilterType = 'all' | 'online' | 'in_trip';

export default function GodEyeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [filter, setFilter] = useState<FilterType>('all');

    // Fetch all online drivers
    const onlineDrivers = useQuery(api.drivers.getOnlineDrivers) || [];
    const activeRides = useQuery(api.rides.getActiveRides) || [];

    // Filter drivers based on selection
    const filteredDrivers = onlineDrivers.filter(driver => {
        if (filter === 'all') return true;
        if (filter === 'online') return !driver.current_ride_id;
        if (filter === 'in_trip') return !!driver.current_ride_id;
        return true;
    });

    // Dar es Salaam center
    const initialRegion = {
        latitude: -6.7924,
        longitude: 39.2083,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    return (
        <View style={styles.container}>
            {/* Full Screen Map */}
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                customMapStyle={darkMapStyle}
            >
                {filteredDrivers.map((driver) => (
                    <Marker
                        key={driver._id}
                        coordinate={{
                            latitude: driver.current_location?.lat || initialRegion.latitude,
                            longitude: driver.current_location?.lng || initialRegion.longitude,
                        }}
                        title={driver.name}
                        description={driver.current_ride_id ? 'In Trip' : 'Available'}
                    >
                        <View style={[
                            styles.markerContainer,
                            { backgroundColor: driver.current_ride_id ? Colors.primary : Colors.accent }
                        ]}>
                            <Ionicons name="car" size={16} color="white" />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Header Overlay */}
            <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>God Eye</Text>
                <View style={styles.statsChip}>
                    <Text style={styles.statsText}>{onlineDrivers.length} Online</Text>
                </View>
            </View>

            {/* Filter Pills */}
            <View style={[styles.filterContainer, { bottom: insets.bottom + 100 }]}>
                {(['all', 'online', 'in_trip'] as FilterType[]).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterPill, filter === f && styles.filterPillActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'all' ? 'All' : f === 'online' ? 'Available' : 'In Trip'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Stats Bar */}
            <View style={[styles.statsBar, { bottom: insets.bottom + 20 }]}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{onlineDrivers.length}</Text>
                    <Text style={styles.statLabel}>Drivers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{activeRides.length}</Text>
                    <Text style={styles.statLabel}>Active Rides</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    map: {
        width,
        height,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(10, 10, 10, 0.9)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 12,
    },
    statsChip: {
        backgroundColor: Colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statsText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'white',
    },
    markerContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    filterContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textDim,
    },
    filterTextActive: {
        color: 'white',
    },
    statsBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 2,
    },
});
