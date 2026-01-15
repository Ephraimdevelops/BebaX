import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, ActivityIndicator } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'beba_theme_pref';
const LANG_KEY = 'beba_lang_pref';
const NOTIF_KEY = 'beba_notif_pref';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { signOut } = useAuth();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);

    // State
    const [pushNotifications, setPushNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [locationSharing, setLocationSharing] = useState(true);
    const [language, setLanguage] = useState('English');
    const [showLangModal, setShowLangModal] = useState(false);

    // Load Preferences
    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const theme = await AsyncStorage.getItem(THEME_KEY);
            const lang = await AsyncStorage.getItem(LANG_KEY);
            const notif = await AsyncStorage.getItem(NOTIF_KEY);

            if (theme !== null) setDarkMode(theme === 'dark');
            if (lang !== null) setLanguage(lang);
            if (notif !== null) setPushNotifications(notif === 'true');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleTheme = async (val: boolean) => {
        setDarkMode(val);
        await AsyncStorage.setItem(THEME_KEY, val ? 'dark' : 'light');
        // In a real app, this would trigger a Context update to change global styles
        Alert.alert("Theme Updated", "Restart the app to apply full theme changes (Simulated).");
    };

    const toggleNotif = async (val: boolean) => {
        setPushNotifications(val);
        await AsyncStorage.setItem(NOTIF_KEY, val ? 'true' : 'false');
    };

    const changeLanguage = async (lang: string) => {
        setLanguage(lang);
        await AsyncStorage.setItem(LANG_KEY, lang);
        setShowLangModal(false);
    };

    const handleSignOut = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        // Clear cached session to prevent stale data in routing
                        await AsyncStorage.removeItem('user_session');
                        await signOut();
                        router.replace('/(customer)/map');
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This will permanently delete your account and data. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete My Account",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await user?.delete();
                            router.replace('/(auth)/welcome');
                            Alert.alert('Account Deleted', 'We are sorry to see you go.');
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Could not delete account. Contact support.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <Text style={styles.sectionLabel}>ACCOUNT</Text>
                <View style={styles.section}>
                    <SettingsRow
                        icon="person"
                        label="Edit Profile"
                        onPress={() => router.push('/(customer)/profile')}
                    />
                    <SettingsRow
                        icon="phone"
                        label="Phone Number"
                        value={user?.primaryPhoneNumber?.phoneNumber || 'Not set'}
                    />
                    <SettingsRow
                        icon="email"
                        label="Email"
                        value={user?.primaryEmailAddress?.emailAddress || 'Not set'}
                    />
                </View>

                {/* Notifications Section */}
                <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
                <View style={styles.section}>
                    <SettingsToggle
                        icon="notifications"
                        label="Push Notifications"
                        value={pushNotifications}
                        onToggle={toggleNotif}
                    />
                </View>

                {/* Preferences Section */}
                <Text style={styles.sectionLabel}>PREFERENCES</Text>
                <View style={styles.section}>
                    <SettingsToggle
                        icon="dark-mode"
                        label="Dark Mode"
                        value={darkMode}
                        onToggle={toggleTheme}
                    />
                    <SettingsToggle
                        icon="location-on"
                        label="Share Location"
                        value={locationSharing}
                        onToggle={setLocationSharing}
                    />
                    <SettingsRow
                        icon="language"
                        label="Language"
                        value={language}
                        onPress={() => setShowLangModal(true)}
                    />
                </View>

                {/* Support Section */}
                <Text style={styles.sectionLabel}>SUPPORT</Text>
                <View style={styles.section}>
                    <SettingsRow
                        icon="help"
                        label="Help Center"
                        onPress={() => router.push('/(customer)/support')}
                    />
                </View>

                {/* Danger Zone */}
                <Text style={styles.sectionLabel}>ACCOUNT ACTIONS</Text>
                <View style={styles.section}>
                    <TouchableOpacity style={styles.dangerRow} onPress={handleSignOut}>
                        <MaterialIcons name="logout" size={22} color={Colors.primary} />
                        <Text style={[styles.rowLabel, { color: Colors.primary }]}>Sign Out</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount}>
                        <MaterialIcons name="delete-forever" size={22} color="#FF4444" />
                        <Text style={[styles.rowLabel, { color: "#FF4444" }]}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

                {/* Version */}
                <Text style={styles.versionText}>BebaX v2.0.1 (Build 124)</Text>
            </ScrollView>

            {/* Language Modal */}
            <Modal
                transparent
                visible={showLangModal}
                animationType="fade"
                onRequestClose={() => setShowLangModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Language</Text>
                        {['English', 'Swahili', 'French'].map((l) => (
                            <TouchableOpacity
                                key={l}
                                style={styles.langOption}
                                onPress={() => changeLanguage(l)}
                            >
                                <Text style={[styles.langText, language === l && { color: Colors.primary, fontWeight: 'bold' }]}>{l}</Text>
                                {language === l && <MaterialIcons name="check" size={20} color={Colors.primary} />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.modalClose} onPress={() => setShowLangModal(false)}>
                            <Text style={styles.modalCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// --- Sub Components ---

const SettingsRow = ({ icon, label, value, onPress }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
}) => (
    <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
    >
        <View style={styles.rowLeft}>
            <MaterialIcons name={icon as any} size={22} color={Colors.textDim} />
            <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <View style={styles.rowRight}>
            {value && <Text style={styles.rowValue}>{value}</Text>}
            {onPress && <MaterialIcons name="chevron-right" size={22} color={Colors.textDim} />}
        </View>
    </TouchableOpacity>
);

const SettingsToggle = ({ icon, label, value, onToggle }: {
    icon: string;
    label: string;
    value: boolean;
    onToggle: (val: boolean) => void;
}) => (
    <View style={styles.row}>
        <View style={styles.rowLeft}>
            <MaterialIcons name={icon as any} size={22} color={Colors.textDim} />
            <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#FFF"
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textDim,
        letterSpacing: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 8,
    },
    section: {
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowLabel: {
        fontSize: 16,
        color: Colors.text,
        marginLeft: 12,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowValue: {
        fontSize: 14,
        color: Colors.textDim,
        marginRight: 8,
    },
    dangerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    versionText: {
        textAlign: 'center',
        color: Colors.textDim,
        fontSize: 12,
        marginTop: 32,
        opacity: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        width: '80%',
        borderRadius: 20,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    langOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    langText: {
        fontSize: 16,
        color: Colors.text,
    },
    modalClose: {
        marginTop: 20,
        alignItems: 'center',
    },
    modalCloseText: {
        color: Colors.textDim,
        fontWeight: '600',
    },
});
