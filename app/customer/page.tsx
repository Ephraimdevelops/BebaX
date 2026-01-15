'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    MapPin, Navigation, Clock, Truck, Package,
    AlertCircle, Bell, User, Search, ChevronRight,
    Home, Loader2, Camera, CreditCard, Wallet, Plus, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RideMap } from '@/components/RideMap';
import { VEHICLE_FLEET, VehicleId, getVehicleById } from '@/lib/vehicleRegistry';
import {
    loadGoogleMapsScript,
    getCurrentLocation,
    geocodeAddress,
    getDirections,
    Location
} from '@/lib/googleMaps';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Orange theme colors (matching mobile)
const COLORS = {
    primary: '#F97316',      // Orange-500
    primaryDark: '#EA580C',  // Orange-600
    success: '#22C55E',
    dark: '#0F172A',
    muted: '#64748B',
    light: '#F1F5F9',
};

// Vehicle images mapping
const VEHICLE_IMAGES: Record<string, string> = {
    boda: '/vehicles/boda.png',
    toyo: '/vehicles/toyo.png',
    kirikuu: '/vehicles/kirikuu.png',
    canter: '/vehicles/canter.png',
    fuso: '/vehicles/fuso.png',
};

// Cargo size options (matching mobile REFERENCE_OBJECTS)
const CARGO_SIZES = [
    { id: 'photo', label: 'Photo', icon: Camera, vehicle: 'boda' },
    { id: 'small', label: 'Small', icon: Package, vehicle: 'boda' },
    { id: 'medium', label: 'Medium', icon: Package, vehicle: 'toyo' },
    { id: 'large', label: 'Large', icon: Truck, vehicle: 'kirikuu' },
    { id: 'xlarge', label: 'X-Large', icon: Truck, vehicle: 'canter' },
];

// Calculate fare
function calculateFare(vehicleId: VehicleId, distanceKm: number): number {
    const vehicle = getVehicleById(vehicleId);
    if (!vehicle) return 0;
    const baseFare = vehicle.baseFare;
    const perKmRate = vehicle.tier === 1 ? 800 : vehicle.tier === 2 ? 1200 : 1500;
    return Math.round(baseFare + (distanceKm * perKmRate));
}

function getZeroStatePricing(vehicleId: VehicleId) {
    const vehicle = getVehicleById(vehicleId);
    return {
        displayLabel: 'STARTS AT',
        displayPrice: `${((vehicle?.baseFare || 3000) / 1000).toFixed(0)}K TZS`
    };
}

