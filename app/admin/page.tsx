'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Users, Truck, MapPin, DollarSign, TrendingUp, TrendingDown,
    Clock, CheckCircle, XCircle, AlertTriangle, Activity, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const stats = useQuery(api.admin.getAnalytics) as any;
    const pendingDrivers = useQuery(api.admin.getPendingDriversEnriched) as any;
    const activeRides = useQuery(api.admin.getAllRidesEnriched, { status: "ongoing" }) as any;
    const sosAlerts = useQuery(api.sos.listActiveEnriched) as any;

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-slate-400">Platform overview and key metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {stats?.totalDrivers || 0}
                        </p>
                        <p className="text-sm text-slate-400">Total Drivers</p>
                        <p className="text-xs text-green-400 mt-1">
                            {stats?.verifiedDrivers || 0} verified
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                <Truck className="w-6 h-6 text-green-500" />
                            </div>
                            <Activity className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {activeRides?.length || 0}
                        </p>
                        <p className="text-sm text-slate-400">Active Rides</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {stats?.totalRides || 0} total
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-yellow-500" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {((stats?.totalRevenue || 0) / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-sm text-slate-400">Revenue (TZS)</p>
                        <p className="text-xs text-slate-500 mt-1">Platform commission</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-orange-500" />
                            </div>
                            {(pendingDrivers?.length || 0) > 0 && (
                                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
                                    {pendingDrivers?.length}
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {pendingDrivers?.length || 0}
                        </p>
                        <p className="text-sm text-slate-400">Pending Approvals</p>
                        <Link href="/admin/approvals" className="text-xs text-orange-400 hover:underline mt-1 block">
                            Review now →
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* SOS Alerts Banner */}
            {sosAlerts && sosAlerts.length > 0 && (
                <Card className="bg-red-500/10 border-red-500/30 mb-8">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center animate-pulse">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-red-400">
                                        {sosAlerts.length} Active SOS Alert{sosAlerts.length > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-sm text-red-400/70">
                                        Immediate attention required
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/admin/god-eye"
                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors"
                            >
                                View Alerts
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Pending Approvals */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center justify-between">
                            <span>Pending Approvals</span>
                            <Link href="/admin/approvals" className="text-sm text-red-400 font-normal hover:underline">
                                View All
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingDrivers && pendingDrivers.length > 0 ? (
                            <div className="space-y-3">
                                {pendingDrivers.slice(0, 3).map((driver: any) => (
                                    <div key={driver._id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">{driver.user_name}</p>
                                            <p className="text-sm text-slate-400">{driver.vehicle_type} • {driver.vehicle_plate}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                                            Pending
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
                                <p className="text-slate-400">No pending approvals</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Active Rides */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center justify-between">
                            <span>Active Rides</span>
                            <Link href="/admin/god-eye" className="text-sm text-red-400 font-normal hover:underline">
                                Live Map
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeRides && activeRides.length > 0 ? (
                            <div className="space-y-3">
                                {activeRides.slice(0, 3).map((ride: any) => (
                                    <div key={ride._id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">
                                                TZS {(ride.fare_estimate || 0).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-slate-400 truncate max-w-[200px]">
                                                {ride.pickup_location?.address || 'Unknown'}
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                            {ride.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MapPin className="w-12 h-12 text-slate-500/50 mx-auto mb-3" />
                                <p className="text-slate-400">No active rides</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { href: '/admin/approvals', label: 'Review Drivers', icon: Users, color: 'bg-blue-500' },
                    { href: '/admin/god-eye', label: 'Live Monitoring', icon: Eye, color: 'bg-green-500' },
                    { href: '/admin/pricing', label: 'Pricing Control', icon: DollarSign, color: 'bg-yellow-500' },
                    { href: '/admin/finance', label: 'Finance Report', icon: TrendingUp, color: 'bg-purple-500' },
                ].map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-red-500/50 transition-colors group"
                    >
                        <div className={`w-10 h-10 ${link.color}/10 rounded-lg flex items-center justify-center mb-3`}>
                            <link.icon className={`w-5 h-5 ${link.color.replace('bg-', 'text-')}`} />
                        </div>
                        <p className="text-white font-medium group-hover:text-red-400 transition-colors">
                            {link.label}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
