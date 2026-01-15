import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

export default function BusinessMenuScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signOut } = useAuth();

    const handleSwitchToPersonal = () => {
        // In a real app, you might just navigation since we are dual-mode.
        // But our Traffic Cop in _layout.tsx enforces /business if orgId exists.
        // To "Switch", we technically need to bypass that check or have a "mode" toggler.
        // For MVP/Empire Mode: We will redirect to /(customer)/home 
        // AND we need to update _layout.tsx to allow this exception OR we rely on a state toggle.

        // BETTER APPROACH: The Traffic Cop checks 'orgStatus'. 
        // If we really want to switch, we might need a local state override or just allow routing.
        // But _layout says: IF active -> replace /(business).

        // HACK for DEMO: We will just push. If _layout is too strict, it might bounce back.
        // We might need to refine _layout to check `user.publicMetadata.mode`?
        // For now, let's just Try pushing.

        // ALERT: The Traffic Cop WILL bounce us back if we don't handle it.
        // Let's assume for now the user wants to Log Out to switch (safest) 
        // OR we implement a 'mode' switch in the backend/session.

        Alert.alert("Coming Soon", "Multi-profile switching is coming in the next update!");
    };

    const handleLogout = async () => {
        await signOut();
        router.replace('/');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Menu</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>B</Text>
                    </View>
                    <View>
                        <Text style={styles.bizName}>My Business</Text>
                        <Text style={styles.bizRole}>Administrator</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>
                    <MenuItem icon="settings" label="Business Settings" />
                    <MenuItem icon="people" label="Team Management" />
                    <MenuItem icon="credit-card" label="Wallet & Billing" />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Mode</Text>
                    <TouchableOpacity style={styles.switchBtn} onPress={() => router.push('/(customer)/map')}>
                        <View style={styles.switchIcon}>
                            <Ionicons name="person" size={20} color="#FFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchTitle}>Switch to Personal</Text>
                            <Text style={styles.switchSub}>Order rides for yourself</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const MenuItem = ({ icon, label }: { icon: any, label: string }) => (
    <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconBox}>
            <MaterialIcons name={icon} size={20} color="#64748B" />
        </View>
        <Text style={styles.menuText}>{label}</Text>
        <MaterialIcons name="chevron-right" size={20} color="#E2E8F0" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
    content: { padding: 20 },

    profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFF', fontSize: 24, fontWeight: '700' },
    bizName: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    bizRole: { fontSize: 14, color: '#64748B' },

    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },

    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
    menuIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    menuText: { flex: 1, fontSize: 16, color: '#334155', fontWeight: '500' },

    switchBtn: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        backgroundColor: '#0F172A', borderRadius: 16, gap: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10
    },
    switchIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    switchTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    switchSub: { color: '#94A3B8', fontSize: 13 },

    logoutBtn: { alignItems: 'center', padding: 16 },
    logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 16 }
});