export default function CustomerDashboard() {
    const { user, isSignedIn } = useUser();
    const router = useRouter();

    // Location state
    const [pickup, setPickup] = useState<Location | null>(null);
    const [dropoff, setDropoff] = useState<Location | null>(null);
    const [pickupInput, setPickupInput] = useState('Current Location');
    const [dropoffInput, setDropoffInput] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [mapsLoaded, setMapsLoaded] = useState(false);

    // Booking state
    const [vehicleType, setVehicleType] = useState<VehicleId>('boda');
    const [missionMode, setMissionMode] = useState<'item' | 'move'>('item');
    const [selectedCargo, setSelectedCargo] = useState<string | null>('small');
    const [isFragile, setIsFragile] = useState(false);
    const [helpersCount, setHelpersCount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    const [isBooking, setIsBooking] = useState(false);
    const [routeData, setRouteData] = useState<{ distance: number; duration: number } | null>(null);

    // UI state
    const [searchMode, setSearchMode] = useState<'pickup' | 'dropoff' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Convex
    const createRide = useMutation(api.rides.create);
    const activeRide = useQuery(api.rides.getActiveRide);

    // Load maps
    useEffect(() => {
        loadGoogleMapsScript()
            .then(() => setMapsLoaded(true))
            .catch(console.error);
    }, []);

    // Get current location
    const handleGetCurrentLocation = useCallback(async () => {
        if (!mapsLoaded) return;
        setIsLoadingLocation(true);
        try {
            const location = await getCurrentLocation();
            setPickup(location);
            setPickupInput(location.address || 'Current Location');
        } catch (error) {
            console.error('Location error:', error);
        } finally {
            setIsLoadingLocation(false);
        }
    }, [mapsLoaded]);

    // Auto-get location on mount
    useEffect(() => {
        if (mapsLoaded && !pickup) {
            handleGetCurrentLocation();
        }
    }, [mapsLoaded, pickup, handleGetCurrentLocation]);

    // Calculate route when both locations set
    useEffect(() => {
        if (!pickup || !dropoff || !mapsLoaded) return;
        getDirections(pickup, dropoff)
            .then(result => setRouteData({ distance: result.distance, duration: result.duration }))
            .catch(console.error);
    }, [pickup, dropoff, mapsLoaded]);

    // Handle address search
    const handleAddressSearch = async (query: string, isPickup: boolean) => {
        if (!mapsLoaded || query.length < 3) return;
        try {
            const location = await geocodeAddress(query + ', Tanzania');
            if (isPickup) {
                setPickup(location);
                setPickupInput(location.address || query);
            } else {
                setDropoff(location);
                setDropoffInput(location.address || query);
            }
            setSearchMode(null);
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    };

    // Handle booking
    const handleBookRide = async () => {
        if (!isSignedIn) {
            router.push('/sign-in');
            return;
        }

        if (!pickup || !dropoff) {
            alert('Please select pickup and dropoff locations');
            return;
        }

        setIsBooking(true);
        try {
            await createRide({
                pickup_location: {
                    lat: pickup.lat,
                    lng: pickup.lng,
                    address: pickup.address || pickupInput
                },
                dropoff_location: {
                    lat: dropoff.lat,
                    lng: dropoff.lng,
                    address: dropoff.address || dropoffInput
                },
                vehicle_type: vehicleType,
                cargo_details: missionMode === 'move' ? 'House Move' : (selectedCargo || 'Package'),
                cargo_size: (selectedCargo === 'small' || selectedCargo === 'medium' || selectedCargo === 'large' || selectedCargo === 'xlarge')
                    ? (selectedCargo === 'xlarge' ? 'huge' : selectedCargo as 'small' | 'medium' | 'large')
                    : 'medium',
                is_fragile: isFragile,
                helpers_count: helpersCount,
                payment_method: paymentMethod,
            });
            router.push('/customer/ride-status');
        } catch (error) {
            console.error('Booking error:', error);
            alert('Failed to book ride');
        } finally {
            setIsBooking(false);
        }
    };

    // Calculate fare
    const fare = routeData && vehicleType
        ? calculateFare(vehicleType, routeData.distance)
        : 0;
    const hasDestination = !!dropoff;

    // If there's an active ride, redirect
    if (activeRide) {
        router.push('/customer/ride-status');
        return null;
    }

    return (
        <div className="min-h-screen bg-white relative">
            {/* 1. MAP BACKGROUND */}
            <div className="fixed inset-0 z-0">
                <RideMap
                    pickup={pickup || undefined}
                    dropoff={dropoff || undefined}
                    showRoute={!!pickup && !!dropoff}
                    className="w-full h-full"
                />
            </div>

            {/* 2. HEADER (Profile + Notifications) */}
            <div className="fixed top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
                <Link
                    href={isSignedIn ? "/customer/profile" : "/sign-in"}
                    className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
                >
                    {isSignedIn ? (
                        <span className="text-lg font-bold text-slate-900">
                            {user?.firstName?.charAt(0) || 'U'}
                        </span>
                    ) : (
                        <User className="w-5 h-5 text-slate-500" />
                    )}
                </Link>

                <div className="flex items-center gap-3">
                    {isSignedIn ? (
                        <Link
                            href="/customer/notifications"
                            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
                        >
                            <Bell className="w-5 h-5 text-slate-900" />
                        </Link>
                    ) : (
                        <Link
                            href="/sign-in"
                            className="px-5 py-3 rounded-full shadow-lg text-white font-bold"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            Log in
                        </Link>
                    )}
                </div>
            </div>

            {/* 3. FLOATING ADDRESS CARD */}
            <div className="fixed top-20 left-4 right-4 z-10">
                <div className="bg-white rounded-2xl shadow-lg p-4">
                    {/* Pickup Row */}
                    <button
                        onClick={() => setSearchMode('pickup')}
                        className="w-full flex items-center gap-3 py-2"
                    >
                        <div className="flex flex-col items-center w-6">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS.primary }}
                            />
                            <div className="w-0.5 h-6 bg-slate-200" />
                        </div>
                        <span className="flex-1 text-left font-semibold text-slate-900 truncate">
                            {pickupInput || 'Current Location'}
                        </span>
                    </button>

                    <div className="h-px bg-slate-100 ml-9" />

                    {/* Dropoff Row */}
                    <button
                        onClick={() => setSearchMode('dropoff')}
                        className="w-full flex items-center gap-3 py-2"
                    >
                        <div className="flex flex-col items-center w-6">
                            <div className="w-3 h-3 bg-slate-900" />
                        </div>
                        <span className={`flex-1 text-left font-semibold truncate ${dropoffInput ? 'text-slate-900' : 'text-slate-400'}`}>
                            {dropoffInput || 'Where to?'}
                        </span>
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-full">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className="text-xs font-semibold text-slate-500">Now</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* 4. SEARCH OVERLAY */}
            {searchMode && (
                <div className="fixed inset-0 z-50 bg-white">
                    <div className="p-4 pt-safe">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => setSearchMode(null)}
                                className="p-2"
                            >
                                <ChevronRight className="w-6 h-6 text-slate-900 rotate-180" />
                            </button>
                            <h2 className="text-xl font-bold text-slate-900">
                                {searchMode === 'pickup' ? 'Set Pickup' : 'Set Dropoff'}
                            </h2>
                        </div>

                        <input
                            type="text"
                            placeholder={searchMode === 'pickup' ? 'Enter pickup location' : 'Where are you going?'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddressSearch(searchQuery, searchMode === 'pickup');
                                }
                            }}
                            className="w-full px-4 py-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400"
                            autoFocus
                        />

                        <p className="mt-4 text-sm text-slate-500 text-center">
                            Type an address and press Enter
                        </p>
                    </div>
                </div>
            )}

            {/* 5. BOTTOM BOOKING SHEET */}
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <h2 className="text-lg font-bold text-slate-900">Choose Your Ride</h2>
                </div>

                {/* Vehicle Cards - Horizontal Scroll */}
                <div className="overflow-x-auto px-4 pb-4">
                    <div className="flex gap-3" style={{ width: 'max-content' }}>
                        {VEHICLE_FLEET.slice(0, 5).map((vehicle) => {
                            const isSelected = vehicleType === vehicle.id;
                            const pricing = hasDestination && routeData
                                ? {
                                    displayLabel: 'Est. Total',
                                    displayPrice: `${Math.round(calculateFare(vehicle.id, routeData.distance) / 1000)}K TZS`
                                }
                                : getZeroStatePricing(vehicle.id);

                            return (
                                <button
                                    key={vehicle.id}
                                    onClick={() => setVehicleType(vehicle.id)}
                                    className={`flex-shrink-0 w-28 p-3 rounded-2xl border-2 transition-all ${isSelected
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-slate-200 bg-white'
                                        }`}
                                >
                                    {/* ETA Badge */}
                                    <div
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full mb-2 w-fit ${isSelected
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                            }`}
                                    >
                                        15+ min
                                    </div>

                                    {/* Vehicle Image */}
                                    <div className="h-12 flex items-center justify-center mb-2">
                                        <Truck className={`w-10 h-10 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`} />
                                    </div>

                                    {/* Label */}
                                    <p className={`font-bold text-sm text-center ${isSelected ? 'text-orange-500' : 'text-slate-900'}`}>
                                        {vehicle.label.toUpperCase()}
                                    </p>

                                    {/* Price */}
                                    <p className={`text-xs text-center ${hasDestination ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {pricing.displayLabel}
                                    </p>
                                    <p className={`font-bold text-center ${isSelected ? 'text-orange-500' : 'text-slate-900'}`}>
                                        {pricing.displayPrice}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Mission Mode Toggle */}
                <div className="flex gap-2 px-4 pb-3">
                    <button
                        onClick={() => setMissionMode('item')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${missionMode === 'item'
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-slate-200 text-slate-600'
                            }`}
                    >
                        <Package className="w-4 h-4" />
                        <span className="font-semibold text-sm">Send Item</span>
                    </button>
                    <button
                        onClick={() => setMissionMode('move')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${missionMode === 'move'
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-slate-200 text-slate-600'
                            }`}
                    >
                        <Home className="w-4 h-4" />
                        <span className="font-semibold text-sm">Move House</span>
                    </button>
                </div>

                {/* Cargo Size Selector (for item mode) */}
                {missionMode === 'item' && (
                    <div className="px-4 pb-3">
                        <p className="text-sm text-slate-500 mb-2">What are you sending?</p>
                        <div className="flex gap-2 overflow-x-auto">
                            {CARGO_SIZES.map((cargo) => {
                                const Icon = cargo.icon;
                                const isSelected = selectedCargo === cargo.id;
                                return (
                                    <button
                                        key={cargo.id}
                                        onClick={() => setSelectedCargo(cargo.id)}
                                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl border-2 min-w-[70px] ${isSelected
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-slate-200'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`} />
                                        <span className={`text-xs font-semibold ${isSelected ? 'text-orange-600' : 'text-slate-600'}`}>
                                            {cargo.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Select a size to filter vehicles.</p>
                    </div>
                )}

                {/* Inline Controls Row */}
                <div className="flex items-center justify-between px-4 pb-4">
                    {/* Fragile Toggle */}
                    <button
                        onClick={() => setIsFragile(!isFragile)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border ${isFragile
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-slate-200 text-slate-500'
                            }`}
                    >
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Fragile</span>
                    </button>

                    {/* Helpers Counter */}
                    {missionMode === 'move' && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Helpers</span>
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-full border border-amber-200">
                                <button
                                    onClick={() => setHelpersCount(Math.max(0, helpersCount - 1))}
                                    className="p-1"
                                >
                                    <Minus className="w-3 h-3 text-amber-700" />
                                </button>
                                <span className="w-4 text-center text-sm font-bold text-amber-700">{helpersCount}</span>
                                <button
                                    onClick={() => setHelpersCount(Math.min(4, helpersCount + 1))}
                                    className="p-1"
                                >
                                    <Plus className="w-3 h-3 text-amber-700" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Payment Toggle */}
                    <button
                        onClick={() => setPaymentMethod(paymentMethod === 'cash' ? 'wallet' : 'cash')}
                        className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 text-slate-600"
                    >
                        {paymentMethod === 'cash' ? (
                            <CreditCard className="w-4 h-4" />
                        ) : (
                            <Wallet className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium capitalize">{paymentMethod}</span>
                    </button>
                </div>

                {/* BOOK BUTTON */}
                <div className="px-4 pb-6 pb-safe">
                    <Button
                        onClick={handleBookRide}
                        disabled={isBooking || !pickup || !dropoff}
                        className="w-full h-14 rounded-2xl text-white font-bold text-lg disabled:opacity-50"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        {isBooking ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            `BOOK ${vehicleType.toUpperCase()}`
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
