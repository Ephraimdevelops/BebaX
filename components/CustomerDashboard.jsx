'use client';

import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MapPin, Clock, Package, DollarSign, X, Loader2, Menu, Shield, Wallet, Banknote, Camera, Check, Navigation, CreditCard, Search, User, LogOut, Briefcase } from "lucide-react";
import OrganizationDashboard from './OrganizationDashboard';
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SmartAddressInput from "@/components/SmartAddressInput";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { mapUiTypeToBackend } from "@/lib/vehicleMapping";
import UserProfile from "@/components/profile/UserProfile";

// --- 1. PREMIUM CLEAN MAP STYLE (Desaturated Silver) ---
const MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: -6.7924,
    lng: 39.2083 // Dar es Salaam
};

const libraries = ['places', 'geometry'];

// --- PREMIUM SVG ICONS (Vector-First, Inline) ---
const BodaIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M5 17C3.89543 17 3 17.8954 3 19C3 20.1046 3.89543 21 5 21C6.10457 21 7 20.1046 7 19C7 17.8954 6.10457 17 5 17Z" fill="#121212" stroke="none" />
        <path d="M19 17C17.8954 17 17 17.8954 17 19C17 20.1046 17.8954 21 19 21C20.1046 21 21 20.1046 21 19C21 17.8954 20.1046 17 19 17Z" fill="#121212" stroke="none" />
        <path d="M15 6L9 8L8 12L13 12" stroke="#121212" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 19H5" stroke="#121212" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="19" cy="19" r="2" stroke="#121212" />
        <circle cx="5" cy="19" r="2" stroke="#121212" />
    </svg>
);

const BajajIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M12 2L4 6V18L12 22L20 18V6L12 2Z" stroke="#121212" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 22V12" stroke="#121212" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 12L20 6" stroke="#121212" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 12L4 6" stroke="#121212" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const KirikuuIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="2" y="4" width="20" height="14" rx="1" stroke="#121212" />
        <path d="M16 4V18" stroke="#121212" />
        <path d="M2 12H16" stroke="#121212" />
        <circle cx="6" cy="19" r="2" fill="#121212" stroke="none" />
        <circle cx="18" cy="19" r="2" fill="#121212" stroke="none" />
    </svg>
);

const PickupSIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M2 11L5 7H11L12 11H2Z" stroke="#121212" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="11" width="20" height="6" stroke="#121212" />
        <path d="M12 7V11" stroke="#121212" />
        <circle cx="6" cy="18" r="2" fill="#121212" stroke="none" />
        <circle cx="18" cy="18" r="2" fill="#121212" stroke="none" />
    </svg>
);

const PickupDIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M2 11L5 7H14L15 11H2Z" stroke="#121212" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="11" width="20" height="6" stroke="#121212" />
        <path d="M9 7V11" stroke="#121212" />
        <path d="M15 7V11" stroke="#121212" />
        <circle cx="6" cy="18" r="2" fill="#121212" stroke="none" />
        <circle cx="18" cy="18" r="2" fill="#121212" stroke="none" />
    </svg>
);

const TruckIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="2" y="6" width="14" height="11" rx="1" stroke="#121212" />
        <path d="M16 10H19L22 13V17H16V10Z" stroke="#121212" />
        <circle cx="6" cy="18" r="2" fill="#121212" stroke="none" />
        <circle cx="18" cy="18" r="2" fill="#121212" stroke="none" />
    </svg>
);

const SemiIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="2" y="5" width="12" height="12" stroke="#121212" />
        <rect x="16" y="9" width="6" height="8" stroke="#121212" />
        <circle cx="5" cy="18" r="2" fill="#121212" stroke="none" />
        <circle cx="11" cy="18" r="2" fill="#121212" stroke="none" />
        <circle cx="19" cy="18" r="2" fill="#121212" stroke="none" />
    </svg>
);

// --- VEHICLE FLEET ---
const VEHICLE_FLEET = [
    { id: 'boda', label: 'Boda Boda', price: '1,000', Icon: BodaIcon },
    { id: 'bajaj', label: 'Bajaji', price: '2,000', Icon: BajajIcon },
    { id: 'kirikuu', label: 'Kirikuu', price: '5,000', Icon: KirikuuIcon },
    { id: 'pickup_s', label: 'Pickup (S)', price: '8,000', Icon: PickupSIcon },
    { id: 'pickup_d', label: 'Pickup (D)', price: '10,000', Icon: PickupDIcon },
    { id: 'canter', label: 'Canter', price: '15,000', Icon: TruckIcon },
    { id: 'semi', label: 'Semi Trailer', price: '25,000', Icon: SemiIcon }
];

