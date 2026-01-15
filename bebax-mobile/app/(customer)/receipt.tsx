import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReceiptScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    // Get ride from active ride or passed ride_id
    const activeRide = useQuery(api.rides.getActiveRide);
    const ride = activeRide; // For now use active ride

    const handleShare = async () => {
        if (!ride) return;
        try {
            await Share.share({
                message: `BebaX Trip Receipt\n\nFrom: ${ride.pickup_location?.address}\nTo: ${ride.dropoff_location?.address}\nFare: Tsh ${ride.final_fare?.toLocaleString() || ride.fare_estimate?.toLocaleString()}\nDate: ${new Date(ride.created_at).toLocaleDateString()}\n\nThank you for riding with BebaX!`,
                title: 'Trip Receipt',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share receipt');
        }
    };

    if (!ride) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Receipt</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="receipt-long" size={64} color={Colors.textDim} />
                    <Text style={styles.emptyText}>No receipt available</Text>
                </View>
            </View>
        );
    }

    const fare = ride.final_fare || ride.fare_estimate || 0;
    const insuranceFee = ride.insurance_fee || 0;
    const subtotal = fare - insuranceFee;
    const date = new Date(ride.created_at);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Receipt</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Ionicons name="share-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Trip Completed Banner */}
                <View style={styles.successBanner}>
                    <MaterialIcons name="check-circle" size={40} color={Colors.success} />
                    <Text style={styles.successText}>Safari Imemalizika!</Text>
                    <Text style={styles.successSubtext}>Trip Completed</Text>
                </View>

                {/* Receipt Card */}
                <View style={styles.receiptCard}>
                    {/* Date & ID */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Date</Text>
                        <Text style={styles.value}>{date.toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Time</Text>
                        <Text style={styles.value}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Route */}
                    <View style={styles.routeSection}>
                        <View style={styles.routePoint}>
                            <View style={styles.pickupDot} />
                            <View style={styles.routeText}>
                                <Text style={styles.routeLabel}>Pickup</Text>
                                <Text style={styles.routeAddress} numberOfLines={2}>
                                    {ride.pickup_location?.address}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routePoint}>
                            <View style={styles.dropoffDot} />
                            <View style={styles.routeText}>
                                <Text style={styles.routeLabel}>Dropoff</Text>
                                <Text style={styles.routeAddress} numberOfLines={2}>
                                    {ride.dropoff_location?.address}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Fare Breakdown */}
                    <Text style={styles.sectionTitle}>Fare Breakdown</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Trip Fare</Text>
                        <Text style={styles.value}>Tsh {subtotal.toLocaleString()}</Text>
                    </View>

                    {insuranceFee > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Insurance ({ride.insurance_tier_id?.toUpperCase()})</Text>
                            <Text style={styles.value}>Tsh {insuranceFee.toLocaleString()}</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>Tsh {fare.toLocaleString()}</Text>
                    </View>

                    {/* Payment Method */}
                    <View style={styles.paymentRow}>
                        <MaterialIcons name="payments" size={20} color={Colors.textDim} />
                        <Text style={styles.paymentText}>
                            {ride.payment_method === 'cash' ? 'Cash' : 'Mobile Money'}
                        </Text>
                    </View>
                </View>

                {/* Driver Info */}
                {ride.driver_name && (
                    <View style={styles.driverCard}>
                        <View style={styles.driverAvatar}>
                            <Text style={styles.driverInitials}>
                                {ride.driver_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </Text>
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>{ride.driver_name}</Text>
                            <Text style={styles.vehicleType}>{ride.vehicle_type?.toUpperCase()}</Text>
                        </View>
                        <View style={styles.ratingBox}>
                            <MaterialIcons name="star" size={18} color="#FFD700" />
                            <Text style={styles.ratingText}>{ride.customer_rating || '5.0'}</Text>
                        </View>
                    </View>
                )}

                {/* Actions */}
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                    <Ionicons name="share-social" size={20} color="white" />
                    <Text style={styles.actionButtonText}>SHARE RECEIPT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => router.replace('/')}
                >
                    <Text style={styles.secondaryButtonText}>BOOK ANOTHER RIDE</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textDim,
        marginTop: 16,
    },
    content: {
        padding: 20,
    },
    successBanner: {
        alignItems: 'center',
        marginBottom: 24,
    },
    successText: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginTop: 12,
    },
    successSubtext: {
        fontSize: 14,
        color: Colors.textDim,
    },
    receiptCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: Colors.textDim,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 16,
    },
    routeSection: {
        marginVertical: 8,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    pickupDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
        marginRight: 12,
        marginTop: 4,
    },
    dropoffDot: {
        width: 12,
        height: 12,
        borderRadius: 3,
        backgroundColor: '#121212',
        marginRight: 12,
        marginTop: 4,
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
        marginVertical: 4,
    },
    routeText: {
        flex: 1,
    },
    routeLabel: {
        fontSize: 11,
        color: Colors.textDim,
        fontWeight: '600',
        marginBottom: 2,
    },
    routeAddress: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    paymentText: {
        marginLeft: 8,
        fontSize: 14,
        color: Colors.textDim,
        fontWeight: '500',
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    driverAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverInitials: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    driverInfo: {
        flex: 1,
        marginLeft: 14,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    vehicleType: {
        fontSize: 12,
        color: Colors.textDim,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    ratingText: {
        marginLeft: 4,
        fontWeight: '700',
        color: Colors.text,
    },
    actionButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 24,
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    secondaryButtonText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '800',
    },
});
