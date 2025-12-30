import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../../src/convex/_generated/api';
import { Colors } from '../../../src/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Activity() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Real data from Convex
    const rides = useQuery(api.rides.listMyRides);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.replace('/(auth)/welcome');
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded || !isSignedIn) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString([], { day: 'numeric', month: 'short' }) +
                `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
    };

    const getVehicleIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'boda': return 'two-wheeler';
            case 'bajaji': return 'electric-rickshaw';
            case 'boxbody':
            case 'truck': return 'local-shipping';
            default: return 'local-taxi';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed':
            case 'delivered':
                return styles.statusCompleted;
            case 'cancelled':
                return styles.statusCancelled;
            case 'ongoing':
            case 'loading':
            case 'accepted':
                return styles.statusActive;
            default:
                return styles.statusPending;
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>MY ACTIVITY</Text>
            </View>

            {rides === undefined ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading your rides...</Text>
                </View>
            ) : rides.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="history" size={64} color={Colors.textDim} />
                    <Text style={styles.emptyTitle}>No rides yet</Text>
                    <Text style={styles.emptyText}>Your ride history will appear here</Text>
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => router.push('/(customer)/dashboard')}
                    >
                        <Text style={styles.bookButtonText}>Book Your First Ride</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list}>
                    {rides.map((ride: any) => (
                        <TouchableOpacity
                            key={ride._id}
                            style={styles.card}
                            onPress={() => router.push(`/(customer)/activity/${ride._id}`)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconCol}>
                                <View style={styles.iconBg}>
                                    <MaterialIcons
                                        name={getVehicleIcon(ride.vehicle_type)}
                                        size={24}
                                        color={Colors.primary}
                                    />
                                </View>
                                <View style={styles.line} />
                            </View>
                            <View style={styles.infoCol}>
                                <View style={styles.row}>
                                    <Text style={styles.date}>{formatDate(ride.created_at)}</Text>
                                    <Text style={[styles.status, getStatusStyle(ride.status)]}>
                                        {ride.status?.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.dest} numberOfLines={1}>
                                    {ride.dropoff_location?.address || 'Unknown destination'}
                                </Text>
                                <Text style={styles.price}>
                                    TSh {(ride.final_fare || ride.fare_estimate || 0).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.arrowCol}>
                                <MaterialIcons name="chevron-right" size={24} color={Colors.textDim} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
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
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: Colors.textDim,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        textAlign: 'center',
    },
    bookButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 24,
    },
    bookButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    list: {
        padding: 20,
    },
    card: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    iconCol: {
        alignItems: 'center',
        marginRight: 16,
    },
    iconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: Colors.border,
        marginTop: 8,
    },
    infoCol: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    date: {
        fontSize: 12,
        color: Colors.textDim,
        fontWeight: '600',
    },
    status: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        overflow: 'hidden',
    },
    statusCompleted: {
        backgroundColor: 'rgba(0, 200, 81, 0.1)',
        color: '#00C851',
    },
    statusCancelled: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        color: '#FF4444',
    },
    statusActive: {
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        color: '#FF9800',
    },
    statusPending: {
        backgroundColor: 'rgba(158, 158, 158, 0.1)',
        color: '#9E9E9E',
    },
    dest: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '800',
    },
    arrowCol: {
        justifyContent: 'center',
        paddingLeft: 8,
    },
});
