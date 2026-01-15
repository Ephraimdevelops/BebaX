import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface DriverJobCardProps {
    ride: {
        _id: string;
        pickup_location: { address: string };
        dropoff_location: { address: string };
        fare_estimate: number;
        distance: number;
        vehicle_type: string;
        cargo_details: string;
        // Visual Truth Fields
        mission_mode?: 'item' | 'move';
        cargo_photo_url?: string;
        helpers_count?: number;
        house_size_id?: string;
        // Business Fields
        waybill_number?: string;
        recipient_name?: string;
        recipient_phone?: string;
    };
    onAccept: () => void;
    onDecline: () => void;
}

export const DriverJobCard = ({ ride, onAccept, onDecline }: DriverJobCardProps) => {
    // Mission Badge Logic
    const isMove = ride.mission_mode === 'move';
    const badgeColor = isMove ? '#7C3AED' : '#2563EB'; // Purple vs Blue
    const badgeLabel = isMove ? 'HAMISHA (MOVE HOUSE)' : 'CARGO DELIVERY';
    const badgeIcon = isMove ? 'home' : 'inventory-2';

    return (
        <View style={styles.card}>
            {/* 1. MISSION BADGE (Visual Truth) */}
            <View style={[styles.missionBadge, { backgroundColor: badgeColor }]}>
                <MaterialIcons name={badgeIcon as any} size={16} color="#FFF" />
                <Text style={styles.missionText}>{badgeLabel}</Text>
                {ride.helpers_count && ride.helpers_count > 0 ? (
                    <View style={styles.helpersTag}>
                        <Text style={styles.helpersText}>+{ride.helpers_count} Helpers</Text>
                    </View>
                ) : null}
            </View>

            {/* 2. PHOTO TRUTH (If Large Item) */}
            {ride.cargo_photo_url ? (
                <View style={styles.photoContainer}>
                    <Image source={{ uri: ride.cargo_photo_url }} style={styles.cargoPhoto} />
                    <View style={styles.verifiedOverlay}>
                        <MaterialIcons name="verified" size={14} color="#16A34A" />
                        <Text style={styles.verifiedText}>Verified Cargo</Text>
                    </View>
                </View>
            ) : null}

            {/* 3. DETAILS */}
            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.price}>Tsh {ride.fare_estimate.toLocaleString()}</Text>
                    <Text style={styles.distance}>{ride.distance.toFixed(1)} km</Text>
                </View>

                {/* WAYBILL INFO (Business Mode) */}
                {ride.waybill_number && (
                    <View style={styles.waybillContainer}>
                        <View style={styles.waybillRow}>
                            <MaterialIcons name="receipt-long" size={16} color="#475569" />
                            <Text style={styles.waybillText}>{ride.waybill_number}</Text>
                        </View>
                        {ride.recipient_name && (
                            <View>
                                <Text style={styles.recipientLabel}>Recipient</Text>
                                <Text style={styles.recipientName}>{ride.recipient_name} • {ride.recipient_phone}</Text>
                            </View>
                        )}
                    </View>
                )}

                <Text style={styles.cargoDesc} numberOfLines={2}>
                    {ride.cargo_details}
                </Text>

                {/* Locations */}
                <View style={styles.timeline}>
                    <View style={styles.locationRow}>
                        <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.address} numberOfLines={1}>{ride.pickup_location.address}</Text>
                    </View>
                    <View style={styles.locationConnector} />
                    <View style={styles.locationRow}>
                        <View style={[styles.dot, { backgroundColor: '#0F172A' }]} />
                        <Text style={styles.address} numberOfLines={1}>{ride.dropoff_location.address}</Text>
                    </View>
                </View>
            </View>

            {/* 4. ACTIONS */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
                    <Ionicons name="close" size={24} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
                    <Text style={styles.acceptText}>ACCEPT JOB</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginVertical: 8,
    },
    missionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    missionText: {
        color: '#FFF',
        fontWeight: '800',
        letterSpacing: 0.5,
        fontSize: 12,
    },
    helpersTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    helpersText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 10,
    },
    photoContainer: {
        height: 120,
        backgroundColor: '#F1F5F9',
        position: 'relative',
    },
    cargoPhoto: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    verifiedOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    verifiedText: {
        color: '#16A34A',
        fontWeight: '700',
        fontSize: 10,
    },
    content: {
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    price: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    distance: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    cargoDesc: {
        fontSize: 14,
        color: '#334155',
        marginBottom: 16,
        lineHeight: 20,
    },
    // Waybill Styles
    waybillContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 4
    },
    waybillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    waybillText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
    },
    recipientLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 4
    },
    recipientName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B'
    },
    timeline: {
        gap: 0,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 24,
    },
    locationConnector: {
        width: 2,
        height: 12,
        backgroundColor: '#E2E8F0',
        marginLeft: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    address: {
        fontSize: 14,
        color: '#0F172A',
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    declineBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    acceptBtn: {
        flex: 1,
        height: 50,
        backgroundColor: Colors.primary,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        elevation: 2,
    },
    acceptText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
    },
});
