/**
 * Google Maps Utilities for BebaX
 * Handles geocoding, reverse geocoding, directions, and distance calculation
 */

export interface Location {
    lat: number;
    lng: number;
    address?: string;
}

export interface DirectionsResult {
    distance: number; // in km
    duration: number; // in minutes
    polyline: string;
}

/**
 * Initialize Google Maps API
 * Call this once in your app
 */
export const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (typeof window.google !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
    });
};

/**
 * Geocode an address to coordinates
 */
export const geocodeAddress = async (address: string): Promise<Location> => {
    if (!address || address.trim().length === 0) {
        throw new Error('Address is required');
    }

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const location = results[0].geometry.location;
                resolve({
                    lat: location.lat(),
                    lng: location.lng(),
                    address: results[0].formatted_address,
                });
            } else {
                reject(new Error(`Geocoding failed: ${status}`));
            }
        });
    });
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                resolve(results[0].formatted_address);
            } else {
                reject(new Error(`Reverse geocoding failed: ${status}`));
            }
        });
    });
};

/**
 * Calculate distance and duration between two points
 */
export const getDirections = async (
    origin: Location,
    destination: Location
): Promise<DirectionsResult> => {
    const directionsService = new google.maps.DirectionsService();

    return new Promise((resolve, reject) => {
        directionsService.route(
            {
                origin: { lat: origin.lat, lng: origin.lng },
                destination: { lat: destination.lat, lng: destination.lng },
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    const route = result.routes[0];
                    const leg = route.legs[0];

                    resolve({
                        distance: leg.distance!.value / 1000, // Convert meters to km
                        duration: leg.duration!.value / 60, // Convert seconds to minutes
                        polyline: route.overview_polyline,
                    });
                } else {
                    reject(new Error(`Directions failed: ${status}`));
                }
            }
        );
    });
};

/**
 * Calculate distance using Haversine formula (fallback)
 */
export const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (degrees: number): number => {
    return (degrees * Math.PI) / 180;
};

/**
 * Get current user location
 */
export const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    const address = await reverseGeocode(lat, lng);
                    resolve({ lat, lng, address });
                } catch (error) {
                    resolve({ lat, lng });
                }
            },
            (error) => {
                reject(new Error(`Geolocation error: ${error.message}`));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
};

/**
 * Format distance for display
 */
export const formatDistance = (km: number): string => {
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
};

/**
 * Format duration for display
 */
export const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
};
