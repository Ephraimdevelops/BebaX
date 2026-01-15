'use client';

import React, { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { VEHICLE_FLEET, VehicleId } from '@/lib/vehicleRegistry';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Lock, FileText,
    CheckCircle, Loader2, Truck, Bike, Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

// Vehicle icon mapping for web
const vehicleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'boda': Bike,
    'toyo': Car,
    'kirikuu': Truck,
    'pickup': Truck,
    'canter': Truck,
    'fuso': Truck,
};

export default function DriverSignupPage() {
    const { isLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const router = useRouter();
    // @ts-expect-error - Convex type instantiation is excessively deep
    const syncDriverProfile = useMutation(api.users.createOrUpdateProfile);
    const registerDriver = useMutation(api.drivers.register);

    const [driverData, setDriverData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        password: '',
        vehicleType: '' as VehicleId | '',
        licenseNumber: '',
    });

    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const updateField = (key: string, value: string) => {
        setDriverData(prev => ({ ...prev, [key]: value }));
        setError('');
    };

    const handleRegister = async () => {
        if (!isLoaded) return;
        const { name, email, phone, city, password, vehicleType, licenseNumber } = driverData;

        if (!name || !email || !password || !vehicleType || !licenseNumber || !city) {
            setError('Please complete all fields to proceed.');
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
                    role: 'driver',
                    phone: phone,
                    city: city,
                    vehicleType: vehicleType,
                    licenseNumber: licenseNumber
                }
            });

            if (completeSignUp.status === 'complete') {
                await setSignUpActive({ session: completeSignUp.createdSessionId });
                await new Promise(resolve => setTimeout(resolve, 1500));

                try {
                    await syncDriverProfile({
                        name: name,
                        email: email,
                        phone: phone,
                        role: 'driver',
                    });
                } catch (e) {
                    console.error("Profile sync failed:", e);
                }

                try {
                    await registerDriver({
                        license_number: licenseNumber,
                        nida_number: "pending",
                        vehicle_type: vehicleType,
                        vehicle_plate: "pending",
                        capacity_kg: 500,
                        payout_method: "mpesa" as const,
                        payout_number: phone,
                        location: { lat: -6.7924, lng: 39.2083 },
                    });
                } catch (e: any) {
                    console.log("Driver registration:", e.message);
                }

                await new Promise(resolve => setTimeout(resolve, 500));
                router.push('/driver');
                return;
            }

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            setError(err.errors ? err.errors[0].message : 'Application failed');
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
                await new Promise(resolve => setTimeout(resolve, 1500));

                try {
                    await syncDriverProfile({
                        name: driverData.name,
                        email: driverData.email,
                        phone: driverData.phone,
                        role: 'driver',
                    });
                } catch (e) {
                    console.error("Profile sync failed:", e);
                }

                try {
                    await registerDriver({
                        license_number: driverData.licenseNumber,
                        nida_number: "pending",
                        vehicle_type: driverData.vehicleType as VehicleId,
                        vehicle_plate: "pending",
                        capacity_kg: 500,
                        payout_method: "mpesa" as const,
                        payout_number: driverData.phone,
                        location: { lat: -6.7924, lng: 39.2083 },
                    });
                } catch (e: any) {
                    console.log("Driver registration:", e.message);
                }

                await new Promise(resolve => setTimeout(resolve, 500));
                router.push('/driver');
            } else {
                setError("Verification incomplete");
            }
        } catch (err: any) {
            setError(err.errors ? err.errors[0].message : "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-10">
            <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        <div className="w-20 h-20 bg-gradient-to-br from-[#FF5722] to-[#E64A19] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                            <Truck className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-[#121212]">Driver Partner</CardTitle>
                        <CardDescription className="text-gray-500 text-lg">
                            Join the fleet. Earn on your terms.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8 pt-2">
                        {pendingVerification ? (
                            <div className="space-y-6">
                                {/* Success Banner */}
                                <div className="flex items-center gap-3 bg-green-50 border border-green-100 p-4 rounded-xl">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <span className="text-green-800 font-semibold">Application Received!</span>
                                </div>
                                <p className="text-gray-500">
                                    Please enter the verification code sent to {driverData.email} to complete your registration.
                                </p>

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
                                    onClick={handleVerify}
                                    disabled={loading}
                                    className="w-full h-14 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-xl font-bold text-base"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Start Driving'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Personal Details */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Personal Details</h3>
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-gray-700">
                                                <User className="w-4 h-4" /> Full Name
                                            </Label>
                                            <Input
                                                value={driverData.name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)}
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-gray-700">
                                                    <Mail className="w-4 h-4" /> Email
                                                </Label>
                                                <Input
                                                    type="email"
                                                    value={driverData.email}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('email', e.target.value)}
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2 text-gray-700">
                                                    <Phone className="w-4 h-4" /> Phone
                                                </Label>
                                                <Input
                                                    type="tel"
                                                    value={driverData.phone}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('phone', e.target.value)}
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-gray-700">
                                                <MapPin className="w-4 h-4" /> City / Region
                                            </Label>
                                            <Input
                                                value={driverData.city}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('city', e.target.value)}
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle & Security */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Vehicle & Security</h3>

                                    {/* Vehicle Type Selection */}
                                    <Label className="text-gray-700 mb-3 block">Select Vehicle Type</Label>
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {VEHICLE_FLEET.map((vehicle) => {
                                            const IconComponent = vehicleIcons[vehicle.id] || Truck;
                                            const isSelected = driverData.vehicleType === vehicle.id;
                                            return (
                                                <button
                                                    key={vehicle.id}
                                                    type="button"
                                                    onClick={() => updateField('vehicleType', vehicle.id)}
                                                    className={`
                                                        p-4 rounded-xl border-2 transition-all text-center
                                                        ${isSelected
                                                            ? 'border-[#FF5722] bg-orange-50 text-[#FF5722]'
                                                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'}
                                                    `}
                                                >
                                                    <IconComponent className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                                                    <span className={`text-sm font-semibold ${isSelected ? 'text-[#FF5722]' : 'text-gray-700'}`}>
                                                        {vehicle.label}
                                                    </span>
                                                    <p className="text-xs text-gray-400 mt-1">{vehicle.capacity}</p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {driverData.vehicleType && (
                                        <p className="text-sm text-[#FF5722] italic mb-4">
                                            {driverData.vehicleType === 'fuso' || driverData.vehicleType === 'canter'
                                                ? "Requirements: Commercial License, Insurance, Inspection (Manual Verification)"
                                                : "Requirements: Valid License & Registration (Auto Verification)"}
                                        </p>
                                    )}

                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-gray-700">
                                                <FileText className="w-4 h-4" /> License Number
                                            </Label>
                                            <Input
                                                value={driverData.licenseNumber}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('licenseNumber', e.target.value.toUpperCase())}
                                                className="h-12 rounded-xl uppercase"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2 text-gray-700">
                                                <Lock className="w-4 h-4" /> Create Password
                                            </Label>
                                            <Input
                                                type="password"
                                                value={driverData.password}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('password', e.target.value)}
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

                                <Button
                                    onClick={handleRegister}
                                    disabled={loading}
                                    className="w-full h-14 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-xl font-bold text-base shadow-lg shadow-orange-500/20"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
                                </Button>

                                <p className="text-center text-gray-400 text-xs">
                                    By continuing, you agree to our Driver Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
