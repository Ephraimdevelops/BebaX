import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform } from 'react-native';

export default function CustomerLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textDim,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopWidth: 0,
                    elevation: 10,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "BebaX",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "map" : "map-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="activity"
                options={{
                    title: "Activity",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "time" : "time-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="business"
                options={{
                    title: "Business",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "storefront" : "storefront-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="wallet"
                options={{
                    title: "Wallet",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "wallet" : "wallet-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="support"
                options={{
                    href: null, // Hide from tab bar if not needed, or show if asked
                    title: "Support",
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: null, // Profile is accessed via header, hide from bottom tabs
                }}
            />
        </Tabs>
    );
}
