/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BebaX "BONGO" Pricing Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Cost-Plus Model: BASE + DISTANCE (Fuel) + TIME (Traffic)
 * 
 * Real-World Variables:
 * - Fuel prices (Petrol/Diesel) 
 * - Vehicle fuel efficiency (km/L)
 * - Traffic opportunity cost (TZS/min)
 * - Winding road factor (straight line ≠ road distance)
 * - Dynamic speed based on distance (city vs highway)
 * 
 * @author BebaX Engineering
 * @version 2.0 - Bongo Edition
 */

import { VehicleId, getVehicleById } from '../constants/vehicleRegistry';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS - Tanzanian Market (January 2026)
// ═══════════════════════════════════════════════════════════════════════════════

/** Petrol price in TZS per liter */
export const FUEL_PRICE_PETROL = 3200;

/** Diesel price in TZS per liter */
export const FUEL_PRICE_DIESEL = 3100;

/** Profit margin multiplier (30% markup on raw fuel costs) */
export const PROFIT_MARGIN = 1.3;

/** Earth radius in kilometers (for Haversine calculation) */
const EARTH_RADIUS_KM = 6371;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface RoadMetrics {
    /** Straight-line distance in km */
    haversineKm: number;
    /** Estimated road distance with winding factor */
    roadDistanceKm: number;
    /** Winding factor applied (1.3 - 1.5) */
    windingFactor: number;
    /** Estimated speed in km/h based on distance */
    estimatedSpeedKmh: number;
    /** Estimated travel time in minutes */
    estimatedMinutes: number;
}

export interface FareBreakdown {
    /** Base booking fee */
    base: number;
    /** Fuel-based distance cost */
    distance: number;
    /** Traffic/opportunity time cost */
    time: number;
}

