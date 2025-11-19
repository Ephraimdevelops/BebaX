import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Enhanced driver registration with documents
export const register = mutation({
    args: {
        license_number: v.string(),
        nida_number: v.string(),
        vehicle_type: v.string(),
        vehicle_plate: v.string(),
        capacity_kg: v.number(),
        payout_method: v.union(v.literal("mpesa"), v.literal("airtel"), v.literal("tigo")),
        payout_number: v.string(),
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

        const existingDriver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (existingDriver) {
            throw new Error("Driver already registered");
        }

        const driverId = await ctx.db.insert("drivers", {
            clerkId: identity.subject,
            license_number: args.license_number,
            nida_number: args.nida_number,
            documents: {},
            verified: false,
            verification_status: "pending",
            is_online: false,
            current_location: args.location,
            last_location_update: new Date().toISOString(),
            rating: 5.0,
            total_trips: 0,
            total_earnings: 0,
            commission_rate: 0.10, // 10% commission
            payout_method: args.payout_method,
            payout_number: args.payout_number,
            // Initialize wallet fields
            wallet_balance: 0,
            wallet_locked: false,
            created_at: new Date().toISOString(),
        });

        return driverId;
    },
});

// Upload documents
export const uploadDocuments = mutation({
    args: {
        nida_photo: v.optional(v.string()),
        license_photo: v.optional(v.string()),
        insurance_photo: v.optional(v.string()),
        road_permit_photo: v.optional(v.string()),
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

        if (!driver) {
            throw new Error("Driver not found");
        }

        const documents = { ...driver.documents };
        if (args.nida_photo) documents.nida_photo = args.nida_photo;
        if (args.license_photo) documents.license_photo = args.license_photo;
        if (args.insurance_photo) documents.insurance_photo = args.insurance_photo;
        if (args.road_permit_photo) documents.road_permit_photo = args.road_permit_photo;

        await ctx.db.patch(driver._id, { documents });
    },
});

// Go online/offline
export const setOnlineStatus = mutation({
    args: {
        is_online: v.boolean(),
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

        if (!driver) {
            throw new Error("Driver not found");
        }

        // Check if wallet is locked
        if (args.is_online && driver.wallet_locked) {
            throw new Error(
                `Akaunti imefungwa. ${driver.wallet_lock_reason || 'Lipa deni lako ili kufungua.'}`
            );
        }

        await ctx.db.patch(driver._id, { is_online: args.is_online });
    },
});

// Update location (called frequently by driver app)
export const updateLocation = mutation({
    args: {
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

        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!driver) {
            throw new Error("Driver not found");
        }

        await ctx.db.patch(driver._id, {
            current_location: args.location,
            last_location_update: new Date().toISOString(),
        });
    },
});

// Get current driver profile
export const getCurrentDriver = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        return await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
    },
});

// Get driver earnings
export const getEarnings = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { total: 0, today: 0, week: 0, month: 0 };
        }

        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!driver) {
            return { total: 0, today: 0, week: 0, month: 0 };
        }

        // Get completed rides
        const rides = await ctx.db
            .query("rides")
            .withIndex("by_driver", (q) => q.eq("driver_clerk_id", identity.subject))
            .filter((q) => q.eq(q.field("status"), "completed"))
            .collect();

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let today = 0;
        let week = 0;
        let month = 0;

        for (const ride of rides) {
            const rideDate = new Date(ride.completed_at || ride.created_at);
            const fare = ride.final_fare || ride.fare_estimate;
            const earnings = fare * (1 - driver.commission_rate);

            if (rideDate >= todayStart) today += earnings;
            if (rideDate >= weekStart) week += earnings;
            if (rideDate >= monthStart) month += earnings;
        }

        return {
            total: driver.total_earnings,
            today,
            week,
            month,
        };
    },
});

// Request payout
export const requestPayout = mutation({
    args: {
        amount: v.number(),
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

        if (!driver) {
            throw new Error("Driver not found");
        }

        if (args.amount > driver.total_earnings) {
            throw new Error("Insufficient balance");
        }

        const commission = args.amount * driver.commission_rate;
        const net_amount = args.amount - commission;

        const payoutId = await ctx.db.insert("payouts", {
            driver_clerk_id: identity.subject,
            amount: args.amount,
            commission,
            net_amount,
            method: driver.payout_method,
            status: "pending",
            created_at: new Date().toISOString(),
        });

        return payoutId;
    },
});

// Get driver by Clerk ID
export const getDriverByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});
