import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VEHICLE_FLEET } from '../../src/constants/vehicleRegistry';
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { ArrowLeft, User, Mail, Phone, MapPin, Lock, Truck, FileText, CheckCircle } from 'lucide-react-native';
import { DriverIllustration } from '../../components/AuthIllustrations';
import { PremiumInput } from '../../components/PremiumInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from "convex/react";
import { api } from "../../src/convex/_generated/api";

export default function DriverSignup() {
    const { isLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const syncDriverProfile = useMutation(api.users.createOrUpdateProfile);
    const registerDriver = useMutation(api.drivers.register);

    const [driverData, setDriverData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        password: '',
        vehicleType: '',
        licenseNumber: '',
    });

    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const updateField = (key: string, value: string) => {
        setDriverData(prev => ({ ...prev, [key]: value }));
        setError('');
    };

    const handleRegister = async () => {
        if (!isLoaded) return;
        const { name, email, phone, city, password, vehicleType, licenseNumber } = driverData;

        if (!name || !email || !password || !vehicleType || !licenseNumber || !city) {
            setError('Please complete all fields to proceed.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const completeSignUp = await signUp.create({
                emailAddress: email,
                password,
                firstName: name,
                unsafeMetadata: {
                    role: 'driver',
                    phone: phone,
                    city: city,
                    vehicleType: vehicleType,
                    licenseNumber: licenseNumber
                }
            });

            if (completeSignUp.status === 'complete') {
                await setSignUpActive({ session: completeSignUp.createdSessionId });

                // 1. Sync user profile with driver role
                try {
                    await syncDriverProfile({
                        name: name,
                        email: email,
                        phone: phone,
                        role: 'driver',
                    });
                } catch (e) {
                    console.error("Profile sync failed:", e);
                }

                // 2. Create driver record in drivers table (required for cockpit)
                try {
                    await registerDriver({
                        license_number: licenseNumber,
                        nida_number: "pending", // Will be updated later in profile
                        vehicle_type: vehicleType,
                        vehicle_plate: "pending", // Will be updated later
                        capacity_kg: 500, // Default, can be updated later
                        payout_method: "mpesa" as const,
                        payout_number: phone,
                        location: { lat: -6.7924, lng: 39.2083 }, // DSM default
                    });
                } catch (e: any) {
                    // May fail if driver already exists, that's ok
                    console.log("Driver registration:", e.message);
                }

                // Wait for Convex to propagate
                await new Promise(resolve => setTimeout(resolve, 500));

                router.replace('/(driver)/cockpit');
                return;
            }

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            setError(err.errors ? err.errors[0].message : 'Application failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!isLoaded) return;
        setLoading(true);
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
            if (completeSignUp.status === 'complete') {
                await setSignUpActive({ session: completeSignUp.createdSessionId });

                // 1. Sync user profile with driver role
                try {
                    await syncDriverProfile({
                        name: driverData.name,
                        email: driverData.email,
                        phone: driverData.phone,
                        role: 'driver',
                    });
                } catch (e) {
                    console.error("Profile sync failed:", e);
                }

                // 2. Create driver record in drivers table (required for cockpit)
                try {
                    await registerDriver({
                        license_number: driverData.licenseNumber,
                        nida_number: "pending",
                        vehicle_type: driverData.vehicleType,
                        vehicle_plate: "pending",
                        capacity_kg: 500,
                        payout_method: "mpesa" as const,
                        payout_number: driverData.phone,
                        location: { lat: -6.7924, lng: 39.2083 },
                    });
                } catch (e: any) {
                    console.log("Driver registration:", e.message);
                }

                // Wait for Convex to propagate
                await new Promise(resolve => setTimeout(resolve, 500));

                router.replace('/(driver)/cockpit');
            } else {
                setError("Verification incomplete");
            }
        } catch (err: any) {
            setError(err.errors ? err.errors[0].message : "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text} size={24} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.brandingContainer}>
                        <DriverIllustration width={180} height={180} />
                        <Text style={styles.title}>Driver Partner</Text>
                        <Text style={styles.subtitle}>Join the fleet. Earn on your terms.</Text>
                    </View>

                    {pendingVerification ? (
                        <View style={styles.formSection}>
                            <View style={styles.successBanner}>
                                <CheckCircle size={24} color="#4CAF50" />
                                <Text style={styles.successText}>Application Received!</Text>
                            </View>
                            <Text style={styles.helperText}>
                                Please enter the verification code sent to {driverData.email} to complete your registration.
                            </Text>

                            <PremiumInput
                                label="Verification Code"
                                value={code}
                                onChangeText={(t) => { setCode(t); setError(''); }}
                                icon={Lock}
                                keyboardType="number-pad"
                                placeholder="123456"
                                error={error}
                            />

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleVerify}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Verify & Start Driving</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Personal Details</Text>

                            <PremiumInput
                                label="Full Name"
                                value={driverData.name}
                                onChangeText={(t) => updateField('name', t)}
                                icon={User}
                            />

                            <PremiumInput
                                label="Email"
                                value={driverData.email}
                                onChangeText={(t) => updateField('email', t)}
                                icon={Mail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <PremiumInput
                                label="Phone Number"
                                value={driverData.phone}
                                onChangeText={(t) => updateField('phone', t)}
                                icon={Phone}
                                keyboardType="phone-pad"
                            />

                            <PremiumInput
                                label="City / Region"
                                value={driverData.city}
                                onChangeText={(t) => updateField('city', t)}
                                icon={MapPin}
                            />

                            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Vehicle & Security</Text>

                            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Vehicle & Security</Text>

                            <Text style={styles.fieldLabel}>Select Vehicle Type</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.vehicleList}
                            >
                                {VEHICLE_FLEET.map((vehicle) => (
                                    <TouchableOpacity
                                        key={vehicle.id}
                                        style={[
                                            styles.vehicleChip,
                                            driverData.vehicleType === vehicle.id && styles.vehicleChipSelected
                                        ]}
                                        onPress={() => updateField('vehicleType', vehicle.id)}
                                    >
                                        <MaterialIcons
                                            name={vehicle.icon as any}
                                            size={24}
                                            color={driverData.vehicleType === vehicle.id ? Colors.primary : Colors.textDim}
                                        />
                                        <Text style={[
                                            styles.vehicleChipText,
                                            driverData.vehicleType === vehicle.id && styles.vehicleChipTextSelected
                                        ]}>
                                            {vehicle.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            {driverData.vehicleType && (
                                <Text style={styles.tierHint}>
                                    {driverData.vehicleType === 'trailer' || driverData.vehicleType === 'fuso'
                                        ? "Requirements: Commercial License, Insurance, Inspection (Manual Verification)"
                                        : "Requirements: Valid License & Registration (Auto Verification)"}
                                </Text>
                            )}

                            <PremiumInput
                                label="License Number"
                                value={driverData.licenseNumber}
                                onChangeText={(t) => updateField('licenseNumber', t)}
                                icon={FileText}
                                autoCapitalize="characters"
                            />

                            <PremiumInput
                                label="Create Password"
                                value={driverData.password}
                                onChangeText={(t) => updateField('password', t)}
                                icon={Lock}
                                secureTextEntry
                                error={error}
                            />

                            <TouchableOpacity
                                style={[styles.primaryButton, loading && styles.disabledButton]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Submit Application</Text>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.disclaimer}>
                                By continuing, you agree to our Driver Terms of Service and Privacy Policy.
                            </Text>

                            {/* Global Error Display */}
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: 20, paddingBottom: 10 },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#f0f0f0' },
    scrollContainer: { paddingHorizontal: 24, paddingBottom: 40 },
    brandingContainer: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: Colors.textDim, textAlign: 'center' },
    formSection: { gap: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textDim, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },

    primaryButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 20,
    },
    disabledButton: { opacity: 0.7 },
    primaryButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },

    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        gap: 12
    },
    successText: { color: '#2E7D32', fontWeight: '700', fontSize: 16 },
    helperText: { color: Colors.textDim, marginBottom: 20, lineHeight: 22 },
    disclaimer: { color: Colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 16, opacity: 0.6 },
    errorText: { color: Colors.error, fontSize: 14, textAlign: 'center', marginTop: 10, fontWeight: 'bold' },

    // Vehicle Selector Styles
    fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 12, marginLeft: 4 },
    vehicleList: { paddingRight: 20, gap: 12 },
    vehicleChip: {
        width: 100,
        height: 100,
        backgroundColor: Colors.surfaceOff,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        padding: 8,
    },
    vehicleChipSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF0E6', // Light orange tint
    },
    vehicleChipText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textDim,
        textAlign: 'center',
    },
    vehicleChipTextSelected: {
        color: Colors.primary,
        fontWeight: '700',
    },
    tierHint: {
        fontSize: 12,
        color: Colors.primary,
        marginTop: 8,
        marginLeft: 4,
        fontStyle: 'italic',
    }
});
