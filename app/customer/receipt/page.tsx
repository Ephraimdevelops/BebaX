'use client';

import {
    ArrowLeft, Download, Share2, MapPin, Clock, Truck,
    CreditCard, CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReceiptPage() {
    // In production, would get rideId from URL and fetch actual ride data
    const mockRide = {
        _id: 'BEBA-2024-001234',
        date: new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        pickup: { address: 'Mlimani City Mall, Dar es Salaam' },
        dropoff: { address: 'Ubungo Bus Terminal, Dar es Salaam' },
        distance: 8.5,
        duration: 25,
        vehicle_type: 'Bajaj',
        driver_name: 'John M.',
        fare_breakdown: {
            base_fare: 3000,
            distance_fare: 6800,
            traffic_surcharge: 500,
            tip: 1000,
            total: 11300,
        },
        payment_method: 'Cash',
        status: 'completed',
    };

    const handleDownload = () => {
        // Generate PDF receipt
        alert('Receipt downloaded!');
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `BebaX Receipt - ${mockRide._id}`,
                text: `Trip from ${mockRide.pickup.address} to ${mockRide.dropoff.address}. Total: TZS ${mockRide.fare_breakdown.total.toLocaleString()}`,
            });
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/customer/rides" className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Receipt</h1>
                        <p className="text-sm text-slate-500">{mockRide._id}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleShare} className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow">
                        <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button onClick={handleDownload} className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow">
                        <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="max-w-md mx-auto">
                {/* Status Badge */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-bold text-green-600">Trip Completed</span>
                    </div>
                </div>

                {/* Main Receipt Card */}
                <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl mb-6">
                    <CardContent className="p-6">
                        {/* Date & Time */}
                        <div className="text-center mb-6 pb-6 border-b border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-slate-500 text-sm">{mockRide.date}</p>
                            <p className="text-slate-400 text-xs">{mockRide.time}</p>
                        </div>

                        {/* Route */}
                        <div className="space-y-4 mb-6 pb-6 border-b border-dashed border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5" />
                                <div>
                                    <p className="text-xs text-slate-400">PICKUP</p>
                                    <p className="text-sm text-slate-900 dark:text-white">{mockRide.pickup.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5" />
                                <div>
                                    <p className="text-xs text-slate-400">DROPOFF</p>
                                    <p className="text-sm text-slate-900 dark:text-white">{mockRide.dropoff.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Trip Info */}
                        <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-dashed border-slate-200 dark:border-slate-700">
                            <div className="text-center">
                                <MapPin className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{mockRide.distance} km</p>
                                <p className="text-xs text-slate-400">Distance</p>
                            </div>
                            <div className="text-center">
                                <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{mockRide.duration} min</p>
                                <p className="text-xs text-slate-400">Duration</p>
                            </div>
                            <div className="text-center">
                                <Truck className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{mockRide.vehicle_type}</p>
                                <p className="text-xs text-slate-400">Vehicle</p>
                            </div>
                        </div>

                        {/* Fare Breakdown */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Base Fare</span>
                                <span className="text-slate-900 dark:text-white">TZS {mockRide.fare_breakdown.base_fare.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Distance ({mockRide.distance} km)</span>
                                <span className="text-slate-900 dark:text-white">TZS {mockRide.fare_breakdown.distance_fare.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Traffic Surcharge</span>
                                <span className="text-slate-900 dark:text-white">TZS {mockRide.fare_breakdown.traffic_surcharge.toLocaleString()}</span>
                            </div>
                            {mockRide.fare_breakdown.tip > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Tip</span>
                                    <span className="text-green-500">TZS {mockRide.fare_breakdown.tip.toLocaleString()}</span>
                                </div>
                            )}
                            <hr className="border-slate-200 dark:border-slate-700 my-2" />
                            <div className="flex justify-between">
                                <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                                <span className="text-xl font-black text-purple-600">
                                    TZS {mockRide.fare_breakdown.total.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                            <CreditCard className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-xs text-slate-400">Paid via</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{mockRide.payment_method}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                    <Link href="/customer/support" className="flex-1">
                        <Button variant="outline" className="w-full h-12 rounded-xl">
                            Report Issue
                        </Button>
                    </Link>
                    <Link href="/customer/book" className="flex-1">
                        <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                            Book Again
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
