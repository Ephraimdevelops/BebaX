'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    DollarSign, TrendingUp, TrendingDown, Wallet, ArrowLeft,
    Calendar, Download, PieChart, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FinancePage() {
    const stats = useQuery(api.admin.getAnalytics) as any;

    // Mock financial data since we don't have a dedicated finance API
    const financeData = {
        totalRevenue: stats?.totalRevenue || 0,
        todayRevenue: Math.round((stats?.totalRevenue || 0) * 0.05),
        weekRevenue: Math.round((stats?.totalRevenue || 0) * 0.2),
        monthRevenue: Math.round((stats?.totalRevenue || 0) * 0.6),
        commissionEarned: Math.round((stats?.totalRevenue || 0) * 0.15),
        payoutsProcessed: Math.round((stats?.totalRevenue || 0) * 0.85 * 0.7),
        pendingPayouts: Math.round((stats?.totalRevenue || 0) * 0.85 * 0.1),
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
        return amount.toLocaleString();
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
                        <p className="text-slate-400">Revenue and payout overview</p>
                    </div>
                </div>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <DollarSign className="w-8 h-8 text-white/80" />
                            <TrendingUp className="w-5 h-5 text-white/60" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            TZS {formatCurrency(financeData.totalRevenue)}
                        </p>
                        <p className="text-sm text-white/70">Total Revenue</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <Calendar className="w-8 h-8 text-blue-500" />
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            TZS {formatCurrency(financeData.todayRevenue)}
                        </p>
                        <p className="text-sm text-slate-400">Today</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <BarChart3 className="w-8 h-8 text-purple-500" />
                            <span className="text-xs text-green-400">+12%</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            TZS {formatCurrency(financeData.weekRevenue)}
                        </p>
                        <p className="text-sm text-slate-400">This Week</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <PieChart className="w-8 h-8 text-yellow-500" />
                            <span className="text-xs text-green-400">+8%</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            TZS {formatCurrency(financeData.monthRevenue)}
                        </p>
                        <p className="text-sm text-slate-400">This Month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Commission & Payouts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Platform Commission</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                                <div>
                                    <p className="text-slate-400 text-sm">Total Commission (15%)</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        TZS {formatCurrency(financeData.commissionEarned)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-green-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                                    <p className="text-xl font-bold text-white">{stats?.totalRides || 0}</p>
                                    <p className="text-xs text-slate-500">Total Rides</p>
                                </div>
                                <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                                    <p className="text-xl font-bold text-white">15%</p>
                                    <p className="text-xs text-slate-500">Commission Rate</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Driver Payouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                                <div>
                                    <p className="text-slate-400 text-sm">Total Processed</p>
                                    <p className="text-2xl font-bold text-blue-400">
                                        TZS {formatCurrency(financeData.payoutsProcessed)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-blue-500" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                                <div>
                                    <p className="text-orange-400 text-sm">Pending Payouts</p>
                                    <p className="text-xl font-bold text-orange-400">
                                        TZS {formatCurrency(financeData.pendingPayouts)}
                                    </p>
                                </div>
                                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                                    Process
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Breakdown */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">Revenue by Vehicle Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[
                            { type: 'Tricycle', percentage: 35, color: 'bg-green-500' },
                            { type: 'Van', percentage: 30, color: 'bg-blue-500' },
                            { type: 'Truck', percentage: 25, color: 'bg-purple-500' },
                            { type: 'Semi-trailer', percentage: 10, color: 'bg-yellow-500' },
                        ].map((item) => (
                            <div key={item.type} className="flex items-center gap-4">
                                <span className="text-slate-400 w-24">{item.type}</span>
                                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} rounded-full transition-all`}
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                                <span className="text-white font-medium w-12 text-right">{item.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
