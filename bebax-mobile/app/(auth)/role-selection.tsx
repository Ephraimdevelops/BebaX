import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RoleSelection() {
    const { user } = useUser();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const createProfile = useMutation(api.users.createProfile);
    const [loading, setLoading] = useState(false);

    const handleSelectRole = async (role: 'customer' | 'driver') => {
        if (loading) return;
        setLoading(true);

        try {
            await createProfile({
                role: role,
                name: user?.fullName || "User",
                phone: user?.primaryPhoneNumber?.phoneNumber || ""
            });

            // Routing Logic
            if (role === 'customer') {
                router.replace('/');
            } else {
                router.replace('/(auth)/driver-setup'); // Assuming this route exists/will be created
            }
        } catch (error) {
            console.error("Profile creation failed:", error);
            setLoading(false);
            // Show alert?
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Who are you?</Text>
                <Text style={styles.subtitle}>Choose how you want to use BebaX</Text>
            </View>

            <View style={styles.cardsContainer}>
                {/* 📦 Customer Option */}
                <TouchableOpacity
                    style={[styles.card, styles.customerCard]}
                    onPress={() => handleSelectRole('customer')}
                    disabled={loading}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.emoji}>📦</Text>
                    </View>
                    <Text style={styles.cardTitle}>Send Cargo</Text>
                    <Text style={styles.cardDesc}>I need to move items or relocate.</Text>
                    <View style={styles.arrow}>
                        <Ionicons name="arrow-forward" size={24} color={Colors.primary} />
                    </View>
                </TouchableOpacity>

                {/* 🚚 Driver Option */}
                <TouchableOpacity
                    style={[styles.card, styles.driverCard]}
                    onPress={() => handleSelectRole('driver')}
                    disabled={loading}
                >
                    <View style={[styles.iconContainer, styles.driverIcon]}>
                        <Text style={styles.emoji}>🚚</Text>
                    </View>
                    <Text style={styles.cardTitle}>Drive & Earn</Text>
                    <Text style={styles.cardDesc}>I have a vehicle and want to find jobs.</Text>
                    <View style={styles.arrow}>
                        <Ionicons name="arrow-forward" size={24} color="#FFF" />
                    </View>
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 24,
    },
    header: {
        marginTop: 40,
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    cardsContainer: {
        gap: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    customerCard: {
        backgroundColor: '#FFF',
    },
    driverCard: {
        backgroundColor: '#1E293B', // Slate 800
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    driverIcon: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    emoji: {
        fontSize: 32,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    cardTitleLight: {
        color: '#FFF',
    },
    cardDesc: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    cardDescLight: {
        color: '#CBD5E1',
    },
    arrow: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
