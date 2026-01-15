import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

const FINANCE_ITEMS = [
    {
        id: 'wallet-watch',
        title: 'Wallet Watch',
        description: 'Monitor driver wallet balances',
        icon: 'wallet',
        route: '/(admin)/wallet-watch',
        color: '#F59E0B',
    },
    {
        id: 'withdrawals',
        title: 'Withdrawals',
        description: 'Process payout requests',
        icon: 'money-bill-wave',
        route: '/(admin)/wallet-watch', // Same screen for now
        color: '#10B981',
    },
    {
        id: 'revenue',
        title: 'Revenue Report',
        description: 'Daily/weekly commission breakdown',
        icon: 'chart-line',
        route: '/(admin)/dashboard',
        color: '#3B82F6',
    },
];

export default function FinanceScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <FontAwesome5 name="coins" size={24} color={Colors.warning} />
                <Text style={styles.headerTitle}>Finance</Text>
            </View>

            <ScrollView style={styles.content}>
                {FINANCE_ITEMS.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => router.push(item.route as any)}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                            <FontAwesome5 name={item.icon} size={20} color={item.color} />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.menuDescription}>{item.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textDim} />
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
        gap: 12,
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
    content: {
        flex: 1,
        padding: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    menuIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuContent: {
        flex: 1,
        marginLeft: 16,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    menuDescription: {
        fontSize: 13,
        color: Colors.textDim,
        marginTop: 2,
    },
});
