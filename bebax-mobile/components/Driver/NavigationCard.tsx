import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { Navigation, MapPin, Flag, Clock } from 'lucide-react-native';

interface NavigationCardProps {
    status: string; // 'accepted' | 'loading' | 'ongoing'
    pickupAddress: string;
    dropoffAddress: string;
    pickupLocation: { lat: number; lng: number };
    dropoffLocation: { lat: number; lng: number };
    estimatedDistance?: number; // in km
}

export default function NavigationCard({
    status,
    pickupAddress,
    dropoffAddress,
    pickupLocation,
    dropoffLocation,
    estimatedDistance,
}: NavigationCardProps) {
    const isHeadingToPickup = status === 'accepted';
    const isHeadingToDropoff = status === 'loading' || status === 'ongoing';

    const currentDestination = isHeadingToPickup ? pickupLocation : dropoffLocation;
    const currentAddress = isHeadingToPickup ? pickupAddress : dropoffAddress;
    const currentLabel = isHeadingToPickup ? 'Heading to Pickup' : 'Heading to Dropoff';

    // Estimate ETA (rough calculation: 25 km/h average in city)
    const etaMinutes = estimatedDistance ? Math.round((estimatedDistance / 25) * 60) : null;

    const handleNavigate = () => {
        const { lat, lng } = currentDestination;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
        Linking.openURL(url);
    };

    const handleNavigateWaze = () => {
        const { lat, lng } = currentDestination;
        const url = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            {/* Status Header */}
            <View style={styles.header}>
                <View style={[
                    styles.statusDot,
                    isHeadingToPickup ? styles.pickupDot : styles.dropoffDot
                ]} />
                <Text style={styles.statusLabel}>{currentLabel}</Text>
                {etaMinutes && (
                    <View style={styles.etaBadge}>
                        <Clock size={12} color={Colors.primary} />
                        <Text style={styles.etaText}>~{etaMinutes} min</Text>
                    </View>
                )}
            </View>

            {/* Destination Address */}
            <View style={styles.addressRow}>
                {isHeadingToPickup ? (
                    <MapPin size={20} color={Colors.primary} />
                ) : (
                    <Flag size={20} color={Colors.text} />
                )}
                <Text style={styles.addressText} numberOfLines={2}>
                    {currentAddress}
                </Text>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={handleNavigate}
                >
                    <Navigation size={20} color="white" />
                    <Text style={styles.navigateText}>Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.wazeButton}
                    onPress={handleNavigateWaze}
                >
                    <Text style={styles.wazeText}>Waze</Text>
                </TouchableOpacity>
            </View>

            {/* Route Preview (Pickup → Dropoff) */}
            <View style={styles.routePreview}>
                <View style={styles.routePoint}>
                    <View style={[styles.routeDot, styles.pickupRouteDot]} />
                    <Text style={styles.routeLabel} numberOfLines={1}>{pickupAddress}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                    <View style={[styles.routeDot, styles.dropoffRouteDot]} />
                    <Text style={styles.routeLabel} numberOfLines={1}>{dropoffAddress}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    pickupDot: {
        backgroundColor: Colors.primary,
    },
    dropoffDot: {
        backgroundColor: Colors.text,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        flex: 1,
    },
    etaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    etaText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 10,
    },
    addressText: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    navigateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    navigateText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    wazeButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#33CCFF',
    },
    wazeText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    routePreview: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    pickupRouteDot: {
        backgroundColor: Colors.primary,
    },
    dropoffRouteDot: {
        backgroundColor: Colors.text,
    },
    routeLine: {
        width: 2,
        height: 16,
        backgroundColor: '#E0E0E0',
        marginLeft: 3,
        marginVertical: 2,
    },
    routeLabel: {
        flex: 1,
        fontSize: 12,
        color: Colors.textDim,
    },
});
