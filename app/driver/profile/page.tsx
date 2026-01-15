'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    User, Phone, Mail, MapPin, Edit, Camera, Star, Award,
    Truck, Shield, FileText, ArrowLeft, Check, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DriverProfilePage() {
    const { user } = useUser();
    const myData = useQuery(api.users.getMyself) as any;
    const driverProfile = useQuery(api.drivers.getDriverProfile) as any;

    const stats = {
        totalTrips: driverProfile?.total_trips || 0,
        rating: driverProfile?.rating || 5.0,
        earnings: driverProfile?.total_earnings || 0,
        memberSince: myData?.created_at ? new Date(myData.created_at).getFullYear() : 2024,
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/driver" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Driver Profile</h1>
            </div>

            {/* Profile Card */}
            <Card className="bg-slate-800 border-slate-700 mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                                {user?.imageUrl ? (
                                    <img src={user.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-green-500" />
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                <Camera className="w-4 h-4 text-white" />
                            </button>
                            {driverProfile?.verified && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white">
                                {user?.fullName || driverProfile?.name || 'Driver'}
                            </h2>
                            <p className="text-slate-400 text-sm">{driverProfile?.phone || myData?.phone}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-bold text-white">{stats.rating.toFixed(1)}</span>
                                <span className="text-xs text-slate-500">• {stats.totalTrips} trips</span>
                            </div>
                        </div>

                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 rounded-full">
                            <Edit className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <Truck className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{stats.totalTrips}</p>
                        <p className="text-xs text-slate-400">Total Trips</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{stats.rating.toFixed(1)}</p>
                        <p className="text-xs text-slate-400">Rating</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">
                            {(stats.earnings / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-slate-400">Total Earned</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{stats.memberSince}</p>
                        <p className="text-xs text-slate-400">Member Since</p>
                    </CardContent>
                </Card>
            </div>

            {/* Vehicle Info */}
            <Card className="bg-slate-800 border-slate-700 mb-6">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Truck className="w-5 h-5 text-green-500" />
                        Vehicle Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-400">Vehicle Type</span>
                        <span className="font-medium text-white">{driverProfile?.vehicle_type || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-400">Plate Number</span>
                        <span className="font-medium text-white">{driverProfile?.vehicle_plate || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-400">Status</span>
                        <span className={`font-medium ${driverProfile?.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                            {driverProfile?.verified ? 'Verified' : 'Pending Verification'}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 space-y-2">
                    <Link href="/driver/documents" className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded-xl transition-colors">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="text-white font-medium">Documents</span>
                    </Link>
                    <Link href="/driver/settings" className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded-xl transition-colors">
                        <Shield className="w-5 h-5 text-purple-500" />
                        <span className="text-white font-medium">Settings</span>
                    </Link>
                    <Link href="/driver/earnings" className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded-xl transition-colors">
                        <Award className="w-5 h-5 text-green-500" />
                        <span className="text-white font-medium">Earnings History</span>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
