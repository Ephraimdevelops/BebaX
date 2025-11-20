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

        const unverifiedDrivers = await ctx.db
            .query("drivers")
            .filter((q: any) => q.eq(q.field("verified"), false))
            .collect();

        return unverifiedDrivers;
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

        const baseQuery = ctx.db.query("rides");
        const rides = await (args.status
            ? baseQuery.withIndex("by_status", (q: any) => q.eq("status", args.status))
            : baseQuery
        ).order("desc").take(args.limit || 100);
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
            pendingDrivers: allDrivers.filter(d => !d.verified).length,
            totalRevenue,
            averageRating: completedRides.reduce((sum, r) => sum + (r.driver_rating || 0), 0) / completedRides.length || 0,
        };
    },
});

// Get all drivers with user profile and vehicle information
export const getAllDrivers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        const drivers = await ctx.db.query("drivers").collect();

        // Enrich each driver with user profile and vehicle data
        const enrichedDrivers = await Promise.all(
            drivers.map(async (driver) => {
                // Get user profile
                const userProfile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", driver.clerkId))
                    .first();

                // Get vehicle
                const vehicle = await ctx.db
                    .query("vehicles")
                    .withIndex("by_driver", (q: any) => q.eq("driver_clerk_id", driver.clerkId))
                    .first();

                return {
                    ...driver,
                    user_name: userProfile?.name || "Unknown",
                    user_phone: userProfile?.phone || "N/A",
                    vehicle_type: vehicle?.type || "N/A",
                    vehicle_plate: vehicle?.plate_number || "N/A",
                };
            })
        );

        return enrichedDrivers;
    },
});

// Enhanced getPendingDrivers with all necessary fields
export const getPendingDriversEnriched = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        const unverifiedDrivers = await ctx.db
            .query("drivers")
            .filter((q: any) => q.eq(q.field("verified"), false))
            .collect();

        // Enrich with user and vehicle data
        const enriched = await Promise.all(
            unverifiedDrivers.map(async (driver) => {
                const userProfile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", driver.clerkId))
                    .first();

                const vehicle = await ctx.db
                    .query("vehicles")
                    .withIndex("by_driver", (q: any) => q.eq("driver_clerk_id", driver.clerkId))
                    .first();

                // Get document URLs if they exist
                const documents = driver.documents || {};
                const nida_photo = documents.nida_photo
                    ? await ctx.storage.getUrl(documents.nida_photo)
                    : null;
                const license_photo = documents.license_photo
                    ? await ctx.storage.getUrl(documents.license_photo)
                    : null;

                return {
                    ...driver,
                    user_name: userProfile?.name || "Unknown",
                    user_phone: userProfile?.phone || "N/A",
                    vehicle_type: vehicle?.type || "N/A",
                    vehicle_plate: vehicle?.plate_number || "N/A",
                    nida_photo,
                    license_photo,
                };
            })
        );

        return enriched;
    },
});

// Get all rides with customer and driver names
export const getAllRidesEnriched = query({
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
            .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        const baseQuery = ctx.db.query("rides");
        const rides = await (args.status
            ? baseQuery.withIndex("by_status", (q: any) => q.eq("status", args.status))
            : baseQuery
        ).order("desc").take(args.limit || 100);

        // Enrich with customer and driver names
        const enrichedRides = await Promise.all(
            rides.map(async (ride) => {
                const customer = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", ride.customer_clerk_id))
                    .first();

                let driver = null;
                if (ride.driver_clerk_id) {
                    driver = await ctx.db
                        .query("userProfiles")
                        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", ride.driver_clerk_id))
                        .first();
                }

                return {
                    ...ride,
                    customer_name: customer?.name || "Unknown",
                    driver_name: driver?.name || "Unassigned",
                };
            })
        );

        return enrichedRides;
    },
});
