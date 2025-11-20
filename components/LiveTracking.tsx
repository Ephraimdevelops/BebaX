'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Map from './Map';
import ChatButton from './ChatButton';
import { Navigation, Clock, MapPin, User, Phone } from 'lucide-react';
import { formatDistance, formatDuration } from '@/lib/googleMaps';

interface LiveTrackingProps {
    rideId: any; // Id<"rides">
}

export default function LiveTracking({ rideId }: LiveTrackingProps) {
    const ride = useQuery(api.rides.getRide, { ride_id: rideId });
    const [eta, setEta] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const driverMarkerRef = useRef<google.maps.Marker | null>(null);
    const routePolylineRef = useRef<google.maps.Polyline | null>(null);

    // Calculate ETA when driver location updates
    useEffect(() => {
        if (!ride || !ride.driver_location_updates || ride.driver_location_updates.length === 0) {
            return;
        }

        const calculateETA = async () => {
            const latestLocation = ride.driver_location_updates?.[ride.driver_location_updates.length - 1];

            if (!latestLocation) return;

            // Determine destination based on status
            let destination;
            if (ride.status === 'accepted') {
                destination = ride.pickup_location;
            } else if (ride.status === 'ongoing') {
                destination = ride.dropoff_location;
            } else {
                return;
            }

            try {
                const directionsService = new google.maps.DirectionsService();
                const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                    directionsService.route(
                        {
                            origin: { lat: latestLocation.lat, lng: latestLocation.lng },
                            destination: { lat: destination.lat, lng: destination.lng },
                            travelMode: google.maps.TravelMode.DRIVING,
                        },
                        (result, status) => {
                            if (status === 'OK' && result) {
                                resolve(result);
                            } else {
                                reject(new Error(`Directions failed: ${status}`));
                            }
                        }
                    );
                });

                const route = result.routes[0];
                const leg = route.legs[0];

                setEta(leg.duration!.value / 60); // minutes
                setDistance(leg.distance!.value / 1000); // km

                // Draw route on map
                if (mapRef.current && routePolylineRef.current) {
                    routePolylineRef.current.setMap(null);
                }

                if (mapRef.current) {
                    routePolylineRef.current = new google.maps.Polyline({
                        path: route.overview_path,
                        geodesic: true,
                        strokeColor: '#00B14F',
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                        map: mapRef.current,
                    });
                }
            } catch (error) {
                console.error('Failed to calculate ETA:', error);
            }
        };

        calculateETA();
    }, [ride?.driver_location_updates, ride?.status]);

    if (!ride) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading ride details...</p>
                </div>
            </div>
        );
    }

    const latestDriverLocation = ride.driver_location_updates && ride.driver_location_updates.length > 0
        ? ride.driver_location_updates[ride.driver_location_updates.length - 1]
        : null;

    const markers = [];

    // Pickup marker
    markers.push({
        position: ride.pickup_location,
        title: 'Pickup',
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    });

    // Dropoff marker
    markers.push({
        position: ride.dropoff_location,
        title: 'Dropoff',
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    });

    // Driver marker (if available)
    if (latestDriverLocation) {
        markers.push({
            position: { lat: latestDriverLocation.lat, lng: latestDriverLocation.lng },
            title: 'Driver',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        });
    }

    const center = latestDriverLocation || ride.pickup_location;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Map */}
            <div className="relative h-[60vh]">
                <Map
                    center={center}
                    zoom={14}
                    markers={markers}
                    className="w-full h-full"
                />

                {/* ETA Card */}
                {eta !== null && (
                    <div className="absolute top-4 left-4 right-4 bg-white rounded-2xl shadow-bebax-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-bebax-green-light rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-bebax-green" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        {ride.status === 'accepted' ? 'Arriving in' : 'Destination in'}
                                    </p>
                                    <p className="text-2xl font-bold text-bebax-black">
                                        {formatDuration(eta)}
                                    </p>
                                </div>
                            </div>
                            {distance !== null && (
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Distance</p>
                                    <p className="text-lg font-semibold text-bebax-black">
                                        {formatDistance(distance)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Trip Details */}
            <div className="relative -mt-8 bg-white rounded-t-3xl shadow-bebax-xl p-6">
                {/* Status */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Trip Status</h2>
                        <span className={`status-${ride.status}`}>
                            {ride.status === 'accepted' && 'Driver on the way'}
                            {ride.status === 'loading' && 'Loading items'}
                            {ride.status === 'ongoing' && 'In transit'}
                            {ride.status === 'delivered' && 'Delivered'}
                        </span>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ride.status === 'accepted' || ride.status === 'loading' || ride.status === 'ongoing' || ride.status === 'delivered'
                                ? 'bg-bebax-green' : 'bg-gray-200'
                                }`}>
                                {ride.status === 'accepted' || ride.status === 'loading' || ride.status === 'ongoing' || ride.status === 'delivered' ? (
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                ) : (
                                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Driver accepted</p>
                                <p className="text-sm text-gray-600">{ride.accepted_at || 'Waiting...'}</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ride.status === 'loading' || ride.status === 'ongoing' || ride.status === 'delivered'
                                ? 'bg-bebax-green' : 'bg-gray-200'
                                }`}>
                                {ride.status === 'loading' || ride.status === 'ongoing' || ride.status === 'delivered' ? (
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                ) : (
                                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Arrived at pickup</p>
                                <p className="text-sm text-gray-600">{ride.loading_started_at || 'Pending...'}</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ride.status === 'ongoing' || ride.status === 'delivered'
                                ? 'bg-bebax-green' : 'bg-gray-200'
                                }`}>
                                {ride.status === 'ongoing' || ride.status === 'delivered' ? (
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                ) : (
                                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Trip started</p>
                                <p className="text-sm text-gray-600">{ride.trip_started_at || 'Pending...'}</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ride.status === 'delivered' ? 'bg-bebax-green' : 'bg-gray-200'
                                }`}>
                                {ride.status === 'delivered' ? (
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                ) : (
                                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Delivered</p>
                                <p className="text-sm text-gray-600">{ride.delivered_at || 'Pending...'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Locations */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-bebax-green mt-1" />
                        <div>
                            <p className="text-sm text-gray-600">Pickup</p>
                            <p className="font-medium">{ride.pickup_location.address}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-red-600 mt-1" />
                        <div>
                            <p className="text-sm text-gray-600">Dropoff</p>
                            <p className="font-medium">{ride.dropoff_location.address}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button className="btn-bebax-secondary flex items-center justify-center space-x-2">
                        <Phone className="w-5 h-5" />
                        <span>Call Driver</span>
                    </button>
                    <ChatButton rideId={rideId} />
                </div>
            </div>
        </div>
    );
}
