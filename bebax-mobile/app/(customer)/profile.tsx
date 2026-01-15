import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { signOut } = useAuth();
    const { user } = useUser();
    const insets = useSafeAreaInsets();

    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editSosContact, setEditSosContact] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isForceEdit, setIsForceEdit] = useState(false);

    // Convex data
    const profile = useQuery(api.users.getCurrentProfile, {});
    const updateProfile = useMutation(api.users.updateProfile);
    const generateUploadUrl = useMutation(api.drivers.generateUploadUrl); // Reusing upload logic
    const saveProfilePhoto = useMutation(api.users.saveProfilePhoto);

    // Auto-open edit modal if ?edit=true
    useEffect(() => {
        if (params.edit === 'true') {
            setShowEditModal(true);
            setIsForceEdit(true);
        }
    }, [params.edit]);

    useEffect(() => {
        if (profile) {
            setEditName(profile.name || user?.fullName || '');
            setEditPhone(profile.phone || '');
            setEditSosContact(profile.emergencyContact || '');
        }
    }, [profile, user]);

    const handleSaveProfile = async () => {
        if (isForceEdit && (!editPhone || editPhone.trim() === '')) {
            Alert.alert("Phone Required", "Please enter your phone number so drivers can contact you.");
            return;
        }
        setSaving(true);
        try {
            await updateProfile({
                name: editName,
                phone: editPhone,
                emergencyContact: editSosContact,
            });
            Alert.alert("✅ Saved!", "Profile updated successfully.");
            setShowEditModal(false);
            if (isForceEdit) router.replace('/');
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission required", "Need camera roll permissions!");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                // @ts-ignore
                mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setUploading(true);
                const uri = result.assets[0].uri;
                const postUrl = await generateUploadUrl();
                const response = await fetch(uri);
                const blob = await response.blob();
                const uploadResponse = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type },
                    body: blob,
                });
                const { storageId } = await uploadResponse.json();
                await saveProfilePhoto({ storageId });
                Alert.alert("Updated", "Profile photo changed.");
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to upload: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const MenuItem = ({ icon, label, subLabel, route, color = Colors.text }: any) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => route ? router.push(route) : {}}
            activeOpacity={0.7}
        >
            <View style={styles.menuIconBg}>
                <Ionicons name={icon} size={22} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color }]}>{label}</Text>
                {subLabel && <Text style={styles.menuSub}>{subLabel}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
    );

    const displayName = profile?.name || user?.fullName || 'My Account';
    const displayPhone = profile?.phone || user?.phoneNumbers?.[0]?.phoneNumber || 'Add Phone';

    // Placeholder Stats (Real data would come from backend)
    const joinYear = new Date(profile?._creationTime || Date.now()).getFullYear();

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}>

                {/* HERO HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>

                    <View style={styles.profileRow}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={profile?.profilePhoto
                                    ? { uri: profile.profilePhoto }
                                    : require('../../assets/images/avatar_placeholder.png')
                                }
                                style={styles.avatar}
                            />
                            <TouchableOpacity style={styles.editPhotoIcon} onPress={handlePickImage} disabled={uploading}>
                                {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="camera" size={14} color="#FFF" />}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.name}>{displayName}</Text>
                            <Text style={styles.phone}>{displayPhone}</Text>
                            <TouchableOpacity style={styles.editProfileLink} onPress={() => setShowEditModal(true)}>
                                <Text style={styles.editProfileText}>Edit details</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* QUICK STATS */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>-</Text>
                            <Text style={styles.statLabel}>Rides</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{joinYear}</Text>
                            <Text style={styles.statLabel}>Member Since</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>5.0</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                    </View>
                </View>

                {/* MENU LIST */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Account</Text>

                    {/* REGISTER AS MERCHANT (The Hidden Door) */}
                    {/* REGISTER AS MERCHANT (The Hidden Door) */}
                    {!profile?.orgId && (
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => router.push('/business/register')}
                        >
                            <View style={[styles.menuIconBg, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="briefcase" size={22} color="#16A34A" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuLabel, { color: '#333' }]}>Register as Merchant</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CCC" />
                        </TouchableOpacity>
                    )}

                    {/* EARN AS A DRIVER (Captain's Exam Entry) */}
                    {!profile?.driverId && (
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => router.push('/driver/apply')}
                        >
                            <View style={[styles.menuIconBg, { backgroundColor: '#FEF3C7' }]}>
                                <MaterialIcons name="local-shipping" size={22} color="#D97706" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuLabel, { color: '#333' }]}>Earn as a Driver</Text>
                                <Text style={styles.menuSub}>Join our fleet and start earning</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CCC" />
                        </TouchableOpacity>
                    )}

                    <MenuItem
                        icon="time-outline"
                        label="Your Rides"
                        subLabel="View past trips and receipts"
                        route="/(customer)/activity"
                    />
                    <MenuItem
                        icon="card-outline"
                        label="Wallet"
                        subLabel="Manage payments and balance"
                        route="/(customer)/wallet"
                    />
                </View>

                {profile?.orgId && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Business</Text>
                        <MenuItem
                            icon="business-outline"
                            label="My Business"
                            subLabel="Manage logistics and orders"
                            route="/(business)" // Direct link to business layout since we have orgId
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Support & Settings</Text>
                    <MenuItem
                        icon="help-circle-outline"
                        label="Support"
                        subLabel="Get help with your rides"
                        route="/(customer)/support"
                    />
                    <MenuItem
                        icon="settings-outline"
                        label="Settings"
                        subLabel="Notification preferences"
                        route="/(customer)/settings"
                    />
                    <TouchableOpacity style={styles.logoutButton} onPress={async () => {
                        await AsyncStorage.removeItem('user_session');
                        await signOut();
                        router.replace('/(customer)/map');
                    }}>
                        <MaterialIcons name="logout" size={20} color={Colors.error} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>

                {profile?.emergencyContact && (
                    <View style={styles.sosContainer}>
                        <View style={styles.sosCard}>
                            <Ionicons name="warning" size={20} color={Colors.error} />
                            <View>
                                <Text style={styles.sosLabel}>Emergency Contact</Text>
                                <Text style={styles.sosNumber}>{profile.emergencyContact}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={styles.versionText}>BebaX Customer v1.0.0</Text>
                </View>
            </ScrollView>

            {/* EDIT MODAL */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <MaterialIcons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Name" />

                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} placeholder="Phone" keyboardType="phone-pad" />

                        <Text style={styles.inputLabel}>Emergency Contact</Text>
                        <TextInput style={styles.input} value={editSosContact} onChangeText={setEditSosContact} placeholder="SOS Contact" keyboardType="phone-pad" />

                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>
                            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>SAVE CHANGES</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { paddingBottom: 40 },

    // Header
    header: {
        backgroundColor: '#FFF',
        paddingHorizontal: 24, paddingBottom: 24, paddingTop: 10,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
        marginBottom: 20
    },
    backButton: { marginBottom: 16 },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    avatarWrapper: { position: 'relative', marginRight: 16 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EFF', borderWidth: 1, borderColor: '#EEE' },
    editPhotoIcon: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: Colors.primary, padding: 6, borderRadius: 12,
        borderWidth: 2, borderColor: '#FFF'
    },
    profileInfo: { flex: 1 },
    name: { fontSize: 22, fontWeight: '800', color: '#121212', marginBottom: 2 },
    phone: { fontSize: 14, color: Colors.textDim, marginBottom: 8 },
    editProfileLink: { alignSelf: 'flex-start' },
    editProfileText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },

    // Stats
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16 },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#121212' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '500' },
    statDivider: { width: 1, height: 24, backgroundColor: '#E0E0E0' },

    // Menu
    section: { marginBottom: 24, paddingHorizontal: 20 },
    sectionHeader: { fontSize: 18, fontWeight: '700', color: '#121212', marginBottom: 12, marginLeft: 4 },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
    },
    menuIconBg: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(74, 144, 226, 0.08)',
        alignItems: 'center', justifyContent: 'center', marginRight: 16
    },
    menuContent: { flex: 1 },
    menuLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2, color: '#333' },
    menuSub: { fontSize: 12, color: '#888' },

    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 10, padding: 16, gap: 8
    },
    logoutText: { color: Colors.error, fontWeight: '700', fontSize: 15 },

    sosContainer: { paddingHorizontal: 20, marginBottom: 20 },
    sosCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#FFF5F5', padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: '#FFE0E0'
    },
    sosLabel: { fontSize: 12, color: Colors.error, fontWeight: '700' },
    sosNumber: { fontSize: 16, fontWeight: '800', color: '#333' },

    footer: { alignItems: 'center', marginTop: 10 },
    versionText: { color: '#CCC', fontSize: 12, fontWeight: '500' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 16 },
    saveButton: { backgroundColor: Colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: 'white', fontWeight: '800' }
});
