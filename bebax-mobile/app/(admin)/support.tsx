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

const SUPPORT_ITEMS = [
    {
        id: 'tickets',
        title: 'Support Tickets',
        description: 'Customer and driver complaints',
        icon: 'ticket',
        count: 12,
        color: '#EF4444',
    },
    {
        id: 'disputes',
        title: 'Fare Disputes',
        description: 'Pending fare adjustments',
        icon: 'scale',
        count: 3,
        color: '#F59E0B',
    },
    {
        id: 'sos',
        title: 'SOS Alerts',
        description: 'Emergency alerts from rides',
        icon: 'warning',
        count: 0,
        color: '#EF4444',
    },
];

export default function SupportScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="shield-checkmark" size={28} color={Colors.accent} />
                <Text style={styles.headerTitle}>Support</Text>
            </View>

            <ScrollView style={styles.content}>
                {SUPPORT_ITEMS.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon as any} size={24} color={item.color} />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.menuDescription}>{item.description}</Text>
                        </View>
                        {item.count > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.count}</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={20} color={Colors.textDim} />
                    </TouchableOpacity>
                ))}

                <Text style={styles.placeholder}>Support ticket system coming soon...</Text>
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
    badge: {
        backgroundColor: Colors.danger,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'white',
    },
    placeholder: {
        textAlign: 'center',
        color: Colors.textDim,
        marginTop: 40,
        fontSize: 14,
    },
});
