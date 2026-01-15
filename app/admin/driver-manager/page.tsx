'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Users, Search, Filter, CheckCircle, XCircle, Clock,
    Star, Truck, Phone, ArrowLeft, TrendingUp, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState } from 'react';

export default function DriverManagerPage() {
    const allDrivers = useQuery(api.admin.getAllDrivers) as any;
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'online'>('all');

    const filteredDrivers = allDrivers?.filter((driver: any) => {
        const matchesSearch = driver.user_name?.toLowerCase().includes(search.toLowerCase()) ||
            driver.vehicle_plate?.toLowerCase().includes(search.toLowerCase());

        if (filter === 'all') return matchesSearch;
        if (filter === 'verified') return matchesSearch && driver.verified;
        if (filter === 'pending') return matchesSearch && !driver.verified;
        if (filter === 'online') return matchesSearch && driver.is_online;
        return matchesSearch;
    }) || [];

    const stats = {
        total: allDrivers?.length || 0,
        verified: allDrivers?.filter((d: any) => d.verified).length || 0,
        online: allDrivers?.filter((d: any) => d.is_online).length || 0,
        pending: allDrivers?.filter((d: any) => !d.verified).length || 0,
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Driver Manager</h1>
                    <p className="text-slate-400">Manage all drivers on the platform</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <p className="text-3xl font-bold text-white">{stats.total}</p>
                        <p className="text-sm text-slate-400">Total Drivers</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <p className="text-3xl font-bold text-green-400">{stats.verified}</p>
                        <p className="text-sm text-slate-400">Verified</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <p className="text-3xl font-bold text-blue-400">{stats.online}</p>
                        <p className="text-sm text-slate-400">Online Now</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <p className="text-3xl font-bold text-orange-400">{stats.pending}</p>
                        <p className="text-sm text-slate-400">Pending</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                        placeholder="Search by name or plate..."
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'verified', 'pending', 'online'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === f
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Drivers List */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Driver</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Vehicle</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Trips</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Rating</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrivers.map((driver: any) => (
                                    <tr key={driver._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{driver.user_name}</p>
                                                    <p className="text-sm text-slate-500">{driver.user_phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-slate-500" />
                                                <div>
                                                    <p className="text-white capitalize">{driver.vehicle_type}</p>
                                                    <p className="text-sm text-slate-500">{driver.vehicle_plate}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-green-500" />
                                                <span className="text-white font-bold">{driver.total_trips || 0}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-white font-medium">
                                                    {driver.rating?.toFixed(1) || '5.0'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {driver.is_online && (
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                                        Online
                                                    </span>
                                                )}
                                                {driver.verified ? (
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredDrivers.length === 0 && (
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No drivers found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
