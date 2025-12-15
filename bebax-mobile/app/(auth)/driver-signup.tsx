import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSignUp, useSignIn } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { ArrowLeft } from 'lucide-react-native';

export default function DriverSignup() {
    const { isLoaded, signUp, setSession: setSignUpActive } = useSignUp();
    const router = useRouter();

    // Driver-specific registration state
    const [driverData, setDriverData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        vehicleType: 'boda', // specific to drivers
        licenseNumber: '',
    });

    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');

    const handleRegister = async () => {
        if (!isLoaded) return;
        if (!driverData.name || !driverData.email || !driverData.password || !driverData.vehicleType || !driverData.licenseNumber) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await signUp.create({
                emailAddress: driverData.email,
                password: driverData.password,
                firstName: driverData.name,
                unsafeMetadata: {
                    role: 'driver',
                    phone: driverData.phone,
                    vehicleType: driverData.vehicleType,
                    licenseNumber: driverData.licenseNumber
                }
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
            Alert.alert("Verification Sent", "Please check your email.");

        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            Alert.alert('Error', err.errors ? err.errors[0].message : 'Registration failed');
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
                // Root layout redirects to cockpit
            } else {
                Alert.alert("Error", "Verification incomplete");
            }
        } catch (err: any) {
            Alert.alert("Error", err.errors ? err.errors[0].message : "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text} size={24} />
                </TouchableOpacity>

                {/* 3D Logo Header */}
                <View style={styles.logoContainer}>
                    <Image
                        source={{ uri: 'file:///Users/ednangowi/.gemini/antigravity/brain/ce78f4e0-d7a0-4e84-a1e8-69c77a41ac49/bebax_3d_logo_header_1765824096128.png' }}
                        style={styles.logoImage}
                    />
                </View>

                <View style={styles.header}>
                    <Text style={styles.title}>Driver Application</Text>
                    <Text style={styles.subtitle}>Join the fleet and start earning today.</Text>
                </View>

                {pendingVerification ? (
                    <View style={styles.formContent}>
                        <Text style={styles.helperText}>Enter the verification code sent to your email.</Text>
                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.input}
                                placeholder="123456"
                                placeholderTextColor="#999"
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={handleVerify}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify Email'}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.formContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor="#999"
                                value={driverData.name}
                                onChangeText={(t) => setDriverData({ ...driverData, name: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor="#999"
                                value={driverData.email}
                                onChangeText={(t) => setDriverData({ ...driverData, email: t })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+255 700 000 000"
                                placeholderTextColor="#999"
                                value={driverData.phone}
                                onChangeText={(t) => setDriverData({ ...driverData, phone: t })}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Create a strong password"
                                placeholderTextColor="#999"
                                value={driverData.password}
                                onChangeText={(t) => setDriverData({ ...driverData, password: t })}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Vehicle Information</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Vehicle Type</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Boda / Bajaji / Truck"
                                placeholderTextColor="#999"
                                value={driverData.vehicleType}
                                onChangeText={(t) => setDriverData({ ...driverData, vehicleType: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>License Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your license ID"
                                placeholderTextColor="#999"
                                value={driverData.licenseNumber}
                                onChangeText={(t) => setDriverData({ ...driverData, licenseNumber: t })}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Processing...' : 'Submit Application'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 24,
        paddingBottom: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginBottom: 20,
        marginTop: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20
    },
    logoImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain'
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textDim,
        lineHeight: 24,
        textAlign: 'center',
    },
    formContent: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    input: {
        backgroundColor: '#F7F8F9',
        borderWidth: 1,
        borderColor: '#E8E9EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: Colors.text,
    },
    sectionHeader: {
        marginTop: 10,
        marginBottom: 10,
    },
    sectionTitle: {
        color: Colors.primary,
        fontWeight: '800',
        fontSize: 18,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 10,
    },
    primaryButton: {},
    disabledButton: { opacity: 0.7 },
    buttonText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 16,
    },
    helperText: {
        color: Colors.textDim,
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 14,
    }
});
