import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Image, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { PremiumInput } from '../../components/PremiumInput';
import { Ionicons } from '@expo/vector-icons';
import { ChevronRight, Check } from 'lucide-react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

// 3-Step Wizard for "Join BebaX Business"
// This runs AFTER Auth (when user is already a 'customer')

export default function BusinessSetupWizard() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useUser(); // Get User to update metadata
    const syncUser = useMutation(api.users.syncUser); // To create backend profile
    const createOrg = useMutation(api.b2b.createOrganization); // To create actual business entity

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [industry, setIndustry] = useState('');
    const [phone, setPhone] = useState('');
    const [tinNumber, setTinNumber] = useState('');
    const [fleetSize, setFleetSize] = useState('');
    const [address, setAddress] = useState('');

    const handleComplete = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Sync User to ensure Profile Exists (Prerequisite for creating Org)
            await syncUser();

            // 2. Create Organization in Backend (Real DB Record)
            const orgId = await createOrg({
                name: user.unsafeMetadata.pending_business_name as string || user.fullName || "My Business",
                adminEmail: user.primaryEmailAddress?.emailAddress || "",
                phone: phone,
                industry: industry,
                tinNumber: tinNumber,
                expectedMonthlyVolume: parseInt(fleetSize) || 0,
                // We could pass address/location if we geocoded it, basically skipping for now or passing string
            });

            // 3. Update Clerk Metadata to Release the Trap & Upgrade Role
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    role: 'business',
                    is_business_setup: false,
                    accountType: 'organization',
                    completed_onboarding: true,
                    orgId: orgId // Store backend ID in metadata for easy access
                }
            });

            // 4. Redirect
            // Small delay to ensure metadata propagates
            setTimeout(() => {
                router.replace('/(customer)/business');
            }, 500);

        } catch (err) {
            console.error("Setup failed:", err);
            // alert('Failed to create organization. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => {
                const isActive = s <= step;
                return (
                    <View key={s} style={styles.stepWrapper}>
                        <View style={[styles.stepDot, isActive && styles.stepDotActive]}>
                            {s < step ? (
                                <Ionicons name="checkmark" size={14} color="white" />
                            ) : (
                                <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>{s}</Text>
                            )}
                        </View>
                        {s < 3 && <View style={[styles.stepLine, isActive && step > s && styles.stepLineActive]} />}
                    </View>
                );
            })}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header / Nav */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                {renderProgressBar()}
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* STEP 1: Company Profile */}
                    {step === 1 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
                            <View style={styles.header}>
                                <Image source={require('../../assets/images/biz_setup.png')} style={styles.stepImage} resizeMode="contain" />
                                <Text style={styles.title}>Company Profile</Text>
                                <Text style={styles.subtitle}>Let's set up your official business presence on BebaX.</Text>
                            </View>

                            <View style={styles.form}>
                                <PremiumInput
                                    label="Official Phone Number"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholder="+255..."
                                />
                                <PremiumInput
                                    label="Industry / Sector"
                                    value={industry}
                                    onChangeText={setIndustry}
                                    placeholder="e.g. Retail, Construction"
                                />
                                <PremiumInput
                                    label="Business Address"
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="City, Street"
                                />

                                <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
                                    <Text style={styles.primaryButtonText}>Next Step</Text>
                                    <ChevronRight size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* STEP 2: Legal & Verification */}
                    {step === 2 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Legal & Tax</Text>
                                <Text style={styles.subtitle}>We need this to generate valid invoices and ensure compliance.</Text>
                            </View>

                            <View style={styles.form}>
                                <PremiumInput
                                    label="TIN Number"
                                    value={tinNumber}
                                    onChangeText={setTinNumber}
                                    keyboardType="number-pad"
                                    placeholder="9-digit TIN"
                                />
                                <TouchableOpacity style={styles.uploadBox}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="cloud-upload-outline" size={24} color="#64748B" />
                                    </View>
                                    <Text style={styles.uploadTitle}>Upload Business License</Text>
                                    <Text style={styles.uploadDesc}>PDF or JPG up to 5MB</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(3)}>
                                    <Text style={styles.primaryButtonText}>Next Step</Text>
                                    <ChevronRight size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* STEP 3: Finish */}
                    {step === 3 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Logistics Needs</Text>
                                <Text style={styles.subtitle}>Help us tailor the experience to your volume.</Text>
                            </View>

                            <View style={styles.form}>
                                <PremiumInput
                                    label="Estimated Monthly Deliveries"
                                    value={fleetSize}
                                    onChangeText={setFleetSize}
                                    keyboardType="number-pad"
                                    placeholder="e.g. 50-100"
                                />

                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryTitle}>Review</Text>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Industry</Text>
                                        <Text style={styles.summaryValue}>{industry || 'Not set'}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>TIN</Text>
                                        <Text style={styles.summaryValue}>{tinNumber || 'Not set'}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.primaryButton} onPress={handleComplete} disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text style={styles.primaryButtonText}>Complete Setup</Text>
                                            <Check size={20} color="white" />
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
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    navBar: { paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#F8FAFC' },

    // Progress
    progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    stepWrapper: { flexDirection: 'row', alignItems: 'center' },
    stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    stepDotActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
    stepNum: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    stepNumActive: { color: 'white' },
    stepLine: { width: 20, height: 2, backgroundColor: '#F1F5F9', marginHorizontal: 4 },
    stepLineActive: { backgroundColor: '#0F172A' },

    content: { paddingHorizontal: 30, paddingBottom: 60 },
    header: { marginBottom: 32, marginTop: 10 },
    stepImage: { width: '100%', height: 180, marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#64748B', lineHeight: 24 },

    form: { gap: 4 },
    primaryButton: { backgroundColor: '#0F172A', height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 24, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
    primaryButtonText: { color: 'white', fontWeight: '700', fontSize: 17 },

    uploadBox: { height: 120, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', marginVertical: 8 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    uploadTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
    uploadDesc: { fontSize: 13, color: '#64748B' },

    summaryCard: { padding: 20, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    summaryTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: '#64748B', fontSize: 14 },
    summaryValue: { color: '#0F172A', fontWeight: '500', fontSize: 14 },
});
