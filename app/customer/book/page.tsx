'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import {
    MapPin, Navigation, Search, X, Truck, Clock,
    AlertCircle, Check, ArrowRight, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VehicleSelectionSheet } from '@/components/VehicleSelectionSheet';
import { SmartCargoSelector } from '@/components/SmartCargoSelector';
import { RideMap } from '@/components/RideMap';
import { VEHICLE_FLEET, VehicleId, getVehicleById } from '@/lib/vehicleRegistry';
import {
    loadGoogleMapsScript,
    getCurrentLocation,
    geocodeAddress,
    getDirections,
    formatDistance,
    formatDuration,
    Location
} from '@/lib/googleMaps';
import Link from 'next/link';

// Calculate fare (simplified - should match mobile pricing)
function calculateFare(vehicleId: VehicleId, distanceKm: number): number {
    const vehicle = getVehicleById(vehicleId);
    if (!vehicle) return 0;

    const baseFare = vehicle.baseFare;
    const perKmRate = vehicle.tier === 1 ? 800 : vehicle.tier === 2 ? 1200 : 1500;

    return Math.round(baseFare + (distanceKm * perKmRate));
}

export default function BookPage() {
    const { user } = useUser();
    const [step, setStep] = useState<'addresses' | 'vehicle' | 'cargo' | 'confirm'>('addresses');

    // Location state
    const [pickup, setPickup] = useState<Location | null>(null);
    const [dropoff, setDropoff] = useState<Location | null>(null);
    const [pickupInput, setPickupInput] = useState('');
    const [dropoffInput, setDropoffInput] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Booking state
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleId | null>(null);
    const [cargoType, setCargoType] = useState<string | null>(null);
    const [routeData, setRouteData] = useState<{ distance: number; duration: number } | null>(null);
    const [isBooking, setIsBooking] = useState(false);
    const [mapsLoaded, setMapsLoaded] = useState(false);

    // Mutations
    const createRide = useMutation(api.rides.create);

    // Load Google Maps
    useEffect(() => {
        loadGoogleMapsScript()
            .then(() => setMapsLoaded(true))
            .catch(console.error);
    }, []);

    // Get current location on mount
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

    // Calculate route when both locations set
    useEffect(() => {
        if (!pickup || !dropoff || !mapsLoaded) return;

        getDirections(pickup, dropoff)
            .then(result => {
                setRouteData({ distance: result.distance, duration: result.duration });
            })
            .catch(console.error);
    }, [pickup, dropoff, mapsLoaded]);

    // Handle address search
    const handleAddressSearch = async (query: string, isPickup: boolean) => {
        if (!mapsLoaded || query.length < 3) return;

        setIsSearching(true);
        try {
            const location = await geocodeAddress(query + ', Tanzania');
            if (isPickup) {
                setPickup(location);
                setPickupInput(location.address || query);
            } else {
                setDropoff(location);
                setDropoffInput(location.address || query);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle vehicle selection
    const handleVehicleSelect = (id: VehicleId) => {
        setSelectedVehicle(id);
    };

    // Handle cargo selection
    const handleCargoSelect = (type: string) => {
        setCargoType(type);
        setStep('confirm');
    };

    // Handle booking
    const handleBook = async () => {
        if (!pickup || !dropoff || !selectedVehicle || !user) return;

        setIsBooking(true);
        try {
            await createRide({
                pickup_location: {
                    lat: pickup.lat,
                    lng: pickup.lng,
                    address: pickup.address || pickupInput,
                },
                dropoff_location: {
                    lat: dropoff.lat,
                    lng: dropoff.lng,
                    address: dropoff.address || dropoffInput,
                },
                vehicle_type: selectedVehicle,
                fare_estimate: fare,
                distance: routeData?.distance || 0,
                cargo_details: cargoType || 'general',
                payment_method: 'cash',
            });

            // Redirect to ride status
            window.location.href = '/customer/ride-status';
        } catch (error: any) {
            alert(error.message || 'Booking failed');
        } finally {
            setIsBooking(false);
        }
    };

    const fare = selectedVehicle && routeData
        ? calculateFare(selectedVehicle, routeData.distance)
        : 0;

    const canProceedToVehicle = pickup && dropoff;
    const canProceedToCargo = selectedVehicle !== null;
    const canBook = pickup && dropoff && selectedVehicle && cargoType;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Map Background */}
            <div className="fixed inset-0 z-0">
                <RideMap
                    pickup={pickup || undefined}
                    dropoff={dropoff || undefined}
                    showRoute={!!pickup && !!dropoff}
                    className="w-full h-full"
                />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/customer" className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow hover:shadow-md transition-shadow">
                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Book a Ride</h1>
                        <p className="text-slate-500 text-sm">Get your cargo delivered</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {['addresses', 'vehicle', 'cargo', 'confirm'].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === s ? 'bg-purple-600 text-white' :
                                ['addresses', 'vehicle', 'cargo', 'confirm'].indexOf(step) > i
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                }`}>
                                {['addresses', 'vehicle', 'cargo', 'confirm'].indexOf(step) > i
                                    ? <Check className="w-4 h-4" />
                                    : i + 1}
                            </div>
                            {i < 3 && <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 mx-1" />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Addresses */}
                {step === 'addresses' && (
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl max-w-lg mx-auto">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                Where to?
                            </h2>

                            {/* Pickup */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Pickup Location
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full" />
                                    <Input
                                        value={pickupInput}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupInput(e.target.value)}
                                        onBlur={() => handleAddressSearch(pickupInput, true)}
                                        placeholder="Enter pickup address"
                                        className="pl-8 h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                                    />
                                    <button
                                        onClick={handleGetCurrentLocation}
                                        disabled={isLoadingLocation}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                                    >
                                        {isLoadingLocation ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Navigation className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Dropoff */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Dropoff Location
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
                                    <Input
                                        value={dropoffInput}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDropoffInput(e.target.value)}
                                        onBlur={() => handleAddressSearch(dropoffInput, false)}
                                        placeholder="Enter destination"
                                        className="pl-8 h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Route Info */}
                            {routeData && (
                                <div className="flex items-center justify-around p-4 bg-slate-50 dark:bg-slate-700 rounded-xl mb-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {formatDistance(routeData.distance)}
                                        </p>
                                        <p className="text-xs text-slate-500">Distance</p>
                                    </div>
                                    <div className="w-px h-10 bg-slate-200 dark:bg-slate-600" />
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {formatDuration(routeData.duration)}
                                        </p>
                                        <p className="text-xs text-slate-500">Est. Time</p>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={() => setStep('vehicle')}
                                disabled={!canProceedToVehicle}
                                className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl"
                            >
                                Select Vehicle
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Vehicle Selection */}
                {step === 'vehicle' && (
                    <div className="max-w-2xl mx-auto">
                        <VehicleSelectionSheet
                            onSelectVehicle={handleVehicleSelect}
                            onConfirm={() => setStep('cargo')}
                        />

                        {/* Fare Preview */}
                        {selectedVehicle && routeData && (
                            <Card className="mt-4 bg-white dark:bg-slate-800 border-0 shadow-lg">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Estimated Fare</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            TZS {fare.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">{formatDistance(routeData.distance)}</p>
                                        <p className="text-sm text-slate-500">{formatDuration(routeData.duration)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Step 3: Cargo Type */}
                {step === 'cargo' && (
                    <div className="max-w-md mx-auto">
                        <SmartCargoSelector
                            onSelect={handleCargoSelect}
                            onClose={() => setStep('vehicle')}
                        />
                    </div>
                )}

                {/* Step 4: Confirm */}
                {step === 'confirm' && (
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl max-w-lg mx-auto">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                                Confirm Booking
                            </h2>

                            {/* Summary */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5" />
                                    <div>
                                        <p className="text-xs text-slate-500">PICKUP</p>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium">{pickup?.address || pickupInput}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5" />
                                    <div>
                                        <p className="text-xs text-slate-500">DROPOFF</p>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium">{dropoff?.address || dropoffInput}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle & Fare */}
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600 dark:text-slate-400">Vehicle</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {getVehicleById(selectedVehicle!)?.label}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600 dark:text-slate-400">Distance</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {routeData ? formatDistance(routeData.distance) : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600 dark:text-slate-400">Cargo Type</span>
                                    <span className="font-bold text-slate-900 dark:text-white capitalize">{cargoType}</span>
                                </div>
                                <hr className="border-purple-200 dark:border-purple-700 my-3" />
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                                    <span className="text-2xl font-black text-purple-600">
                                        TZS {fare.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setStep('cargo')}
                                    variant="outline"
                                    className="flex-1 h-14 rounded-xl"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleBook}
                                    disabled={isBooking || !canBook}
                                    className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl"
                                >
                                    {isBooking ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        'Confirm Booking'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
