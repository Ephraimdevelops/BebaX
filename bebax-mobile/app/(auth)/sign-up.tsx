import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumInput } from '../../components/PremiumInput';
import { Eye, EyeOff } from 'lucide-react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function SignUp() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });

    const handleGoogleSignUp = async () => {
        try {
            const { createdSessionId, setActive: setOAuthActive } = await startGoogleOAuth({ redirectUrl: 'bebax://' });
            if (createdSessionId) {
                await setOAuthActive!({ session: createdSessionId });
            }
        } catch (err) {
            console.error(err);
            setError('Google sign-up failed');
        }
    };

    const handleRegister = async () => {
        if (!isLoaded) return;
        if (!name || !email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const completeSignUp = await signUp.create({
                emailAddress: email,
                password,
                firstName: name,
            });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                return;
            }

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            setError(err.errors ? err.errors[0].message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!isLoaded || !code) return;
        setLoading(true);
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
            } else {
                setError('Verification incomplete');
            }
        } catch (err: any) {
            setError(err.errors ? err.errors[0].message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header (Back Button) */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#121212" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Header Text */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {pendingVerification ? "Enter Code" : "Create Account"}
                        </Text>
                        <Text style={styles.subtitle}>
                            {pendingVerification
                                ? `We sent a code to ${email}`
                                : "Join BebaX to request rides and move cargo."
                            }
                        </Text>
                    </View>

                    {/* Verification Form */}
                    {pendingVerification ? (
                        <View style={styles.form}>
                            <PremiumInput
                                label="Verification Code"
                                value={code}
                                onChangeText={(t) => { setCode(t); setError(''); }}
                                keyboardType="number-pad"
                                placeholder="123456"
                                error={error}
                            />

                            <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Verify Account</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Sign Up Form */
                        <View style={styles.form}>
                            <PremiumInput
                                label="Full Name"
                                value={name}
                                onChangeText={(t) => { setName(t); setError(''); }}
                                autoCapitalize="words"
                            />

                            <PremiumInput
                                label="Email Address"
                                value={email}
                                onChangeText={(t) => { setEmail(t); setError(''); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <PremiumInput
                                label="Password"
                                value={password}
                                onChangeText={(t) => { setPassword(t); setError(''); }}
                                secureTextEntry={!showPassword}
                                rightElement={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                                    </TouchableOpacity>
                                }
                                error={error}
                            />

                            <TouchableOpacity
                                style={[styles.primaryButton, loading && styles.disabledBtn]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Create Account</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignUp}>
                                <FontAwesome5 name="google" size={18} color="#121212" />
                                <Text style={styles.socialButtonText}>Sign Up with Google</Text>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <View style={styles.loginContainer}>
                                    <Text style={styles.footerText}>Already have an account?</Text>
                                    <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                                        <Text style={styles.footerLink}>Log In</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.loginContainer, { marginTop: 16 }]}>
                                    <Text style={styles.footerText}>Want to drive?</Text>
                                    <TouchableOpacity onPress={() => router.push('/(auth)/driver-signup')}>
                                        <Text style={styles.footerLink}>Register as Driver</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    navBar: { paddingHorizontal: 20, paddingBottom: 10 },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }, // Simple back arrow, no circle

    content: { paddingHorizontal: 24, paddingBottom: 40 },

    header: { marginBottom: 32 },
    title: { fontSize: 32, fontWeight: '700', color: '#121212', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666', lineHeight: 24, maxWidth: '90%' },

    form: { gap: 8 },

    primaryButton: {
        backgroundColor: '#121212',
        height: 56,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    disabledBtn: { opacity: 0.7 },
    primaryButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },

    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
    dividerText: { marginHorizontal: 16, color: '#999', fontSize: 14 },

    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        gap: 12,
        backgroundColor: 'white',
    },
    socialButtonText: { fontSize: 16, fontWeight: '500', color: '#121212' },

    footer: { marginTop: 40, alignItems: 'center' },
    loginContainer: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    footerText: { color: '#666', fontSize: 14 },
    footerLink: { color: '#121212', fontWeight: '600', fontSize: 14 },
});
