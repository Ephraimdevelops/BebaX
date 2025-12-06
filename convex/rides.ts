import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { reserveFunds, settleTrip, refundReservation } from "./utils/financial";

// Validation helper
const validateLatLng = (location: { lat: number; lng: number }) => {
    if (location.lat < -90 || location.lat > 90) {
        throw new Error("Invalid latitude: must be between -90 and 90");
    }
    if (location.lng < -180 || location.lng > 180) {
        throw new Error("Invalid longitude: must be between -180 and 180");
    }
};

const sanitizeString = (str: string, maxLength: number = 500): string => {
    return str.trim().substring(0, maxLength);
};

// Helper to calculate distance (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateFare(distance: number, vehicleType: string) {
    const baseFares: Record<string, number> = {
        tricycle: 2000,
        van: 5000,
        truck: 8000,
        semitrailer: 15000
    };
    const perKmRates: Record<string, number> = {
        tricycle: 300,
        van: 500,
        truck: 800,
        semitrailer: 1200
    };

    const base = baseFares[vehicleType] || 2000;
    const rate = perKmRates[vehicleType] || 300;

    return base + (distance * rate);
}

// Enhanced create ride with validation and B2B Logic
export const create = mutation({
    args: {
        pickup_location: v.object({
            lat: v.number(),
            lng: v.number(),
            address: v.string(),
        }),
        dropoff_location: v.object({
            lat: v.number(),
            lng: v.number(),
            address: v.string(),
        }),
        vehicle_type: v.union(
            v.literal("tricycle"),
            v.literal("van"),
            v.literal("truck"),
            v.literal("semitrailer")
        ),
        cargo_details: v.string(),
        cargo_photos: v.optional(v.array(v.string())),
        special_instructions: v.optional(v.string()),
        scheduled_time: v.optional(v.string()),
        payment_method: v.union(v.literal("cash"), v.literal("mobile_money"), v.literal("wallet")),
        insurance_opt_in: v.optional(v.boolean()),
        insurance_tier_id: v.optional(v.string()),
        fare_estimate: v.optional(v.number()), // Added optional for frontend estimate
        distance: v.optional(v.number()), // Added optional for frontend estimate
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Validate coordinates
        validateLatLng(args.pickup_location);
        validateLatLng(args.dropoff_location);

        // Validate addresses
        if (args.pickup_location.address.length < 3) {
            throw new Error("Pickup address too short");
        }
        if (args.dropoff_location.address.length < 3) {
            throw new Error("Dropoff address too short");
        }

        // Sanitize inputs
        const cargoDetails = sanitizeString(args.cargo_details, 500);
        const specialInstructions = args.special_instructions
            ? sanitizeString(args.special_instructions, 300)
            : undefined;

        // Validate cargo photos (max 5)
        if (args.cargo_photos && args.cargo_photos.length > 5) {
            throw new Error("Maximum 5 cargo photos allowed");
        }

        const distance = calculateDistance(
            args.pickup_location.lat,
            args.pickup_location.lng,
            args.dropoff_location.lat,
            args.dropoff_location.lng
        );

        // Validate distance (max 500km for single trip)
        if (distance > 500) {
            throw new Error("Trip distance exceeds maximum allowed (500km)");
        }

        let fare = calculateFare(distance, args.vehicle_type);
        let insuranceFee = 0;

        // Apply insurance fee if opted in
        if (args.insurance_opt_in && args.insurance_tier_id) {
            const fees: Record<string, number> = {
                'basic': 500,
                'standard': 2500,
                'corporate': 0
            };
            insuranceFee = fees[args.insurance_tier_id] || 0;
            fare += insuranceFee;
        }

        // Use frontend estimate if provided and reasonable
        let finalFare = fare;
        let finalDistance = Math.round(distance * 100) / 100;

        if (args.fare_estimate && args.distance) {
            finalFare = args.fare_estimate;
            finalDistance = args.distance;
        }

        // B2B Wallet Logic (Reservation Pattern)
        let orgId = undefined;
        let isBusinessTrip = false;

        if (args.payment_method === 'wallet') {
            const userProfile = await ctx.db
                .query("userProfiles")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (!userProfile || !userProfile.orgId) {
                throw new Error("Wallet payment requires an Organization account");
            }

            orgId = userProfile.orgId;
            isBusinessTrip = true;

            const org = await ctx.db.get(orgId);
            if (!org) throw new Error("Organization not found");

            // 1. Check Daily Spending Limit
            if (userProfile.spendingLimitPerDay) {
                if (finalFare > userProfile.spendingLimitPerDay) {
                    throw new Error(`Ride exceeds your daily spending limit of ${userProfile.spendingLimitPerDay}`);
                }
            }

            // 3. Atomic Reservation
            await reserveFunds(ctx, orgId, finalFare);
        }

        const rideId = await ctx.db.insert("rides", {
            customer_clerk_id: identity.subject,
            org_id: orgId,
            vehicle_type: args.vehicle_type,
            pickup_location: args.pickup_location,
            dropoff_location: args.dropoff_location,
            cargo_details: cargoDetails,
            cargo_photos: args.cargo_photos,
            special_instructions: specialInstructions,
            scheduled_time: args.scheduled_time,
            payment_method: args.payment_method,
            distance: finalDistance,
            fare_estimate: finalFare,
            insurance_opt_in: args.insurance_opt_in,
            insurance_tier_id: args.insurance_tier_id,
            insurance_fee: insuranceFee,
            is_business_trip: isBusinessTrip,
            status: "pending",
            payment_status: "pending",
            created_at: new Date().toISOString(),
        });

        // Notify nearby drivers
        const nearbyDrivers = await getNearbyDriversInternal(
            ctx,
            args.pickup_location.lat,
            args.pickup_location.lng,
            10 // 10km radius
        );

        for (const driver of nearbyDrivers) {
            await ctx.db.insert("notifications", {
                user_clerk_id: driver.clerkId,
                type: "ride_request",
                title: "New Ride Request",
                body: `${args.vehicle_type} needed - ${finalDistance}km - ${finalFare} TZS`,
                read: false,
                ride_id: rideId,
                created_at: new Date().toISOString(),
            });
        }

        return rideId;
    },
});

