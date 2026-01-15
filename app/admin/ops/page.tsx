'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Activity, ArrowLeft, Users, Truck, MapPin, AlertTriangle,
    TrendingUp, Clock, RefreshCw, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Mock real-time data
const useLiveStats = () => {
    const [stats, setStats] = useState({
        activeRides: 24,
        onlineDrivers: 156,
        queuedRequests: 8,
        avgWaitTime: 3.2,
        completionRate: 94.5,
        cancelRate: 5.5,
        peakHour: false,
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                activeRides: Math.max(20, prev.activeRides + Math.floor(Math.random() * 5) - 2),
                onlineDrivers: Math.max(140, prev.onlineDrivers + Math.floor(Math.random() * 10) - 5),
                queuedRequests: Math.max(0, prev.queuedRequests + Math.floor(Math.random() * 3) - 1),
                avgWaitTime: Math.max(1, +(prev.avgWaitTime + (Math.random() - 0.5)).toFixed(1)),
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return stats;
};

export default function OpsPage() {
    const stats = useLiveStats();
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setLastUpdate(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Operations Center</h1>
                            <p className="text-slate-400 text-sm">Real-time platform health</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live • {lastUpdate.toLocaleTimeString()}
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Truck className="w-5 h-5 text-blue-400" />
                            <span className="text-xs text-green-400">LIVE</span>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.activeRides}</p>
                        <p className="text-xs text-slate-400">Active Rides</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-5 h-5 text-green-400" />
                            <span className="text-xs text-green-400">ONLINE</span>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.onlineDrivers}</p>
                        <p className="text-xs text-slate-400">Drivers Online</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <p className="text-3xl font-black text-white">{stats.avgWaitTime}m</p>
                        <p className="text-xs text-slate-400">Avg Wait Time</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <RefreshCw className="w-5 h-5 text-purple-400" />
                        </div>
                        <p className="text-3xl font-black text-white">{stats.queuedRequests}</p>
                        <p className="text-xs text-slate-400">Queued Requests</p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm text-slate-400">Completion Rate</span>
                                <span className="text-sm font-bold text-green-400">{stats.completionRate}%</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full">
                                <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${stats.completionRate}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm text-slate-400">Cancel Rate</span>
                                <span className="text-sm font-bold text-red-400">{stats.cancelRate}%</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full">
                                <div
                                    className="h-full bg-red-500 rounded-full"
                                    style={{ width: `${stats.cancelRate}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm text-slate-400">Driver Utilization</span>
                                <span className="text-sm font-bold text-blue-400">
                                    {Math.round((stats.activeRides / stats.onlineDrivers) * 100)}%
                                </span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${(stats.activeRides / stats.onlineDrivers) * 100}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            System Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { name: 'API Gateway', status: 'healthy', latency: '45ms' },
                            { name: 'Database', status: 'healthy', latency: '12ms' },
                            { name: 'Payment Service', status: 'healthy', latency: '120ms' },
                            { name: 'SMS Gateway', status: 'healthy', latency: '89ms' },
                            { name: 'Maps API', status: 'healthy', latency: '156ms' },
                        ].map((service) => (
                            <div key={service.name} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${service.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                                        }`} />
                                    <span className="text-white text-sm">{service.name}</span>
                                </div>
                                <span className="text-xs text-slate-400">{service.latency}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/admin/god-eye">
                    <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-blue-400" />
                            <span className="text-white font-medium">Live Map</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/kill-switch">
                    <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-white font-medium">Kill Switch</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/driver-manager">
                    <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Users className="w-5 h-5 text-green-400" />
                            <span className="text-white font-medium">Drivers</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/support">
                    <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Activity className="w-5 h-5 text-purple-400" />
                            <span className="text-white font-medium">Support</span>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
