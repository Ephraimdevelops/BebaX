import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new fleet
export const create = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Check if user already has a fleet
        const existingFleet = await ctx.db
            .query("fleets")
            .withIndex("by_owner", (q) => q.eq("owner_id", identity.subject))
            .first();

        if (existingFleet) {
            throw new Error("You already have a fleet");
        }

        // Create fleet
        const fleetId = await ctx.db.insert("fleets", {
            owner_id: identity.subject,
            name: args.name,
            total_earnings: 0,
            created_at: new Date().toISOString(),
        });

        // Update user role to fleet_owner
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (userProfile) {
            await ctx.db.patch(userProfile._id, { role: "fleet_owner" });
        }

        return fleetId;
    },
});

// Get my fleet details
export const getMyFleet = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        return await ctx.db
            .query("fleets")
            .withIndex("by_owner", (q) => q.eq("owner_id", identity.subject))
            .first();
    },
});

// Get drivers in my fleet
export const getMyDrivers = query({
    args: { fleet_id: v.id("fleets") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        // Verify ownership
        const fleet = await ctx.db.get(args.fleet_id);
        if (!fleet || fleet.owner_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        // Get drivers linked to this fleet
        // Note: We need an index on drivers by fleet_id, but currently we don't have one.
        // For now, we'll filter in memory or add an index.
        // Let's add an index to schema.ts first for efficiency.
        // Wait, I can't edit schema.ts in this step. I'll do a full scan for now or use filter.
        // Actually, I should have added the index. I'll add it in the next step if needed.
        // For now, let's use filter.

        const drivers = await ctx.db
            .query("drivers")
            .withIndex("by_fleet_id", (q) => q.eq("fleet_id", args.fleet_id))
            .collect();

        // Fetch profile details for each driver
        const driversWithDetails = await Promise.all(
            drivers.map(async (driver) => {
                const profile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", driver.clerkId))
                    .first();
                return { ...driver, profile };
            })
        );

        return driversWithDetails;
    },
});

// Add a driver to fleet (by email or phone - simplified for now)
// In a real app, this would be an invite flow.
// Here, we'll just assume we have the driver's Clerk ID or we search by phone.
export const addDriver = mutation({
    args: {
        fleet_id: v.id("fleets"),
        driver_phone: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const fleet = await ctx.db.get(args.fleet_id);
        if (!fleet || fleet.owner_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        // Find driver by phone
        const userProfile = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("phone"), args.driver_phone))
            .first();

        if (!userProfile || userProfile.role !== "driver") {
            throw new Error("Driver not found");
        }

        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", userProfile.clerkId))
            .first();

        if (!driver) {
            throw new Error("Driver record not found");
        }

        if (driver.fleet_id) {
            throw new Error("Driver already belongs to a fleet");
        }

        await ctx.db.patch(driver._id, { fleet_id: args.fleet_id });
    },
});

// Remove driver from fleet
export const removeDriver = mutation({
    args: {
        fleet_id: v.id("fleets"),
        driver_id: v.id("drivers"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const fleet = await ctx.db.get(args.fleet_id);
        if (!fleet || fleet.owner_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        const driver = await ctx.db.get(args.driver_id);
        if (!driver || driver.fleet_id !== args.fleet_id) {
            throw new Error("Driver not in your fleet");
        }

        await ctx.db.patch(driver._id, { fleet_id: undefined });
    },
});

// Get rides for my fleet
export const getFleetRides = query({
    args: { fleet_id: v.id("fleets") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        // Verify ownership
        const fleet = await ctx.db.get(args.fleet_id);
        if (!fleet || fleet.owner_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        // Get fleet drivers
        const drivers = await ctx.db
            .query("drivers")
            .withIndex("by_fleet_id", (q) => q.eq("fleet_id", args.fleet_id))
            .collect();

        const driverIds = drivers.map(d => d.clerkId);

        if (driverIds.length === 0) {
            return [];
        }

        // Fetch rides driven by these drivers
        // Note: Needs efficient index. For now, doing parallel fetches + filtering.
        // In prod, would use proper relationship index or aggregate table.
        // We'll fetch robustly:

        const allRides = await ctx.db
            .query("rides")
            .withIndex("by_status", (q) => q.eq("status", "completed"))
            .order("desc")
            .take(100); // Limit to recent 100 trips for dashboard

        const fleetRides = allRides.filter(ride => ride.driver_clerk_id && driverIds.includes(ride.driver_clerk_id));

        // Enrich with driver info
        const ridesWithDetails = await Promise.all(
            fleetRides.map(async (ride) => {
                const driver = drivers.find(d => d.clerkId === ride.driver_clerk_id);
                // Get driver name from profile
                let driverName = "Unknown Driver";
                if (driver) {
                    const profile = await ctx.db
                        .query("userProfiles")
                        .withIndex("by_clerk_id", (q) => q.eq("clerkId", driver.clerkId))
                        .unique();
                    driverName = profile?.name || "Unknown Driver";
                }

                return {
                    ...ride,
                    driver_name: driverName,
                    vehicle_type: driver?.vehicle_type
                };
            })
        );

        return ridesWithDetails;
    },
});
