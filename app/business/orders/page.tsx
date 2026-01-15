'use client';

import { useState } from 'react';
import {
    ArrowLeft, Package, Search, Filter, Clock, CheckCircle,
    Truck, XCircle, Eye, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// Mock orders data
const mockOrders = [
    { id: 'ORD-001', destination: 'Kinondoni', items: 3, fare: 25000, status: 'delivered', driver: 'John D.', date: '2024-01-14' },
    { id: 'ORD-002', destination: 'Kariakoo', items: 5, fare: 35000, status: 'in_transit', driver: 'Peter K.', date: '2024-01-14' },
    { id: 'ORD-003', destination: 'Mikocheni', items: 2, fare: 15000, status: 'pending', driver: null, date: '2024-01-14' },
    { id: 'ORD-004', destination: 'Magomeni', items: 1, fare: 12000, status: 'cancelled', driver: null, date: '2024-01-13' },
    { id: 'ORD-005', destination: 'Msasani', items: 4, fare: 45000, status: 'delivered', driver: 'Mary A.', date: '2024-01-13' },
];

export default function OrdersPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_transit' | 'delivered' | 'cancelled'>('all');

    const filteredOrders = mockOrders.filter((order) => {
        const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) ||
            order.destination.toLowerCase().includes(search.toLowerCase());
        if (filter === 'all') return matchesSearch;
        return matchesSearch && order.status === filter;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'delivered':
                return { color: 'bg-green-500/20 text-green-400', icon: CheckCircle };
            case 'in_transit':
                return { color: 'bg-blue-500/20 text-blue-400', icon: Truck };
            case 'pending':
                return { color: 'bg-orange-500/20 text-orange-400', icon: Clock };
            case 'cancelled':
                return { color: 'bg-red-500/20 text-red-400', icon: XCircle };
            default:
                return { color: 'bg-slate-500/20 text-slate-400', icon: Package };
        }
    };

    const stats = {
        total: mockOrders.length,
        pending: mockOrders.filter(o => o.status === 'pending').length,
        inTransit: mockOrders.filter(o => o.status === 'in_transit').length,
        delivered: mockOrders.filter(o => o.status === 'delivered').length,
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/business" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Orders</h1>
                    <p className="text-slate-400">Track and manage all your orders</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                        <p className="text-xs text-slate-400">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-orange-400">{stats.pending}</p>
                        <p className="text-xs text-slate-400">Pending</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{stats.inTransit}</p>
                        <p className="text-xs text-slate-400">In Transit</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
                        <p className="text-xs text-slate-400">Delivered</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                        placeholder="Search by order ID or destination..."
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'pending', 'in_transit', 'delivered'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === f
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {f === 'in_transit' ? 'In Transit' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Order ID</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Destination</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Items</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Fare</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Driver</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => {
                                    const statusConfig = getStatusConfig(order.status);
                                    return (
                                        <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4">
                                                <p className="text-white font-mono font-medium">{order.id}</p>
                                                <p className="text-xs text-slate-500">{order.date}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-500" />
                                                    <span className="text-white">{order.destination}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-white">{order.items}</td>
                                            <td className="p-4 text-white font-medium">
                                                TZS {order.fare.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-slate-400">
                                                {order.driver || '—'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${statusConfig.color}`}>
                                                    <statusConfig.icon className="w-3 h-3" />
                                                    {order.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredOrders.length === 0 && (
                            <div className="p-12 text-center">
                                <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No orders found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
