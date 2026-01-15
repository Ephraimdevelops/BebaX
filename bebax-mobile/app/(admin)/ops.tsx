import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

// Ops menu items
const OPS_ITEMS = [
    {
        id: 'god-eye',
        title: 'God Eye',
        description: 'Full-screen map with all vehicles',
        icon: 'eye',
        route: '/(admin)/god-eye',
        color: '#3B82F6',
    },
    {
        id: 'drivers',
        title: 'Driver Manager',
        description: 'Verify, ban, and manage drivers',
        icon: 'people',
        route: '/(admin)/driver-manager',
        color: '#10B981',
    },
    {
        id: 'live-rides',
        title: 'Live Rides',
        description: 'Monitor all ongoing trips',
        icon: 'car',
        route: '/(admin)/god-eye',
        color: '#8B5CF6',
    },
];

export default function OpsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <MaterialCommunityIcons name="radar" size={28} color={Colors.primary} />
                <Text style={styles.headerTitle}>Operations</Text>
            </View>

            <ScrollView style={styles.content}>
                {OPS_ITEMS.map((item) => (
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
