'use client';

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowRight, Loader2, Package, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RoleSelectionPage() {
    const { user } = useUser();
    const router = useRouter();
    const createProfile = useMutation(api.users.createProfile);
    const [loading, setLoading] = useState<'customer' | 'driver' | null>(null);

    const handleSelectRole = async (role: 'customer' | 'driver') => {
        if (loading) return;
        setLoading(role);

        try {
            await createProfile({
                role: role,
                name: user?.fullName || "User",
                phone: user?.primaryPhoneNumber?.phoneNumber || ""
            });

            if (role === 'customer') {
                router.push('/');
            } else {
                router.push('/(auth)/driver-signup');
            }
        } catch (error) {
            console.error("Profile creation failed:", error);
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-[#1A1A1A] mb-3">Who are you?</h1>
                    <p className="text-lg text-gray-500">Choose how you want to use BebaX</p>
                </div>

                {/* Role Cards */}
                <div className="space-y-5">
                    {/* Customer Option */}
                    <Card
                        className={`
                            relative overflow-hidden cursor-pointer transition-all duration-300 
                            bg-white border-2 border-gray-100 hover:border-[#FF5722]/30 hover:shadow-xl hover:shadow-orange-500/10
                            ${loading === 'customer' ? 'pointer-events-none opacity-70' : ''}
                        `}
                        onClick={() => handleSelectRole('customer')}
                    >
                        <CardContent className="p-8">
                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Send Cargo</h3>
                                    <p className="text-gray-500 leading-relaxed">
                                        I need to move items or relocate.
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#FF5722] transition-colors">
                                    {loading === 'customer' ? (
                                        <Loader2 className="w-5 h-5 text-[#FF5722] animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-5 h-5 text-[#FF5722]" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Driver Option */}
                    <Card
                        className={`
                            relative overflow-hidden cursor-pointer transition-all duration-300 
                            bg-[#1E293B] border-0 hover:bg-[#334155] hover:shadow-xl hover:shadow-slate-900/30
                            ${loading === 'driver' ? 'pointer-events-none opacity-70' : ''}
                        `}
                        onClick={() => handleSelectRole('driver')}
                    >
                        <CardContent className="p-8">
                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Truck className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2">Drive & Earn</h3>
                                    <p className="text-slate-400 leading-relaxed">
                                        I have a vehicle and want to find jobs.
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
                                    {loading === 'driver' ? (
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
