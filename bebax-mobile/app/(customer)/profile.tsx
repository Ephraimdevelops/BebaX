import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const router = useRouter();
    const { signOut } = useAuth();
    const insets = useSafeAreaInsets();

    const menuItems = [
        { icon: 'time-outline', label: 'Your Rides', route: '/(customer)/activity' },
        { icon: 'card-outline', label: 'Wallet', route: '/(customer)/wallet' },
        { icon: 'business-outline', label: 'Manage Business', route: '/(customer)/business' },
        { icon: 'headset-outline', label: 'Support', route: '/(customer)/support' },
        { icon: 'settings-outline', label: 'Settings', route: '/(customer)/settings' }, // Placeholder
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>ME</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>My Account</Text>
                        <Text style={styles.userPhone}>+255 ...</Text>
                    </View>
                </View>

                {/* Menu Links */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => item.route && router.push(item.route as any)}
                        >
                            <View style={styles.iconBox}>
                                <Ionicons name={item.icon as any} size={22} color={Colors.text} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <MaterialIcons name="chevron-right" size={24} color={Colors.textDim} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
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
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 10,
    },
    content: {
        padding: 24,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    userPhone: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 4,
    },
    menuContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 8,
        marginBottom: 32,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    logoutButton: {
        alignItems: 'center',
        padding: 16,
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
});
