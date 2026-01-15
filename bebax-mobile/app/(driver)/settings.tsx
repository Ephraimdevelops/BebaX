import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Moon, Bell, Volume2, Globe, Shield, Smartphone, ChevronRight } from 'lucide-react-native';

export default function DriverSettingsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [sound, setSound] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [autoNav, setAutoNav] = useState(true);

    // Load settings on mount
    React.useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.multiGet(['settings_notifications', 'settings_sound', 'settings_darkMode', 'settings_autoNav']);
            if (stored[0][1] !== null) setNotifications(stored[0][1] === 'true');
            if (stored[1][1] !== null) setSound(stored[1][1] === 'true');
            if (stored[2][1] !== null) setDarkMode(stored[2][1] === 'true');
            if (stored[3][1] !== null) setAutoNav(stored[3][1] === 'true');
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };

    const toggleSetting = async (key: string, value: boolean, setter: (val: boolean) => void) => {
        const newValue = !value;
        setter(newValue);
        try {
            await AsyncStorage.setItem(key, String(newValue));
        } catch (e) {
            console.error("Failed to save setting", key, e);
        }
    };

    const SettingItem = ({ icon: Icon, label, value, type = 'toggle', onPress }: any) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={type === 'toggle'}>
            <View style={styles.settingLeft}>
                <View style={styles.iconBox}>
                    <Icon size={20} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            {type === 'toggle' ? (
                <Switch
                    value={value}
                    onValueChange={onPress}
                    trackColor={{ false: '#E5E7EB', true: Colors.primary }}
                    thumbColor={'#FFF'}
                />
            ) : (
                <View style={styles.settingRight}>
                    {value && <Text style={styles.settingValue}>{value}</Text>}
                    <ChevronRight size={20} color="#9CA3AF" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* App Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={Bell}
                            label="Push Notifications"
                            value={notifications}
                            onPress={() => toggleSetting('settings_notifications', notifications, setNotifications)}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={Volume2}
                            label="Sound Effects"
                            value={sound}
                            onPress={() => toggleSetting('settings_sound', sound, setSound)}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={Moon}
                            label="Dark Mode"
                            value={darkMode}
                            onPress={() => toggleSetting('settings_darkMode', darkMode, setDarkMode)}
                        />
                    </View>
                </View>

                {/* Navigation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Navigation & Ride</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={Smartphone}
                            label="Auto-Start Navigation"
                            value={autoNav}
                            onPress={() => toggleSetting('settings_autoNav', autoNav, setAutoNav)}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={Globe}
                            label="Language"
                            value="English"
                            type="link"
                            onPress={() => Alert.alert("Language", "Language selection coming soon.")}
                        />
                    </View>
                </View>

                {/* Privacy & Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy & Security</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={Shield}
                            label="Privacy Policy"
                            type="link"
                            onPress={() => { }}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={({ size, color }: any) => <MaterialIcons name="security" size={size} color={color} />}
                            label="Security Settings"
                            type="link"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                <Text style={styles.footerText}>BebaX Driver App v1.0.0 (Build 124)</Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
    },
    backBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    content: { padding: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
    sectionContent: {
        backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    settingItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 16, paddingHorizontal: 16,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F9FF',
        alignItems: 'center', justifyContent: 'center'
    },
    settingLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
    settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    settingValue: { fontSize: 14, color: '#6B7280' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 64 },
    footerText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 20, marginBottom: 40 }
});
