import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

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

export default function AdminDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { signOut } = useAuth();
    const [refreshing, setRefreshing] = React.useState(false);

    // Live data queries
    const activeRides = useQuery(api.rides.getActiveRidesCount) || 0;
    const todayStats = useQuery(api.admin.getTodayStats);
    const systemHealth = useQuery(api.admin.getSystemHealth);

    console.log("📊 Admin Dashboard: Rendering. Stats:", todayStats, "Health:", systemHealth);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Leave Command Center?",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Command Center</Text>
                    <Text style={styles.headerSubtitle}>BebaX HQ</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="notifications" size={22} color={Colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* System Health Banner */}
                <View style={[styles.healthBanner, { backgroundColor: systemHealth?.status === 'healthy' ? Colors.accent : Colors.danger }]}>
                    <Ionicons name={systemHealth?.status === 'healthy' ? "shield-checkmark" : "warning"} size={20} color="white" />
                    <Text style={styles.healthText}>
                        System: {systemHealth?.status?.toUpperCase() || 'CHECKING...'}
                    </Text>
                </View>

                {/* Live Ticker - Active Rides */}
                <View style={styles.tickerCard}>
                    <View style={styles.tickerIcon}>
                        <MaterialCommunityIcons name="truck-fast" size={32} color={Colors.primary} />
                    </View>
                    <View style={styles.tickerContent}>
                        <Text style={styles.tickerValue}>{activeRides}</Text>
                        <Text style={styles.tickerLabel}>Active Rides</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.tickerAction}
                        onPress={() => router.push('/(admin)/god-eye')}
                    >
                        <Text style={styles.tickerActionText}>View Map</Text>
                        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* The Mint Meter - Today's Commission */}
                <View style={styles.mintCard}>
                    <View style={styles.mintHeader}>
                        <FontAwesome5 name="coins" size={20} color={Colors.warning} />
                        <Text style={styles.mintTitle}>The Mint</Text>
                    </View>
                    <Text style={styles.mintValue}>
                        TZS {(todayStats?.todayCommission || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.mintLabel}>Today's Commission</Text>
                    <View style={styles.mintStats}>
                        <View style={styles.mintStat}>
                            <Text style={styles.mintStatValue}>{todayStats?.todayRides || 0}</Text>
                            <Text style={styles.mintStatLabel}>Rides</Text>
                        </View>
                        <View style={styles.mintDivider} />
                        <View style={styles.mintStat}>
                            <Text style={styles.mintStatValue}>TZS {(todayStats?.todayGMV || 0).toLocaleString()}</Text>
                            <Text style={styles.mintStatLabel}>GMV</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions Grid */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(admin)/god-eye')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#3B82F620' }]}>
                            <Ionicons name="eye" size={24} color="#3B82F6" />
                        </View>
                        <Text style={styles.actionLabel}>God Eye</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(admin)/driver-manager')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
                            <Ionicons name="people" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.actionLabel}>Drivers</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(admin)/wallet-watch')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
                            <FontAwesome5 name="wallet" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.actionLabel}>Wallets</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(admin)/pricing-matrix')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#8B5CF620' }]}>
                            <Ionicons name="calculator" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={styles.actionLabel}>Pricing</Text>
                    </TouchableOpacity>
                </View>

                {/* Alerts Section */}
                <Text style={styles.sectionTitle}>Alerts</Text>
                <View style={styles.alertCard}>
                    <Ionicons name="warning" size={20} color={Colors.warning} />
                    <View style={styles.alertContent}>
                        <Text style={styles.alertTitle}>{todayStats?.lowBalanceDrivers || 0} Drivers with Low Balance</Text>
                        <Text style={styles.alertSubtitle}>Require wallet top-up</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(admin)/wallet-watch')}>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textDim} />
                    </TouchableOpacity>
                </View>

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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    healthBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 16,
    },
    healthText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
    tickerCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tickerIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tickerContent: {
        flex: 1,
        marginLeft: 16,
    },
    tickerValue: {
        fontSize: 36,
        fontWeight: '700',
        color: Colors.text,
    },
    tickerLabel: {
        fontSize: 14,
        color: Colors.textDim,
    },
    tickerAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tickerActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    mintCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    mintHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    mintTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textDim,
    },
    mintValue: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.warning,
    },
    mintLabel: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 4,
    },
    mintStats: {
        flexDirection: 'row',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    mintStat: {
        flex: 1,
    },
    mintDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 16,
    },
    mintStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    mintStatLabel: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 24,
        marginBottom: 12,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '47%',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    alertSubtitle: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 2,
    },
});