export interface FareResult {
    /** Final fare rounded to nearest 500 TZS */
    total: number;
    /** Raw total before rounding */
    rawTotal: number;
    /** Itemized breakdown */
    breakdown: FareBreakdown;
    /** Currency code */
    currency: 'TZS';
    /** Road metrics used in calculation */
    metrics: RoadMetrics;
    /** Vehicle used */
    vehicleId: VehicleId;
    /** Display-ready string */
    displayPrice: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAVERSINE DISTANCE CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate straight-line distance between two GPS coordinates
 * Uses Haversine formula accounting for Earth's curvature
 */
export const calculateHaversineDistance = (
    start: GeoPoint,
    end: GeoPoint
): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(end.lat - start.lat);
    const dLng = toRad(end.lng - start.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(start.lat)) *
        Math.cos(toRad(end.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS_KM * c;

    return Math.round(distance * 100) / 100; // 2 decimal places
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP A: THE "APPROPRIATE ROUTE" SIMULATION (Mock Router)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estimate real road metrics from GPS coordinates
 * Since we don't have Google Directions API, we apply winding factors:
 * - Short trips (<5km): 1.5x (lots of turns in city center)
 * - Medium trips (5-15km): 1.3x (mixed roads)
 * - Long trips (>15km): 1.3x (highways tend to be straighter)
 * 
 * Also applies dynamic speed based on typical Dar es Salaam traffic:
 * - <5km: 15 km/h (city center congestion)
 * - 5-15km: 30 km/h (standard traffic)
 * - >15km: 45 km/h (highway sections)
 */
export const getEstimatedRoadMetrics = (
    start: GeoPoint,
    end: GeoPoint
): RoadMetrics => {
    const haversineKm = calculateHaversineDistance(start, end);

    // Apply winding factor based on distance
    let windingFactor: number;
    let estimatedSpeedKmh: number;

    if (haversineKm < 5) {
        // Short trip - city center, lots of turns
        windingFactor = 1.5;
        estimatedSpeedKmh = 15; // Heavy traffic
    } else if (haversineKm > 15) {
        // Long trip - likely includes highway sections
        windingFactor = 1.3;
        estimatedSpeedKmh = 45; // Highway speeds
    } else {
        // Medium trip - mixed roads
        windingFactor = 1.3;
        estimatedSpeedKmh = 30; // Standard traffic
    }

    const roadDistanceKm = haversineKm * windingFactor;
    const estimatedMinutes = (roadDistanceKm / estimatedSpeedKmh) * 60;

    return {
        haversineKm,
        roadDistanceKm: Math.round(roadDistanceKm * 10) / 10, // 1 decimal
        windingFactor,
        estimatedSpeedKmh,
        estimatedMinutes: Math.round(estimatedMinutes),
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP B & C: THE BONGO PRICING FORMULA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate fare using the Cost-Plus model
 * 
 * FORMULA:
 * FuelCost = (RoadDistance / FuelEfficiency) × FuelPrice
 * DistanceFare = FuelCost × PROFIT_MARGIN
 * TimeFare = EstimatedMinutes × TrafficRate
 * 
 * TOTAL = BaseFare + DistanceFare + TimeFare
 * 
 * @param vehicleId - Vehicle type from registry
 * @param pickup - Pickup GPS coordinates
 * @param dropoff - Dropoff GPS coordinates
 * @returns FareResult with total and breakdown
 */
export const calculateFare = (
    vehicleId: VehicleId,
    pickup: GeoPoint,
    dropoff: GeoPoint
): FareResult => {
    // Get vehicle specs
    const vehicle = getVehicleById(vehicleId);
    if (!vehicle) {
        throw new Error(`Invalid vehicle ID: ${vehicleId}`);
    }

    // Get road metrics
    const metrics = getEstimatedRoadMetrics(pickup, dropoff);

    // Determine fuel price based on vehicle type
    const fuelPrice = vehicle.fuelType === 'diesel'
        ? FUEL_PRICE_DIESEL
        : FUEL_PRICE_PETROL;

    // STEP B: Calculate fuel cost with profit margin
    const litersUsed = metrics.roadDistanceKm / vehicle.fuelEfficiency;
    const rawFuelCost = litersUsed * fuelPrice;
    const distanceFare = Math.round(rawFuelCost * PROFIT_MARGIN);

    // STEP C: Calculate time fare
    const timeFare = Math.round(metrics.estimatedMinutes * vehicle.trafficRate);

    // FINAL CALCULATION
    const baseFare = vehicle.baseFare;
    const rawTotal = baseFare + distanceFare + timeFare;

    // Round UP to nearest 500 TZS for easy cash handling
    const total = Math.ceil(rawTotal / 500) * 500;

    return {
        total,
        rawTotal,
        breakdown: {
            base: baseFare,
            distance: distanceFare,
            time: timeFare,
        },
        currency: 'TZS',
        metrics,
        vehicleId,
        displayPrice: formatTZS(total),
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP D: SAFE LOCK PRICING (Google API)
// ═══════════════════════════════════════════════════════════════════════════════

export interface RouteResult {
    distanceKm: number;
    durationMins: number;
    polyline: string;
    trafficDurationMins: number; // Raw traffic duration
    bufferedDurationMins: number; // With 15% buffer
}

/**
 * Calculate the FINAL LOCKED FARE using real Google API data
 * 
 * Uses the same formula but with ACTUAL distance/time instead of estimates:
 * - Distance: Actual road distance from API
 * - Time: Buffered traffic duration (Traffic Duration * 1.15)
 */
export const calculateLockedFare = (
    vehicleId: VehicleId,
    route: RouteResult
): FareResult => {
    // Get vehicle specs
    const vehicle = getVehicleById(vehicleId);
    if (!vehicle) throw new Error(`Invalid vehicle ID: ${vehicleId}`);

    // Determine fuel price
    const fuelPrice = vehicle.fuelType === 'diesel' ? FUEL_PRICE_DIESEL : FUEL_PRICE_PETROL;

    // STEP B: Calculate fuel cost (Real Distance)
    const litersUsed = route.distanceKm / vehicle.fuelEfficiency;
    const rawFuelCost = litersUsed * fuelPrice;
    const distanceFare = Math.round(rawFuelCost * PROFIT_MARGIN);

    // STEP C: Calculate time fare (Buffered Real Time)
    const timeFare = Math.round(route.bufferedDurationMins * vehicle.trafficRate);

    // FINAL CALCULATION
    const baseFare = vehicle.baseFare;
    const rawTotal = baseFare + distanceFare + timeFare;

    // Round UP to nearest 500 TZS
    const total = Math.ceil(rawTotal / 500) * 500;

    // Create metrics object compatible with FareResult
    const metrics: RoadMetrics = {
        haversineKm: route.distanceKm, // Approximate since we have real road distance
        roadDistanceKm: route.distanceKm,
        windingFactor: 1, // Real road usage
        estimatedSpeedKmh: (route.distanceKm / (route.durationMins / 60)) || 0,
        estimatedMinutes: Math.round(route.bufferedDurationMins)
    };

    return {
        total,
        rawTotal,
        breakdown: {
            base: baseFare,
            distance: distanceFare,
            time: timeFare,
        },
        currency: 'TZS',
        metrics, // Include real metrics
        vehicleId,
        displayPrice: formatTZS(total),
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format TZS currency for display
 */
export const formatTZS = (amount: number): string => {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M TZS`;
    }
    if (amount >= 1000) {
        return `${Math.round(amount / 1000)}K TZS`;
    }
    return `${amount} TZS`;
};

/**
 * Get zero-state pricing (when no destination is set)
 * Shows "Starts at [BaseFare]" for each vehicle
 */
export const getZeroStatePricing = (vehicleId: VehicleId): {
    displayLabel: string;
    displayPrice: string;
    baseFare: number;
} => {
    const vehicle = getVehicleById(vehicleId);
    if (!vehicle) {
        return {
            displayLabel: 'Starts at',
            displayPrice: '---',
            baseFare: 0,
        };
    }
    return {
        displayLabel: 'Starts at',
        displayPrice: formatTZS(vehicle.baseFare),
        baseFare: vehicle.baseFare,
    };
};

/**
 * Estimate ETA in minutes based on road metrics
 */
export const estimateETA = (pickup: GeoPoint, dropoff: GeoPoint): number => {
    const metrics = getEstimatedRoadMetrics(pickup, dropoff);
    return metrics.estimatedMinutes;
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY (for existing code)
// ═══════════════════════════════════════════════════════════════════════════════

/** @deprecated Use calculateFare instead */
export const calculateDistance = calculateHaversineDistance;

/** @deprecated Use calculateFare instead */
export const calculateEstFare = (
    baseFare: number,
    perKmRate: number,
    distanceKm: number
) => {
    console.warn('[DEPRECATED] Use calculateFare() for accurate pricing');
    const total = Math.ceil((baseFare + perKmRate * distanceKm) / 500) * 500;
    return {
        baseFare,
        distanceFare: perKmRate * distanceKm,
        totalFare: total,
        distanceKm,
        displayPrice: formatTZS(total),
        displayLabel: 'Est. Total',
    };
};
