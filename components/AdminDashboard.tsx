'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { UserButton } from '@clerk/nextjs';
import {
    Truck, Users, MapPin, DollarSign, TrendingUp,
    CheckCircle, XCircle, Clock, Eye, FileText, Image as ImageIcon,
    Check, X, Car, UserCheck, ExternalLink, ShieldAlert, Phone
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
    const { user } = useUser();
    const { toast } = useToast();

    // Queries - using enriched versions with joined data
    const pendingDrivers = useQuery(api.admin.getPendingDriversEnriched);
    const allDrivers = useQuery(api.admin.getAllDrivers);
    const activeRides = useQuery(api.admin.getAllRidesEnriched, { status: "ongoing" });
    const stats = useQuery(api.admin.getAnalytics);
    const sosAlerts = useQuery(api.sos.listActiveEnriched);

    // Mutations
    const verifyDriver = useMutation(api.admin.verifyDriver);
    const rejectDriver = useMutation(api.admin.rejectDriver);
    const resolveSOS = useMutation(api.sos.resolve);

    const [selectedDriver, setSelectedDriver] = useState(null);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('pending'); // pending, drivers, rides, stats

    const handleVerifyDriver = async (driverId: Id<"drivers">, approved: boolean, reason: string = '') => {
        setVerifying(driverId);
        try {
            if (approved) {
                await verifyDriver({ driver_id: driverId });
            } else {
                await rejectDriver({ driver_id: driverId, reason });
            }

            toast({
                title: approved ? 'Driver Approved! ✅' : 'Driver Rejected',
                description: approved
                    ? 'Driver can now go online and accept rides'
                    : `Rejection reason: ${reason}`,
            });

            setSelectedDriver(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update driver',
                variant: 'destructive',
            });
        } finally {
            setVerifying(null);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" >
            {/* Header */}
            < header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-bebax-sm" >
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-bebax-green rounded-xl flex items-center justify-center">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-bebax-black">BebaX Admin</h1>
                                <p className="text-xs text-gray-600">Platform Management</p>
                            </div>
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header >

            {/* Stats Overview */}
            < div className="container mx-auto px-4 py-6" >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card-bebax p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-600" />
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold">{stats?.totalDrivers || 0}</p>
                        <p className="text-sm text-gray-600">Total Drivers</p>
                        <p className="text-xs text-green-600 mt-1">
                            {stats?.verifiedDrivers || 0} verified
                        </p>
                    </div>

                    <div className="card-bebax p-6">
                        <div className="flex items-center justify-between mb-2">
                            <MapPin className="w-8 h-8 text-bebax-green" />
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold">{stats?.totalRides || 0}</p>
                        <p className="text-sm text-gray-600">Total Rides</p>
                        <p className="text-xs text-bebax-green mt-1">
                            {activeRides?.length || 0} active now
                        </p>
                    </div>

                    <div className="card-bebax p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-yellow-600" />
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold">
                            {((stats?.totalRevenue || 0) / 1000).toFixed(0)}K
                        </p>
                        <p className="text-sm text-gray-600">Revenue (TZS)</p>
                        <p className="text-xs text-gray-500 mt-1">Platform commission</p>
                    </div>

                    <div className="card-bebax p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-orange-600" />
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full font-semibold">
                                {pendingDrivers?.length || 0}
                            </span>
                        </div>
                        <p className="text-3xl font-bold">{pendingDrivers?.length || 0}</p>
                        <p className="text-sm text-gray-600">Pending Verification</p>
                        <p className="text-xs text-orange-600 mt-1">Needs review</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-bebax-md overflow-hidden">
                    <div className="border-b border-gray-200">
                        <div className="flex space-x-1 p-2">
                            {[
                                { id: 'pending', label: 'Pending Drivers', count: pendingDrivers?.length },
                                { id: 'drivers', label: 'All Drivers', count: allDrivers?.length },
                                { id: 'rides', label: 'Active Rides', count: activeRides?.length },
                                { id: 'sos', label: '🆘 SOS Alerts', count: sosAlerts?.length },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeTab === tab.id
                                        ? 'bg-bebax-green text-white shadow-bebax-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.label}
                                    {(tab.count ?? 0) > 0 && (
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                                            }`}>
                                            {tab.count ?? 0}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pending Drivers */}
                    {activeTab === 'pending' && (
                        <div className="p-6">
                            <h2 className="text-lg font-bold mb-4">Drivers Awaiting Verification</h2>
                            {!pendingDrivers || pendingDrivers.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-600">No pending verifications</p>
                                    <p className="text-sm text-gray-500">All drivers are verified!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingDrivers.map((driver) => (
                                        <div key={driver._id} className="border border-gray-200 rounded-xl p-4 hover:border-bebax-green transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg">{driver.user_name}</h3>
                                                    <p className="text-sm text-gray-600">{driver.user_phone}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Applied: {new Date(driver.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                                    Pending
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                                <div>
                                                    <p className="text-gray-600">NIDA Number</p>
                                                    <p className="font-medium">{driver.nida_number}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">License Number</p>
                                                    <p className="font-medium">{driver.license_number}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Vehicle Type</p>
                                                    <p className="font-medium capitalize">{driver.vehicle_type}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Plate Number</p>
                                                    <p className="font-medium">{driver.vehicle_plate}</p>
                                                </div>
                                            </div>

                                            {/* Documents */}
                                            <div className="mb-4">
                                                <p className="text-sm font-medium mb-2">Documents:</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {driver.nida_photo && (
                                                        <a
                                                            href={driver.nida_photo}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                        >
                                                            <FileText className="w-4 h-4 text-gray-600" />
                                                            <span className="text-xs">NIDA Photo</span>
                                                        </a>
                                                    )}
                                                    {driver.license_photo && (
                                                        <a
                                                            href={driver.license_photo}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                        >
                                                            <FileText className="w-4 h-4 text-gray-600" />
                                                            <span className="text-xs">License Photo</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleVerifyDriver(driver._id, true)}
                                                    disabled={verifying === driver._id}
                                                    className="flex-1 btn-bebax-primary flex items-center justify-center space-x-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>{verifying === driver._id ? 'Approving...' : 'Approve'}</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Rejection reason:');
                                                        if (reason) handleVerifyDriver(driver._id, false, reason);
                                                    }}
                                                    disabled={verifying === driver._id}
                                                    className="flex-1 btn-bebax-secondary flex items-center justify-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    <span>Reject</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* All Drivers */}
                    {activeTab === 'drivers' && (
                        <div className="p-6">
                            <h2 className="text-lg font-bold mb-4">All Drivers</h2>
                            {!allDrivers || allDrivers.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-600">No drivers yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {allDrivers.map((driver) => (
                                        <div key={driver._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-bebax-green transition-colors">
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{driver.user_name}</h3>
                                                <p className="text-sm text-gray-600">{driver.vehicle_type} • {driver.vehicle_plate}</p>
                                                <p className="text-xs text-gray-500">
                                                    {driver.total_trips} trips • {driver.rating.toFixed(1)}⭐
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {driver.is_online && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                        Online
                                                    </span>
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${driver.verified
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {driver.verified ? 'Verified' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Active Rides */}
                    {activeTab === 'rides' && (
                        <div className="p-6">
                            <h2 className="text-lg font-bold mb-4">Active Rides</h2>
                            {!activeRides || activeRides.length === 0 ? (
                                <div className="text-center py-12">
                                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-600">No active rides</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeRides.map((ride) => (
                                        <div key={ride._id} className="border border-gray-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`status-${ride.status}`}>
                                                    {ride.status}
                                                </span>
                                                <span className="font-bold text-bebax-green">
                                                    {(ride.final_fare || ride.fare_estimate).toLocaleString()} TZS
                                                </span>
                                            </div>
                                            <p className="text-sm mb-1">📍 {ride.pickup_location.address}</p>
                                            <p className="text-sm text-gray-600 mb-2">🎯 {ride.dropoff_location.address}</p>
                                            <p className="text-xs text-gray-500">
                                                Customer: {ride.customer_name} • Driver: {ride.driver_name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SOS Alerts */}
                    {activeTab === 'sos' && (
                        <div className="p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-6 h-6 text-red-600" />
                                Active SOS Alerts
                            </h2>
                            {!sosAlerts || sosAlerts.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-3" />
                                    <p className="text-gray-600">No active emergencies</p>
                                    <p className="text-sm text-gray-500">All users are safe!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sosAlerts.map((alert) => (
                                        <div key={alert._id} className="border-2 border-red-300 bg-red-50 rounded-xl p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg text-red-700">
                                                        🆘 {alert.user_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {alert.user_role === 'driver' ? '🚗 Driver' : '👤 Customer'}
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold animate-pulse">
                                                    ACTIVE
                                                </span>
                                            </div>

                                            <div className="mb-3">
                                                <p className="text-sm font-medium text-gray-700">📍 Location:</p>
                                                <p className="text-sm text-gray-600">{alert.location.address}</p>
                                            </div>

                                            {alert.ride_info && (
                                                <div className="mb-3 p-3 bg-white rounded-lg">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Related Ride:</p>
                                                    <p className="text-sm">📍 {alert.ride_info.pickup}</p>
                                                    <p className="text-sm">🎯 {alert.ride_info.dropoff}</p>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-500 mb-3">
                                                Triggered: {new Date(alert.created_at).toLocaleString()}
                                            </p>

                                            <div className="flex gap-2">
                                                {alert.user_phone && (
                                                    <a
                                                        href={`tel:${alert.user_phone}`}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        Call User
                                                    </a>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await resolveSOS({ alert_id: alert._id });
                                                            toast({
                                                                title: 'Alert Resolved ✅',
                                                                description: 'SOS alert has been marked as resolved.',
                                                            });
                                                        } catch (error) {
                                                            toast({
                                                                title: 'Error',
                                                                description: 'Failed to resolve alert',
                                                                variant: 'destructive',
                                                            });
                                                        }
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Resolve
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
