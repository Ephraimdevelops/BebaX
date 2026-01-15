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
                tabBarInactiveTintColor: '#94A3B8', // Slate-400 for a softer inactive state
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 0,
                    elevation: 10,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -5 },
                    shadowOpacity: 0.05, // Very subtle shadow
                    shadowRadius: 15,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Enforce system fonts
                },
            }}
        >
            <Tabs.Screen
                name="map"
                options={{
                    title: "BebaX",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "map" : "map-outline"} size={26} color={color} />
                    ),
                    tabBarStyle: { display: 'none' }, // Hide tab bar on map - it has its own bottom sheet
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
            {/* Hidden screens - accessed via navigation, not tabs */}
            <Tabs.Screen name="support" options={{ href: null }} />
            <Tabs.Screen name="profile" options={{ href: null }} />
            <Tabs.Screen name="settings" options={{ href: null }} />
            <Tabs.Screen name="list-business" options={{ href: null }} />
            <Tabs.Screen name="my-business" options={{ href: null }} />
            <Tabs.Screen name="ride-status" options={{ href: null }} />
            <Tabs.Screen name="notifications" options={{ href: null }} />
            <Tabs.Screen name="receipt" options={{ href: null }} />
            <Tabs.Screen name="rate-ride" options={{ href: null }} />
            <Tabs.Screen name="book-move" options={{ href: null }} />
            <Tabs.Screen name="business/[id]" options={{ href: null }} />
        </Tabs>
    );
}
