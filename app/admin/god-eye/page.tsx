'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Eye, MapPin, AlertTriangle, Phone, CheckCircle,
    ArrowLeft, Radio, Truck, Clock, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

export default function GodEyePage() {
    const onlineDrivers = useQuery(api.drivers.getOnlineDrivers) as any;
    const activeRides = useQuery(api.admin.getAllRidesEnriched, { status: "ongoing" }) as any;
    const sosAlerts = useQuery(api.sos.listActiveEnriched) as any;
    const resolveSOS = useMutation(api.sos.resolve);

    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const handleResolveSOS = async (alertId: string) => {
        setResolvingId(alertId);
        try {
            await resolveSOS({ alert_id: alertId as any });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <Eye className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">God Eye</h1>
                        <p className="text-slate-400">Live platform monitoring</p>
                    </div>
                </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-green-400">{onlineDrivers?.length || 0}</p>
                                <p className="text-sm text-slate-400">Online Drivers</p>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-blue-400">{activeRides?.length || 0}</p>
                                <p className="text-sm text-slate-400">Active Rides</p>
                            </div>
                            <Radio className="w-5 h-5 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className={`border ${sosAlerts?.length > 0 ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-800 border-slate-700'}`}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-3xl font-bold ${sosAlerts?.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                    {sosAlerts?.length || 0}
                                </p>
                                <p className="text-sm text-slate-400">SOS Alerts</p>
                            </div>
                            {sosAlerts?.length > 0 && (
                                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SOS Alerts Section */}
            {sosAlerts && sosAlerts.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Active SOS Alerts
                    </h2>
                    <div className="space-y-4">
                        {sosAlerts.map((alert: any) => (
                            <Card key={alert._id} className="bg-red-500/10 border-red-500/30">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center animate-pulse">
                                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{alert.user_name}</h3>
                                                <p className="text-sm text-red-400">
                                                    {alert.user_role === 'driver' ? '🚗 Driver' : '👤 Customer'}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                            ACTIVE
                                        </span>
                                    </div>

                                    <div className="p-3 bg-slate-800/50 rounded-lg mb-4">
                                        <p className="text-xs text-slate-500 uppercase mb-1">Location</p>
                                        <p className="text-white">{alert.location?.address || 'Unknown location'}</p>
                                    </div>

                                    <div className="flex gap-3">
                                        {alert.user_phone && (
                                            <a
                                                href={`tel:${alert.user_phone}`}
                                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                                            >
                                                <Phone className="w-4 h-4" />
                                                Call User
                                            </a>
                                        )}
                                        <Button
                                            onClick={() => handleResolveSOS(alert._id)}
                                            disabled={resolvingId === alert._id}
                                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {resolvingId === alert._id ? 'Resolving...' : 'Mark Resolved'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Rides */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-500" />
                    Active Rides ({activeRides?.length || 0})
                </h2>
                {activeRides && activeRides.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {activeRides.map((ride: any) => (
                            <Card key={ride._id} className="bg-slate-800 border-slate-700">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-xl font-bold text-white">
                                                TZS {(ride.fare_estimate || 0).toLocaleString()}
                                            </p>
                                            <span className="text-xs text-slate-500 capitalize">{ride.vehicle_type}</span>
                                        </div>
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                            {ride.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-slate-400 truncate">{ride.pickup_location?.address || 'Pickup'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <span className="text-slate-400 truncate">{ride.dropoff_location?.address || 'Dropoff'}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between text-xs text-slate-500">
                                        <span>Customer: {ride.customer_name || 'Unknown'}</span>
                                        <span>Driver: {ride.driver_name || 'Unknown'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-12 text-center">
                            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">No active rides at the moment</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Online Drivers */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-500" />
                    Online Drivers ({onlineDrivers?.length || 0})
                </h2>
                {onlineDrivers && onlineDrivers.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {onlineDrivers.slice(0, 8).map((driver: any) => (
                            <Card key={driver._id} className="bg-slate-800 border-slate-700">
                                <CardContent className="p-4 text-center">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <User className="w-6 h-6 text-green-500" />
                                    </div>
                                    <p className="text-white font-medium truncate">{driver.user_name}</p>
                                    <p className="text-xs text-slate-500 capitalize">{driver.vehicle_type}</p>
                                    <div className="flex items-center justify-center gap-1 mt-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span className="text-xs text-green-400">Online</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-12 text-center">
                            <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">No drivers online</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
