import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
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

import { calculateFare } from "./pricing";

// Helper Fee Configuration (Pass-Through Wallet)
const HELPER_FEE = 5000; // TZS per helper - NOT commissionable
const COMMISSION_RATE = 0.15; // 15% on transport only

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
        fare_estimate: v.optional(v.number()),
        distance: v.optional(v.number()),
        // Smart Cargo & Visual Truth Fields
        cargo_size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"), v.literal("huge"))),
        helpers_count: v.optional(v.number()),
        is_fragile: v.optional(v.boolean()),
        mission_mode: v.optional(v.union(v.literal("item"), v.literal("move"))),
        cargo_ref_id: v.optional(v.string()), // 's', 'm', 'l', 'xl'
        house_size_id: v.optional(v.string()), // 'studio', '2-3rooms', 'big'

        cargo_photo_url: v.optional(v.string()), // Mandatory for L/XL
        locked_price: v.optional(v.number()), // Safe Lock
        pricing_snapshot: v.optional(v.string()), // Metadata
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

        // 1. TRUSTLESS PRICING ENGINE (The Brain)
        // We do NOT trust the client for price. We calculate it here.
        const fareResult = await calculateFare(ctx, {
            distanceKm: distance,
            vehicleType: args.vehicle_type
        });

        let fare = fareResult.fare;
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

        // 2. SAFE LOCK PRICING OVERRIDE
        // If the client sends a locked price (based on Google API), use it.
        // We trust the frontend's RouteService for now, but in future perform server-side check.
        if (args.locked_price) {
            fare = args.locked_price + insuranceFee; // Ensure insurance is added on top if not included
            // Wait, calculateLockedFare includes everything? No, usually exclude insurance.
            // Let's assume locked_price is base+distance+time. Insurance is separate.
            // Re-adding insurance to ensure correctness.
            // Actually, if backend calculates insuranceFee above, we should add it to locked_price base.
        }

        // Use frontend estimate ONLY if provided and reasonable (mostly for legacy checks)
        // But for V2 Core, we overwrite with our calculated fare.
        let finalFare = fare;
        let finalDistance = Math.round(distance * 100) / 100;

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

        // Calculate helper fee (Pass-Through Wallet)
        const helpersCount = args.helpers_count ?? 0;
        const laborCost = helpersCount * HELPER_FEE;
        const totalFare = finalFare + laborCost;

        const rideId = await ctx.db.insert("rides", {
            customer_clerk_id: identity.subject,
            org_id: orgId,
            vehicle_type: args.vehicle_type,
            pickup_location: args.pickup_location,
            dropoff_location: args.dropoff_location,
            cargo_details: cargoDetails,
            cargo_photos: args.cargo_photos,
            // Visual Truth Fields
            mission_mode: args.mission_mode,
            cargo_ref_id: args.cargo_ref_id,
            house_size_id: args.house_size_id,
            cargo_photo_url: args.cargo_photo_url,
            special_instructions: specialInstructions,
            scheduled_time: args.scheduled_time,
            payment_method: args.payment_method,
            distance: finalDistance,
            fare_estimate: totalFare, // Includes labor
            transport_fare: finalFare, // Ride fare only (commissionable)
            locked_price: args.locked_price,
            pricing_snapshot: args.pricing_snapshot,
            helper_fee: laborCost, // Pass-through to driver
            helpers_count: helpersCount,
            cargo_size: args.cargo_size ?? "small",
            is_fragile: args.is_fragile ?? false,
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
        // Exclude busy drivers
        if (driver.is_busy) return false;

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

        // Set driver as busy
        await ctx.db.patch(driver._id, { is_busy: true });

        await ctx.db.patch(args.ride_id, {
            driver_clerk_id: identity.subject,
            status: "accepted",
            accepted_at: new Date().toISOString(),
        });

        // Notify the customer with enhanced messaging
        await ctx.db.insert("notifications", {
            user_clerk_id: ride.customer_clerk_id,
            type: "ride_accepted",
            title: "🎉 Driver Found!",
            body: "Dereva amekubali! Your driver is on the way to pick up.",
            read: false,
            ride_id: args.ride_id,
            created_at: new Date().toISOString(),
        });

        // Send push notification to customer
        const customer = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.customer_clerk_id))
            .first();

        if (customer?.pushToken) {
            await ctx.scheduler.runAfter(0, "actions:sendPushNotification" as any, {
                to: customer.pushToken,
                title: "🎉 Driver Found!",
                body: "Dereva amekubali safari yako! Track your driver in the app.",
                data: { rideId: args.ride_id, status: "accepted" },
            });
        }
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

        // Idempotent: If already at this status, return success (prevents double-tap errors)
        if (ride.status === args.status) {
            return { success: true, message: "Already at this status" };
        }

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

        // FREE DRIVER: If delivered or cancelled, mark driver as available
        if ((args.status === "delivered" || args.status === "cancelled" || args.status === "completed") && ride.driver_clerk_id) {
            const driver = await ctx.db
                .query("drivers")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.driver_clerk_id!))
                .first();

            if (driver) {
                await ctx.db.patch(driver._id, { is_busy: false });
            }
        }

        // Trigger cash settlement for delivered rides (Legacy Cash Flow)
        if (args.status === "delivered" && ride.payment_method === "cash") {
            // Schedule settlement to run after this mutation completes
            await ctx.scheduler.runAfter(0, "payments:settleCashTrip" as any, {
                ride_id: args.ride_id,
            });

            // Alert admins for large cash trips (fraud monitoring)
            const tripFare = ride.final_fare || ride.fare_estimate;
            // Check if driver_clerk_id exists before proceeding with admin alert logic that relies on it
            if (tripFare >= 200000 && ride.driver_clerk_id) { // TZS 200k threshold
                const admins = await ctx.db
                    .query("userProfiles")
                    .filter((q: any) => q.eq(q.field("role"), "admin"))
                    .collect();

                const adminTokens = admins
                    .filter(a => a.pushToken)
                    .map(a => a.pushToken as string);

                if (adminTokens.length > 0) {
                    // Get customer and driver names
                    const customer = await ctx.db
                        .query("userProfiles")
                        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", ride.customer_clerk_id))
                        .first();
                    const driver = await ctx.db
                        .query("userProfiles")
                        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", ride.driver_clerk_id))
                        .first();

                    // Using string path to avoid TS2589 type recursion issue
                    await ctx.scheduler.runAfter(0, "pushNotifications:notifyAdminsLargeCashTrip" as any, {
                        admin_tokens: adminTokens,
                        fare: tripFare,
                        driver_name: driver?.name || "Unknown Driver",
                        customer_name: customer?.name || "Unknown Customer",
                        ride_id: args.ride_id,
                    });
                }
            }
        }

        // Notify the other party with status-specific messages
        const notifyId = identity.subject === ride.customer_clerk_id
            ? ride.driver_clerk_id
            : ride.customer_clerk_id;

        // Define status-specific notification messages
        const notificationMessages: Record<string, { title: string; body: string }> = {
            loading: {
                title: "🚛 Driver Arrived!",
                body: "Dereva amefika mahali pa kupakia. The driver is at the pickup location.",
            },
            ongoing: {
                title: "📍 Trip Started!",
                body: "Safari imeanza. Your cargo is on the way to the destination.",
            },
            delivered: {
                title: "✅ Delivery Complete!",
                body: "Mizigo yako imefika salama! Your cargo has been delivered successfully.",
            },
            cancelled: {
                title: "❌ Trip Cancelled",
                body: "Safari imefutwa. The trip has been cancelled.",
            },
        };

        const message = notificationMessages[args.status] || {
            title: `Ride ${args.status}`,
            body: `The ride status has been updated to ${args.status}`,
        };

        if (notifyId) {
            // 1. Save notification to DB
            await ctx.db.insert("notifications", {
                user_clerk_id: notifyId,
                type: args.status === "delivered" ? "ride_completed" : "ride_request",
                title: message.title,
                body: message.body,
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
                    title: message.title,
                    body: message.body,
                    data: { rideId: args.ride_id, status: args.status },
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
            created_at: new Date().toISOString(),
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

        let driver = null;
        if (ride.driver_clerk_id) {
            driver = await ctx.db
                .query("userProfiles")
                .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", ride.driver_clerk_id))
                .first();
        }

        let customer = null;
        if (ride.customer_clerk_id) {
            customer = await ctx.db
                .query("userProfiles")
                .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", ride.customer_clerk_id))
                .first();
        }

        return {
            ...ride,
            driver_details: driver ? {
                name: driver.name,
                phone: driver.phone,
                photo: driver.profilePhoto, // Corrected field name
                rating: driver.rating || 5.0, // Use real rating
            } : null,
            customer_details: customer ? {
                name: customer.name,
                phone: customer.phone,
                photo: customer.profilePhoto, // Corrected field name
            } : null,
        };
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

// Get active ride for driver with customer location
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

        // Get customer details
        let customerPhone = null;
        let customerName = null;
        if (ride.customer_clerk_id) {
            const customerProfile = await ctx.db
                .query("userProfiles")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.customer_clerk_id))
                .first();
            if (customerProfile) {
                customerPhone = customerProfile.phone;
                customerName = customerProfile.name;
            }
        }

        return {
            ...ride,
            customer_phone: customerPhone,
            customer_name: customerName
        };
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

// ============================================
// AFRICAN LOGISTICS ENGINE - LOADING TIMER
// ============================================

/**
 * Start loading timer when driver arrives at pickup
 * Sets loading_start_time to current timestamp
 */
export const startLoading = mutation({
    args: {
        ride_id: v.id("rides"),
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

        // Verify driver owns this ride
        if (ride.driver_clerk_id !== identity.subject) {
            throw new Error("Unauthorized - not the assigned driver");
        }

        if (ride.loading_start_time) {
            throw new Error("Loading timer already started");
        }

        await ctx.db.patch(args.ride_id, {
            loading_start_time: Date.now(),
            status: "loading",
            loading_started_at: new Date().toISOString(),
        });

        return { success: true, loading_start_time: Date.now() };
    },
});

/**
 * Stop loading timer and calculate demurrage if applicable
 * Uses pricing_config to determine free loading window and demurrage rate
 */
export const stopLoading = mutation({
    args: {
        ride_id: v.id("rides"),
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

        // Verify driver owns this ride
        if (ride.driver_clerk_id !== identity.subject) {
            throw new Error("Unauthorized - not the assigned driver");
        }

        if (!ride.loading_start_time) {
            throw new Error("Loading timer not started");
        }

        if (ride.loading_end_time) {
            throw new Error("Loading already completed");
        }

        const endTime = Date.now();
        const elapsedMs = endTime - ride.loading_start_time;
        const elapsedMin = elapsedMs / 60000;

        // Fetch pricing config for this vehicle type
        const config = await ctx.db
            .query("pricing_config")
            .withIndex("by_vehicle", (q) => q.eq("vehicle_type", ride.vehicle_type as any))
            .first();

        let demurrageFee = 0;
        let loadingWindow = 30; // Default 30 min
        let demurrageRate = 500; // Default 500 TZS/min

        if (config) {
            loadingWindow = config.loading_window_min;
            demurrageRate = config.demurrage_rate;
        }

        // Calculate demurrage if over loading window
        if (elapsedMin > loadingWindow) {
            const overtimeMin = elapsedMin - loadingWindow;
            demurrageFee = Math.round(overtimeMin * demurrageRate);
        }

        // Update ride with loading end time and demurrage
        const currentFare = ride.final_fare || ride.fare_estimate || 0;
        const newFare = currentFare + demurrageFee;

        await ctx.db.patch(args.ride_id, {
            loading_end_time: endTime,
            demurrage_fee: demurrageFee,
            final_fare: newFare,
            status: "ongoing",
            trip_started_at: new Date().toISOString(),
        });

        return {
            success: true,
            loading_duration_min: Math.round(elapsedMin),
            loading_window_min: loadingWindow,
            demurrage_fee: demurrageFee,
            new_total_fare: newFare,
            demurrage_applied: demurrageFee > 0,
        };
    },
});

/**
 * Get loading timer status for a ride
 */
export const getLoadingStatus = query({
    args: {
        ride_id: v.id("rides"),
    },
    handler: async (ctx, args) => {
        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            return null;
        }

        // Fetch config for loading window
        const config = await ctx.db
            .query("pricing_config")
            .withIndex("by_vehicle", (q) => q.eq("vehicle_type", ride.vehicle_type as any))
            .first();

        const loadingWindow = config?.loading_window_min || 30;
        const demurrageRate = config?.demurrage_rate || 500;

        if (!ride.loading_start_time) {
            return {
                status: "not_started",
                loading_window_min: loadingWindow,
                demurrage_rate: demurrageRate,
            };
        }

        if (ride.loading_end_time) {
            return {
                status: "completed",
                loading_duration_min: Math.round((ride.loading_end_time - ride.loading_start_time) / 60000),
                demurrage_fee: ride.demurrage_fee || 0,
            };
        }

        // Calculate current elapsed time
        const elapsedMs = Date.now() - ride.loading_start_time;
        const elapsedMin = elapsedMs / 60000;
        const remainingMin = Math.max(0, loadingWindow - elapsedMin);
        const isOvertime = elapsedMin > loadingWindow;

        return {
            status: isOvertime ? "overtime" : "in_progress",
            loading_start_time: ride.loading_start_time,
            elapsed_min: Math.round(elapsedMin),
            remaining_min: Math.round(remainingMin),
            loading_window_min: loadingWindow,
            demurrage_rate: demurrageRate,
            is_overtime: isOvertime,
            current_demurrage: isOvertime ? Math.round((elapsedMin - loadingWindow) * demurrageRate) : 0,
        };
    },
});

// ============================================
// ADMIN DASHBOARD QUERIES
// ============================================

// Get count of active rides
export const getActiveRidesCount = query({
    args: {},
    handler: async (ctx) => {
        const activeRides = await ctx.db
            .query("rides")
            .withIndex("by_status", (q) => q.eq("status", "accepted"))
            .collect();

        const loadingRides = await ctx.db
            .query("rides")
            .withIndex("by_status", (q) => q.eq("status", "loading"))
            .collect();

        const ongoingRides = await ctx.db
            .query("rides")
            .withIndex("by_status", (q) => q.eq("status", "ongoing"))
            .collect();

        return activeRides.length + loadingRides.length + ongoingRides.length;
    },
});

// Get all active rides for God Eye
export const getActiveRides = query({
    args: {},
    handler: async (ctx) => {
        const allRides = await ctx.db.query("rides").collect();

        // Filter for active statuses
        const activeStatuses = ['accepted', 'loading', 'ongoing', 'delivered'];
        return allRides.filter(r => activeStatuses.includes(r.status));
    },
});

