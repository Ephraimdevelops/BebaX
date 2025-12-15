import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Colors } from '../../../src/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Activity() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            // Guest Redirect
            router.replace('/(auth)/welcome');
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded || !isSignedIn) return null; // Or a loading spinner

    // Simulated Rides
    const rides = [
        { id: '1', date: 'Today, 2:30 PM', dest: 'Mlimani City Mall', price: 5000, status: 'Completed', vehicle: 'Bajaji' },
        { id: '2', date: 'Yesterday, 9:15 AM', dest: 'Posta Mpya', price: 15000, status: 'Completed', vehicle: 'Kirikuu' },
        { id: '3', date: '12 Dec, 6:00 PM', dest: 'Mikocheni B', price: 0, status: 'Cancelled', vehicle: 'Boda' },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>MY ACTIVITY</Text>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {rides.map(ride => (
                    <TouchableOpacity
                        key={ride.id}
                        style={styles.card}
                        onPress={() => router.push(`/(customer)/activity/${ride.id}`)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconCol}>
                            <View style={styles.iconBg}>
                                <MaterialIcons
                                    name={ride.vehicle === 'Boda' ? 'two-wheeler' : 'local-shipping'}
                                    size={24}
                                    color={Colors.primary}
                                />
                            </View>
                            {ride.status === 'Completed' ? (
                                <View style={styles.line} />
                            ) : null}
                        </View>
                        <View style={styles.infoCol}>
                            <View style={styles.row}>
                                <Text style={styles.date}>{ride.date}</Text>
                                <Text style={[
                                    styles.status,
                                    ride.status === 'Cancelled' ? styles.statusCancelled : styles.statusCompleted
                                ]}>
                                    {ride.status}
                                </Text>
                            </View>
                            <Text style={styles.dest} numberOfLines={1}>{ride.dest}</Text>
                            <Text style={styles.price}>TSh {ride.price.toLocaleString()}</Text>
                        </View>
                        <View style={styles.arrowCol}>
                            <MaterialIcons name="chevron-right" size={24} color={Colors.textDim} />
                        </View>
                    </TouchableOpacity>
                ))}
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
        width: 40,
        height: 40,
        borderRadius: 20,
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
        borderRadius: 8,
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
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusCompleted: {
        backgroundColor: 'rgba(0, 200, 81, 0.1)',
        color: '#00C851',
    },
    statusCancelled: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        color: '#FF4444',
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
