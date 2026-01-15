import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { ShieldCheck, FileText, Settings, Award, AlertCircle, Camera, LogOut, ChevronRight, Clock, Star, MapPin, CreditCard, HelpCircle, Truck, User } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const { signOut } = useAuth();
    const router = useRouter();
    // @ts-ignore
    const profile = useQuery(api.drivers.getDriverProfile);
    const generateUploadUrl = useMutation(api.drivers.generateUploadUrl);
    const saveProfilePhoto = useMutation(api.users.saveProfilePhoto);
    const [uploading, setUploading] = useState(false);

    // Derived Data
    const driverName = profile?.user?.name || "Driver";
    const rating = profile?.driver?.rating?.toFixed(1) || "5.0";
    const totalTrips = profile?.driver?.total_trips || 0;
    const isVerified = profile?.driver?.verified ?? false;

    const handlePickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission required", "Sorry, we need camera roll permissions to make this work!");
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
                Alert.alert("Success", "Profile photo updated successfully!");
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to upload photo: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/');
        } catch (err: any) {
            Alert.alert("Error logging out", err.message);
        }
    };

    const MenuItem = ({ icon: Icon, label, subLabel, onPress, color = Colors.text }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconBg}>
                <Icon size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color }]}>{label}</Text>
                {subLabel && <Text style={styles.menuSub}>{subLabel}</Text>}
            </View>
            <ChevronRight size={20} color="#CCC" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* HERO HEADER */}
                <View style={styles.header}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={profile?.user?.profilePhoto
                                    ? { uri: profile.user.profilePhoto }
                                    : require('../../assets/images/avatar_placeholder.png')
                                }
                                style={styles.avatar}
                            />
                            <TouchableOpacity style={styles.editBtn} onPress={handlePickImage} disabled={uploading}>
                                {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Camera size={14} color="#FFF" />}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.name}>{driverName}</Text>
                            <View style={styles.verifiedRow}>
                                {isVerified ? (
                                    <>
                                        <ShieldCheck size={14} color="#10B981" />
                                        <Text style={styles.verifiedText}>Verified Driver</Text>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={14} color="#F59E0B" />
                                        <Text style={[styles.verifiedText, { color: '#F59E0B' }]}>Verification Pending</Text>
                                    </>
                                )}
                            </View>
                        </View>
                        <View style={styles.ratingBadge}>
                            <Star size={14} color="#FFF" fill="#FFF" />
                            <Text style={styles.ratingText}>{rating}</Text>
                        </View>
                    </View>

                    {/* QUICK STATS */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{totalTrips}</Text>
                            <Text style={styles.statLabel}>Trips</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>2.5</Text>
                            <Text style={styles.statLabel}>Years</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>100%</Text>
                            <Text style={styles.statLabel}>Acceptance</Text>
                        </View>
                    </View>
                </View>

                {/* VERIFICATION STATUS WIDGET */}
                <TouchableOpacity
                    style={[styles.verificationWidget, isVerified ? styles.vWidgetSuccess : styles.vWidgetPending]}
                    onPress={() => router.push('/(driver)/documents')}
                >
                    <View style={styles.vWidgetIcon}>
                        {isVerified ? <ShieldCheck size={24} color="#065F46" /> : <AlertCircle size={24} color="#92400E" />}
                    </View>
                    <View style={styles.vWidgetContent}>
                        <Text style={[styles.vWidgetTitle, isVerified ? { color: '#065F46' } : { color: '#92400E' }]}>
                            {isVerified ? "Account Verified" : "Action Required"}
                        </Text>
                        <Text style={[styles.vWidgetSub, isVerified ? { color: '#047857' } : { color: '#B45309' }]}>
                            {isVerified ? "All documents approved" : "Upload missing documents to go online"}
                        </Text>
                    </View>
                    <ChevronRight size={20} color={isVerified ? '#065F46' : '#92400E'} />
                </TouchableOpacity>

                {/* MENU LIST */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>My Account</Text>

                    <MenuItem
                        icon={Clock}
                        label="Ride History"
                        subLabel="View past trips and earnings"
                        onPress={() => router.push('/(driver)/history')}
                    />
                    <MenuItem
                        icon={FileText}
                        label="Documents"
                        subLabel="License, Insurance, Permits"
                        onPress={() => router.push('/(driver)/documents')}
                    />
                    <MenuItem
                        icon={Truck}
                        label="Vehicle Details"
                        subLabel={profile?.vehicle?.plate_number || "Manage vehicle"}
                        onPress={() => router.push('/(driver)/vehicle')}
                    />
                    <MenuItem
                        icon={CreditCard}
                        label="Earnings & Payouts"
                        subLabel="M-Pesa, Bank Account"
                        onPress={() => router.push('/(driver)/earnings')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Preferences</Text>

                    <MenuItem
                        icon={Settings}
                        label="App Settings"
                        subLabel="Navigation, Sounds, Language"
                        onPress={() => router.push('/(driver)/settings')}
                    />
                    <MenuItem
                        icon={HelpCircle}
                        label="Support"
                        subLabel="Get help with your account"
                        onPress={() => { }}
                    />
                </View>

                {/* DANGER ZONE */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: Colors.error }]}>Danger Zone</Text>
                    <MenuItem
                        icon={LogOut}
                        label="Log Out"
                        onPress={handleLogout}
                    />
                    <TouchableOpacity style={styles.deleteAccountBtn} onPress={() => Alert.alert("Delete Account", "Contact support to delete your account data.")}>
                        <Text style={styles.deleteAccountText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>BebaX Driver v1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { paddingBottom: 40 },

    // Header
    header: {
        backgroundColor: '#FFF',
        padding: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
        marginBottom: 20
    },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    avatarWrapper: { position: 'relative', marginRight: 16 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0F0F0' },
    editBtn: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: Colors.primary, padding: 6, borderRadius: 12,
        borderWidth: 2, borderColor: '#FFF'
    },
    profileInfo: { flex: 1 },
    name: { fontSize: 24, fontWeight: '800', color: '#121212', marginBottom: 4 },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    verifiedText: { fontSize: 13, fontWeight: '600', color: '#10B981' },
    ratingBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#121212', paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 12
    },
    ratingText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    // Stats
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16 },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#121212' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '500' },
    statDivider: { width: 1, height: 24, backgroundColor: '#E0E0E0' },

    // Verification Widget
    verificationWidget: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 24, marginBottom: 24,
        padding: 16, borderRadius: 16,
        borderWidth: 1,
    },
    vWidgetSuccess: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
    vWidgetPending: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
    vWidgetIcon: { marginRight: 12 },
    vWidgetContent: { flex: 1 },
    vWidgetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    vWidgetSub: { fontSize: 12 },

    // Sections
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
    menuLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2, color: '#1F2937' },
    menuSub: { fontSize: 12, color: '#9CA3AF' },

    // Danger Zone
    deleteAccountBtn: {
        alignItems: 'center', padding: 16, borderRadius: 16,
        backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
        marginTop: 8
    },
    deleteAccountText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },

    footer: { alignItems: 'center', marginTop: 20 },
    versionText: { color: '#CCC', fontSize: 12, fontWeight: '500' }
});
