'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { RideStatusSheet, RideStatus, DriverInfo } from '@/components/RideStatusSheet';
import { RideMap } from '@/components/RideMap';
import { MapPin, ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RideStatusPage() {
    const [status, setStatus] = useState<RideStatus>('SEARCHING');

    // Get active ride
    const activeRide = useQuery(api.rides.getActiveRide) as any;

    // Map ride status to component status
    useEffect(() => {
        if (!activeRide) return;

        switch (activeRide.status) {
            case 'pending':
            case 'searching':
                setStatus('SEARCHING');
                break;
            case 'accepted':
            case 'driver_assigned':
                setStatus('ACCEPTED');
                break;
            case 'arrived':
            case 'driver_arrived':
                setStatus('ARRIVED');
                break;
            case 'ongoing':
            case 'in_progress':
                setStatus('IN_PROGRESS');
                break;
            default:
                setStatus('SEARCHING');
        }
    }, [activeRide]);

    // Handle cancel - mock implementation
    const handleCancel = async () => {
        if (!activeRide) return;
        const confirmed = window.confirm('Are you sure you want to cancel this ride?');
        if (!confirmed) return;

        // In production, this would call api.rides.cancel
        alert('Ride cancelled');
        window.location.href = '/customer';
    };

    // Handle call driver
    const handleCall = () => {
        if (activeRide?.driver_phone) {
            window.open(`tel:${activeRide.driver_phone}`);
        }
    };

    // Handle chat
    const handleChat = () => {
        if (activeRide) {
            window.location.href = `/customer/chat?ride=${activeRide._id}`;
        }
    };

    // Handle share
    const handleShare = () => {
        if (navigator.share && activeRide) {
            navigator.share({
                title: 'My BebaX Ride',
                text: `I'm on a BebaX ride from ${activeRide.pickup_location?.address} to ${activeRide.dropoff_location?.address}`,
                url: window.location.href,
            });
        }
    };

    // Handle I'm Coming
    const handleImComing = () => {
        // Would send notification to driver
        alert('Driver has been notified!');
    };

    // No active ride
    if (activeRide === null) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Ride</h2>
                <p className="text-slate-500 mb-6">You don't have any ongoing rides</p>
                <Link href="/customer/book">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        Book a Ride
                    </Button>
                </Link>
            </div>
        );
    }

    // Loading
    if (activeRide === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-pulse text-slate-500">Loading...</div>
            </div>
        );
    }

    // Build driver info if available
    const driverInfo: DriverInfo | undefined = activeRide.driver_id ? {
        name: activeRide.driver_name || 'Driver',
        rating: activeRide.driver_rating || 4.8,
        trips: activeRide.driver_trips || 0,
        phone: activeRide.driver_phone || '',
        vehicleModel: activeRide.vehicle_type || 'Vehicle',
        vehicleColor: 'White',
        plateNumber: activeRide.vehicle_plate || 'T 000 XXX',
        eta: activeRide.eta_minutes || 5,
        pin: activeRide.verification_pin || '0000',
    } : undefined;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-800">
            {/* Live Map */}
            <div className="h-[60vh] relative">
                <RideMap
                    pickup={activeRide.pickup_location ? {
                        lat: activeRide.pickup_location.lat || -6.7924,
                        lng: activeRide.pickup_location.lng || 39.2083,
                    } : undefined}
                    dropoff={activeRide.dropoff_location ? {
                        lat: activeRide.dropoff_location.lat || -6.8000,
                        lng: activeRide.dropoff_location.lng || 39.2500,
                    } : undefined}
                    driverLocation={activeRide.driver_location ? {
                        lat: activeRide.driver_location.lat,
                        lng: activeRide.driver_location.lng,
                    } : undefined}
                    showRoute={true}
                    className="w-full h-full"
                />

                {/* Back button */}
                <Link
                    href="/customer"
                    className="absolute top-4 left-4 z-10 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </Link>

                {/* Route Info Overlay */}
                <div className="absolute top-4 right-4 z-10 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-slate-500 truncate max-w-[150px]">
                            {activeRide.pickup_location?.address}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-xs text-slate-500 truncate max-w-[150px]">
                            {activeRide.dropoff_location?.address}
                        </span>
                    </div>
                </div>
            </div>

            {/* Status Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-20">
                <RideStatusSheet
                    status={status}
                    driver={driverInfo}
                    onCancel={handleCancel}
                    onCall={handleCall}
                    onChat={handleChat}
                    onShareRide={handleShare}
                    onImComing={handleImComing}
                />
            </div>
        </div>
    );
}
