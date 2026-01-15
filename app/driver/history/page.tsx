'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, Truck, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function HistoryPage() {
    
    const history = useQuery(api.rides.listDriverHistory);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Group rides by date
    const groupedRides: Record<string, any[]> = {};
    if (history) {
        history.forEach((ride: any) => {
            const date = formatDate(ride._creationTime);
            if (!groupedRides[date]) {
                groupedRides[date] = [];
            }
            groupedRides[date].push(ride);
        });
    }

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/driver" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Trip History</h1>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="bg-[#1E293B] border-0">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-black text-white">{history?.length || 0}</p>
                        <p className="text-slate-500 text-xs">Total Trips</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#1E293B] border-0">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-black text-green-500">
                            {history?.filter((r: any) => r.status === 'completed').length || 0}
                        </p>
                        <p className="text-slate-500 text-xs">Completed</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#1E293B] border-0">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-black text-red-500">
                            {history?.filter((r: any) => r.status === 'cancelled').length || 0}
                        </p>
                        <p className="text-slate-500 text-xs">Cancelled</p>
                    </CardContent>
                </Card>
            </div>

            {/* Grouped Trips */}
            {Object.keys(groupedRides).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedRides).map(([date, rides]) => (
                        <div key={date}>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                                {date}
                            </h3>
                            <div className="space-y-3">
                                {rides.map((ride: any) => (
                                    <Card key={ride._id} className="bg-[#1E293B] border border-slate-700">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ride.status === 'completed' ? 'bg-green-500/10' :
                                                        ride.status === 'cancelled' ? 'bg-red-500/10' : 'bg-blue-500/10'
                                                    }`}>
                                                    <Truck className={`w-6 h-6 ${ride.status === 'completed' ? 'text-green-500' :
                                                            ride.status === 'cancelled' ? 'text-red-500' : 'text-blue-500'
                                                        }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="text-white font-semibold">
                                                                {ride.vehicle_type?.charAt(0).toUpperCase() + ride.vehicle_type?.slice(1)}
                                                            </p>
                                                            <p className="text-slate-500 text-xs">
                                                                {formatTime(ride._creationTime)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-white font-bold">
                                                                TZS {(ride.fare_estimate || 0).toLocaleString()}
                                                            </p>
                                                            <p className={`text-xs font-medium ${ride.status === 'completed' ? 'text-green-500' :
                                                                    ride.status === 'cancelled' ? 'text-red-500' : 'text-blue-500'
                                                                }`}>
                                                                {ride.status?.toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                                            <p className="text-slate-400 truncate">{ride.pickup_address || 'Pickup'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                                            <p className="text-slate-400 truncate">{ride.dropoff_address || 'Dropoff'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="bg-[#1E293B] border border-dashed border-slate-700">
                    <CardContent className="p-10 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium mb-1">No trip history</p>
                        <p className="text-slate-600 text-sm">Complete your first delivery to see it here</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
