'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    User, Phone, Mail, MapPin, Edit, Camera, Star, Award,
    CreditCard, Shield, Bell, ArrowLeft, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

export default function ProfilePage() {
    const { user } = useUser();
    const myData = useQuery(api.users.getMyself) as any;
    const [isEditing, setIsEditing] = useState(false);

    const stats = {
        totalRides: myData?.total_rides || 0,
        rating: myData?.rating || 5.0,
        memberSince: myData?.created_at ? new Date(myData.created_at).getFullYear() : 2024,
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/customer" className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow">
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
            </div>

            {/* Profile Card */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                {user?.imageUrl ? (
                                    <img src={user.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-purple-500" />
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <Camera className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {user?.fullName || myData?.name || 'User'}
                            </h2>
                            <p className="text-slate-500 text-sm">{myData?.phone || user?.primaryPhoneNumber?.phoneNumber}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.rating.toFixed(1)}</span>
                                <span className="text-xs text-slate-500">• {stats.totalRides} rides</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => setIsEditing(!isEditing)}
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-white dark:bg-slate-800 border-0 shadow">
                    <CardContent className="p-4 text-center">
                        <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalRides}</p>
                        <p className="text-xs text-slate-500">Total Rides</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-800 border-0 shadow">
                    <CardContent className="p-4 text-center">
                        <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.rating.toFixed(1)}</p>
                        <p className="text-xs text-slate-500">Rating</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-800 border-0 shadow">
                    <CardContent className="p-4 text-center">
                        <Shield className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.memberSince}</p>
                        <p className="text-xs text-slate-500">Member Since</p>
                    </CardContent>
                </Card>
            </div>

            {/* Details */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl mb-6">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <Phone className="w-5 h-5 text-purple-500" />
                        <div>
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {myData?.phone || user?.primaryPhoneNumber?.phoneNumber || 'Not set'}
                            </p>
                        </div>
                        {myData?.phone && <Check className="w-4 h-4 text-green-500 ml-auto" />}
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <Mail className="w-5 h-5 text-purple-500" />
                        <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {user?.primaryEmailAddress?.emailAddress || 'Not set'}
                            </p>
                        </div>
                        {user?.primaryEmailAddress && <Check className="w-4 h-4 text-green-500 ml-auto" />}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
                <CardContent className="p-4 space-y-2">
                    <Link href="/customer/wallet" className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        <CreditCard className="w-5 h-5 text-green-500" />
                        <span className="text-slate-900 dark:text-white font-medium">Payment Methods</span>
                    </Link>
                    <Link href="/customer/settings" className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        <Bell className="w-5 h-5 text-blue-500" />
                        <span className="text-slate-900 dark:text-white font-medium">Notification Settings</span>
                    </Link>
                    <Link href="/customer/support" className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        <Shield className="w-5 h-5 text-purple-500" />
                        <span className="text-slate-900 dark:text-white font-medium">Privacy & Security</span>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
