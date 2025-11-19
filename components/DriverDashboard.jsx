'use client';

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Truck, DollarSign, TrendingUp, Clock, CheckCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function DriverDashboard() {
    const { user } = useUser();
    const { toast } = useToast();
    const driver = useQuery(api.drivers.getCurrentDriver);
    const earnings = useQuery(api.drivers.getEarnings);
    const availableRides = useQuery(api.rides.listAvailableRides);
    const myRides = useQuery(api.rides.listMyRides);
    const wallet = useQuery(api.payments.getDriverWallet);
    const setOnline = useMutation(api.drivers.setOnlineStatus);
    const acceptRide = useMutation(api.rides.accept);
    const updateRideStatus = useMutation(api.rides.updateStatus);

    const [acceptingRide, setAcceptingRide] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);

    const handleToggleOnline = async () => {
        if (driver) {
            try {
                await setOnline({ is_online: !driver.is_online });
                toast({
                    title: driver.is_online ? "You're now offline" : "You're now online!",
                    description: driver.is_online ? "You won't receive ride requests" : "You can now accept rides",
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            }
        }
    };

    const handleAcceptRide = async (rideId) => {
        setAcceptingRide(rideId);
        try {
            await acceptRide({ ride_id: rideId });
            toast({
                title: "Ride Accepted!",
                description: "Navigate to pickup location",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to accept ride",
                variant: "destructive",
            });
        } finally {
            setAcceptingRide(null);
        }
    };

    const handleUpdateStatus = async (rideId, newStatus) => {
        setUpdatingStatus(rideId);
        try {
            await updateRideStatus({ ride_id: rideId, status: newStatus });
            toast({
                title: "Status Updated",
                description: `Ride marked as ${newStatus}`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setUpdatingStatus(null);
        }
    };

    if (!driver) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Driver profile not found</p>
                    <p className="text-sm text-gray-500 mt-2">Please complete driver registration</p>
                </div>
            </div>
        );
    }

    const activeRides = myRides?.filter(r => r.status === 'accepted' || r.status === 'ongoing' || r.status === 'loading') || [];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header with Online Toggle */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-bebax-sm">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-bebax-green rounded-xl flex items-center justify-center">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">BebaX Driver</h2>
                                <p className="text-xs text-gray-600">
                                    {driver.verified ? '✅ Verified' : '⏳ Pending'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleOnline}
                            disabled={!driver.verified}
                            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${driver.is_online
                                ? 'bg-bebax-green text-white shadow-bebax-md'
                                : 'bg-gray-200 text-gray-600'
                                } disabled:opacity-50`}
                        >
                            {driver.is_online ? '🟢 Online' : '⚫ Offline'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Earnings Summary */}
            <div className="p-4">
                <div className="card-bebax p-6 bg-gradient-to-br from-bebax-green to-bebax-green-dark text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Total Earnings</h3>
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <p className="text-4xl font-bold mb-2">
                        {(earnings?.total || 0).toLocaleString()} TZS
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
                        <div>
                            <p className="text-xs opacity-80">Today</p>
                            <p className="text-lg font-semibold">{(earnings?.today || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs opacity-80">This Week</p>
                            <p className="text-lg font-semibold">{(earnings?.week || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs opacity-80">This Month</p>
                            <p className="text-lg font-semibold">{(earnings?.month || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallet Balance */}
            {wallet && (
                <div className="p-4">
                    <div className={`card-bebax p-6 ${wallet.balance < 0
                            ? 'bg-red-50 border-2 border-red-200'
                            : 'bg-green-50 border-2 border-green-200'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">💰 Wallet Balance</h3>
                            {wallet.locked && (
                                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold">
                                    🔒 Locked
                                </span>
                            )}
                        </div>
                        <p className={`text-4xl font-bold mb-2 ${wallet.balance < 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {wallet.balance.toLocaleString()} TZS
                        </p>

                        {wallet.balance < 0 && (
                            <div className="mt-4 p-4 bg-white rounded-lg">
                                <p className="text-sm text-red-800 mb-2">
                                    {wallet.lock_reason || `Una deni la ${Math.abs(wallet.balance).toLocaleString()} TZS`}
                                </p>
                                {wallet.locked && (
                                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <p className="text-xs text-yellow-800 mb-2">
                                            ⚠️ Huwezi kupata safari mpya mpaka ulipe deni lako
                                        </p>
                                        <button
                                            className="w-full btn-bebax-primary text-sm"
                                            onClick={() => toast({
                                                title: "Lipa Sasa",
                                                description: "M-Pesa payment coming soon! Contact admin to settle.",
                                            })}
                                        >
                                            Lipa Sasa (M-Pesa - Coming Soon)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {wallet.balance >= 0 && (
                            <p className="text-sm text-green-700 mt-2">
                                ✅ Akaunti yako iko sawa. Endelea kufanya kazi!
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-3">
                    <div className="card-bebax p-4 text-center">
                        <Truck className="w-8 h-8 text-bebax-green mx-auto mb-2" />
                        <p className="text-2xl font-bold">{driver.total_trips}</p>
                        <p className="text-xs text-gray-500">Total Trips</p>
                    </div>
                    <div className="card-bebax p-4 text-center">
                        <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{driver.rating.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">Rating</p>
                    </div>
                    <div className="card-bebax p-4 text-center">
                        <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{activeRides.length}</p>
                        <p className="text-xs text-gray-500">Active</p>
                    </div>
                </div>
            </div>

            {/* Active Rides */}
            {activeRides.length > 0 && (
                <div className="px-4 pb-4">
                    <h3 className="text-lg font-semibold mb-3">Active Rides</h3>
                    <div className="space-y-3">
                        {activeRides.map((ride) => (
                            <div key={ride._id} className="card-bebax p-4 border-2 border-bebax-green">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`status-${ride.status}`}>
                                        {ride.status === 'accepted' && 'Heading to Pickup'}
                                        {ride.status === 'loading' && 'Loading Items'}
                                        {ride.status === 'ongoing' && 'In Transit'}
                                    </span>
                                    <span className="font-bold text-bebax-green">
                                        {(ride.final_fare || ride.fare_estimate).toLocaleString()} TZS
                                    </span>
                                </div>
                                <p className="text-sm mb-1 font-medium">📍 {ride.pickup_location.address}</p>
                                <p className="text-sm text-gray-600 mb-3">🎯 {ride.dropoff_location.address}</p>
                                <p className="text-xs text-gray-500 mb-3">📦 {ride.cargo_details}</p>

                                <div className="flex space-x-2">
                                    {ride.status === 'accepted' && (
                                        <>
                                            <Button
                                                className="flex-1 btn-bebax-secondary text-sm flex items-center justify-center"
                                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.pickup_location.lat},${ride.pickup_location.lng}`, '_blank')}
                                            >
                                                <Navigation className="w-4 h-4 mr-1" />
                                                Navigate
                                            </Button>
                                            <Button
                                                className="flex-1 btn-bebax-primary text-sm"
                                                onClick={() => handleUpdateStatus(ride._id, 'loading')}
                                                disabled={updatingStatus === ride._id}
                                            >
                                                {updatingStatus === ride._id ? 'Updating...' : 'Arrived'}
                                            </Button>
                                        </>
                                    )}

                                    {ride.status === 'loading' && (
                                        <Button
                                            className="flex-1 btn-bebax-primary text-sm"
                                            onClick={() => handleUpdateStatus(ride._id, 'ongoing')}
                                            disabled={updatingStatus === ride._id}
                                        >
                                            {updatingStatus === ride._id ? 'Updating...' : 'Start Trip'}
                                        </Button>
                                    )}

                                    {ride.status === 'ongoing' && (
                                        <>
                                            <Button
                                                className="flex-1 btn-bebax-secondary text-sm flex items-center justify-center"
                                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.dropoff_location.lat},${ride.dropoff_location.lng}`, '_blank')}
                                            >
                                                <Navigation className="w-4 h-4 mr-1" />
                                                Navigate
                                            </Button>
                                            <Button
                                                className="flex-1 btn-bebax-primary text-sm"
                                                onClick={() => handleUpdateStatus(ride._id, 'delivered')}
                                                disabled={updatingStatus === ride._id}
                                            >
                                                {updatingStatus === ride._id ? 'Updating...' : 'Delivered'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Rides */}
            {driver.is_online && driver.verified && activeRides.length === 0 && (
                <div className="px-4 pb-4">
                    <h3 className="text-lg font-semibold mb-3">Available Rides</h3>
                    {!availableRides || availableRides.length === 0 ? (
                        <div className="card-bebax p-8 text-center">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-pulse" />
                            <p className="text-gray-600">Waiting for ride requests...</p>
                            <p className="text-sm text-gray-500">New requests will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {availableRides.map((ride) => (
                                <div key={ride._id} className="card-bebax-hover p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <p className="font-medium mb-1">📍 {ride.pickup_location.address}</p>
                                            <p className="text-sm text-gray-600">🎯 {ride.dropoff_location.address}</p>
                                        </div>
                                        <span className="text-bebax-green font-bold text-lg ml-2">
                                            {ride.fare_estimate.toLocaleString()} TZS
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                        <span>📏 {ride.distance} km</span>
                                        <span>🚚 {ride.vehicle_type}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3">📦 {ride.cargo_details}</p>
                                    <Button
                                        className="w-full btn-bebax-primary"
                                        onClick={() => handleAcceptRide(ride._id)}
                                        disabled={acceptingRide === ride._id}
                                    >
                                        {acceptingRide === ride._id ? 'Accepting...' : 'Accept Ride'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Verification Pending */}
            {!driver.verified && (
                <div className="px-4 pb-4">
                    <div className="card-bebax p-6 bg-yellow-50 border-2 border-yellow-200">
                        <div className="flex items-start space-x-3">
                            <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-yellow-900 mb-1">Verification Pending</h3>
                                <p className="text-sm text-yellow-800">
                                    Your documents are being reviewed. You'll be able to go online once verified.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
