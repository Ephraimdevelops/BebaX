import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// AFRICAN LOGISTICS ENGINE - MOVERS MODULE
// ============================================

// Volume tier to vehicle type mapping
const VOLUME_TO_VEHICLE: Record<string, string> = {
    small: "kirikuu",
    medium: "canter",
    large: "fuso",
};

// Base prices by volume tier (TZS)
const BASE_PRICES: Record<string, number> = {
    small: 80000,   // Bedsitter / Single Room
    medium: 150000, // 1-2 Bedroom House
    large: 250000,  // 3+ Bedroom / Office
};

// Distance rates by tier (TZS per km)
const DISTANCE_RATES: Record<string, number> = {
    small: 500,
    medium: 1000,
    large: 1500,
};

// Floor fee when no elevator (TZS per floor)
const FLOOR_FEE = 2000;

// Far parking fee (TZS)
const FAR_PARKING_FEE = 5000;

// Helper fee (TZS per helper)
const HELPER_FEE = 15000;

/**
 * Calculate move quote based on complexity factors
 */
export const getMoveQuote = query({
    args: {
        volume_tier: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
        floors: v.object({ origin: v.number(), dest: v.number() }),
        has_elevator: v.boolean(),
        distance_to_parking: v.union(v.literal("close"), v.literal("far")),
        helper_count: v.number(),
        distance_km: v.number(),
    },
    handler: async (ctx, args) => {
        // Base price by tier
        let quote = BASE_PRICES[args.volume_tier];

        // Floor fees (only if no elevator)
        let floorFee = 0;
        if (!args.has_elevator) {
            const totalFloors = args.floors.origin + args.floors.dest;
            floorFee = totalFloors * FLOOR_FEE;
        }
        quote += floorFee;

        // Parking distance fee
        let parkingFee = 0;
        if (args.distance_to_parking === "far") {
            parkingFee = FAR_PARKING_FEE;
        }
        quote += parkingFee;

        // Helper fees
        const helperFee = args.helper_count * HELPER_FEE;
        quote += helperFee;

        // Distance fee
        const distanceFee = args.distance_km * DISTANCE_RATES[args.volume_tier];
        quote += distanceFee;

        // Build breakdown
        const breakdown = {
            base: BASE_PRICES[args.volume_tier],
            distance: Math.round(distanceFee),
            floor_fee: floorFee,
            helper_fee: helperFee,
            parking_fee: parkingFee,
        };

        // Quote range (±5% for moves - less variance than regular trips)
        const rangeMin = Math.round(quote * 0.95);
        const rangeMax = Math.round(quote * 1.05);

        return {
            quote_amount: Math.round(quote),
            breakdown,
            quote_range: { min: rangeMin, max: rangeMax },
            display_text: `TZS ${rangeMin.toLocaleString()} - ${rangeMax.toLocaleString()}`,
            recommended_vehicle: VOLUME_TO_VEHICLE[args.volume_tier],
            helper_count: args.helper_count,
            helper_warning: args.helper_count === 0
                ? "⚠️ Driver will NOT load. You must provide labor."
                : null,
        };
    },
});

/**
 * Create a new move request
 */
export const createMove = mutation({
    args: {
        volume_tier: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
        items_summary: v.string(),
        floors: v.object({ origin: v.number(), dest: v.number() }),
        has_elevator: v.boolean(),
        distance_to_parking: v.union(v.literal("close"), v.literal("far")),
        helper_count: v.number(),
        photos: v.array(v.string()),
        pickup_location: v.object({ lat: v.number(), lng: v.number(), address: v.string() }),
        dropoff_location: v.object({ lat: v.number(), lng: v.number(), address: v.string() }),
        scheduled_date: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Validate photos for trucks (mandatory)
        if (args.volume_tier !== "small" && args.photos.length === 0) {
            throw new Error("Photos are mandatory for Medium/Large moves");
        }

        // Calculate distance between locations
        const lat1 = args.pickup_location.lat;
        const lng1 = args.pickup_location.lng;
        const lat2 = args.dropoff_location.lat;
        const lng2 = args.dropoff_location.lng;

        // Haversine formula
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance_km = R * c;

        // Calculate quote
        let quote = BASE_PRICES[args.volume_tier];

        if (!args.has_elevator) {
            quote += (args.floors.origin + args.floors.dest) * FLOOR_FEE;
        }
        if (args.distance_to_parking === "far") {
            quote += FAR_PARKING_FEE;
        }
        quote += args.helper_count * HELPER_FEE;
        quote += distance_km * DISTANCE_RATES[args.volume_tier];

        // Create the move record
        const moveId = await ctx.db.insert("moves", {
            customer_clerk_id: identity.subject,
            vehicle_type: VOLUME_TO_VEHICLE[args.volume_tier],
            items_summary: args.items_summary,
            volume_tier: args.volume_tier,
            floors: args.floors,
            has_elevator: args.has_elevator,
            distance_to_parking: args.distance_to_parking,
            helper_count: args.helper_count,
            photos: args.photos,
            pickup_location: args.pickup_location,
            dropoff_location: args.dropoff_location,
            quote_amount: Math.round(quote),
            quote_breakdown: {
                base: BASE_PRICES[args.volume_tier],
                distance: Math.round(distance_km * DISTANCE_RATES[args.volume_tier]),
                floor_fee: !args.has_elevator ? (args.floors.origin + args.floors.dest) * FLOOR_FEE : 0,
                helper_fee: args.helper_count * HELPER_FEE,
            },
            status: "quoting",
            scheduled_date: args.scheduled_date,
            created_at: new Date().toISOString(),
        });

        return {
            move_id: moveId,
            quote_amount: Math.round(quote),
            vehicle_type: VOLUME_TO_VEHICLE[args.volume_tier],
        };
    },
});

/**
 * Book a move (transition from quoting to booked)
 */
export const bookMove = mutation({
    args: {
        move_id: v.id("moves"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const move = await ctx.db.get(args.move_id);
        if (!move) {
            throw new Error("Move not found");
        }

        if (move.customer_clerk_id !== identity.subject) {
            throw new Error("Unauthorized");
        }

        if (move.status !== "quoting") {
            throw new Error("Move is not in quoting status");
        }

        await ctx.db.patch(args.move_id, {
            status: "booked",
        });

        return { success: true, status: "booked" };
    },
});

/**
 * Get customer's moves
 */
export const getMyMoves = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const moves = await ctx.db
            .query("moves")
            .withIndex("by_customer", (q) => q.eq("customer_clerk_id", identity.subject))
            .order("desc")
            .collect();

        return moves;
    },
});

/**
 * Get move details
 */
export const getMove = query({
    args: { move_id: v.id("moves") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.move_id);
    },
});
