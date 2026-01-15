'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMapsScript } from '@/lib/googleMaps';
import { Loader2, MapPin } from 'lucide-react';

interface Location {
    lat: number;
    lng: number;
}

interface MarkerConfig {
    position: Location;
    title?: string;
    icon?: string;
    type?: 'pickup' | 'dropoff' | 'driver' | 'default';
}

interface RideMapProps {
    pickup?: Location;
    dropoff?: Location;
    driverLocation?: Location;
    routePolyline?: string;
    showRoute?: boolean;
    onPickupSelect?: (location: Location, address: string) => void;
    onDropoffSelect?: (location: Location, address: string) => void;
    selectionMode?: 'pickup' | 'dropoff' | null;
    className?: string;
    zoom?: number;
}

// Custom marker icons as SVG data URLs
const MARKER_ICONS = {
    pickup: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#22C55E"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
    `),
    dropoff: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#EF4444"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
    `),
    driver: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#8B5CF6" stroke="white" stroke-width="4"/>
            <path d="M20 10L26 25H14L20 10Z" fill="white"/>
        </svg>
    `),
};

export function RideMap({
    pickup,
    dropoff,
    driverLocation,
    routePolyline,
    showRoute = true,
    onPickupSelect,
    onDropoffSelect,
    selectionMode,
    className = 'w-full h-full',
    zoom = 14,
}: RideMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs to track markers and polyline
    const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
    const dropoffMarkerRef = useRef<google.maps.Marker | null>(null);
    const driverMarkerRef = useRef<google.maps.Marker | null>(null);
    const routeLineRef = useRef<google.maps.Polyline | null>(null);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

    // Initialize map
    useEffect(() => {
        const initMap = async () => {
            try {
                await loadGoogleMapsScript();
                if (!mapRef.current) return;

                const defaultCenter = pickup || dropoff || { lat: -6.7924, lng: 39.2083 };

                const newMap = new google.maps.Map(mapRef.current, {
                    center: defaultCenter,
                    zoom,
                    styles: [
                        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                    ],
                    disableDefaultUI: true,
                    zoomControl: true,
                    gestureHandling: 'greedy',
                });

                // Handle map clicks for location selection
                newMap.addListener('click', async (e: google.maps.MapMouseEvent) => {
                    if (!e.latLng || !selectionMode) return;

                    const location = { lat: e.latLng.lat(), lng: e.latLng.lng() };

                    // Reverse geocode to get address
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ location }, (results, status) => {
                        const address = status === 'OK' && results?.[0]
                            ? results[0].formatted_address
                            : 'Unknown location';

                        if (selectionMode === 'pickup' && onPickupSelect) {
                            onPickupSelect(location, address);
                        } else if (selectionMode === 'dropoff' && onDropoffSelect) {
                            onDropoffSelect(location, address);
                        }
                    });
                });

                // Initialize directions renderer
                directionsRendererRef.current = new google.maps.DirectionsRenderer({
                    map: newMap,
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: '#8B5CF6',
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                    },
                });

                setMap(newMap);
                setLoading(false);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load map';
                setError(message);
                setLoading(false);
            }
        };

        initMap();
    }, []);

    // Update pickup marker
    useEffect(() => {
        if (!map || !pickup) return;

        if (pickupMarkerRef.current) {
            pickupMarkerRef.current.setPosition(pickup);
        } else {
            pickupMarkerRef.current = new google.maps.Marker({
                position: pickup,
                map,
                title: 'Pickup',
                icon: {
                    url: MARKER_ICONS.pickup,
                    scaledSize: new google.maps.Size(32, 40),
                    anchor: new google.maps.Point(16, 40),
                },
            });
        }
    }, [map, pickup]);

    // Update dropoff marker
    useEffect(() => {
        if (!map || !dropoff) return;

        if (dropoffMarkerRef.current) {
            dropoffMarkerRef.current.setPosition(dropoff);
        } else {
            dropoffMarkerRef.current = new google.maps.Marker({
                position: dropoff,
                map,
                title: 'Dropoff',
                icon: {
                    url: MARKER_ICONS.dropoff,
                    scaledSize: new google.maps.Size(32, 40),
                    anchor: new google.maps.Point(16, 40),
                },
            });
        }
    }, [map, dropoff]);

    // Update driver marker with animation
    useEffect(() => {
        if (!map || !driverLocation) return;

        if (driverMarkerRef.current) {
            // Animate marker movement
            const startPos = driverMarkerRef.current.getPosition();
            if (startPos) {
                const frames = 30;
                let frame = 0;
                const animate = () => {
                    frame++;
                    const progress = frame / frames;
                    const lat = startPos.lat() + (driverLocation.lat - startPos.lat()) * progress;
                    const lng = startPos.lng() + (driverLocation.lng - startPos.lng()) * progress;
                    driverMarkerRef.current?.setPosition({ lat, lng });
                    if (frame < frames) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
        } else {
            driverMarkerRef.current = new google.maps.Marker({
                position: driverLocation,
                map,
                title: 'Driver',
                icon: {
                    url: MARKER_ICONS.driver,
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 20),
                },
                zIndex: 100,
            });
        }
    }, [map, driverLocation]);

    // Draw route between pickup and dropoff
    useEffect(() => {
        if (!map || !pickup || !dropoff || !showRoute) return;

        const directionsService = new google.maps.DirectionsService();

        directionsService.route(
            {
                origin: pickup,
                destination: dropoff,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK' && result && directionsRendererRef.current) {
                    directionsRendererRef.current.setDirections(result);

                    // Fit bounds to show entire route
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(pickup);
                    bounds.extend(dropoff);
                    if (driverLocation) bounds.extend(driverLocation);
                    map.fitBounds(bounds, { top: 50, bottom: 150, left: 50, right: 50 });
                }
            }
        );
    }, [map, pickup, dropoff, showRoute]);

    // Fit bounds when locations change
    useEffect(() => {
        if (!map) return;

        const bounds = new google.maps.LatLngBounds();
        let hasBounds = false;

        if (pickup) { bounds.extend(pickup); hasBounds = true; }
        if (dropoff) { bounds.extend(dropoff); hasBounds = true; }
        if (driverLocation) { bounds.extend(driverLocation); hasBounds = true; }

        if (hasBounds) {
            map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        }
    }, [map, pickup, dropoff, driverLocation]);

    if (loading) {
        return (
            <div className={`${className} bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}>
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Loading map...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${className} bg-red-50 dark:bg-red-900/20 flex items-center justify-center`}>
                <div className="text-center p-4">
                    <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 font-medium">Map Error</p>
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div ref={mapRef} className={className} />

            {/* Selection Mode Indicator */}
            {selectionMode && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-lg">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Tap to set {selectionMode === 'pickup' ? 'pickup' : 'dropoff'} location
                    </p>
                </div>
            )}
        </div>
    );
}

export default RideMap;
