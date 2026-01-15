import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

export default function BusinessDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Data
    const orgStats = useQuery(api.b2b.getOrgStats);
    const showroomStats = useQuery(api.b2b.getShowroomStats);

    if (orgStats === undefined) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!orgStats) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                <Text style={styles.errorText}>Business not found</Text>
            </View>
        );
    }

    const { organization, stats } = orgStats;
    const isAdmin = true; // TODO: Get from session

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ========== INDUSTRIAL HERO ========== */}
                <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
                    {/* Header Row */}
                    <View style={styles.heroHeader}>
                        <View style={styles.heroLeft}>
                            <View style={styles.verifiedBadge}>
                                <MaterialIcons name="verified" size={16} color="#10B981" />
                                <Text style={styles.verifiedText}>VERIFIED</Text>
                            </View>
                            <Text style={styles.businessName}>{organization.name}</Text>
                        </View>
                        <TouchableOpacity style={styles.settingsBtn}>
                            <MaterialIcons name="settings" size={22} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* Wallet Balance - HUGE */}
                    <View style={styles.walletSection}>
                        <Text style={styles.walletLabel}>Available Balance</Text>
                        <Text style={styles.walletAmount}>
                            TZS {(organization.walletBalance || 0).toLocaleString()}
                        </Text>
                        {isAdmin && (
                            <TouchableOpacity style={styles.topUpBtn}>
                                <MaterialIcons name="add-circle" size={18} color="#FFF" />
                                <Text style={styles.topUpText}>Top Up</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* THE PULSE STRIP - 3 Metric Cards */}
                    <View style={styles.pulseStrip}>
                        <View style={[styles.pulseCard, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                            <Text style={[styles.pulseValue, { color: '#10B981' }]}>
                                {stats?.activeRides || 0}
                            </Text>
                            <Text style={styles.pulseLabel}>Active</Text>
                        </View>
                        <View style={[styles.pulseCard, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                            <Text style={[styles.pulseValue, { color: '#F59E0B' }]}>
                                {stats?.pendingRides || 0}
                            </Text>
                            <Text style={styles.pulseLabel}>Pending</Text>
                        </View>
                        <View style={[styles.pulseCard, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
                            <Text style={[styles.pulseValue, { color: '#94A3B8' }]}>
                                {stats?.todaySpent || '0'}
                            </Text>
                            <Text style={styles.pulseLabel}>Today TZS</Text>
                        </View>
                    </View>
                </View>

                {/* ========== MAIN CONTENT ========== */}
                <View style={styles.content}>

                    {/* DISPATCH CTA - Prominent */}
                    <TouchableOpacity
                        style={styles.dispatchBtn}
                        onPress={() => router.push('/(business)/dispatch')}
                        activeOpacity={0.85}
                    >
                        <View style={styles.dispatchIcon}>
                            <MaterialIcons name="local-shipping" size={28} color="#FFF" />
                        </View>
                        <View style={styles.dispatchText}>
                            <Text style={styles.dispatchTitle}>New Dispatch</Text>
                            <Text style={styles.dispatchSub}>Send goods to a customer</Text>
                        </View>
                        <MaterialIcons name="arrow-forward-ios" size={18} color="#64748B" />
                    </TouchableOpacity>

                    {/* QUICK ACTIONS - 2x2 Grid */}
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(business)/dispatch')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                                <MaterialIcons name="add-box" size={24} color="#6366F1" />
                            </View>
                            <Text style={styles.actionLabel}>Dispatch</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(business)/orders')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                                <MaterialIcons name="receipt-long" size={24} color="#D97706" />
                            </View>
                            <Text style={styles.actionLabel}>History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(business)/inventory')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                                <MaterialIcons name="inventory-2" size={24} color="#10B981" />
                            </View>
                            <Text style={styles.actionLabel}>Inventory</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard}>
                            <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                                <MaterialIcons name="groups" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.actionLabel}>Team</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Activity Preview */}
                    <View style={styles.recentHeader}>
                        <Text style={styles.sectionTitle}>Recent Orders</Text>
                        <TouchableOpacity onPress={() => router.push('/(business)/orders')}>
                            <Text style={styles.seeAllBtn}>See All →</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.emptyRecent}>
                        <MaterialIcons name="local-shipping" size={32} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No recent dispatches</Text>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
    errorText: { marginTop: 16, fontSize: 18, color: '#94A3B8' },

    // ========== INDUSTRIAL HERO ==========
    hero: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    heroLeft: {},
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    verifiedText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#10B981',
        letterSpacing: 1,
    },
    businessName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
    },
    settingsBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Wallet Section
    walletSection: {
        marginBottom: 24,
    },
    walletLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 4,
    },
    walletAmount: {
        fontSize: 40,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 12,
    },
    topUpBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        height: 44,
        borderRadius: 10,
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
    },
    topUpText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },

    // Pulse Strip
    pulseStrip: {
        flexDirection: 'row',
        gap: 12,
    },
    pulseCard: {
        flex: 1,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    pulseValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    pulseLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 4,
    },

    // ========== MAIN CONTENT ==========
    content: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 100,
    },

    // Dispatch CTA
    dispatchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: Colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    dispatchIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dispatchText: { flex: 1 },
    dispatchBtnText: { flex: 1 },
    dispatchTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    dispatchSub: { fontSize: 13, color: '#64748B', marginTop: 2 },

    // Section Title
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },

    // Quick Actions - 2x2 Grid
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        width: '47%',
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    actionItem: {
        width: '47%',
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        gap: 10,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },

    // Recent Orders
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    seeAllBtn: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    emptyRecent: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emptyText: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 8,
    },
});
