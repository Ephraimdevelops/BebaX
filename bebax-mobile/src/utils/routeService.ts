// Google Maps API Key handling
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface RouteResult {
    distanceKm: number;
    durationMins: number;
    polyline: string;
    trafficDurationMins: number; // Raw traffic duration
    bufferedDurationMins: number; // With 15% buffer
}

/**
 * Fetches route data from Google Directions API.
 * Applies a 15% safety buffer to the traffic duration for pricing.
 */
export const getRouteData = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
): Promise<RouteResult | null> => {
    if (!GOOGLE_API_KEY) {
        console.error("Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY");
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${GOOGLE_API_KEY}&mode=driving&traffic_model=best_guess&departure_time=now`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
            console.error("Directions API Error:", data.status, data.error_message);
            return null;
        }

        const route = data.routes[0];
        const leg = route.legs[0];

        const distanceKm = leg.distance.value / 1000;
        const durationMins = leg.duration.value / 60;

        // Use duration_in_traffic if available (only with departure_time=now)
        const trafficDurationSeconds = leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value;
        const trafficDurationMins = trafficDurationSeconds / 60;

        // Apply 15% Buffer
        const bufferedDurationMins = trafficDurationMins * 1.15;

        return {
            distanceKm,
            durationMins,
            polyline: route.overview_polyline.points,
            trafficDurationMins,
            bufferedDurationMins
        };

    } catch (error) {
        console.error("Error fetching route:", error);
        return null;
    }
};

/**
 * Calculates a Safe Lock Price based on real API data.
 * @param basePrice Base vehicle price
 * @param perKmRate Rate per km
 * @param perMinRate Rate per minute (traffic)
 * @param route Route data from getRouteData
 */
export const calculateSafeLockPrice = (
    basePrice: number,
    perKmRate: number,
    perMinRate: number,
    route: RouteResult
): number => {
    const distanceCost = route.distanceKm * perKmRate;
    const timeCost = route.bufferedDurationMins * perMinRate;
    const subtotal = basePrice + distanceCost + timeCost;

    // Round to nearest 500 TZS
    return Math.ceil(subtotal / 500) * 500;
};
