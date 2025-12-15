import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, Image } from 'react-native';
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignIn() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });

    const handleLogin = async () => {
        if (!isLoaded) return;
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        try {
            const completeSignIn = await signIn.create({ identifier: email, password });
            if (completeSignIn.status === 'complete') {
                await setActive({ session: completeSignIn.createdSessionId });
                router.replace('/(customer)/dashboard');
            } else {
                Alert.alert('Error', 'Login incomplete. Please try again.');
            }
        } catch (err: any) {
            Alert.alert('Login Failed', err.errors ? err.errors[0].message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
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
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue managing your logistics.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
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
                            placeholder="Enter your password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <TouchableOpacity style={styles.forgotPass}>
                            <Text style={styles.forgotPassText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.disabledBtn]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.loginButtonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                        <FontAwesome5 name="google" size={18} color={Colors.text} />
                        <Text style={styles.socialButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account?</Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                            <Text style={styles.linkText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    forgotPass: { alignSelf: 'flex-end', marginTop: 4 },
    forgotPassText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
    loginButton: {
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
    disabledBtn: { opacity: 0.7 },
    loginButtonText: { color: 'white', fontWeight: '800', fontSize: 16 },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    line: { flex: 1, height: 1, backgroundColor: '#E8E9EB' },
    orText: { marginHorizontal: 16, color: '#999', fontSize: 12, fontWeight: '600' },
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
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
    footerText: { color: Colors.textDim, fontSize: 14 },
    linkText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});