export default function CustomerDashboard() {
    const { user } = useUser();
    const { toast } = useToast();
    const currentProfile = useQuery(api.users.getCurrentProfile);
    const myRides = useQuery(api.rides.listMyRides);
    const createRide = useMutation(api.rides.create);
    const calculateFare = useAction(api.actions.ride.calculateFare);
    const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: libraries
    });

    const [map, setMap] = useState(null);
    const [showBooking, setShowBooking] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    // Booking State
    const [bookingForm, setBookingForm] = useState({
        pickupAddress: '',
        pickupLocation: null, // { lat, lng }
        dropoffAddress: '',
        dropoffLocation: null, // { lat, lng }
        vehicleType: '', // UI Type (e.g., 'kirikuu')
        cargoDetails: '',
        paymentMethod: 'cash', // 'cash' | 'wallet'
        insuranceTier: 'basic', // 'basic' | 'standard' | 'corporate'
        cargoPhoto: null, // File object
    });

    // Fare State
    const [activeTab, setActiveTab] = useState('book'); // 'book', 'activity', 'admin'
    const [fareDetails, setFareDetails] = useState(null); // { distance, duration, fare, polyline }
    const [routePath, setRoutePath] = useState([]);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    // Auto-select Corporate for Wallet
    useEffect(() => {
        if (bookingForm.paymentMethod === 'wallet') {
            setBookingForm(prev => ({ ...prev, insuranceTier: 'corporate' }));
        } else {
            setBookingForm(prev => ({ ...prev, insuranceTier: 'basic' }));
        }
    }, [bookingForm.paymentMethod]);

    // Calculate Fare when pickup/dropoff/vehicle changes
    useEffect(() => {
        const calculate = async () => {
            if (bookingForm.pickupLocation && bookingForm.dropoffLocation && bookingForm.vehicleType) {
                setIsCalculating(true);
                try {
                    const backendType = mapUiTypeToBackend(bookingForm.vehicleType);

                    const result = await calculateFare({
                        pickup: bookingForm.pickupLocation,
                        dropoff: bookingForm.dropoffLocation,
                        vehicleType: backendType,
                    });

                    setFareDetails(result);

                    if (window.google && window.google.maps && window.google.maps.geometry) {
                        const decodedPath = window.google.maps.geometry.encoding.decodePath(result.polyline);
                        setRoutePath(decodedPath);

                        if (map) {
                            const bounds = new window.google.maps.LatLngBounds();
                            decodedPath.forEach(point => bounds.extend(point));
                            map.fitBounds(bounds);
                        }
                    }
                } catch (error) {
                    console.error("Fare calculation failed:", error);
                    toast({
                        title: "Error",
                        description: "Failed to calculate fare. Please try again.",
                        variant: "destructive",
                    });
                } finally {
                    setIsCalculating(false);
                }
            }
        };

        calculate();
    }, [bookingForm.pickupLocation, bookingForm.dropoffLocation, bookingForm.vehicleType, calculateFare, map]);

    const handleBookRide = async (e) => {
        e.preventDefault();

        if (!bookingForm.vehicleType || !bookingForm.pickupLocation || !bookingForm.dropoffLocation) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        if (bookingForm.insuranceTier === 'standard' && !bookingForm.cargoPhoto) {
            toast({
                title: "Photo Required",
                description: "Standard insurance requires a photo of your cargo.",
                variant: "destructive",
            });
            return;
        }

        setIsCreating(true);
        try {
            const backendType = mapUiTypeToBackend(bookingForm.vehicleType);

            let cargoPhotoUrl = undefined;
            if (bookingForm.cargoPhoto) {
                // Upload photo
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": bookingForm.cargoPhoto.type },
                    body: bookingForm.cargoPhoto,
                });
                const { storageId } = await result.json();
                cargoPhotoUrl = storageId;
            }

            await createRide({
                pickup_location: {
                    lat: bookingForm.pickupLocation.lat,
                    lng: bookingForm.pickupLocation.lng,
                    address: bookingForm.pickupAddress,
                },
                dropoff_location: {
                    lat: bookingForm.dropoffLocation.lat,
                    lng: bookingForm.dropoffLocation.lng,
                    address: bookingForm.dropoffAddress,
                },
                vehicle_type: backendType,
                cargo_details: bookingForm.cargoDetails || "General items",
                payment_method: bookingForm.paymentMethod,
                insurance_opt_in: true,
                insurance_tier_id: bookingForm.insuranceTier,
                cargo_photos: cargoPhotoUrl ? [cargoPhotoUrl] : undefined,
                fare_estimate: fareDetails?.fare,
                distance: fareDetails?.distance,
            });

            toast({
                title: "Success!",
                description: "Your ride has been booked. Waiting for a driver...",
            });

            // Reset form
            setBookingForm({
                pickupAddress: '',
                pickupLocation: null,
                dropoffAddress: '',
                dropoffLocation: null,
                vehicleType: '',
                cargoDetails: '',
                paymentMethod: 'cash',
                insuranceTier: 'basic',
                cargoPhoto: null,
            });
            setFareDetails(null);
            setRoutePath([]);
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
        <div className="min-h-screen bg-[#F8FAFC] text-[#121212] font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <img src="/assets/branding/app-icon.png" alt="BebaX" className="w-10 h-10 rounded-xl shadow-lg shadow-orange-500/20" />
                            {/* Simplified Header: Removed text logo to fix spacing/pacing issues as requested */}
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            {/* Map Container */}
            <div className="relative h-[60vh] bg-gray-100">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={defaultCenter}
                        zoom={13}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={{
                            styles: MAP_STYLE, // Premium Clean Theme
                            disableDefaultUI: false,
                            zoomControl: true,
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: false,
                        }}
                    >
                        {bookingForm.pickupLocation && (
                            <Marker
                                position={bookingForm.pickupLocation}
                                title="Pickup"
                                icon={{
                                    url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                                }}
                            />
                        )}
                        {bookingForm.dropoffLocation && (
                            <Marker
                                position={bookingForm.dropoffLocation}
                                title="Dropoff"
                                icon={{
                                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                }}
                            />
                        )}
                        {routePath.length > 0 && (
                            <Polyline
                                path={routePath}
                                options={{
                                    strokeColor: "#FF5722", // Safety Orange
                                    strokeOpacity: 1.0,
                                    strokeWeight: 5,
                                }}
                            />
                        )}
                    </GoogleMap>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
                    </div>
                )}

                {/* Search Bar Trigger */}
                {!showBooking && (
                    <div className="absolute top-4 left-4 right-4 z-10">
                        <button
                            onClick={() => setShowBooking(true)}
                            className="w-full bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center space-x-3 hover:bg-gray-50 transition-all group"
                        >
                            <div className="w-10 h-10 bg-[#FF5722]/10 rounded-xl flex items-center justify-center group-hover:bg-[#FF5722]/20 transition-colors">
                                <MapPin className="w-5 h-5 text-[#FF5722]" />
                            </div>
                            <span className="text-gray-500 text-lg font-medium">Where do you want to move?</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Content */}
            <div className="relative -mt-8 bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-6 min-h-[40vh] border-t border-gray-100">
                {/* Tab Navigation */}
                <div className="flex justify-center space-x-3 mb-6">
                    <button
                        onClick={() => setActiveTab('book')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'book'
                            ? 'bg-[#FF5722] text-white shadow-lg shadow-orange-500/20'
                            : 'text-gray-600 hover:bg-gray-100'
                            } `}
                    >
                        <Navigation className="w-4 h-4" />
                        <span className="font-medium">Book Ride</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'activity'
                            ? 'bg-gray-900 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-100'
                            } `}
                    >
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">My Activity</span>
                    </button>

                    {/* Business Admin Tab */}
                    {currentProfile?.orgRole === 'admin' && (
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'admin'
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                : 'text-gray-600 hover:bg-gray-100'
                                } `}
                        >
                            <Briefcase className="w-4 h-4" />
                            <span className="font-medium">Business Admin</span>
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'profile'
                            ? 'bg-gray-900 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-100'
                            } `}
                    >
                        <User className="w-4 h-4" />
                        <span className="font-medium">Profile</span>
                    </button>
                </div>

                {activeTab === 'book' && (
                    <>
                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center group cursor-pointer">
                                <div className="w-12 h-12 bg-[#FF5722]/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-[#FF5722]/20 transition-colors">
                                    <TruckIcon className="w-6 h-6 text-[#FF5722]" />
                                </div>
                                <p className="text-2xl font-bold text-[#121212]">{myRides?.length || 0}</p>
                                <p className="text-xs text-gray-500">Total Rides</p>
                            </div>
                            <div className="text-center group cursor-pointer">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition-colors">
                                    <Clock className="w-6 h-6 text-blue-600" />
                                </div>
                                <p className="text-2xl font-bold text-[#121212]">
                                    {myRides?.filter(r => r.status === 'ongoing' || r.status === 'accepted').length || 0}
                                </p>
                                <p className="text-xs text-gray-500">Active</p>
                            </div>
                            <div className="text-center group cursor-pointer">
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-green-100 transition-colors">
                                    <Package className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-2xl font-bold text-[#121212]">
                                    {myRides?.filter(r => r.status === 'completed').length || 0}
                                </p>
                                <p className="text-xs text-gray-500">Completed</p>
                            </div>
                        </div>

                        {/* Recent Rides */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-[#121212]">Recent Rides</h3>
                            {!myRides || myRides.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                                    <TruckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 mb-2">No rides yet</p>
                                    <p className="text-sm text-gray-400">Book your first ride to get started</p>
                                    <Button
                                        onClick={() => setShowBooking(true)}
                                        className="mt-4 bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-orange-500/20"
                                    >
                                        Book a Ride
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myRides.slice(0, 5).map((ride) => (
                                        <div
                                            key={ride._id}
                                            className="bg-white border border-gray-100 p-4 rounded-xl hover:border-[#FF5722] hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-bold text-[#121212] mb-1 group-hover:text-[#FF5722] transition-colors">
                                                        {ride.pickup_location.address}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        → {ride.dropoff_location.address}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    } `}>
                                                    {ride.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <TruckIcon className="w-4 h-4 mr-1" />
                                                    {ride.vehicle_type}
                                                </span>
                                                <span className="flex items-center font-semibold text-[#121212]">
                                                    <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                                                    {(ride.final_fare || ride.fare_estimate).toLocaleString()} TZS
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 min-h-[600px]">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>

                        {myRides?.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No rides yet</h3>
                                <p className="text-gray-500">Your trip history will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myRides?.map((ride) => (
                                    <div key={ride._id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                                                {ride.vehicle_type === 'tricycle' && '🛺'}
                                                {ride.vehicle_type === 'van' && '🚐'}
                                                {ride.vehicle_type === 'truck' && '🚛'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{ride.pickup_location.address}</div>
                                                <div className="text-sm text-gray-500">{new Date(ride.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">TZS {ride.fare_estimate.toLocaleString()}</div>
                                            <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-1 ${ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                } `}>
                                                {ride.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'admin' && currentProfile?.orgRole === 'admin' && (
                    <OrganizationDashboard userProfile={currentProfile} />
                )}

                {activeTab === 'profile' && (
                    <UserProfile profile={currentProfile} user={user} />
                )}
            </div>

            {/* Booking Bottom Sheet */}
            {showBooking && (
                <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in backdrop-blur-sm" onClick={() => setShowBooking(false)}>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#121212]">Book a Ride</h2>
                            <button onClick={() => setShowBooking(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleBookRide} className="space-y-4">
                            {/* Pickup */}
                            <div>
                                <label className="block text-base font-bold mb-2 text-gray-900">Pickup Location</label>
                                <SmartAddressInput
                                    value={bookingForm.pickupAddress}
                                    onChange={(address, location) => setBookingForm(prev => ({ ...prev, pickupAddress: address, pickupLocation: location }))}
                                    placeholder="Where are you starting?"
                                    className="h-14 text-lg" // Larger input
                                />
                            </div>

                            {/* Dropoff */}
                            <div>
                                <label className="block text-base font-bold mb-2 text-gray-900">Drop-off Location</label>
                                <SmartAddressInput
                                    value={bookingForm.dropoffAddress}
                                    onChange={(address, location) => setBookingForm(prev => ({ ...prev, dropoffAddress: address, dropoffLocation: location }))}
                                    placeholder="Where are you going?"
                                    className="h-14 text-lg" // Larger input
                                />
                            </div>

                            {/* Cargo Details */}
                            <div>
                                <label className="block text-base font-bold mb-2 text-gray-900">What are you moving?</label>
                                <textarea
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 text-base text-[#121212] focus:border-[#FF5722] outline-none min-h-[100px] transition-colors placeholder:text-gray-400 focus:bg-white"
                                    placeholder="Describe your items (e.g., furniture, boxes, equipment)"
                                    value={bookingForm.cargoDetails}
                                    onChange={(e) => setBookingForm({ ...bookingForm, cargoDetails: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Vehicle Type */}
                            <div>
                                <label className="block text-sm font-medium mb-3 text-gray-500">Vehicle Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {VEHICLE_FLEET.map((vehicle) => (
                                        <button
                                            key={vehicle.id}
                                            type="button"
                                            onClick={() => setBookingForm({ ...bookingForm, vehicleType: vehicle.id })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all group ${bookingForm.vehicleType === vehicle.id
                                                ? 'border-[#FF5722] bg-[#FF5722]/5'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                } `}
                                        >
                                            <div className={`mb-3 ${bookingForm.vehicleType === vehicle.id ? 'text-[#FF5722]' : 'text-gray-400 group-hover:text-[#121212]'} `}>
                                                <vehicle.Icon className="w-10 h-10" />
                                            </div>
                                            <p className={`font-bold ${bookingForm.vehicleType === vehicle.id ? 'text-[#FF5722]' : 'text-[#121212]'} `}>
                                                {vehicle.label}
                                            </p>
                                            <p className="text-sm text-gray-500">from {vehicle.price} TZS</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            {currentProfile?.orgId && (
                                <div>
                                    <label className="block text-sm font-medium mb-3 text-gray-500">Payment Method</label>
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setBookingForm({ ...bookingForm, paymentMethod: 'cash' })}
                                            className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center space-x-2 transition-all ${bookingForm.paymentMethod === 'cash' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-500'} `}
                                        >
                                            <Banknote size={16} />
                                            <span className="font-bold">Cash</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBookingForm({ ...bookingForm, paymentMethod: 'wallet' })}
                                            className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center space-x-2 transition-all ${bookingForm.paymentMethod === 'wallet' ? 'border-[#FF5722] bg-[#FF5722] text-white' : 'border-gray-200 text-gray-500'} `}
                                        >
                                            <Wallet size={16} />
                                            <span className="font-bold">Company Wallet</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Insurance Tier */}
                            <div>
                                <label className="block text-base font-bold mb-3 text-gray-900">Trip Protection</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setBookingForm({ ...bookingForm, insuranceTier: 'basic' })}
                                        disabled={bookingForm.paymentMethod === 'wallet'}
                                        className={`p-3 rounded-xl border-2 text-left transition-all ${bookingForm.insuranceTier === 'basic' ? 'border-gray-900 bg-gray-50' : 'border-gray-100'} `}
                                    >
                                        <Shield size={20} className="mb-2 text-gray-900" />
                                        <p className="font-bold text-xs">Basic</p>
                                        <p className="text-[10px] text-gray-500">+500 TZS</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setBookingForm({ ...bookingForm, insuranceTier: 'standard' })}
                                        disabled={bookingForm.paymentMethod === 'wallet'}
                                        className={`p-3 rounded-xl border-2 text-left transition-all ${bookingForm.insuranceTier === 'standard' ? 'border-[#FF5722] bg-orange-50' : 'border-gray-100'} `}
                                    >
                                        <div className="flex justify-between">
                                            <Shield size={20} className="mb-2 text-[#FF5722]" />
                                            <Camera size={14} className="text-[#FF5722]" />
                                        </div>
                                        <p className="font-bold text-xs text-[#FF5722]">Standard</p>
                                        <p className="text-[10px] text-gray-500">+2,500 TZS</p>
                                    </button>

                                    {bookingForm.paymentMethod === 'wallet' && (
                                        <button
                                            type="button"
                                            disabled
                                            className="p-3 rounded-xl border-2 border-[#FF5722] bg-[#FF5722] text-left"
                                        >
                                            <div className="flex justify-between">
                                                <Shield size={20} className="mb-2 text-white" />
                                                <Check size={14} className="text-white" />
                                            </div>
                                            <p className="font-bold text-xs text-white">Corporate</p>
                                            <p className="text-[10px] text-white/80">INCLUDED</p>
                                        </button>
                                    )}
                                </div>

                                {/* Photo Upload for Standard Insurance */}
                                {bookingForm.insuranceTier === 'standard' && (
                                    <div className="mt-4 bg-orange-50 p-4 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-bold text-[#FF5722] mb-2">
                                            <Camera size={16} className="inline mr-1" />
                                            Cargo Photo Required
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setBookingForm({ ...bookingForm, cargoPhoto: e.target.files[0] })}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FF5722] file:text-white hover:file:bg-[#E64A19]"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Fare Estimate */}
                            {fareDetails && (
                                <div className="bg-[#FF5722]/5 p-4 rounded-xl border border-[#FF5722]/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600 font-medium">Estimated Fare</span>
                                        <span className="text-xl font-bold text-[#FF5722]">
                                            {fareDetails.fare.toLocaleString()} TZS
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Distance: {fareDetails.distance.toFixed(1)} km</span>
                                        <span>Duration: {Math.round(fareDetails.duration)} min</span>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBooking(false)}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-[#FF5722] text-white font-bold hover:bg-[#E64A19] disabled:opacity-50 shadow-lg shadow-orange-500/20 transition-all"
                                    disabled={isCreating || isCalculating || !fareDetails}
                                >
                                    {isCreating ? 'Booking...' : isCalculating ? 'Calculating...' : 'Book Ride'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

