import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../../src/convex/_generated/api';
import { Colors } from '../../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Activity() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const rides = useQuery(api.rides.listMyRides);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.replace('/(auth)/welcome');
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded || !isSignedIn) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed': return { color: '#10B981', bg: '#DCFCE7', label: 'Completed', icon: 'checkmark-circle' };
            case 'cancelled': return { color: '#EF4444', bg: '#FEE2E2', label: 'Cancelled', icon: 'close-circle' };
            case 'ongoing':
            case 'started': return { color: '#3B82F6', bg: '#DBEAFE', label: 'In Trip', icon: 'play-circle' };
            case 'accepted': return { color: '#F59E0B', bg: '#FEF3C7', label: 'Driver Coming', icon: 'time' };
            default: return { color: '#94A3B8', bg: '#F1F5F9', label: 'Pending', icon: 'ellipse' };
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* LARGE HEADER */}
            <View style={styles.header}>
                <Text style={styles.hugeTitle}>Your Activity</Text>
                <Text style={styles.subtitle}>Recent requests & deliveries</Text>
            </View>

            {rides === undefined ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : rides.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBg}>
                        <Ionicons name="documents-outline" size={40} color={Colors.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No activity yet</Text>
                    <Text style={styles.emptyText}>Your bookings will appear here.</Text>
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => router.push('/')}
                    >
                        <Text style={styles.bookButtonText}>Start Moving</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {rides.map((ride: any) => {
                        const status = getStatusConfig(ride.status);
                        return (
                            <TouchableOpacity
                                key={ride._id}
                                style={styles.card}
                                onPress={() => router.push(`/(customer)/activity/${ride._id}`)}
                                activeOpacity={0.8}
                            >
                                {/* HEADER OF CARD */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.dateRow}>
                                        <Text style={styles.dateText}>{formatDate(ride.created_at)}</Text>
                                        <Text style={styles.timeText}> • {formatTime(ride.created_at)}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                                        <Ionicons name={status.icon as any} size={12} color={status.color} />
                                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                                    </View>
                                </View>

                                {/* ROUTE VISUALIZATION */}
                                <View style={styles.routeContainer}>
                                    <View style={styles.routeLeft}>
                                        <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                                        <View style={styles.line} />
                                        <View style={[styles.box, { borderColor: Colors.text }]} />
                                    </View>
                                    <View style={styles.routeRight}>
                                        <Text style={styles.addressTitle} numberOfLines={1}>{ride.pickup_location?.address || "Current Location"}</Text>
                                        <View style={{ height: 16 }} />
                                        <Text style={styles.addressTitle} numberOfLines={1}>{ride.dropoff_location?.address || "Unknown"}</Text>
                                    </View>
                                </View>

                                {/* FOOTER */}
                                <View style={styles.cardFooter}>
                                    <View style={styles.vehicleRow}>
                                        {/* Mock vehicle icon based on type */}
                                        <Text style={styles.vehicleText}>{ride.vehicle_type?.toUpperCase() || "VEHICLE"}</Text>
                                    </View>
                                    <Text style={styles.priceText}>TSh {(ride.final_fare || ride.fare_estimate).toLocaleString()}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Slate-50
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        paddingTop: 10,
    },
    hugeTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptyText: {
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    bookButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    bookButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    timeText: {
        fontSize: 14,
        color: '#94A3B8',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    routeContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    routeLeft: {
        alignItems: 'center',
        marginRight: 12,
        paddingTop: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    line: {
        width: 2,
        height: 24,
        backgroundColor: '#E2E8F0',
        marginVertical: 4,
    },
    box: {
        width: 10,
        height: 10,
        borderWidth: 2,
        borderRadius: 2,
    },
    routeRight: {
        flex: 1,
    },
    addressTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#0F172A',
        marginBottom: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    vehicleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
    },
});
