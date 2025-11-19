'use client';

import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Truck, MapPin, Clock, Package, DollarSign, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
    const { user } = useUser();
    const { toast } = useToast();
    const currentProfile = useQuery(api.users.getCurrentProfile);
    const myRides = useQuery(api.rides.listMyRides);
    const createRide = useMutation(api.rides.create);

    const [showBooking, setShowBooking] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [mapCenter] = useState({ lat: -6.7924, lng: 39.2083 }); // Dar es Salaam
    const [bookingForm, setBookingForm] = useState({
        pickupAddress: '',
        dropoffAddress: '',
        vehicleType: '',
        cargoDetails: '',
    });

    const handleBookRide = async (e) => {
        e.preventDefault();

        if (!bookingForm.vehicleType) {
            toast({
                title: "Error",
                description: "Please select a vehicle type",
                variant: "destructive",
            });
            return;
        }

        setIsCreating(true);
        try {
            // For now, use dummy coordinates (will add Google Maps later)
            const pickupLat = -6.7924 + (Math.random() - 0.5) * 0.1;
            const pickupLng = 39.2083 + (Math.random() - 0.5) * 0.1;
            const dropoffLat = -6.8160 + (Math.random() - 0.5) * 0.1;
            const dropoffLng = 39.2803 + (Math.random() - 0.5) * 0.1;

            await createRide({
                pickup_location: {
                    lat: pickupLat,
                    lng: pickupLng,
                    address: bookingForm.pickupAddress || "Dar es Salaam",
                },
                dropoff_location: {
                    lat: dropoffLat,
                    lng: dropoffLng,
                    address: bookingForm.dropoffAddress || "Ubungo",
                },
                vehicle_type: bookingForm.vehicleType,
                cargo_details: bookingForm.cargoDetails || "General items",
            });

            toast({
                title: "Success!",
                description: "Your ride has been booked. Waiting for a driver...",
            });

            // Reset form
            setBookingForm({
                pickupAddress: '',
                dropoffAddress: '',
                vehicleType: '',
                cargoDetails: '',
            });
            setShowBooking(false);
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to book ride",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-bebax-sm">
                <div className="px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-bebax-green rounded-xl flex items-center justify-center">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-bebax-black">BebaX</h1>
                                <p className="text-xs text-gray-500">Hi, {user?.firstName}!</p>
                            </div>
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            {/* Map Container */}
            <div className="relative h-[60vh] bg-gradient-to-br from-bebax-green-light to-bebax-green/20">
                {/* Map placeholder - will show real map once NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <MapPin className="w-16 h-16 text-bebax-green mx-auto mb-4 animate-pulse-green" />
                        <p className="text-gray-700 font-medium mb-1">Map Ready</p>
                        <p className="text-sm text-gray-500">Add GOOGLE_MAPS_API_KEY to .env.local</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="absolute top-4 left-4 right-4 z-10">
                    <button
                        onClick={() => setShowBooking(true)}
                        className="w-full bg-white rounded-2xl shadow-bebax-lg p-4 flex items-center space-x-3 hover:shadow-bebax-xl transition-all"
                    >
                        <div className="w-10 h-10 bg-bebax-green-light rounded-xl flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-bebax-green" />
                        </div>
                        <span className="text-gray-600 text-lg">Where do you want to move?</span>
                    </button>
                </div>
            </div>

            {/* Bottom Content */}
            <div className="relative -mt-8 bg-white rounded-t-3xl shadow-bebax-xl p-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-bebax-green-light rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Truck className="w-6 h-6 text-bebax-green" />
                        </div>
                        <p className="text-2xl font-bold text-bebax-black">{myRides?.length || 0}</p>
                        <p className="text-xs text-gray-500">Total Rides</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-bebax-black">
                            {myRides?.filter(r => r.status === 'ongoing' || r.status === 'accepted').length || 0}
                        </p>
                        <p className="text-xs text-gray-500">Active</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Package className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-bebax-black">
                            {myRides?.filter(r => r.status === 'completed').length || 0}
                        </p>
                        <p className="text-xs text-gray-500">Completed</p>
                    </div>
                </div>

                {/* Recent Rides */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Rides</h3>
                    {!myRides || myRides.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl">
                            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 mb-2">No rides yet</p>
                            <p className="text-sm text-gray-500">Book your first ride to get started</p>
                            <Button
                                onClick={() => setShowBooking(true)}
                                className="mt-4 btn-bebax-primary"
                            >
                                Book a Ride
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myRides.slice(0, 5).map((ride) => (
                                <div
                                    key={ride._id}
                                    className="card-bebax-hover p-4"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <p className="font-medium text-bebax-black mb-1">
                                                {ride.pickup_location.address}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                → {ride.dropoff_location.address}
                                            </p>
                                        </div>
                                        <span className={`status-${ride.status} ml-2`}>
                                            {ride.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span className="flex items-center">
                                            <Truck className="w-4 h-4 mr-1" />
                                            {ride.vehicle_type}
                                        </span>
                                        <span className="flex items-center">
                                            <DollarSign className="w-4 h-4 mr-1" />
                                            {(ride.final_fare || ride.fare_estimate).toLocaleString()} TZS
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Bottom Sheet */}
            {showBooking && (
                <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setShowBooking(false)}>
                    <div className="bottom-sheet animate-slide-up p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-bebax-h2">Book a Ride</h2>
                            <button onClick={() => setShowBooking(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleBookRide} className="space-y-4">
                            {/* Pickup */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Pickup Location</label>
                                <div className="input-bebax flex items-center">
                                    <MapPin className="w-5 h-5 text-bebax-green mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Enter pickup address"
                                        className="flex-1 outline-none"
                                        value={bookingForm.pickupAddress}
                                        onChange={(e) => setBookingForm({ ...bookingForm, pickupAddress: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Dropoff */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Drop-off Location</label>
                                <div className="input-bebax flex items-center">
                                    <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Enter destination"
                                        className="flex-1 outline-none"
                                        value={bookingForm.dropoffAddress}
                                        onChange={(e) => setBookingForm({ ...bookingForm, dropoffAddress: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Cargo Details */}
                            <div>
                                <label className="block text-sm font-medium mb-2">What are you moving?</label>
                                <textarea
                                    className="input-bebax min-h-[80px]"
                                    placeholder="Describe your items (e.g., furniture, boxes, equipment)"
                                    value={bookingForm.cargoDetails}
                                    onChange={(e) => setBookingForm({ ...bookingForm, cargoDetails: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Vehicle Type */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Vehicle Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { type: 'tricycle', name: 'Tricycle', price: '2,000', icon: '🛺' },
                                        { type: 'van', name: 'Van', price: '5,000', icon: '🚐' },
                                        { type: 'truck', name: 'Truck', price: '8,000', icon: '🚚' },
                                        { type: 'semitrailer', name: 'Semi-trailer', price: '15,000', icon: '🚛' },
                                    ].map((vehicle) => (
                                        <button
                                            key={vehicle.type}
                                            type="button"
                                            onClick={() => setBookingForm({ ...bookingForm, vehicleType: vehicle.type })}
                                            className={bookingForm.vehicleType === vehicle.type ? 'vehicle-card-selected' : 'vehicle-card'}
                                        >
                                            <span className="text-3xl mb-2">{vehicle.icon}</span>
                                            <p className="font-medium">{vehicle.name}</p>
                                            <p className="text-sm text-gray-600">from {vehicle.price} TZS</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBooking(false)}
                                    className="flex-1 btn-bebax-secondary"
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-bebax-primary"
                                    disabled={isCreating}
                                >
                                    {isCreating ? 'Booking...' : 'Book Ride'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
