import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumInput } from '../../components/PremiumInput';
import { Eye, EyeOff } from 'lucide-react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';

export default function BusinessSignup() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [businessName, setBusinessName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');

    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });

    const handleCreateAccount = async () => {
        if (!isLoaded) return;
        if (!name || !businessName || !email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const completeSignUp = await signUp.create({
                emailAddress: email,
                password,
                firstName: name, // User's name
                unsafeMetadata: {
                    role: 'customer', // As requested: Start as Customer
                    pending_business_name: businessName, // Store intent
                    is_business_setup: true
                }
            });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                router.push('/(auth)/business-setup'); // Redirect to 3-step form
            } else {
                await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                setPendingVerification(true);
            }
        } catch (err: any) {
            setError(err.errors ? err.errors[0].message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!isLoaded || !code) return;
        setLoading(true);
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                // SUCCESS: Redirect to the 3-Step Business Form
                router.push('/(auth)/business-setup');
            } else {
                setError('Verification incomplete');
            }
        } catch (err: any) {
            setError(err.errors ? err.errors[0].message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            const { createdSessionId, setActive: setOAuthActive } = await startGoogleOAuth({ redirectUrl: 'bebax://' });
            if (createdSessionId) {
                await setOAuthActive!({ session: createdSessionId });
                // If Google signin works, we assume they need to be redirected too if we could track context
                // For now, standard redirect.
            }
        } catch (err) {
            console.error(err);
            setError('Google sign-up failed');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {pendingVerification ? "Verify Email" : "Create Account"}
                        </Text>
                        <Text style={styles.subtitle}>
                            {pendingVerification
                                ? `Enter code sent to ${email}`
                                : "Start by creating your user profile."}
                        </Text>
                    </View>

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
                            <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyEmail} disabled={loading}>
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Verify & Continue</Text>}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <PremiumInput
                                label="Full Name"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                            <PremiumInput
                                label="Business Name"
                                value={businessName}
                                onChangeText={setBusinessName}
                                autoCapitalize="words"
                                placeholder="Your Company Ltd"
                            />
                            <PremiumInput
                                label="Work Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <PremiumInput
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                rightElement={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                                    </TouchableOpacity>
                                }
                            />

                            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateAccount} disabled={loading}>
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or continue with</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignUp}>
                                <FontAwesome5 name="google" size={18} color="#0F172A" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                                    <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLink}>Log in</Text></Text>
                                </TouchableOpacity>
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
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    content: { paddingHorizontal: 30, paddingBottom: 60 },

    header: { marginBottom: 40, marginTop: 10 },
    title: { fontSize: 30, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#64748B', lineHeight: 24, maxWidth: '90%' },

    form: { gap: 4 },

    primaryButton: {
        backgroundColor: '#0F172A',
        height: 60,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 30,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    primaryButtonText: { color: 'white', fontWeight: '700', fontSize: 17 },

    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    dividerText: { marginHorizontal: 16, color: '#94A3B8', fontSize: 14, fontWeight: '500' },

    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        gap: 12,
        backgroundColor: 'white',
    },
    socialButtonText: { fontSize: 16, fontWeight: '600', color: '#0F172A' },

    footer: { marginTop: 40, alignItems: 'center' },
    footerText: { color: '#64748B', fontSize: 15 },
    footerLink: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});
