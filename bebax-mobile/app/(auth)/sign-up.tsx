import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, Image } from 'react-native';
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });

    const handleGoogleSignUp = async () => {
        try {
            const { createdSessionId, setActive: setOAuthActive } = await startGoogleOAuth({ redirectUrl: 'bebax://' });
            if (createdSessionId) {
                await setOAuthActive!({ session: createdSessionId });
                router.replace('/(customer)/dashboard');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRegister = async () => {
        if (!isLoaded) return;
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            await signUp.create({
                emailAddress: email,
                password,
                firstName: name,
            });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            Alert.alert('Registration Failed', err.errors ? err.errors[0].message : 'An error occurred');
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
                await setActive({ session: completeSignUp.createdSessionId });
                router.replace('/(customer)/dashboard');
            } else {
                Alert.alert('Error', 'Verification incomplete.');
            }
        } catch (err: any) {
            Alert.alert('Verification Failed', err.errors ? err.errors[0].message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* 3D Logo Header */}
                <View style={styles.logoContainer}>
                    <Image
                        source={{ uri: 'file:///Users/ednangowi/.gemini/antigravity/brain/ce78f4e0-d7a0-4e84-a1e8-69c77a41ac49/bebax_3d_logo_header_1765824096128.png' }}
                        style={styles.logoImage}
                    />
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{pendingVerification ? "Verify Email" : "Create Account"}</Text>
                    <Text style={styles.subtitle}>
                        {pendingVerification ? `Enter the code sent to ${email}` : "Join BebaX to request rides and move cargo instantly."}
                    </Text>
                </View>

                {pendingVerification ? (
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Verification Code</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="123456"
                                placeholderTextColor="#999"
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                            />
                        </View>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={loading}>
                            <Text style={styles.primaryButtonText}>{loading ? 'Verifying...' : 'Verify Email'}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.form}>
                        {/* Social Sign Up */}
                        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignUp}>
                            <FontAwesome5 name="google" size={18} color={Colors.text} />
                            <Text style={styles.socialButtonText}>Sign Up with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.orText}>OR EMAIL</Text>
                            <View style={styles.line} />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor="#999"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Create a strong password"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
                            <Text style={styles.primaryButtonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                                <Text style={styles.linkText}>Log In</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.footer, { marginTop: 10 }]}>
                            <Text style={styles.footerText}>Want to earn money?</Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/driver-signup')}>
                                <Text style={styles.linkText}>Register as a Driver</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: 20, paddingBottom: 10 },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#f0f0f0' },
    content: { paddingHorizontal: 24, paddingBottom: 40 },
    logoContainer: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
    logoImage: { width: 100, height: 100, resizeMode: 'contain' },
    titleContainer: { marginTop: 0, marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 32, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 16, color: Colors.textDim, lineHeight: 24, textAlign: 'center' },
    form: { gap: 20 },
    inputContainer: { gap: 8 },
    label: { fontSize: 14, fontWeight: '700', color: Colors.text },
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
    primaryButton: {
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
    primaryButtonText: { color: 'white', fontWeight: '800', fontSize: 16 },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    footerText: { color: Colors.textDim, fontSize: 14 },
    linkText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },

    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8E9EB',
        gap: 12,
        backgroundColor: 'white',
    },
    socialButtonText: { fontSize: 16, fontWeight: '600', color: Colors.text },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
    line: { flex: 1, height: 1, backgroundColor: '#E8E9EB' },
    orText: { marginHorizontal: 16, color: '#999', fontSize: 12, fontWeight: '600' },
});
