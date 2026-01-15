import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { View, ActivityIndicator } from 'react-native';

export default function BusinessLayout() {
    // Fetch user's session to determine access level
    const session = useQuery(api.users.getSessionContext);

    // Loading state
    if (session === undefined) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Security: Only Admin can see Inventory & Wallet (Dashboard stats)
    // Staff (e.g., Drivers/Loaders) only see Dispatch & Orders
    const isAdmin = session?.orgRole === 'admin';
    const isStaff = session?.orgRole === 'user'; // 'user' in org context means Staff

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#1E293B',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0',
                    height: 85,
                    paddingBottom: 25,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            {/* 1. DASHBOARD - The Command Center */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="dashboard" size={24} color={color} />
                    ),
                }}
            />

            {/* 2. DISPATCH - The Booking Console */}
            <Tabs.Screen
                name="dispatch"
                options={{
                    title: 'Dispatch',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="local-shipping" size={24} color={color} />
                    ),
                }}
            />

            {/* 3. ORDERS - The Waybill Feed */}
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="receipt-long" size={24} color={color} />
                    ),
                }}
            />

            {/* 4. INVENTORY - Product Grid (Admin Only) */}
            <Tabs.Screen
                name="inventory"
                options={{
                    title: 'Inventory',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="inventory" size={24} color={color} />
                    ),
                    href: isAdmin ? '/(business)/inventory' : null, // Hide from tab bar
                }}
            />
            {/* 5. MENU - Settings & Switch Mode */}
            <Tabs.Screen
                name="menu"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="menu" size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
