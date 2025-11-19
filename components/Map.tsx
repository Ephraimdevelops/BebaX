'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript } from '@/lib/googleMaps';
import { Loader2 } from 'lucide-react';

interface MapProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: Array<{
        position: { lat: number; lng: number };
        title?: string;
        icon?: string;
    }>;
    onMapClick?: (lat: number, lng: number) => void;
    className?: string;
}

export default function Map({
    center = { lat: -6.7924, lng: 39.2083 }, // Dar es Salaam
    zoom = 13,
    markers = [],
    onMapClick,
    className = 'w-full h-full',
}: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);

    // Initialize map
    useEffect(() => {
        const initMap = async () => {
            try {
                await loadGoogleMapsScript();

                if (!mapRef.current) return;

                const newMap = new google.maps.Map(mapRef.current, {
                    center,
                    zoom,
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }],
                        },
                    ],
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                if (onMapClick) {
                    newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
                        if (e.latLng) {
                            onMapClick(e.latLng.lat(), e.latLng.lng());
                        }
                    });
                }

                setMap(newMap);
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Failed to load map');
                setLoading(false);
            }
        };

        initMap();
    }, []);

    // Update markers
    useEffect(() => {
        if (!map) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add new markers
        markers.forEach(markerData => {
            const marker = new google.maps.Marker({
                position: markerData.position,
                map,
                title: markerData.title,
                icon: markerData.icon,
            });
            markersRef.current.push(marker);
        });
    }, [map, markers]);

    // Update center
    useEffect(() => {
        if (map && center) {
            map.setCenter(center);
        }
    }, [map, center]);

    if (loading) {
        return (
            <div className={`${className} bg-gray-100 flex items-center justify-center rounded-2xl`}>
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-bebax-green animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading map...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${className} bg-red-50 flex items-center justify-center rounded-2xl`}>
                <div className="text-center p-4">
                    <p className="text-red-600 font-medium mb-1">Map Error</p>
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return <div ref={mapRef} className={className} />;
}
