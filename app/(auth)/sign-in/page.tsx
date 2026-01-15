'use client';

import React, { useState, useCallback } from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Truck, ArrowRight, Loader2, Phone, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED AUTH PAGE: Phone-First + Email OAuth (Web Version)
// Ported from mobile sign-in.tsx
// ═══════════════════════════════════════════════════════════════════════════════

export default function SignInPage() {
    const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
    const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
    const router = useRouter();

    // ─── STATE ───────────────────────────────────────────────────────────────
    const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
    const [countryCode, setCountryCode] = useState('255');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
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
    const handleSendPhoneCode = async () => {
        if (!signInLoaded || !signUpLoaded) return;

        const fullPhone = getFullPhoneNumber();
        if (fullPhone.length < 12) {
            setError('Enter a valid phone number');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // STEP 1: Try Sign In first
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
                setIsSignUpMode(false);
                setPendingVerification(true);
            }
        } catch (err: any) {
            // STEP 2: If user doesn't exist, switch to Sign Up
            if (err.errors?.[0]?.code === 'form_identifier_not_found') {
                try {
                    await signUp!.create({ phoneNumber: fullPhone });
                    await signUp!.preparePhoneNumberVerification({ strategy: 'phone_code' });
                    setIsSignUpMode(true);
                    setPendingVerification(true);
                } catch (signUpErr: any) {
                    setError(signUpErr.errors?.[0]?.message || 'Failed to send code');
                }
            } else {
                setError(err.errors?.[0]?.message || 'Failed to send code');
            }
        } finally {
            setLoading(false);
        }
    };

    // ─── EMAIL OTP FLOW ──────────────────────────────────────────────────────
    const handleSendEmailCode = async () => {
        if (!signInLoaded || !signUpLoaded) return;

        if (!email || !email.includes('@')) {
            setError('Enter a valid email address');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Try Sign In first
            const { supportedFirstFactors } = await signIn!.create({
                identifier: email,
            });

            const emailCodeFactor = supportedFirstFactors?.find(
                (factor: any) => factor.strategy === 'email_code'
            );

            if (emailCodeFactor) {
                await signIn!.prepareFirstFactor({
                    strategy: 'email_code',
                    emailAddressId: (emailCodeFactor as any).emailAddressId,
                });
                setIsSignUpMode(false);
                setPendingVerification(true);
            }
        } catch (err: any) {
            // If user doesn't exist, switch to Sign Up
            if (err.errors?.[0]?.code === 'form_identifier_not_found') {
                try {
                    await signUp!.create({ emailAddress: email });
                    await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
                    setIsSignUpMode(true);
                    setPendingVerification(true);
                } catch (signUpErr: any) {
                    setError(signUpErr.errors?.[0]?.message || 'Failed to send code');
                }
            } else {
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

        try {
            if (isSignUpMode) {
                let result;
                if (authMethod === 'phone') {
                    result = await signUp!.attemptPhoneNumberVerification({ code });
                } else {
                    result = await signUp!.attemptEmailAddressVerification({ code });
                }

                if (result.status === 'complete') {
                    await setSignUpActive!({ session: result.createdSessionId });
                    router.push('/');
                } else {
                    setError('Could not complete signup. Try again.');
                }
            } else {
                const result = await signIn!.attemptFirstFactor({
                    strategy: authMethod === 'phone' ? 'phone_code' : 'email_code',
                    code,
                });

                if (result.status === 'complete') {
                    await setSignInActive!({ session: result.createdSessionId });
                    router.push('/');
                } else {
                    setError('Could not complete sign in. Try again.');
                }
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleSendCode = authMethod === 'phone' ? handleSendPhoneCode : handleSendEmailCode;

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Left Column: Value Prop */}
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        <div className="w-2 h-2 bg-[#FF5722] rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-gray-600">Live in Dar es Salaam</span>
                    </div>

                    <div>
                        <h1 className="text-5xl lg:text-6xl font-bold text-[#121212] leading-tight mb-6 tracking-tight">
                            Move anything, <br />
                            <span className="text-[#FF5722]">anywhere.</span>
                        </h1>
                        <p className="text-xl text-gray-500 leading-relaxed max-w-md">
                            From documents to furniture, BebaX connects you with reliable drivers in minutes.
                        </p>
                    </div>

                    <div className="flex items-center space-x-8">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="w-11 h-11 rounded-full border-4 border-white bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-sm"
                                >
                                    <span className="text-gray-400 text-xs font-bold">{i}</span>
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="font-bold text-[#121212]">2,000+ Drivers</p>
                            <p className="text-sm text-gray-500">Ready to move</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Auth Card */}
                <div className="relative animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#FF5722]/10 to-purple-500/10 rounded-[2rem] blur-2xl" />
                    <Card className="relative border-0 shadow-2xl shadow-black/5 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
                        <CardHeader className="text-center pb-2 pt-8">
                            <div className="w-16 h-16 bg-[#FF5722] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                                <Truck className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-[#121212]">
                                {pendingVerification ? 'Verify your account' : 'Get Started'}
                            </CardTitle>
                            <CardDescription className="text-gray-500">
                                {pendingVerification
                                    ? `We sent a code to ${authMethod === 'phone' ? getFullPhoneNumber() : email}`
                                    : 'Sign in or create an account to continue'}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-8 pt-4">
                            {!pendingVerification ? (
                                <>
                                    {/* Auth Method Tabs */}
                                    <Tabs value={authMethod} onValueChange={(v: string) => setAuthMethod(v as 'phone' | 'email')} className="w-full mb-6">
                                        <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100/50 p-1 rounded-xl">
                                            <TabsTrigger
                                                value="phone"
                                                className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#121212] data-[state=active]:shadow-sm transition-all flex items-center gap-2"
                                            >
                                                <Phone className="w-4 h-4" />
                                                Phone
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="email"
                                                className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#121212] data-[state=active]:shadow-sm transition-all flex items-center gap-2"
                                            >
                                                <Mail className="w-4 h-4" />
                                                Email
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    {/* Phone Input */}
                                    {authMethod === 'phone' && (
                                        <div className="flex gap-2 mb-4">
                                            <div className="flex items-center gap-1 px-3 py-3 bg-gray-100 rounded-xl border border-gray-200 min-w-[90px]">
                                                <span className="text-lg">🇹🇿</span>
                                                <span className="text-sm font-semibold text-gray-700">+</span>
                                                <Input
                                                    value={countryCode}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCountryCode(e.target.value.replace(/\D/g, ''))}
                                                    className="w-10 p-0 border-0 bg-transparent text-sm font-semibold focus-visible:ring-0"
                                                    maxLength={4}
                                                />
                                            </div>
                                            <Input
                                                type="tel"
                                                value={phone}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPhone(e.target.value); setError(''); }}
                                                placeholder="712 345 678"
                                                className="flex-1 h-12 text-lg font-medium rounded-xl border-gray-200 focus:border-[#FF5722] focus:ring-[#FF5722]/20"
                                                autoFocus
                                            />
                                        </div>
                                    )}

                                    {/* Email Input */}
                                    {authMethod === 'email' && (
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); setError(''); }}
                                            placeholder="your@email.com"
                                            className="mb-4 h-12 text-lg rounded-xl border-gray-200 focus:border-[#FF5722] focus:ring-[#FF5722]/20"
                                            autoFocus
                                        />
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <p className="text-red-500 text-sm font-medium text-center mb-4">{error}</p>
                                    )}

                                    {/* Continue Button */}
                                    <Button
                                        onClick={handleSendCode}
                                        disabled={loading}
                                        className="w-full h-14 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-bold text-base shadow-lg shadow-slate-900/20 transition-all"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>

                                    {/* Links */}
                                    <div className="mt-6 space-y-3 text-center">
                                        <Link
                                            href="/(auth)/driver-signup"
                                            className="block text-[#FF5722] hover:text-[#E64A19] font-semibold text-sm transition-colors"
                                        >
                                            Earn with BebaX →
                                        </Link>
                                        <Link
                                            href="/(auth)/business-signup"
                                            className="block text-gray-500 hover:text-gray-700 text-sm transition-colors"
                                        >
                                            Register your business
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* OTP Input */}
                                    <Input
                                        type="text"
                                        value={code}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                                        placeholder="000000"
                                        className="mb-4 h-16 text-3xl font-bold text-center tracking-[0.5em] rounded-xl border-gray-200 focus:border-[#FF5722] focus:ring-[#FF5722]/20"
                                        maxLength={6}
                                        autoFocus
                                    />

                                    {/* Error */}
                                    {error && (
                                        <p className="text-red-500 text-sm font-medium text-center mb-4">{error}</p>
                                    )}

                                    {/* Verify Button */}
                                    <Button
                                        onClick={handleVerifyCode}
                                        disabled={loading}
                                        className="w-full h-14 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-xl font-bold text-base shadow-lg shadow-orange-500/20 transition-all"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Verify & Continue'
                                        )}
                                    </Button>

                                    {/* Back Button */}
                                    <button
                                        onClick={() => { setPendingVerification(false); setCode(''); setError(''); }}
                                        className="w-full mt-4 text-[#FF5722] hover:text-[#E64A19] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Change {authMethod === 'phone' ? 'Number' : 'Email'}
                                    </button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    {!pendingVerification && (
                        <p className="text-center text-gray-400 text-xs mt-6">
                            By continuing, you agree to our{' '}
                            <Link href="/terms" className="text-[#FF5722] hover:underline">
                                Terms of Service
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
