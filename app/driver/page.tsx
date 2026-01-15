'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Power, MapPin, Clock, DollarSign, Star, TrendingUp,
    Package, Navigation, Phone, MessageCircle, CheckCircle,
    ArrowRight, User, Settings, FileText, Wallet, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RideMap } from '@/components/RideMap';
import { DriverJobCard } from '@/components/DriverJobCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Green theme colors (matching mobile driver)
const COLORS = {
    primary: '#22C55E',      // Green-500
    primaryDark: '#16A34A',  // Green-600
    warning: '#EAB308',
    dark: '#0F172A',
    muted: '#64748B',
};

export default function DriverCockpit() {
    const { user, isSignedIn } = useUser();
    const router = useRouter();

    // Queries
    const driver = useQuery(api.drivers.getCurrentDriver);
    const activeRide = useQuery(api.rides.getDriverActiveRide);
    const availableRides = useQuery(api.rides.listAvailableRides);
    const earnings = useQuery(api.drivers.getEarnings);

    // Mutations
    const setOnline = useMutation(api.drivers.setOnlineStatus);
    const acceptRide = useMutation(api.rides.accept);
    const updateRideStatus = useMutation(api.rides.updateStatus);

    // State
    const [statusLoading, setStatusLoading] = useState(false);
    const [showIncomingJob, setShowIncomingJob] = useState(false);
    const [pendingJob, setPendingJob] = useState<any | null>(null);

    // Derived data
    const todayEarnings = earnings?.today || 0;
    const weekEarnings = earnings?.week || 0;
    const isOnline = driver?.is_online || false;
    const isVerified = driver?.verified || false;

    // Check for incoming jobs
    useEffect(() => {
        if (isOnline && availableRides && availableRides.length > 0 && !activeRide) {
            setPendingJob(availableRides[0]);
            setShowIncomingJob(true);
        }
    }, [isOnline, availableRides, activeRide]);

    // Toggle online status
    const toggleOnline = async () => {
        if (!driver) return;
        if (activeRide) {
            alert("Cannot go offline during active delivery. Complete the trip first.");
            return;
        }
        if (!isVerified) {
            alert("Please verify your documents before going online.");
            router.push('/driver/documents');
            return;
        }

        setStatusLoading(true);
        try {
            await setOnline({ is_online: !isOnline });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update status';
            alert(message);
        } finally {
            setStatusLoading(false);
        }
    };

    // Accept job
    const handleAcceptJob = async (jobId: string) => {
        try {
            await acceptRide({ ride_id: jobId as any });
            setShowIncomingJob(false);
            setPendingJob(null);
        } catch (err) {
            console.error('Accept error:', err);
        }
    };

    // Reject job
    const handleRejectJob = (jobId: string) => {
        setShowIncomingJob(false);
        setPendingJob(null);
    };

    // Update ride status
    const handleUpdateStatus = async (status: string) => {
        if (!activeRide) return;
        try {
            await updateRideStatus({ ride_id: activeRide._id, status: status as any });
        } catch (err) {
            console.error('Status update error:', err);
        }
    };

    // Get next status action
    const getNextAction = () => {
        if (!activeRide) return null;
        switch (activeRide.status) {
            case 'accepted':
            case 'driver_assigned':
                return { label: 'ARRIVED AT PICKUP', status: 'arrived', color: COLORS.primary };
            case 'arrived':
            case 'driver_arrived':
                return { label: 'START TRIP', status: 'in_progress', color: COLORS.primary };
            case 'in_progress':
            case 'ongoing':
                return { label: 'COMPLETE DELIVERY', status: 'completed', color: COLORS.warning };
            default:
                return null;
        }
    };

    const nextAction = getNextAction();

    return (
        <div className="min-h-screen bg-slate-900 relative">
            {/* 1. MAP BACKGROUND */}
            <div className="fixed inset-0 z-0">
                <RideMap
                    pickup={activeRide?.pickup_location ? {
                        lat: activeRide.pickup_location.lat || -6.7924,
                        lng: activeRide.pickup_location.lng || 39.2083,
                    } : undefined}
                    dropoff={activeRide?.dropoff_location ? {
                        lat: activeRide.dropoff_location.lat || -6.8,
                        lng: activeRide.dropoff_location.lng || 39.25,
                    } : undefined}
                    showRoute={!!activeRide}
                    className="w-full h-full"
                />
                {/* Dark overlay when offline */}
                {!isOnline && (
                    <div className="absolute inset-0 bg-slate-900/80" />
                )}
            </div>

            {/* 2. HEADER */}
            <div className="fixed top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
                <Link
                    href="/driver/profile"
                    className="w-12 h-12 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border-2 border-slate-700"
                >
                    <span className="text-lg font-bold text-white">
                        {user?.firstName?.charAt(0) || 'D'}
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    {/* Earnings Badge */}
                    <Link
                        href="/driver/earnings"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/90 rounded-full border border-slate-700"
                    >
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-white font-bold">
                            TZS {todayEarnings.toLocaleString()}
                        </span>
                    </Link>

                    <Link
                        href="/driver/settings"
                        className="w-12 h-12 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700"
                    >
                        <Settings className="w-5 h-5 text-slate-400" />
                    </Link>
                </div>
            </div>

            {/* 3. INCOMING JOB CARD */}
            {showIncomingJob && pendingJob && (
                <DriverJobCard
                    job={{
                        id: (pendingJob as any)._id,
                        pickup: {
                            address: (pendingJob as any).pickup_location?.address || 'Pickup',
                        },
                        dropoff: {
                            address: (pendingJob as any).dropoff_location?.address || 'Dropoff',
                        },
                        distance: (pendingJob as any).distance || 5,
                        fare: (pendingJob as any).fare_estimate || 10000,
                        vehicleType: (pendingJob as any).vehicle_type || 'boda',
                        cargoType: (pendingJob as any).cargo_details,
                    }}
                    onAccept={handleAcceptJob}
                    onReject={handleRejectJob}
                />
            )}

            {/* 4. BOTTOM SHEET */}
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-slate-800 rounded-t-3xl border-t border-slate-700">
                <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mt-3" />

                {/* Offline State */}
                {!isOnline && !activeRide && (
                    <div className="p-6 text-center">
                        <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Power className="w-10 h-10 text-slate-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">You're Offline</h2>
                        <p className="text-slate-400 mb-6">
                            Go online to start receiving ride requests
                        </p>

                        {!isVerified && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                                <p className="text-yellow-500 text-sm">
                                    ⚠️ Verify your documents to go online
                                </p>
                                <Link href="/driver/documents" className="text-yellow-400 text-sm font-bold underline">
                                    Upload Documents →
                                </Link>
                            </div>
                        )}

                        <Button
                            onClick={toggleOnline}
                            disabled={statusLoading || !isVerified}
                            className="w-full h-14 rounded-2xl text-white font-bold text-lg"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            {statusLoading ? 'Updating...' : 'GO ONLINE'}
                        </Button>
                    </div>
                )}

                {/* Online - Waiting for Rides */}
                {isOnline && !activeRide && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-green-500 font-bold">ONLINE</span>
                                </div>
                                <p className="text-slate-400">Waiting for ride requests...</p>
                            </div>

                            <Button
                                onClick={toggleOnline}
                                disabled={statusLoading}
                                variant="outline"
                                className="border-slate-600 text-slate-400"
                            >
                                Go Offline
                            </Button>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-white">{driver?.total_trips || 0}</p>
                                <p className="text-xs text-slate-400">Trips</p>
                            </div>
                            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-2xl font-bold text-white">{driver?.rating?.toFixed(1) || '5.0'}</span>
                                </div>
                                <p className="text-xs text-slate-400">Rating</p>
                            </div>
                            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-green-500">
                                    {Math.round(weekEarnings / 1000)}K
                                </p>
                                <p className="text-xs text-slate-400">This Week</p>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="flex gap-3 mt-4">
                            <Link
                                href="/driver/earnings"
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-700 rounded-xl"
                            >
                                <Wallet className="w-5 h-5 text-green-500" />
                                <span className="text-white font-medium">Earnings</span>
                            </Link>
                            <Link
                                href="/driver/history"
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-700 rounded-xl"
                            >
                                <FileText className="w-5 h-5 text-slate-400" />
                                <span className="text-white font-medium">History</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Active Ride */}
                {activeRide && (
                    <div className="p-4">
                        {/* Route Info */}
                        <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5" />
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400">PICKUP</p>
                                    <p className="text-white font-medium truncate">
                                        {activeRide.pickup_location?.address || 'Pickup Location'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5" />
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400">DROPOFF</p>
                                    <p className="text-white font-medium truncate">
                                        {activeRide.dropoff_location?.address || 'Dropoff Location'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="flex items-center justify-between bg-slate-700/50 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">
                                        {activeRide.customer_name || 'Customer'}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        {activeRide.vehicle_type?.toUpperCase()} • TZS {(activeRide.fare_estimate || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-white" />
                                </button>
                                <button className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Action Button */}
                        {nextAction && (
                            <Button
                                onClick={() => handleUpdateStatus(nextAction.status)}
                                className="w-full h-14 rounded-2xl text-white font-bold text-lg"
                                style={{ backgroundColor: nextAction.color }}
                            >
                                {nextAction.label}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
