'use client';

import { useState } from 'react';
import {
    ArrowLeft, MapPin, Package, Truck, User, Phone,
    Search, Plus, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// Mock data for demonstration
const pendingOrders = [
    { id: '1', destination: 'Kinondoni', address: '123 Bagamoyo Road', items: 3, weight: '15kg', priority: 'urgent' },
    { id: '2', destination: 'Kariakoo', address: 'Market Street 45', items: 5, weight: '25kg', priority: 'normal' },
    { id: '3', destination: 'Mikocheni', address: 'Ali Hassan Mwinyi Rd', items: 2, weight: '8kg', priority: 'normal' },
];

const availableDrivers = [
    { id: '1', name: 'John Doe', vehicle: 'Van', plate: 'T 123 ABC', rating: 4.8, distance: '2km' },
    { id: '2', name: 'Peter Kenya', vehicle: 'Truck', plate: 'T 456 DEF', rating: 4.9, distance: '5km' },
    { id: '3', name: 'Mary Asha', vehicle: 'Tricycle', plate: 'T 789 GHI', rating: 4.7, distance: '1km' },
];

export default function DispatchPage() {
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

    const handleDispatch = () => {
        if (!selectedOrder || !selectedDriver) {
            alert('Please select both an order and a driver');
            return;
        }
        alert(`Order ${selectedOrder} dispatched to driver ${selectedDriver}!`);
        setSelectedOrder(null);
        setSelectedDriver(null);
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/business" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Dispatch Center</h1>
                        <p className="text-slate-400">Assign orders to drivers</p>
                    </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Order
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Orders */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Package className="w-5 h-5 text-orange-500" />
                            Pending Orders ({pendingOrders.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingOrders.map((order) => (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all ${selectedOrder === order.id
                                            ? 'bg-blue-600/20 border-2 border-blue-500'
                                            : 'bg-slate-700/50 border-2 border-transparent hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="text-white font-medium">{order.destination}</p>
                                            <div className="flex items-center gap-1 text-sm text-slate-400">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate max-w-[200px]">{order.address}</span>
                                            </div>
                                        </div>
                                        {order.priority === 'urgent' && (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                                                URGENT
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span>{order.items} items</span>
                                        <span>•</span>
                                        <span>{order.weight}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Available Drivers */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Truck className="w-5 h-5 text-green-500" />
                            Available Drivers ({availableDrivers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    placeholder="Search drivers..."
                                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {availableDrivers.map((driver) => (
                                <div
                                    key={driver.id}
                                    onClick={() => setSelectedDriver(driver.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all ${selectedDriver === driver.id
                                            ? 'bg-green-600/20 border-2 border-green-500'
                                            : 'bg-slate-700/50 border-2 border-transparent hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{driver.name}</p>
                                                <p className="text-sm text-slate-400">{driver.vehicle} • {driver.plate}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-yellow-400 text-sm font-bold">⭐ {driver.rating}</p>
                                            <p className="text-xs text-slate-500">{driver.distance} away</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dispatch Button */}
            <div className="mt-6">
                <Button
                    onClick={handleDispatch}
                    disabled={!selectedOrder || !selectedDriver}
                    className={`w-full h-14 font-bold text-lg ${selectedOrder && selectedDriver
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    {selectedOrder && selectedDriver
                        ? 'Dispatch Order'
                        : 'Select an order and driver to dispatch'}
                    <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div>
    );
}
