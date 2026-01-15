'use client';

import React, { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function BusinessSignupPage() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();

    const [businessName, setBusinessName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');

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
                firstName: name,
                unsafeMetadata: {
                    role: 'customer',
                    pending_business_name: businessName,
                    is_business_setup: true
                }
            });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                router.push('/(auth)/business-setup');
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

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-10">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Back Button */}
                <Link
                    href="/(auth)/sign-in"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                </Link>

                <Card className="border-0 shadow-2xl shadow-black/5 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
                    <CardHeader className="text-center pb-4 pt-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-900/30">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-[#121212]">
                            {pendingVerification ? "Verify Email" : "Create Account"}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            {pendingVerification
                                ? `Enter code sent to ${email}`
                                : "Start by creating your user profile."}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8 pt-2">
                        {pendingVerification ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Verification Code</Label>
                                    <Input
                                        type="text"
                                        value={code}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setCode(e.target.value); setError(''); }}
                                        placeholder="123456"
                                        className="h-14 text-2xl font-bold text-center tracking-widest rounded-xl"
                                        maxLength={6}
                                    />
                                </div>

                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                                <Button
                                    onClick={handleVerifyEmail}
                                    disabled={loading}
                                    className="w-full h-14 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-bold"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-gray-700">
                                        <User className="w-4 h-4" /> Full Name
                                    </Label>
                                    <Input
                                        value={name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                        className="h-12 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-gray-700">
                                        <Building2 className="w-4 h-4" /> Business Name
                                    </Label>
                                    <Input
                                        value={businessName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusinessName(e.target.value)}
                                        placeholder="Your Company Ltd"
                                        className="h-12 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-gray-700">
                                        <Mail className="w-4 h-4" /> Work Email
                                    </Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        className="h-12 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-gray-700">
                                        <Lock className="w-4 h-4" /> Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                            className="h-12 rounded-xl pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                                <Button
                                    onClick={handleCreateAccount}
                                    disabled={loading}
                                    className="w-full h-14 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-bold mt-4"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                                </Button>

                                {/* Divider */}
                                <div className="flex items-center gap-4 my-4">
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-sm text-gray-400">or continue with</span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                </div>

                                {/* Google Button */}
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-gray-200"
                                    onClick={() => {/* Google OAuth placeholder */ }}
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </Button>

                                <p className="text-center text-gray-500 text-sm mt-6">
                                    Already have an account?{' '}
                                    <Link href="/(auth)/sign-in" className="text-[#FF5722] font-semibold hover:underline">
                                        Log in
                                    </Link>
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
