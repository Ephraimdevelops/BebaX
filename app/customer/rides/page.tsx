'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, Clock, Package, Truck, ChevronRight, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function RidesPage() {
    
    const allRides = useQuery(api.rides.listMyRides);

    const activeRides = allRides?.filter((r: any) =>
        ['pending', 'accepted', 'arrived', 'in_transit'].includes(r.status)
    ) || [];

    const completedRides = allRides?.filter((r: any) => r.status === 'completed') || [];
    const cancelledRides = allRides?.filter((r: any) => r.status === 'cancelled') || [];

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const RideCard = ({ ride }: { ride: any }) => (
        <Card className="border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ride.status === 'completed' ? 'bg-green-50' :
                            ride.status === 'cancelled' ? 'bg-red-50' : 'bg-blue-50'
                        }`}>
                        <Truck className={`w-6 h-6 ${ride.status === 'completed' ? 'text-green-600' :
                                ride.status === 'cancelled' ? 'text-red-500' : 'text-blue-600'
                            }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {ride.vehicle_type?.charAt(0).toUpperCase() + ride.vehicle_type?.slice(1) || 'Ride'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {ride._creationTime ? formatDate(ride._creationTime) : 'Recently'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">
                                    TZS {ride.fare?.toLocaleString() || '0'}
                                </p>
                                <p className={`text-xs font-medium ${ride.status === 'completed' ? 'text-green-600' :
                                        ride.status === 'cancelled' ? 'text-red-500' : 'text-blue-600'
                                    }`}>
                                    {ride.status?.replace('_', ' ').toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <p className="text-gray-600 truncate">{ride.pickup_address || 'Pickup'}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <p className="text-gray-600 truncate">{ride.dropoff_address || 'Drop-off'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const EmptyState = ({ message }: { message: string }) => (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
            <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">{message}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/customer" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">My Rides</h1>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="w-full max-w-md grid grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl h-12">
                    <TabsTrigger value="active" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Active ({activeRides.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Completed ({completedRides.length})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Cancelled ({cancelledRides.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeRides.length > 0 ? (
                        activeRides.map((ride: any) => <RideCard key={ride._id} ride={ride} />)
                    ) : (
                        <EmptyState message="No active rides" />
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    {completedRides.length > 0 ? (
                        completedRides.map((ride: any) => <RideCard key={ride._id} ride={ride} />)
                    ) : (
                        <EmptyState message="No completed rides yet" />
                    )}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-4">
                    {cancelledRides.length > 0 ? (
                        cancelledRides.map((ride: any) => <RideCard key={ride._id} ride={ride} />)
                    ) : (
                        <EmptyState message="No cancelled rides" />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
