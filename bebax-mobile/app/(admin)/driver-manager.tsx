import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

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

export default function DriverManagerScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'banned'>('all');

    // Fetch drivers
    const drivers = useQuery(api.drivers.getAllDrivers) || [];
    const verifyDriver = useMutation(api.drivers.verifyDriver);

    // Filter drivers
    const filteredDrivers = drivers.filter(driver => {
        const matchesSearch = driver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.phone?.includes(searchQuery);

        if (filter === 'all') return matchesSearch;
        if (filter === 'verified') return matchesSearch && driver.verified;
        if (filter === 'pending') return matchesSearch && !driver.verified && !driver.banned;
        if (filter === 'banned') return matchesSearch && driver.banned;
        return matchesSearch;
    });

    const handleVerify = async (driverId: string) => {
        try {
            await verifyDriver({ driver_id: driverId as any });
            Alert.alert('Success', 'Driver verified!');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Driver Manager</Text>
                <Text style={styles.headerCount}>{drivers.length}</Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.textDim} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or phone..."
                    placeholderTextColor={Colors.textDim}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {(['all', 'verified', 'pending', 'banned'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterPill, filter === f && styles.filterPillActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Driver List */}
            <ScrollView style={styles.list}>
                {filteredDrivers.map((driver) => (
                    <View key={driver._id} style={styles.driverCard}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{driver.name?.charAt(0) || 'D'}</Text>
                        </View>
                        <View style={styles.driverInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.driverName}>{driver.name}</Text>
                                {driver.verified && (
                                    <View style={styles.verifiedBadge}>
                                        <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
                                        <Text style={styles.badgeText}>Verified</Text>
                                    </View>
                                )}
                                {driver.banned && (
                                    <View style={[styles.verifiedBadge, { backgroundColor: Colors.danger + '20' }]}>
                                        <Ionicons name="ban" size={14} color={Colors.danger} />
                                        <Text style={[styles.badgeText, { color: Colors.danger }]}>Banned</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.driverPhone}>{driver.phone}</Text>
                            <Text style={styles.driverVehicle}>{driver.vehicle_type}</Text>
                        </View>
                        {!driver.verified && !driver.banned && (
                            <TouchableOpacity
                                style={styles.verifyButton}
                                onPress={() => handleVerify(driver._id)}
                            >
                                <Text style={styles.verifyButtonText}>Verify</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {filteredDrivers.length === 0 && (
                    <Text style={styles.emptyText}>No drivers found</Text>
                )}

                <View style={{ height: 40 }} />
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 12,
    },
    headerCount: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textDim,
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 16,
        color: Colors.text,
    },
    filterScroll: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxHeight: 60,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 8,
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
    list: {
        flex: 1,
        paddingHorizontal: 16,
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    driverInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.accent + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.accent,
    },
    driverPhone: {
        fontSize: 13,
        color: Colors.textDim,
        marginTop: 2,
    },
    driverVehicle: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 2,
    },
    verifyButton: {
        backgroundColor: Colors.accent,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    verifyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textDim,
        fontSize: 14,
        marginTop: 40,
    },
});
