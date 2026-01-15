'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import {
    Package, Truck, Clock, TrendingUp, DollarSign,
    AlertCircle, ArrowRight, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BusinessDashboardPage() {
    const { user } = useUser();

    // Would need business-specific queries
    // For now using general data
    const myData = useQuery(api.users.getMyself) as any;

    // Mock business data
    const stats = {
        activeOrders: 12,
        pendingDispatch: 5,
        todayDeliveries: 8,
        monthlySpend: 1250000,
    };

    const recentOrders = [
        { id: '1', destination: 'Kinondoni', items: 3, status: 'in_transit', driver: 'John D.' },
        { id: '2', destination: 'Kariakoo', items: 5, status: 'pending', driver: null },
        { id: '3', destination: 'Mikocheni', items: 1, status: 'delivered', driver: 'Peter K.' },
    ];

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        Welcome back, {user?.firstName || 'Business'}! 👋
                    </h1>
                    <p className="text-slate-400">Here's what's happening with your deliveries</p>
                </div>
                <Link href="/business/dispatch">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        New Order
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-500" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.activeOrders}</p>
                        <p className="text-sm text-slate-400">Active Orders</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-orange-500" />
                            </div>
                            {stats.pendingDispatch > 0 && (
                                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
                                    Action
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.pendingDispatch}</p>
                        <p className="text-sm text-slate-400">Pending Dispatch</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                <Truck className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.todayDeliveries}</p>
                        <p className="text-sm text-slate-400">Today's Deliveries</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-purple-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {(stats.monthlySpend / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-sm text-slate-400">Monthly Spend (TZS)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Orders */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center justify-between">
                            <span>Recent Orders</span>
                            <Link href="/business/orders" className="text-sm text-blue-400 font-normal hover:underline">
                                View All
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                    <div>
                                        <p className="text-white font-medium">{order.destination}</p>
                                        <p className="text-sm text-slate-400">{order.items} items</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                                                order.status === 'in_transit' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-orange-500/20 text-orange-400'
                                            }`}>
                                            {order.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {order.driver && (
                                            <p className="text-xs text-slate-500 mt-1">{order.driver}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/business/dispatch" className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-xl hover:bg-blue-600/20 transition-colors group">
                                <Truck className="w-8 h-8 text-blue-500 mb-2" />
                                <p className="text-white font-medium">Dispatch Order</p>
                                <p className="text-xs text-slate-500">Create new delivery</p>
                            </Link>
                            <Link href="/business/orders" className="p-4 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors group">
                                <Package className="w-8 h-8 text-slate-400 mb-2" />
                                <p className="text-white font-medium">Track Orders</p>
                                <p className="text-xs text-slate-500">View all orders</p>
                            </Link>
                            <Link href="/business/inventory" className="p-4 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors group">
                                <Package className="w-8 h-8 text-slate-400 mb-2" />
                                <p className="text-white font-medium">Inventory</p>
                                <p className="text-xs text-slate-500">Manage stock</p>
                            </Link>
                            <Link href="/business/menu" className="p-4 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors group">
                                <DollarSign className="w-8 h-8 text-slate-400 mb-2" />
                                <p className="text-white font-medium">Catalog</p>
                                <p className="text-xs text-slate-500">Products & prices</p>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Alert */}
            {stats.pendingDispatch > 0 && (
                <Card className="bg-orange-500/10 border-orange-500/30">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">
                                        {stats.pendingDispatch} orders waiting for dispatch
                                    </p>
                                    <p className="text-sm text-orange-400">
                                        Assign drivers to these orders
                                    </p>
                                </div>
                            </div>
                            <Link href="/business/dispatch">
                                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                                    Dispatch Now
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