// Get nearby drivers (internal helper)
async function getNearbyDriversInternal(ctx: any, lat: number, lng: number, radiusKm: number) {
    const drivers = await ctx.db
        .query("drivers")
        .withIndex("by_online_status", (q: any) => q.eq("is_online", true))
        .filter((q: any) => q.eq(q.field("verified"), true))
        .collect();

    return drivers.filter((driver: any) => {
        if (!driver.current_location) return false;
        const distance = calculateDistance(
            lat,
            lng,
            driver.current_location.lat,
            driver.current_location.lng
        );
        return distance <= radiusKm;
    });
}

// Get nearby drivers (public query)
export const getNearbyDrivers = query({
    args: {
        lat: v.number(),
        lng: v.number(),
        radiusKm: v.number(),
    },
    handler: async (ctx, args) => {
        // Validate inputs
        validateLatLng({ lat: args.lat, lng: args.lng });
        if (args.radiusKm < 1 || args.radiusKm > 50) {
            throw new Error("Radius must be between 1 and 50 km");
        }

        return await getNearbyDriversInternal(ctx, args.lat, args.lng, args.radiusKm);
    },
});

// Driver accepts ride with validation
export const accept = mutation({
    args: {
        ride_id: v.id("rides"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!driver || !driver.verified) {
            throw new Error("Driver not verified");
        }

        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            throw new Error("Ride not found");
        }

        if (ride.status !== "pending") {
            throw new Error("Ride is no longer available");
        }

        await ctx.db.patch(args.ride_id, {
            driver_clerk_id: identity.subject,
            status: "accepted",
            accepted_at: new Date().toISOString(),
        });

        // Notify the customer
        await ctx.db.insert("notifications", {
            user_clerk_id: ride.customer_clerk_id,
            type: "ride_accepted",
            title: "Ride Accepted",
            body: "A driver has accepted your ride request!",
            read: false,
            ride_id: args.ride_id,
            created_at: new Date().toISOString(),
        });
    },
});

