'use client';

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Truck, DollarSign, TrendingUp, Clock, CheckCircle, Navigation, MapPin, Power } from "lucide-react";
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
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <div className="text-center">
                    <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Driver profile not found</p>
                    <p className="text-sm text-gray-400 mt-2">Please complete driver registration</p>
                </div>
            </div>
        );
    }

    const activeRides = myRides?.filter(r => r.status === 'accepted' || r.status === 'ongoing' || r.status === 'loading') || [];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-[#121212]">
            {/* Header with Online Toggle */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-[#FF5722] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">BebaX Driver</h2>
                                <div className="flex items-center mt-1">
                                    {driver.verified ? (
                                        <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                            <CheckCircle className="w-3 h-3 mr-1" /> VERIFIED
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                                            <Clock className="w-3 h-3 mr-1" /> PENDING
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleOnline}
                            disabled={!driver.verified}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 ${driver.is_online
                                ? 'bg-[#00C853] text-white shadow-lg shadow-green-500/20 hover:bg-[#00BFA5]'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Power className="w-4 h-4" />
                            <span>{driver.is_online ? 'ONLINE' : 'OFFLINE'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Stats & Earnings */}
                    <div className="space-y-6">
                        {/* Earnings Card */}
                        <div className="bg-[#121212] rounded-3xl p-6 text-white shadow-xl shadow-black/10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-gray-400">Total Earnings</h3>
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-4xl font-bold mb-2 tracking-tight">
                                {(earnings?.total || 0).toLocaleString()} <span className="text-lg text-gray-400 font-normal">TZS</span>
                            </p>
                            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Today</p>
                                    <p className="text-lg font-bold">{(earnings?.today || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Week</p>
                                    <p className="text-lg font-bold">{(earnings?.week || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Month</p>
                                    <p className="text-lg font-bold">{(earnings?.month || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Wallet Balance */}
                        {wallet && (
                            <div className={`rounded-3xl p-6 border transition-all ${wallet.balance < 0
                                ? 'bg-red-50 border-red-100'
                                : 'bg-white border-gray-100 shadow-sm'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-[#121212]">Wallet Balance</h3>
                                    {wallet.locked && (
                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                            LOCKED
                                        </span>
                                    )}
                                </div>
                                <p className={`text-3xl font-bold mb-2 ${wallet.balance < 0 ? 'text-red-600' : 'text-[#00C853]'
                                    }`}>
                                    {wallet.balance.toLocaleString()} TZS
                                </p>

                                {wallet.balance < 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-red-600 mb-3 font-medium">
                                            {wallet.lock_reason || `Outstanding balance: ${Math.abs(wallet.balance).toLocaleString()} TZS`}
                                        </p>
                                        <Button
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-6"
                                            onClick={() => toast({
                                                title: "Payment",
                                                description: "M-Pesa integration coming soon.",
                                            })}
                                        >
                                            Pay Now
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-xl font-bold text-[#121212]">{driver.total_trips}</p>
                                <p className="text-xs text-gray-500 font-medium">Trips</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                <p className="text-xl font-bold text-[#121212]">{driver.rating.toFixed(1)}</p>
                                <p className="text-xs text-gray-500 font-medium">Rating</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-xl font-bold text-[#121212]">{activeRides.length}</p>
                                <p className="text-xs text-gray-500 font-medium">Active</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Rides */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Active Rides */}
                        {activeRides.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-[#121212] mb-4 flex items-center">
                                    <span className="w-2 h-8 bg-[#00C853] rounded-full mr-3"></span>
                                    Active Rides
                                </h3>
                                <div className="space-y-4">
                                    {activeRides.map((ride) => (
                                        <div key={ride._id} className="bg-white rounded-3xl p-6 border-2 border-[#00C853] shadow-lg shadow-green-500/10">
                                            <div className="flex items-center justify-between mb-6">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                                    {ride.status === 'accepted' && 'Heading to Pickup'}
                                                    {ride.status === 'loading' && 'Loading Items'}
                                                    {ride.status === 'ongoing' && 'In Transit'}
                                                </span>
                                                <span className="font-bold text-2xl text-[#121212]">
                                                    {(ride.final_fare || ride.fare_estimate).toLocaleString()} TZS
                                                </span>
                                            </div>

                                            <div className="space-y-4 mb-6">
                                                <div className="flex items-start">
                                                    <MapPin className="w-5 h-5 text-[#FF5722] mt-0.5 mr-3" />
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Pickup</p>
                                                        <p className="font-medium text-[#121212]">{ride.pickup_location.address}</p>
                                                    </div>
                                                </div>
                                                <div className="w-full h-[1px] bg-gray-100 pl-8" />
                                                <div className="flex items-start">
                                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Dropoff</p>
                                                        <p className="font-medium text-[#121212]">{ride.dropoff_location.address}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex space-x-3">
                                                {ride.status === 'accepted' && (
                                                    <>
                                                        <Button
                                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#121212] font-bold py-6 rounded-xl"
                                                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.pickup_location.lat},${ride.pickup_location.lng}`, '_blank')}
                                                        >
                                                            <Navigation className="w-5 h-5 mr-2" />
                                                            Navigate
                                                        </Button>
                                                        <Button
                                                            className="flex-1 bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-500/20"
                                                            onClick={() => handleUpdateStatus(ride._id, 'loading')}
                                                            disabled={updatingStatus === ride._id}
                                                        >
                                                            {updatingStatus === ride._id ? 'Updating...' : 'Arrived at Pickup'}
                                                        </Button>
                                                    </>
                                                )}

                                                {ride.status === 'loading' && (
                                                    <Button
                                                        className="flex-1 bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-500/20"
                                                        onClick={() => handleUpdateStatus(ride._id, 'ongoing')}
                                                        disabled={updatingStatus === ride._id}
                                                    >
                                                        {updatingStatus === ride._id ? 'Updating...' : 'Start Trip'}
                                                    </Button>
                                                )}

                                                {ride.status === 'ongoing' && (
                                                    <>
                                                        <Button
                                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#121212] font-bold py-6 rounded-xl"
                                                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.dropoff_location.lat},${ride.dropoff_location.lng}`, '_blank')}
                                                        >
                                                            <Navigation className="w-5 h-5 mr-2" />
                                                            Navigate
                                                        </Button>
                                                        <Button
                                                            className="flex-1 bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-500/20"
                                                            onClick={() => handleUpdateStatus(ride._id, 'delivered')}
                                                            disabled={updatingStatus === ride._id}
                                                        >
                                                            {updatingStatus === ride._id ? 'Updating...' : 'Arrived at Dropoff'}
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
                            <div>
                                <h3 className="text-xl font-bold text-[#121212] mb-4 flex items-center">
                                    <span className="w-2 h-8 bg-[#FF5722] rounded-full mr-3"></span>
                                    Available Rides
                                </h3>
                                {!availableRides || availableRides.length === 0 ? (
                                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Clock className="w-10 h-10 text-gray-300 animate-pulse" />
                                        </div>
                                        <h4 className="text-lg font-bold text-[#121212] mb-2">Searching for rides...</h4>
                                        <p className="text-gray-500">Stay in high demand areas to get more requests.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {availableRides.map((ride) => (
                                            <div key={ride._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-[#FF5722]/30 group">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="bg-gray-50 p-2 rounded-xl">
                                                            <Truck className="w-6 h-6 text-[#121212]" />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-[#FF5722] uppercase tracking-wider bg-[#FF5722]/10 px-2 py-1 rounded-full">
                                                                {ride.vehicle_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-2xl font-bold text-[#121212]">
                                                        {ride.fare_estimate.toLocaleString()} TZS
                                                    </span>
                                                </div>

                                                <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-2xl">
                                                    <div className="flex items-start">
                                                        <MapPin className="w-5 h-5 text-[#FF5722] mt-0.5 mr-3" />
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Pickup</p>
                                                            <p className="font-medium text-[#121212]">{ride.pickup_location.address}</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-[1px] bg-gray-200" />
                                                    <div className="flex items-start">
                                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Dropoff</p>
                                                            <p className="font-medium text-[#121212]">{ride.dropoff_location.address}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-sm text-gray-500 mb-6 px-2">
                                                    <span className="flex items-center"><Navigation className="w-4 h-4 mr-1" /> {ride.distance} km trip</span>
                                                    <span>{ride.cargo_details}</span>
                                                </div>

                                                <Button
                                                    className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-500/20"
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
                            <div className="bg-yellow-50 rounded-3xl p-6 border border-yellow-100">
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-yellow-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-yellow-900 mb-1">Verification Pending</h3>
                                        <p className="text-sm text-yellow-800 leading-relaxed">
                                            Your documents are currently being reviewed by our team. You will be able to go online and accept rides once your account is verified. This usually takes 24-48 hours.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
