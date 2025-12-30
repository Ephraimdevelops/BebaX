import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const [isForceEdit, setIsForceEdit] = useState(false); // Tracks if user was forced here

    // Convex data
    const profile = useQuery(api.users.getCurrentProfile, {});
    const updateProfile = useMutation(api.users.updateProfile);

    // Auto-open edit modal if ?edit=true (forced phone capture)
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
        // Validate phone if this is a forced edit
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

            // If forced edit, redirect to dashboard
            if (isForceEdit) {
                router.replace('/(customer)/dashboard');
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const menuItems = [
        { icon: 'time-outline', label: 'Your Rides', route: '/(customer)/activity' },
        { icon: 'card-outline', label: 'Wallet', route: '/(customer)/wallet' },
        { icon: 'business-outline', label: 'Manage Business', route: '/(customer)/my-business' },
        { icon: 'headset-outline', label: 'Support', route: '/(customer)/support' },
        { icon: 'settings-outline', label: 'Settings', route: '/(customer)/settings' },
    ];

    const displayName = profile?.name || user?.fullName || 'My Account';
    const displayPhone = profile?.phone || user?.phoneNumbers?.[0]?.phoneNumber || '+255 ...';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* User Card with Edit Button */}
                <View style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{initials || 'ME'}</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{displayName}</Text>
                        <Text style={styles.userPhone}>{displayPhone}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setShowEditModal(true)}
                    >
                        <MaterialIcons name="edit" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* SOS Contact Card */}
                {profile?.emergencyContact && (
                    <View style={styles.sosCard}>
                        <Ionicons name="warning" size={20} color={Colors.error} />
                        <View style={styles.sosInfo}>
                            <Text style={styles.sosLabel}>Emergency Contact</Text>
                            <Text style={styles.sosNumber}>{profile.emergencyContact}</Text>
                        </View>
                    </View>
                )}

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

            {/* Edit Profile Modal */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <MaterialIcons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Your full name"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={editPhone}
                                onChangeText={setEditPhone}
                                placeholder="0712345678"
                                placeholderTextColor="#999"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>
                                <Ionicons name="warning" size={14} color={Colors.error} /> Emergency Contact (SOS)
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={editSosContact}
                                onChangeText={setEditSosContact}
                                placeholder="Emergency phone number"
                                placeholderTextColor="#999"
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.inputHint}>This number will be called during emergencies</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveProfile}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        marginBottom: 20,
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
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF5F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sosCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    sosInfo: {
        marginLeft: 12,
    },
    sosLabel: {
        fontSize: 12,
        color: Colors.error,
        fontWeight: '600',
    },
    sosNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    inputHint: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 6,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
});
