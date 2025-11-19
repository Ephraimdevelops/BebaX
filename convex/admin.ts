import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get pending drivers for verification
export const getPendingDrivers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        // Check if user is admin
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        return await ctx.db
            .query("drivers")
            .withIndex("by_verification", (q) => q.eq("verification_status", "pending"))
            .collect();
    },
});

// Verify driver
export const verifyDriver = mutation({
    args: {
        driver_id: v.id("drivers"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        const driver = await ctx.db.get(args.driver_id);
        if (!driver) {
            throw new Error("Driver not found");
        }

        await ctx.db.patch(args.driver_id, {
            verified: true,
            verification_status: "approved",
        });

        // Notify driver
        await ctx.db.insert("notifications", {
            user_clerk_id: driver.clerkId,
            type: "verification",
            title: "Verification Approved!",
            body: "Your driver account has been verified. You can now go online and accept rides.",
            read: false,
            created_at: new Date().toISOString(),
        });
    },
});

// Reject driver
export const rejectDriver = mutation({
    args: {
        driver_id: v.id("drivers"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        const driver = await ctx.db.get(args.driver_id);
        if (!driver) {
            throw new Error("Driver not found");
        }

        await ctx.db.patch(args.driver_id, {
            verified: false,
            verification_status: "rejected",
            rejection_reason: args.reason,
        });

        // Notify driver
        await ctx.db.insert("notifications", {
            user_clerk_id: driver.clerkId,
            type: "verification",
            title: "Verification Rejected",
            body: `Your verification was rejected: ${args.reason}`,
            read: false,
            created_at: new Date().toISOString(),
        });
    },
});

// Get all rides (admin)
export const getAllRides = query({
    args: {
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        let query = ctx.db.query("rides");

        if (args.status) {
            query = query.withIndex("by_status", (q) => q.eq("status", args.status as any));
        }

        const rides = await query.order("desc").take(args.limit || 100);
        return rides;
    },
});

// Get analytics
export const getAnalytics = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const allRides = await ctx.db.query("rides").collect();
        const allDrivers = await ctx.db.query("drivers").collect();

        const todayRides = allRides.filter(r => new Date(r.created_at) >= todayStart);
        const weekRides = allRides.filter(r => new Date(r.created_at) >= weekStart);
        const monthRides = allRides.filter(r => new Date(r.created_at) >= monthStart);

        const completedRides = allRides.filter(r => r.status === "completed");
        const totalRevenue = completedRides.reduce((sum, r) => {
            const fare = r.final_fare || r.fare_estimate;
            return sum + (fare * 0.15); // 15% commission
        }, 0);

        return {
            totalRides: allRides.length,
            todayRides: todayRides.length,
            weekRides: weekRides.length,
            monthRides: monthRides.length,
            totalDrivers: allDrivers.length,
            verifiedDrivers: allDrivers.filter(d => d.verified).length,
            onlineDrivers: allDrivers.filter(d => d.is_online).length,
            pendingDrivers: allDrivers.filter(d => d.verification_status === "pending").length,
            totalRevenue,
            averageRating: completedRides.reduce((sum, r) => sum + (r.driver_rating || 0), 0) / completedRides.length || 0,
        };
    },
});