// Update ride status with validation and B2B Settlement
export const updateStatus = mutation({
    args: {
        ride_id: v.id("rides"),
        status: v.union(
            v.literal("loading"),
            v.literal("ongoing"),
            v.literal("delivered"),
            v.literal("completed"),
            v.literal("cancelled")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            throw new Error("Ride not found");
        }

        if (ride.customer_clerk_id !== identity.subject && ride.driver_clerk_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        // Validate status transitions
        const validTransitions: Record<string, string[]> = {
            "accepted": ["loading", "cancelled"],
            "loading": ["ongoing", "cancelled"],
            "ongoing": ["delivered", "cancelled"],
            "delivered": ["completed"],
        };

        if (ride.status && validTransitions[ride.status] && !validTransitions[ride.status].includes(args.status)) {
            throw new Error(`Invalid status transition from ${ride.status} to ${args.status}`);
        }

        const update: any = { status: args.status };
        const now = new Date().toISOString();

        if (args.status === "loading") update.loading_started_at = now;
        if (args.status === "ongoing") update.trip_started_at = now;
        if (args.status === "delivered") update.delivered_at = now;
        if (args.status === "completed") update.completed_at = now;
        if (args.status === "cancelled") update.cancelled_at = now;

        // B2B Financial Settlement Logic
        if (ride.payment_method === "wallet" && ride.org_id) {
            const org = await ctx.db.get(ride.org_id);
            if (org) {
                // Cancellation: Refund Reserved
                if (args.status === "cancelled") {
                    await refundReservation(ctx, ride.org_id, ride.fare_estimate);
                }
                // Completion: Burn Reserved & Settle Difference
                else if (args.status === "completed") {
                    const finalFare = ride.final_fare || ride.fare_estimate;
                    const reserved = ride.fare_estimate;

                    await settleTrip(ctx, ride.org_id, reserved, finalFare, ride.driver_clerk_id);
                }
            }
        }

        await ctx.db.patch(args.ride_id, update);

        // Trigger cash settlement for delivered rides (Legacy Cash Flow)
        if (args.status === "delivered" && ride.payment_method === "cash") {
            // Schedule settlement to run after this mutation completes
            await ctx.scheduler.runAfter(0, "payments:settleCashTrip" as any, {
                ride_id: args.ride_id,
            });
        }

        // Notify the other party
        const notifyId = identity.subject === ride.customer_clerk_id
            ? ride.driver_clerk_id
            : ride.customer_clerk_id;

        if (notifyId) {
            // 1. Save notification to DB
            await ctx.db.insert("notifications", {
                user_clerk_id: notifyId,
                type: "ride_request",
                title: `Ride ${args.status}`,
                body: `The ride status has been updated to ${args.status}`,
                read: false,
                ride_id: args.ride_id,
                created_at: new Date().toISOString(),
            });

            // 2. Get user's push token
            const userProfile = await ctx.db
                .query("userProfiles")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", notifyId))
                .first();

            // 3. Send push notification if token exists
            if (userProfile?.pushToken) {
                await ctx.scheduler.runAfter(0, "actions:sendPushNotification" as any, {
                    to: userProfile.pushToken,
                    title: `Ride Update: ${args.status}`,
                    body: `Your ride is now ${args.status}. Tap to view details.`,
                    data: { rideId: args.ride_id },
                });
            }
        }
    },
});

// Track driver location during ride with validation
export const updateDriverLocation = mutation({
    args: {
        ride_id: v.id("rides"),
        location: v.object({
            lat: v.number(),
            lng: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Validate coordinates
        validateLatLng(args.location);

        const ride = await ctx.db.get(args.ride_id);
        if (!ride || ride.driver_clerk_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        const updates = ride.driver_location_updates || [];
        updates.push({
            lat: args.location.lat,
            lng: args.location.lng,
            timestamp: new Date().toISOString(),
        });

        // Keep only last 50 updates to avoid bloat
        if (updates.length > 50) {
            updates.shift();
        }

        await ctx.db.patch(args.ride_id, {
            driver_location_updates: updates,
        });
    },
});

// Rate ride with validation
export const rateRide = mutation({
    args: {
        ride_id: v.id("rides"),
        rating: v.number(),
        review: v.optional(v.string()),
        tip_amount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Validate rating
        if (args.rating < 1 || args.rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }

        // Validate tip
        if (args.tip_amount && (args.tip_amount < 0 || args.tip_amount > 100000)) {
            throw new Error("Invalid tip amount");
        }

        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            throw new Error("Ride not found");
        }

        const isCustomer = ride.customer_clerk_id === identity.subject;
        const isDriver = ride.driver_clerk_id === identity.subject;

        if (!isCustomer && !isDriver) {
            throw new Error("Not authorized");
        }

        // Sanitize review
        const sanitizedReview = args.review ? sanitizeString(args.review, 500) : undefined;

        const update: any = {};
        if (isCustomer) {
            update.driver_rating = args.rating;
            update.driver_review = sanitizedReview;
            update.tip_amount = args.tip_amount;
        } else {
            update.customer_rating = args.rating;
            update.customer_review = sanitizedReview;
        }

        await ctx.db.patch(args.ride_id, update);
    },
});

// Get my rides
export const listMyRides = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (driver) {
            return await ctx.db
                .query("rides")
                .withIndex("by_driver", (q) => q.eq("driver_clerk_id", identity.subject))
                .order("desc")
                .collect();
        }

        return await ctx.db
            .query("rides")
            .withIndex("by_customer", (q) => q.eq("customer_clerk_id", identity.subject))
            .order("desc")
            .collect();
    },
});

