import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

const CONFIG_ITEMS = [
    {
        id: 'pricing',
        title: 'Pricing Matrix',
        description: 'Edit base fares, km rates, surge caps',
        icon: 'calculator',
        route: '/(admin)/pricing-matrix',
        color: '#8B5CF6',
        superAdminOnly: true,
    },
    {
        id: 'kill-switch',
        title: 'Kill Switch',
        description: 'Emergency service toggle',
        icon: 'power',
        route: '/(admin)/kill-switch',
        color: '#EF4444',
        superAdminOnly: true,
    },
    {
        id: 'notifications',
        title: 'Push Notifications',
        description: 'Send broadcast messages',
        icon: 'notifications',
        route: '/(admin)/dashboard',
        color: '#3B82F6',
        superAdminOnly: false,
    },
];

export default function ConfigScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="settings" size={28} color={Colors.primary} />
                <Text style={styles.headerTitle}>Configuration</Text>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>Super Admin Only</Text>
                {CONFIG_ITEMS.filter(i => i.superAdminOnly).map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => router.push(item.route as any)}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon as any} size={24} color={item.color} />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.menuDescription}>{item.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textDim} />
                    </TouchableOpacity>
                ))}

                <Text style={styles.sectionTitle}>General</Text>
                {CONFIG_ITEMS.filter(i => !i.superAdminOnly).map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => router.push(item.route as any)}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon as any} size={24} color={item.color} />
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
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textDim,
        marginBottom: 12,
        marginTop: 8,
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
