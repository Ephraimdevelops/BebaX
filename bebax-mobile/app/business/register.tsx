import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

// Categories for business
const BUSINESS_CATEGORIES = [
    { id: 'hardware', label: 'Hardware Store', icon: 'construction' },
    { id: 'retail', label: 'Retail Shop', icon: 'store' },
    { id: 'logistics', label: 'Logistics / Moving', icon: 'local-shipping' },
    { id: 'cosmetics', label: 'Cosmetics / Beauty', icon: 'face' },
    { id: 'electronics', label: 'Electronics', icon: 'devices' },
    { id: 'other', label: 'Other', icon: 'category' },
];

export default function RegisterBusinessScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [tinNumber, setTinNumber] = useState('');
    const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
    const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);

    // Map State
    const [showMap, setShowMap] = useState(false);
    const [tempRegion, setTempRegion] = useState({
        latitude: -6.7924, // Dar es Salaam default
        longitude: 39.2083,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    // Mutations
    const generateUploadUrl = useMutation(api.drivers.generateUploadUrl); // Reuse existing upload helper
    const registerOrg = useMutation(api.b2b.createOrganization);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setLicensePhoto(result.assets[0].uri);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!name || !category || !tinNumber) {
                Alert.alert('Missing Info', 'Please fill in all details including TIN Number.');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!location) {
                Alert.alert('Location Required', 'Please set your store location on the map.');
                return;
            }
            // Temporarily skip photo check for dev speed if needed, but in empire mode it's mandatory
            if (!licensePhoto) {
                Alert.alert('Photo Required', 'Please upload a photo of your Business License.');
                return;
            }
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // 1. UPLOAD LICENSE PHOTO TO STORAGE
            let storageId: any = null;
            if (licensePhoto) {
                // Get upload URL from Convex
                const postUrl = await generateUploadUrl();

                // Fetch the image as blob
                const response = await fetch(licensePhoto);
                const blob = await response.blob();

                // Upload to Convex Storage
                const uploadResult = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type || "image/jpeg" },
                    body: blob,
                });
                const { storageId: uploadedId } = await uploadResult.json();
                storageId = uploadedId;
            }

            // 2. CALL THE REAL MUTATION
            await registerOrg({
                name,
                tinNumber,
                category,
                adminEmail: "", // Will be fetched from Clerk identity on backend
                location: location ? {
                    lat: location.latitude,
                    lng: location.longitude,
                    address: location.address,
                } : undefined,
                licensePhotoId: storageId,
            });

            // 3. SUCCESS - Redirect to Waiting Room
            Alert.alert(
                "Application Received",
                "Your business application is under review. You will be notified via SMS once approved.",
                [{ text: "OK", onPress: () => router.replace('/business/status') }]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit application. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Business Details</Text>

            {/* Name */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Ngowi's Hardware"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* TIN Number */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>TIN Number (Mandatory)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 123-456-789"
                    keyboardType="numeric"
                    value={tinNumber}
                    onChangeText={setTinNumber}
                />
            </View>

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
                {BUSINESS_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryCard, category === cat.id && styles.categoryActive]}
                        onPress={() => setCategory(cat.id)}
                    >
                        <MaterialIcons
                            name={cat.icon as any}
                            size={24}
                            color={category === cat.id ? Colors.primary : '#64748B'}
                        />
                        <Text style={[styles.categoryText, category === cat.id && styles.categoryTextActive]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Verification & Location</Text>

            {/* Location Picker */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Location</Text>
                <TouchableOpacity style={styles.locationBtn} onPress={() => setShowMap(true)}>
                    <View style={styles.locationIcon}>
                        <MaterialIcons name="location-on" size={24} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.locationBtnTitle}>
                            {location ? "Location Set" : "Set Store Location"}
                        </Text>
                        <Text style={styles.locationBtnSub}>
                            {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Tap to open map"}
                        </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* License Photo */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Business License Photo</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                    {licensePhoto ? (
                        <Image source={{ uri: licensePhoto }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <MaterialIcons name="cloud-upload" size={32} color="#94A3B8" />
                            <Text style={styles.uploadText}>Tap to upload photo</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)}>
                    <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Register Merchant</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: step === 1 ? '50%' : '100%' }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {step === 1 ? renderStep1() : renderStep2()}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextBtn, submitting && styles.disabledBtn]}
                    onPress={handleNext}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.nextBtnText}>
                            {step === 1 ? "Next Step" : "Submit Application"}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Map Modal */}
            <Modal visible={showMap} animationType="slide">
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        provider={Platform.OS === 'android' ? PROVIDER_DEFAULT : undefined} // Use default on iOS
                        initialRegion={tempRegion}
                        onRegionChangeComplete={setTempRegion}
                    >
                        <Marker
                            coordinate={{ latitude: tempRegion.latitude, longitude: tempRegion.longitude }}
                            title="Store Location"
                        />
                    </MapView>
                    <View style={styles.mapCenterMarker}>
                        <MaterialIcons name="location-on" size={40} color={Colors.primary} />
                    </View>

                    <View style={styles.mapFooter}>
                        <Text style={styles.mapInstruction}>Position the pin on your store</Text>
                        <TouchableOpacity
                            style={styles.confirmLocationBtn}
                            onPress={() => {
                                setLocation({ latitude: tempRegion.latitude, longitude: tempRegion.longitude });
                                setShowMap(false);
                            }}
                        >
                            <Text style={styles.confirmLocationText}>Confirm Location</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.closeMapBtn} onPress={() => setShowMap(false)}>
                        <MaterialIcons name="close" size={24} color="#0F172A" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    progressContainer: { height: 4, backgroundColor: '#E2E8F0', width: '100%' },
    progressBar: { height: '100%', backgroundColor: Colors.primary },
    scrollContent: { padding: 20 },
    formSection: { marginBottom: 20 },

    sectionTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8 },
    input: {
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
        padding: 16, fontSize: 16, color: '#0F172A'
    },

    // Categories
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    categoryCard: {
        width: '48%', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12,
        borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', gap: 8
    },
    categoryActive: { borderColor: Colors.primary, backgroundColor: '#FFF7ED' },
    categoryText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    categoryTextActive: { color: Colors.primary },

    // Location
    locationBtn: {
        flexDirection: 'row', alignItems: 'center', padding: 12,
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, gap: 12
    },
    locationIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    locationBtnTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    locationBtnSub: { fontSize: 13, color: '#64748B' },

    // Upload
    uploadBtn: {
        height: 150, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
        borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
    },
    uploadPlaceholder: { alignItems: 'center', gap: 8 },
    uploadText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
    previewImage: { width: '100%', height: '100%' },

    // Footer
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    nextBtn: {
        backgroundColor: '#0F172A', height: 56, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
    },
    disabledBtn: { opacity: 0.7 },
    nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    // Map Modal
    mapContainer: { flex: 1 },
    map: { flex: 1 },
    mapCenterMarker: {
        position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40,
        pointerEvents: 'none'
    },
    mapFooter: {
        position: 'absolute', bottom: 40, left: 20, right: 20,
        backgroundColor: '#FFF', padding: 20, borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 10, elevation: 10
    },
    mapInstruction: { fontSize: 14, fontWeight: '600', color: '#64748B', textAlign: 'center', marginBottom: 16 },
    confirmLocationBtn: {
        backgroundColor: Colors.primary, height: 50, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center'
    },
    confirmLocationText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    closeMapBtn: {
        position: 'absolute', top: 60, left: 20,
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
    }
});
