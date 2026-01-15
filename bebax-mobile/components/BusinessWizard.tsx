import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ChevronRight } from 'lucide-react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import * as Location from 'expo-location';

import { PremiumInput } from './PremiumInput';
import { Colors } from '../src/constants/Colors';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '../src/convex/_generated/api';

// REUSABLE BUSINESS WIZARD
// Used by: 
// 1. (auth)/business-setup.tsx (Initial Trap)
// 2. (customer)/list-business.tsx (In-App Add)

const INDUSTRIES = [
    { id: 'retail', label: 'Retail', icon: 'storefront' },
    { id: 'logistics', label: 'Logistics', icon: 'boat' },
    { id: 'manufacturing', label: 'Factory', icon: 'construct' },
    { id: 'agriculture', label: 'Agri', icon: 'leaf' },
    { id: 'food', label: 'Food', icon: 'restaurant' },
    { id: 'other', label: 'Other', icon: 'grid' },
];

interface BusinessWizardProps {
    onComplete: () => void; // Callback after successful creation
}

export function BusinessWizard({ onComplete }: BusinessWizardProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useUser();
    const createOrg = useMutation(api.b2b.createOrganization);
    const syncUser = useMutation(api.users.syncUser); // Ensure profile exists

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    // Form Data
    const [phone, setPhone] = useState('');
    const [industry, setIndustry] = useState('');
    const [address, setAddress] = useState('');
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [fleetSize, setFleetSize] = useState(''); // "Volume"
    const [specialReq, setSpecialReq] = useState('');

    // Pre-fill Name/Email from User (We don't ask again if we can avoid it)
    const businessName = user?.unsafeMetadata?.pending_business_name as string || user?.fullName || "My Business";
    const email = user?.primaryEmailAddress?.emailAddress || "";

    // -- Location Logic --
    const getCurrentLocation = async () => {
        setGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Enable location to tag your business address.");
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            setLocationCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });

            // Reverse Geocode
            const addresses = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude, longitude: loc.coords.longitude
            });
            if (addresses.length > 0) {
                const addr = addresses[0];
                const formatted = [addr.street, addr.district, addr.city].filter(Boolean).join(', ');
                setAddress(formatted);
            }
        } catch (error) {
            Alert.alert("Error", "Could not get location.");
        } finally {
            setGettingLocation(false);
        }
    };

    // -- Submit Logic --
    const handleSubmit = async () => {
        setLoading(true);
        try {
            await syncUser(); // Ensure user exists
            await createOrg({
                name: businessName,
                adminEmail: email,
                phone: phone,
                industry: industry,
                logisticsNeeds: [], // Simplified for now
                expectedMonthlyVolume: parseInt(fleetSize) || 0,
                specialRequirements: specialReq,
                location: locationCoords ? {
                    lat: locationCoords.lat,
                    lng: locationCoords.lng,
                    address: address
                } : undefined
            });

            // Call User Callback (Handles Metadata Update or Redirect)
            onComplete();

        } catch (error: any) {
            console.error("Wizard Error:", error);
            Alert.alert("Registration Failed", error.message || "Please try again.");
            setLoading(false);
        }
        // Note: We don't verify email here as it's assumed valid from Clerk
    };

    // -- Render Helpers --
    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => {
                const isActive = s <= step;
                return (
                    <View key={s} style={styles.stepWrapper}>
                        <View style={[styles.stepDot, isActive && styles.stepDotActive]}>
                            {s < step ? <Ionicons name="checkmark" size={14} color="white" /> :
                                <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>{s}</Text>}
                        </View>
                        {s < 3 && <View style={[styles.stepLine, isActive && step > s && styles.stepLineActive]} />}
                    </View>
                );
            })}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                {renderProgressBar()}
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* STEP 1: Contact Details */}
                    {step === 1 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Contact Details</Text>
                                <Text style={styles.subtitle}>How can customers reach {businessName}?</Text>
                            </View>

                            <View style={styles.form}>
                                <PremiumInput label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+255..." />

                                <Text style={styles.sectionLabel}>Industry</Text>
                                <View style={styles.grid}>
                                    {INDUSTRIES.map(ind => (
                                        <TouchableOpacity key={ind.id} style={[styles.gridItem, industry === ind.id && styles.gridItemActive]} onPress={() => setIndustry(ind.id)}>
                                            <Ionicons name={ind.icon as any} size={24} color={industry === ind.id ? Colors.primary : '#64748B'} />
                                            <Text style={[styles.gridLabel, industry === ind.id && styles.gridLabelActive]}>{ind.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
                                    <Text style={styles.primaryButtonText}>Next: Location</Text>
                                    <ChevronRight size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* STEP 2: Location (No TIN!) */}
                    {step === 2 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Business Location</Text>
                                <Text style={styles.subtitle}>Where should drivers come for pickup?</Text>
                            </View>

                            <View style={styles.form}>
                                <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation} disabled={gettingLocation}>
                                    {gettingLocation ? <ActivityIndicator color={Colors.primary} /> : <Ionicons name="locate" size={20} color={Colors.primary} />}
                                    <Text style={styles.gpsText}>{locationCoords ? 'Location Captured ✓' : 'Use Current GPS Location'}</Text>
                                </TouchableOpacity>

                                <PremiumInput label="Address / Landmark" value={address} onChangeText={setAddress} placeholder="e.g. Kariakoo Market, Plot 42" multiline />

                                <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(3)}>
                                    <Text style={styles.primaryButtonText}>Next: Capacity</Text>
                                    <ChevronRight size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* STEP 3: Capacity & Finish */}
                    {step === 3 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Logistics Capacity</Text>
                                <Text style={styles.subtitle}>Help us match you with the right fleet.</Text>
                            </View>

                            <View style={styles.form}>
                                <PremiumInput label="Est. Monthly Shipments" value={fleetSize} onChangeText={setFleetSize} keyboardType="number-pad" placeholder="e.g. 50" />
                                <PremiumInput label="Special Requirements (Optional)" value={specialReq} onChangeText={setSpecialReq} placeholder="e.g. Cold storage needed" />

                                <TouchableOpacity
                                    style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="white" /> : (
                                        <>
                                            <Text style={styles.primaryButtonText}>Launch Dashboard</Text>
                                            <Ionicons name="rocket" size={20} color="white" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

    progressContainer: { flexDirection: 'row', alignItems: 'center' },
    stepWrapper: { flexDirection: 'row', alignItems: 'center' },
    stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    stepDotActive: { backgroundColor: Colors.primary },
    stepNum: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    stepNumActive: { color: 'white' },
    stepLine: { width: 20, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
    stepLineActive: { backgroundColor: Colors.primary },

    content: { padding: 24 },
    header: { marginBottom: 32 },
    title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#64748B', lineHeight: 24 },

    form: { gap: 20 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 8 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '30%', aspectRatio: 1, backgroundColor: '#F8FAFC', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    gridItemActive: { backgroundColor: '#FFF7ED', borderColor: Colors.primary }, // Light Orange
    gridLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 8 },
    gridLabelActive: { color: Colors.primary },

    gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#BBF7D0' },
    gpsText: { fontSize: 14, fontWeight: '600', color: '#15803D' },

    primaryButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 16, marginTop: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
