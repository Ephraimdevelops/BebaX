import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { ShieldCheck, FileText, Settings, Award, AlertCircle, Camera, LogOut, Globe, Bell, Phone } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// Asset Map
const vehicleAssets: Record<string, any> = {
    'tricycle': require('../../assets/images/bajaji.png'),
    'van': require('../../assets/images/car.png'),
    'truck': require('../../assets/images/truck.png'),
    'semitrailer': require('../../assets/images/truck.png'),
    'boda': require('../../assets/images/boda.png'),
};

export default function ProfileScreen() {
    const { signOut } = useAuth();
    const router = useRouter();
    // @ts-ignore
    const profile = useQuery(api.drivers.getDriverProfile);
    const generateUploadUrl = useMutation(api.drivers.generateUploadUrl);
    // const updateProfile = useMutation(api.users.updateProfile); // Not used directly for photo anymore
    const saveProfilePhoto = useMutation(api.users.saveProfilePhoto);
    // Conditionally fetch image URL only if we have a valid storage ID
    // @ts-ignore
    const getImageUrlQuery = useQuery(api.drivers.getImageUrl,
        profile?.profilePhoto ? { storageId: profile.profilePhoto } : "skip"
    );

    // We can't conditionally call hooks based on state easily, so we'll do the URL fetch manually or in a separate effect if needed.
    // Actually, distinct Step: Upload -> Get ID -> constructing URL manually is risky if format changes.
    // Better: Update `updateProfile` to accept storageId or just construct the URL if we know the domain.
    // For now, we will fetch the Upload URL, upload, and since we need a public URL for `profilePhoto` (string),
    // we might need a backend mutation that takes storageId and sets the photo.
    // Let's rely on a helper or just assume standard convex storage URL for now to save round trips?
    // No, cleaner is: Client uploads -> gets ID -> calls `updateProfilePhoto({ storageId })`.
    // But `updateProfile` takes string.
    // Let's just implement the picker and upload, and use a simpler approach:
    // 1. Pick -> 2. Upload -> 3. Alert "Photo Uploaded" (and ideally trigger a backend update if we can).

    const [activeTab, setActiveTab] = useState<'passport' | 'settings'>('passport');
    const [uploading, setUploading] = useState(false);

    // Dummy data till backend connects perfectly
    const driverName = profile?.user?.name || "Driver";
    const rating = profile?.driver?.rating?.toFixed(1) || "5.0";
    const vehicleType = profile?.vehicle?.type || 'tricycle';
    const vehicleImage = vehicleAssets[vehicleType] || vehicleAssets['tricycle'];
    const isVerified = profile?.driver?.verified ?? false;

    const handlePickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission required", "Sorry, we need camera roll permissions to make this work!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setUploading(true);
                const uri = result.assets[0].uri;

                // 1. Get Upload URL
                const postUrl = await generateUploadUrl();

                // 2. Convert to blob
                const response = await fetch(uri);
                const blob = await response.blob();

                // 3. Upload
                const uploadResponse = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type },
                    body: blob,
                });
                const { storageId } = await uploadResponse.json();

                // 4. Update Profile via Backend
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

    const renderPassport = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Verification Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: isVerified ? Colors.success : Colors.warning }]}>
                {isVerified ? <ShieldCheck size={20} color="white" /> : <AlertCircle size={20} color="white" />}
                <Text style={styles.statusBannerText}>
                    {isVerified ? "VERIFIED DRIVER" : "VERIFICATION PENDING"}
                </Text>
            </View>

            {/* ID Card Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: profile?.user?.profilePhoto || 'https://via.placeholder.com/100' }}
                        style={styles.avatar}
                    />
                    <TouchableOpacity
                        style={styles.editPhotoIcon}
                        onPress={handlePickImage}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Camera size={16} color="white" />
                        )}
                    </TouchableOpacity>
                    <View style={styles.ratingBadge}>
                        <Award size={14} color="white" />
                        <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                </View>
                <Text style={styles.name}>{driverName}</Text>
                <Text style={styles.role}>Professional Driver</Text>
                <Text style={styles.idNumber}>ID: {profile?.driver?.nida_number || "PENDING"}</Text>
            </View>

            {/* Read-Only Vehicle Card */}
            <View style={styles.securityNote}>
                <AlertCircle size={16} color="#666" />
                <Text style={styles.securityText}>Vehicle details are managed by Admin for security.</Text>
            </View>

            <View style={styles.vehicleCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.sectionTitleWhite}>Chombo Chako / Vehicle</Text>
                    <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>{isVerified ? "APPROVED" : "PENDING"}</Text>
                    </View>
                </View>

                <Image source={vehicleImage} style={styles.vehicleImage} resizeMode="contain" />

                <View style={styles.plateContainer}>
                    <Text style={styles.plateLabel}>PLATE NUMBER</Text>
                    <Text style={styles.vehiclePlate}>{profile?.vehicle?.plate_number || "PENDING"}</Text>
                </View>

                <View style={styles.vehicleDetailsRow}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>TYPE</Text>
                        <Text style={styles.detailValue}>{vehicleType.toUpperCase()}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>CAPACITY</Text>
                        <Text style={styles.detailValue}>{profile?.vehicle?.capacity_kg || 0} KG</Text>
                    </View>
                </View>
            </View>

            {/* Documents List */}
            <View style={styles.complianceSection}>
                <Text style={styles.sectionTitle}>Documents</Text>
                {[
                    { name: "Driver's License", valid: true },
                    { name: "Vehicle Insurance", valid: true },
                    { name: "LATRA Permit", valid: false },
                ].map((doc, index) => (
                    <View key={index} style={styles.docRow}>
                        <View style={styles.docInfo}>
                            <FileText size={20} color="#666" />
                            <Text style={styles.docName}>{doc.name}</Text>
                        </View>
                        <View style={[
                            styles.statusLight,
                            { backgroundColor: doc.valid ? Colors.success : Colors.error }
                        ]}>
                            {doc.valid ?
                                <ShieldCheck size={16} color="white" /> :
                                <View style={styles.cross} />
                            }
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderSettings = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Settings</Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingIconBg}>
                        <Globe size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Language / Lugha</Text>
                        <Text style={styles.settingSub}>English (US)</Text>
                    </View>
                    <Text style={styles.actionText}>Change</Text>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.settingRow}
                    onPress={() => router.push('/(driver)/documents')}
                >
                    <View style={styles.settingIconBg}>
                        <FileText size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>My Documents</Text>
                        <Text style={styles.settingSub}>NIDA, License, Insurance, Permit</Text>
                    </View>
                    <Text style={styles.actionText}>View</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                    <View style={styles.settingIconBg}>
                        <Phone size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Additional Phone</Text>
                        <Text style={styles.settingSub}>{profile?.user?.emergencyContact || "Add Number"}</Text>
                    </View>
                    <Text style={styles.actionText}>Edit</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                    <View style={styles.settingIconBg}>
                        <Bell size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Notifications</Text>
                        <Text style={styles.settingSub}>Ride alerts, updates</Text>
                    </View>
                    <Switch value={true} onValueChange={() => { }} trackColor={{ false: "#767577", true: Colors.primary }} />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color={Colors.error} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.versionInfo}>
                <Text style={styles.versionText}>BebaX Driver v1.0.0 (Build 124)</Text>
                <Text style={styles.copyright}>© 2025 EphraimDevelops</Text>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'passport' && styles.activeTab]}
                    onPress={() => setActiveTab('passport')}
                >
                    <Text style={[styles.tabText, activeTab === 'passport' && styles.activeTabText]}>My Passport</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
                    onPress={() => setActiveTab('settings')}
                >
                    <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'passport' ? renderPassport() : renderSettings()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    // Tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
    },
    activeTabText: {
        color: Colors.primary,
    },
    // Banner
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    statusBannerText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    // Header
    header: {
        backgroundColor: 'white',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EEE',
        borderWidth: 3,
        borderColor: 'white',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    editPhotoIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: Colors.primary,
        padding: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFB300',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
    },
    ratingText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 12,
    },
    name: {
        fontSize: 22,
        fontWeight: '800',
        color: '#121212',
    },
    role: {
        fontSize: 15,
        color: '#666',
        marginTop: 4,
    },
    idNumber: {
        fontSize: 13,
        color: '#999',
        marginTop: 4,
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
    // Security Note
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
    },
    securityText: {
        fontSize: 12,
        color: '#666',
    },
    // Vehicle Card
    vehicleCard: {
        margin: 20,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cardHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitleWhite: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
    },
    verifiedBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)', // Green trans
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.success,
    },
    verifiedText: {
        color: Colors.success,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    vehicleImage: {
        width: 220,
        height: 140,
        marginVertical: 12,
    },
    plateContainer: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    plateLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        marginBottom: 4,
        letterSpacing: 1,
    },
    vehiclePlate: {
        color: 'white',
        fontSize: 24,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 4,
    },
    vehicleDetailsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 16,
    },
    detailItem: {
        alignItems: 'center',
        flex: 1,
    },
    detailLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        marginBottom: 4,
    },
    detailValue: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    // Documents
    complianceSection: {
        marginHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    docRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    docInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    docName: {
        fontSize: 16,
        color: '#444',
        marginLeft: 12,
    },
    statusLight: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cross: {
        width: 12,
        height: 12,
        backgroundColor: 'white',
        transform: [{ rotate: '45deg' }],
    },
    // Settings
    section: {
        backgroundColor: 'white',
        marginTop: 20,
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    settingSub: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    actionText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginLeft: 52,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    logoutText: {
        color: Colors.error,
        fontSize: 16,
        fontWeight: '600',
    },
    versionInfo: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 20,
    },
    versionText: {
        color: '#999',
        fontSize: 12,
    },
    copyright: {
        color: '#BBB',
        fontSize: 11,
        marginTop: 4,
    },
});