// Get available rides for drivers
export const listAvailableRides = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!driver) {
            throw new Error("Only drivers can view available rides");
        }

        return await ctx.db
            .query("rides")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .order("desc")
            .collect();
    },
});

// Get ride details
export const getRide = query({
    args: { ride_id: v.id("rides") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            return null;
        }

        if (ride.customer_clerk_id !== identity.subject && ride.driver_clerk_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        return ride;
    },
});

// Get active ride for customer with driver location
export const getActiveRide = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const ride = await ctx.db
            .query("rides")
            .withIndex("by_customer", (q) => q.eq("customer_clerk_id", identity.subject))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "pending"),
                    q.eq(q.field("status"), "accepted"),
                    q.eq(q.field("status"), "loading"),
                    q.eq(q.field("status"), "ongoing"),
                    q.eq(q.field("status"), "delivered")
                )
            )
            .order("desc")
            .first();

        if (!ride) {
            return null;
        }

        let driverLocation = null;
        let driverPhone = null;
        if (ride.driver_clerk_id) {
            const driver = await ctx.db
                .query("drivers")
                .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", ride.driver_clerk_id!))
                .first();
            if (driver) {
                driverLocation = driver.current_location;
            }

            const userProfile = await ctx.db
                .query("userProfiles")
                .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", ride.driver_clerk_id!))
                .first();
            if (userProfile) {
                driverPhone = userProfile.phone;
            }
        }

        return {
            ...ride,
            driver_location: driverLocation,
            driver_phone: driverPhone,
        };
    },
});
// Get active ride for driver
export const getDriverActiveRide = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const ride = await ctx.db
            .query("rides")
            .withIndex("by_driver", (q) => q.eq("driver_clerk_id", identity.subject))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "accepted"),
                    q.eq(q.field("status"), "loading"),
                    q.eq(q.field("status"), "ongoing")
                )
            )
            .order("desc")
            .first();

        if (!ride) {
            return null;
        }

        const customer = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.customer_clerk_id))
            .first();

        return {
            ...ride,
            customer_phone: customer?.phone,
        };
    },
});

import { getNeighbors } from "./lib/geohash";

// Get open rides for a driver based on geohash
export const getOpenRides = query({
    args: {
        geohash: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const rides = await ctx.db
            .query("rides")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .order("desc")
            .take(50);

        // Geohash Proximity Logic (Center + 8 Neighbors)
        // We use precision 5 (~4.9km x 4.9km) for the "search grid"
        // This ensures we catch rides even if the driver is at the edge of a cell.
        const searchPrecision = 5;
        const driverGeohashPrefix = args.geohash.substring(0, searchPrecision);

        const neighbors = getNeighbors(driverGeohashPrefix);
        const searchHashes = [driverGeohashPrefix, ...neighbors];

        return rides.filter(ride => {
            // Fallback: If ride has no geohash, show it (or maybe hide it? Showing for now to be safe)
            if (!ride.pickup_location.geohash) return true;

            // Check if ride's geohash starts with any of the 9 search hashes
            return searchHashes.some(hash => ride.pickup_location.geohash!.startsWith(hash));
        });
    },
});
