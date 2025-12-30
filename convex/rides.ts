import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { reserveFunds, settleTrip, refundReservation } from "./utils/financial";
import { checkSpendingLimit } from "./b2b";

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

/**
 * Calculate fare based on distance and vehicle type
 * Uses the 7 Tanzanian vehicle fleet pricing structure
 * With safe fallback to 'canter' pricing for unrecognized types
 */
function calculateFare(distance: number, vehicleType: string) {
    // Base fares in TSH (Tanzanian Shillings)
    const baseFares: Record<string, number> = {
        // New Tanzanian Fleet (Source of Truth)
        boda: 2000,      // Motorcycle
        toyo: 3000,      // Cargo Tricycle/Guta
        kirikuu: 5000,   // Mini Truck (Suzuki Carry)
        pickup: 8000,    // Standard Pickup
        canter: 15000,   // Box Body 3-4T
        fuso: 30000,     // Heavy Truck 10T
        trailer: 50000,  // Semi-Trailer 20T+
        // Legacy mappings for backward compatibility
        tricycle: 3000,
        van: 5000,
        truck: 15000,
        semitrailer: 50000,
        bajaji: 3000,
        bajaj: 3000,
        classic: 8000,
        boxbody: 15000,
    };

    // Per-km rates in TSH
    const perKmRates: Record<string, number> = {
        // New Tanzanian Fleet
        boda: 200,
        toyo: 300,
        kirikuu: 400,
        pickup: 600,
        canter: 800,
        fuso: 1200,
        trailer: 1500,
        // Legacy mappings
        tricycle: 300,
        van: 400,
        truck: 800,
        semitrailer: 1500,
        bajaji: 300,
        bajaj: 300,
        classic: 600,
        boxbody: 800,
    };

    // Safe fallback to 'canter' pricing if vehicle type is unrecognized
    const base = baseFares[vehicleType] ?? baseFares['canter'];
    const rate = perKmRates[vehicleType] ?? perKmRates['canter'];

    // Log warning for unrecognized types
    if (!(vehicleType in baseFares)) {
        console.warn(`[PRICING] Unknown vehicle type: "${vehicleType}", using 'canter' fallback pricing`);
    }

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
            // New Tanzanian Fleet (Source of Truth - 7 types)
            v.literal("boda"),      // Motorcycle
            v.literal("toyo"),      // Cargo Tricycle/Guta
            v.literal("kirikuu"),   // Mini Truck
            v.literal("pickup"),    // Standard Pickup
            v.literal("canter"),    // Box Body 3-4T
            v.literal("fuso"),      // Heavy Truck 10T
            v.literal("trailer"),   // Semi-Trailer 20T+
            // Legacy vehicle IDs for backward compatibility
            v.literal("bajaj"),
            v.literal("bajaji"),
            v.literal("pickup_s"),
            v.literal("pickup_d"),
            v.literal("semi"),
            v.literal("classic"),
            v.literal("boxbody"),
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

        // Validate coordinates are reasonable (Tanzania bounds roughly: -11 to -1 lat, 29 to 41 lng)
        const validateCoords = (lat: number, lng: number, label: string) => {
            if (lat === 0 && lng === 0) {
                throw new Error(`${label} location coordinates are invalid (0,0). Please select a valid location.`);
            }
            // Basic sanity check for Tanzania/East Africa region
            if (lat < -20 || lat > 5 || lng < 20 || lng > 50) {
                console.warn(`${label} coordinates outside East Africa: ${lat}, ${lng}`);
            }
        };

        validateCoords(args.pickup_location.lat, args.pickup_location.lng, "Pickup");
        validateCoords(args.dropoff_location.lat, args.dropoff_location.lng, "Dropoff");

        const distance = calculateDistance(
            args.pickup_location.lat,
            args.pickup_location.lng,
            args.dropoff_location.lat,
            args.dropoff_location.lng
        );

        // Distance Validation Constants
        const MIN_DISTANCE_KM = 0.2; // 200 meters minimum
        const MAX_DISTANCE_KM = 1000; // 1000km maximum (Tanzania is ~945km north-south)

        // Validate minimum distance
        if (distance < MIN_DISTANCE_KM) {
            const distanceMeters = Math.round(distance * 1000);
            throw new Error(
                `DISTANCE_TOO_SHORT:${distanceMeters}|` +
                `Pickup and dropoff are too close (${distanceMeters}m). ` +
                `Minimum distance is ${MIN_DISTANCE_KM * 1000}m (200 meters).`
            );
        }

        // Validate maximum distance
        if (distance > MAX_DISTANCE_KM) {
            throw new Error(
                `DISTANCE_TOO_FAR:${distance.toFixed(1)}|` +
                `Trip distance (${distance.toFixed(1)}km) exceeds maximum allowed (${MAX_DISTANCE_KM}km). ` +
                `Please check your pickup and dropoff locations.`
            );
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
                throw new Error("Corporate Wallet not available: You are not part of an organization.");
            }

            orgId = userProfile.orgId;
            isBusinessTrip = true;

            const org = await ctx.db.get(orgId);
            if (!org) throw new Error("Organization not found");

            // 1. Check Spending Limits
            const limitCheck = await checkSpendingLimit(ctx, userProfile._id, finalFare);
            if (!limitCheck.allowed) {
                throw new Error(`Transaction Declined: ${limitCheck.reason}`);
            }

            // 2. Atomic Reservation
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

// Get nearby drivers (public query - SANITIZED for Map)
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

        const drivers = await getNearbyDriversInternal(ctx, args.lat, args.lng, args.radiusKm);

        // SANITIZE: Only return data needed for map visualization
        return drivers.map((d: any) => ({
            _id: d._id,
            location: d.current_location,
            vehicle_type: d.vehicle_type,
            // Add mock heading if missing for animation
            heading: d.current_location?.heading || 0
        }));
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

        // First check if they have a verified driver record
        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        // If no driver record, check if their profile role is "driver" (allows new drivers)
        if (!driver) {
            const profile = await ctx.db
                .query("userProfiles")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (!profile || profile.role !== "driver") {
                throw new Error("Only drivers can view available rides");
            }
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

// Get list of rides for driver history (Manifest)
export const listDriverHistory = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        return await ctx.db
            .query("rides")
            .withIndex("by_driver", (q) => q.eq("driver_clerk_id", identity.subject))
            .order("desc")
            .take(50); // Limit to last 50 rides
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
                // Get phone from user profile
                const driverProfile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.driver_clerk_id!))
                    .first();
                if (driverProfile) {
                    driverPhone = driverProfile.phone;
                }
            }
        }

        return {
            ...ride,
            driver_location: driverLocation,
            driver_phone: driverPhone
        };
    },
});
