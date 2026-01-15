import { Tabs, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';

// Admin-specific colors (Dark Industrial theme)
const AdminColors = {
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

export default function AdminLayout() {
    const { userId } = useAuth();
    const router = useRouter();

    // Fetch user profile to check role - use existing query
    const userProfile = useQuery(api.users.getCurrentProfile);

    // RBAC: Determine which tabs to show
    const isSuperAdmin = userProfile?.role === 'admin';
    const isSupportAdmin = false; // Future: userProfile?.role === 'support_admin'

    console.log("🛡️ Admin Layout: User Role:", userProfile?.role);

    // If not admin, redirect to customer dashboard
    if (userProfile && userProfile.role !== 'admin') {
        console.log("🚫 Admin Layout: Non-admin user, redirecting...");
        router.replace('/');
        return null;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: AdminColors.primary,
                tabBarInactiveTintColor: AdminColors.textDim,
                tabBarStyle: {
                    backgroundColor: AdminColors.surface,
                    borderTopColor: AdminColors.border,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 2,
                },
            }}
        >
            {/* 🏠 HQ - Dashboard */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "HQ",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
                    ),
                }}
            />

            {/* 🗼 Ops - Operations */}
            <Tabs.Screen
                name="ops"
                options={{
                    title: "Ops",
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons name={focused ? "radar" : "radar"} size={24} color={color} />
                    ),
                }}
            />

            {/* 💰 Finance */}
            <Tabs.Screen
                name="finance"
                options={{
                    title: "Finance",
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesome5 name="coins" size={20} color={color} />
                    ),
                    href: isSupportAdmin ? null : undefined, // Hide for support admins
                }}
            />

            {/* 🛡️ Support */}
            <Tabs.Screen
                name="support"
                options={{
                    title: "Support",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={24} color={color} />
                    ),
                }}
            />

            {/* 🔧 Config - Super Admin Only */}
            <Tabs.Screen
                name="config"
                options={{
                    title: "Config",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
                    ),
                    href: isSupportAdmin ? null : undefined, // Hide for support admins
                }}
            />

            {/* Hidden screens */}
            <Tabs.Screen name="home" options={{ href: null }} />
            <Tabs.Screen name="god-eye" options={{ href: null, tabBarStyle: { display: 'none' } }} />
            <Tabs.Screen name="driver-manager" options={{ href: null }} />
            <Tabs.Screen name="wallet-watch" options={{ href: null }} />
            <Tabs.Screen name="pricing-matrix" options={{ href: null }} />
            <Tabs.Screen name="kill-switch" options={{ href: null }} />
        </Tabs>
    );
}
