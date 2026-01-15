import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
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

export default function WalletWatchScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Fetch wallets with low/negative balance
    const lowBalanceWallets = useQuery(api.admin.getLowBalanceWallets) || [];

    // Freeze wallet mutation
    const freezeWalletMutation = useMutation(api.admin.freezeWallet);

    const handleFreeze = async (driverId: string, driverName: string) => {
        Alert.alert(
            'Freeze Wallet?',
            `This will block ${driverName} from accepting cash trips until they settle their balance.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Freeze',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await freezeWalletMutation({
                                driver_id: driverId as any,
                                reason: 'Negative wallet balance - requires commission settlement',
                            });
                            Alert.alert('Wallet Frozen ❄️', 'Driver has been notified and blocked from cash trips.');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to freeze wallet');
                        }
                    }
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Wallet Watch</Text>
                <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>{lowBalanceWallets.length}</Text>
                </View>
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <FontAwesome5 name="exclamation-triangle" size={24} color={Colors.warning} />
                <View style={styles.summaryContent}>
                    <Text style={styles.summaryTitle}>Low Balance Drivers</Text>
                    <Text style={styles.summarySubtitle}>
                        Drivers with balance below TZS -2,000 cannot accept cash trips
                    </Text>
                </View>
            </View>

            {/* Wallets List */}
            <ScrollView style={styles.list}>
                {lowBalanceWallets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle" size={48} color={Colors.accent} />
                        <Text style={styles.emptyTitle}>All Clear! 🎉</Text>
                        <Text style={styles.emptySubtitle}>No drivers with critically low balances</Text>
                    </View>
                ) : (
                    lowBalanceWallets.map((wallet: any) => (
                        <View key={wallet._id} style={styles.walletCard}>
                            <View style={styles.walletInfo}>
                                <Text style={styles.walletName}>{wallet.driver_name || 'Driver'}</Text>
                                <Text style={styles.walletPhone}>{wallet.phone}</Text>
                            </View>
                            <View style={styles.walletBalance}>
                                <Text style={[
                                    styles.balanceValue,
                                    { color: wallet.balance < 0 ? Colors.danger : Colors.warning }
                                ]}>
                                    TZS {wallet.balance.toLocaleString()}
                                </Text>
                                <TouchableOpacity
                                    style={styles.freezeButton}
                                    onPress={() => handleFreeze(wallet._id, wallet.driver_name || 'Driver')}
                                >
                                    <Ionicons name="snow" size={16} color="white" />
                                    <Text style={styles.freezeButtonText}>Freeze</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
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
    alertBadge: {
        backgroundColor: Colors.danger,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    alertBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.warning + '15',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    summaryContent: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.warning,
    },
    summarySubtitle: {
        fontSize: 13,
        color: Colors.textDim,
        marginTop: 4,
    },
    list: {
        flex: 1,
        paddingHorizontal: 16,
    },
    walletCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    walletInfo: {
        flex: 1,
    },
    walletName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    walletPhone: {
        fontSize: 13,
        color: Colors.textDim,
        marginTop: 2,
    },
    walletBalance: {
        alignItems: 'flex-end',
    },
    balanceValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    freezeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.danger,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 8,
    },
    freezeButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 8,
    },
});
