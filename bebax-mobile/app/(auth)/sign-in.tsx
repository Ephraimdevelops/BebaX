import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumInput } from '../../components/PremiumInput';
import { Eye, EyeOff } from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });

    const handleLogin = async () => {
        if (!isLoaded) return;
        if (!email || !password) {
            setError('Please fill in both fields');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const completeSignIn = await signIn.create({
                identifier: email,
                password,
            });
            await setActive({ session: completeSignIn.createdSessionId });
        } catch (err: any) {
            setError(err.errors ? err.errors[0].message : 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { createdSessionId, setActive: setOAuthActive } = await startGoogleOAuth({ redirectUrl: 'bebax://' });
            if (createdSessionId) {
                await setOAuthActive!({ session: createdSessionId });
            }
        } catch (err) {
            console.error(err);
            setError('Google sign-in failed');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/bebax_logo_black.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.subtitle}>Enter your details to continue.</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.form}>
                        <PremiumInput
                            label="Email Address"
                            value={email}
                            onChangeText={(t) => { setEmail(t); setError(''); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={error && error.includes('identifier') ? error : undefined}
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
                        />

                        {error && !error.includes('identifier') && (
                            <Text style={styles.globalError}>{error}</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.disabledBtn]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Continue</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                            <FontAwesome5 name="google" size={18} color="#121212" />
                            <Text style={styles.socialButtonText}>Continue with Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.forgotPass}>
                            <Text style={styles.footerLink}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <View style={styles.signupContainer}>
                            <Text style={styles.footerText}>New to BebaX?</Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                                <Text style={styles.footerLink}>Create Account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' }, // Clean white background
    content: { padding: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    logo: { width: 300, height: 110, marginBottom: 24 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
    form: { gap: 8, maxWidth: 400, width: '100%', alignSelf: 'center' },
    globalError: { color: Colors.error, fontSize: 13, marginBottom: 10, textAlign: 'center', fontWeight: '500' },

    primaryButton: {
        backgroundColor: '#121212', // Pure black button
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
    forgotPass: { marginBottom: 24 },
    signupContainer: { flexDirection: 'row', gap: 6 },
    footerText: { color: '#666', fontSize: 14 },
    footerLink: { color: '#121212', fontWeight: '600', fontSize: 14 },
});
