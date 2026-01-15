import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
    Platform, ScrollView, ActivityIndicator, Image, TextInput
} from 'react-native';
import { useSignIn, useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

// Warm up browser for OAuth
WebBrowser.maybeCompleteAuthSession();

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED AUTH SCREEN: Phone-First + Social OAuth
// ═══════════════════════════════════════════════════════════════════════════════

export default function SignIn() {
    const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
    const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
    const { startOAuthFlow: startGoogleAuth } = useOAuth({ strategy: 'oauth_google' });
    const { startOAuthFlow: startAppleAuth } = useOAuth({ strategy: 'oauth_apple' });
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // ─── STATE ───────────────────────────────────────────────────────────────
    const [countryCode, setCountryCode] = useState('255');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [error, setError] = useState('');
    const [isSignUpMode, setIsSignUpMode] = useState(false);

    // ─── PHONE NUMBER PARSER ─────────────────────────────────────────────────
    const getFullPhoneNumber = useCallback(() => {
        const cleanPhone = phone.replace(/\D/g, '');
        const cleanCode = countryCode.replace(/\D/g, '');

        if (cleanPhone.startsWith(cleanCode)) {
            return `+${cleanPhone}`;
        }
        if (cleanPhone.startsWith('0')) {
            return `+${cleanCode}${cleanPhone.slice(1)}`;
        }
        return `+${cleanCode}${cleanPhone}`;
    }, [phone, countryCode]);

    // ─── PHONE OTP FLOW ──────────────────────────────────────────────────────
    const handleSendCode = async () => {
        if (!signInLoaded || !signUpLoaded) return;

        const fullPhone = getFullPhoneNumber();
        if (fullPhone.length < 12) {
            setError('Enter a valid phone number');
            return;
        }

        setError('');
        setLoading(true);
        console.log('📱 [AUTH] Starting phone flow for:', fullPhone);

        try {
            // STEP 1: Try Sign In first
            console.log('🔐 [AUTH] Attempting signIn.create...');
            const { supportedFirstFactors } = await signIn!.create({
                identifier: fullPhone,
            });

            const phoneCodeFactor = supportedFirstFactors?.find(
                (factor: any) => factor.strategy === 'phone_code'
            );

            if (phoneCodeFactor) {
                await signIn!.prepareFirstFactor({
                    strategy: 'phone_code',
                    phoneNumberId: (phoneCodeFactor as any).phoneNumberId,
                });
                console.log('✅ [AUTH] Existing user. OTP sent.');
                setIsSignUpMode(false);
                setPendingVerification(true);
            }
        } catch (err: any) {
            // STEP 2: If user doesn't exist, switch to Sign Up
            if (err.errors?.[0]?.code === 'form_identifier_not_found') {
                console.log('🆕 [AUTH] New user detected. Switching to signUp...');
                try {
                    await signUp!.create({ phoneNumber: fullPhone });
                    await signUp!.preparePhoneNumberVerification({ strategy: 'phone_code' });
                    console.log('✅ [AUTH] New user. OTP sent for verification.');
                    setIsSignUpMode(true);
                    setPendingVerification(true);
                } catch (signUpErr: any) {
                    console.error('❌ [AUTH] SignUp failed:', signUpErr);
                    setError(signUpErr.errors?.[0]?.message || 'Failed to send code');
                }
            } else {
                console.error('❌ [AUTH] SignIn failed:', err);
                setError(err.errors?.[0]?.message || 'Failed to send code');
            }
        } finally {
            setLoading(false);
        }
    };

    // ─── OTP VERIFICATION ────────────────────────────────────────────────────
    const handleVerifyCode = async () => {
        if (!signInLoaded || !signUpLoaded) return;
        if (!code || code.length < 6) {
            setError('Enter the 6-digit code');
            return;
        }

        setError('');
        setLoading(true);
        console.log('🔑 [AUTH] Verifying OTP... isSignUpMode:', isSignUpMode);

        try {
            if (isSignUpMode) {
                const result = await signUp!.attemptPhoneNumberVerification({ code });
                console.log('🔐 [SIGN-UP] Result:', result.status);

                if (result.status === 'complete') {
                    await setSignUpActive!({ session: result.createdSessionId });
                    console.log('✅ [SIGN-UP] Session active. Redirecting...');
                    router.replace('/');
                } else {
                    console.log('⚠️ [SIGN-UP] Status:', result.status, 'Missing:', signUp?.missingFields);
                    setError('Could not complete signup. Try again.');
                }
            } else {
                const result = await signIn!.attemptFirstFactor({
                    strategy: 'phone_code',
                    code,
                });
                console.log('🔐 [SIGN-IN] Result:', result.status);

                if (result.status === 'complete') {
                    await setSignInActive!({ session: result.createdSessionId });
                    console.log('✅ [SIGN-IN] Session active. Redirecting...');
                    router.replace('/');
                } else {
                    setError('Could not complete sign in. Try again.');
                }
            }
        } catch (err: any) {
            console.error('❌ [AUTH] Verification failed:', err);
            setError(err.errors?.[0]?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    // ─── SOCIAL OAUTH FLOW ───────────────────────────────────────────────────
    const handleSocialAuth = async (provider: 'google' | 'apple') => {
        try {
            setSocialLoading(provider);
            console.log(`🌐 [AUTH] Starting ${provider} OAuth...`);

            const startFlow = provider === 'google' ? startGoogleAuth : startAppleAuth;
            const { createdSessionId, setActive } = await startFlow();

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                console.log(`✅ [AUTH] ${provider} session active. Redirecting...`);
                router.replace('/');
            }
        } catch (err: any) {
            console.error(`❌ [AUTH] ${provider} OAuth failed:`, err);
            setError(`${provider} sign in failed. Try again.`);
        } finally {
            setSocialLoading(null);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ─── LOGO ─────────────────────────────────────────────── */}
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/bebax_logo_black.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* ─── TITLE ────────────────────────────────────────────── */}
                    <Text style={styles.title}>
                        {pendingVerification ? 'Verify your number' : 'Enter your mobile number'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {pendingVerification
                            ? `We sent a code to ${getFullPhoneNumber()}`
                            : "We'll send you a verification code"}
                    </Text>

                    {/* ─── FORM ─────────────────────────────────────────────── */}
                    <View style={styles.form}>
                        {!pendingVerification ? (
                            <>
                                {/* PHONE INPUT */}
                                <View style={styles.phoneContainer}>
                                    <View style={styles.countryPicker}>
                                        <Text style={styles.flag}>🇹🇿</Text>
                                        <Text style={styles.countryCodePrefix}>+</Text>
                                        <TextInput
                                            style={styles.countryCodeInput}
                                            value={countryCode}
                                            onChangeText={setCountryCode}
                                            keyboardType="number-pad"
                                            maxLength={4}
                                        />
                                    </View>
                                    <TextInput
                                        style={styles.phoneInput}
                                        value={phone}
                                        onChangeText={(t) => { setPhone(t); setError(''); }}
                                        keyboardType="phone-pad"
                                        placeholder="712 345 678"
                                        placeholderTextColor="#94A3B8"
                                        autoFocus
                                    />
                                </View>

                                {error ? <Text style={styles.error}>{error}</Text> : null}

                                {/* CONTINUE BUTTON */}
                                <TouchableOpacity
                                    style={[styles.primaryBtn, loading && styles.disabledBtn]}
                                    onPress={handleSendCode}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.primaryBtnText}>Continue</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* DIVIDER */}
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>or continue with</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {/* SOCIAL BUTTONS */}
                                <View style={styles.socialRow}>
                                    {/* Google */}
                                    <TouchableOpacity
                                        style={styles.socialBtn}
                                        onPress={() => handleSocialAuth('google')}
                                        disabled={socialLoading !== null}
                                    >
                                        {socialLoading === 'google' ? (
                                            <ActivityIndicator color="#0F172A" />
                                        ) : (
                                            <Image
                                                source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                                                style={styles.socialIcon}
                                            />
                                        )}
                                    </TouchableOpacity>

                                    {/* Apple */}
                                    <TouchableOpacity
                                        style={[styles.socialBtn, styles.appleBtn]}
                                        onPress={() => handleSocialAuth('apple')}
                                        disabled={socialLoading !== null}
                                    >
                                        {socialLoading === 'apple' ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Ionicons name="logo-apple" size={24} color="#FFF" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                {/* OTP INPUT */}
                                <TextInput
                                    style={styles.otpInput}
                                    value={code}
                                    onChangeText={(t) => { setCode(t); setError(''); }}
                                    keyboardType="number-pad"
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor="#94A3B8"
                                    maxLength={6}
                                    autoFocus
                                />

                                {error ? <Text style={styles.error}>{error}</Text> : null}

                                {/* VERIFY BUTTON */}
                                <TouchableOpacity
                                    style={[styles.primaryBtn, loading && styles.disabledBtn]}
                                    onPress={handleVerifyCode}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                                    )}
                                </TouchableOpacity>

                                {/* BACK BUTTON */}
                                <TouchableOpacity
                                    style={styles.backBtn}
                                    onPress={() => { setPendingVerification(false); setCode(''); setError(''); }}
                                >
                                    <Text style={styles.backBtnText}>← Change Number</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* ─── FOOTER ───────────────────────────────────────────── */}
                    {!pendingVerification && (
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                By continuing, you agree to our{' '}
                                <Text style={styles.footerLink}>Terms of Service</Text>
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 24,
        paddingBottom: 60,
        flexGrow: 1,
    },

    // Header
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
    },
    logo: {
        width: 200,
        height: 70,
    },

    // Title
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
    },

    // Form
    form: {
        gap: 16,
    },

    // Phone Input Container
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        backgroundColor: '#FAFAFA',
        overflow: 'hidden',
    },
    countryPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 18,
        backgroundColor: '#F1F5F9',
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
    },
    flag: {
        fontSize: 22,
        marginRight: 6,
    },
    countryCodePrefix: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    countryCodeInput: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        minWidth: 36,
        padding: 0,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 18,
        fontSize: 18,
        fontWeight: '500',
        color: '#0F172A',
        letterSpacing: 0.5,
    },

    // OTP Input
    otpInput: {
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
        letterSpacing: 8,
    },

    // Error
    error: {
        color: Colors.error,
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: -8,
    },

    // Primary Button
    primaryBtn: {
        backgroundColor: '#0F172A',
        height: 58,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    dividerText: {
        paddingHorizontal: 16,
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },

    // Social Buttons
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    appleBtn: {
        backgroundColor: '#0F172A',
        borderColor: '#0F172A',
    },
    socialIcon: {
        width: 24,
        height: 24,
    },

    // Back Button
    backBtn: {
        alignItems: 'center',
        marginTop: 16,
    },
    backBtnText: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },

    // Footer
    footer: {
        marginTop: 'auto',
        paddingTop: 32,
        alignItems: 'center',
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    footerLink: {
        color: Colors.primary,
        fontWeight: '600',
    },
});
