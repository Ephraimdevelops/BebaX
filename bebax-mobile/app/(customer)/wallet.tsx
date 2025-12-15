import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Wallet() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            // Guest Redirect
            router.replace('/(auth)/welcome');
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded || !isSignedIn) return null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>WALLET</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                    <Text style={styles.balanceAmount}>TZS 0</Text>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.topUpButton}>
                        <MaterialIcons name="add-circle-outline" size={24} color={Colors.surface} />
                        <Text style={styles.topUpText}>TOP UP FUNDS</Text>
                    </TouchableOpacity>
                </View>

                {/* Methods */}
                <Text style={styles.sectionTitle}>PAYMENT METHODS</Text>

                <TouchableOpacity style={styles.methodItem}>
                    <View style={styles.methodIcon}>
                        <MaterialIcons name="money" size={24} color={Colors.text} />
                    </View>
                    <Text style={styles.methodText}>Cash</Text>
                    <MaterialIcons name="check-circle" size={24} color={Colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.methodItem}>
                    <View style={styles.methodIcon}>
                        <MaterialIcons name="credit-card" size={24} color={Colors.text} />
                    </View>
                    <Text style={styles.methodText}>M-Pesa / Mobile Money</Text>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.textDim} />
                </TouchableOpacity>

                {/* Transactions Header */}
                <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No recent transactions</Text>
                </View>

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
    content: {
        padding: 20,
    },
    balanceCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    balanceLabel: {
        color: Colors.textDim,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    balanceAmount: {
        color: '#FFFFFF', // Pure White for impact
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 24,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 20,
    },
    topUpButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 8,
    },
    topUpText: {
        color: Colors.surface,
        fontWeight: '800',
        marginLeft: 8,
        letterSpacing: 1,
    },
    sectionTitle: {
        color: Colors.textDim,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    methodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    methodIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    methodText: {
        flex: 1,
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textDim,
        fontStyle: 'italic',
    },
});
