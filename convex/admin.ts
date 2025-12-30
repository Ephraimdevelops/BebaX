import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to check if user is admin
async function checkAdmin(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated");
    }

    const user = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .first();

    if (!user || user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
    }

    return user;
}

// Promote user to admin
export const promoteToAdmin = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        if (!user) {
            throw new Error(`User with email ${args.email} not found.`);
        }

        await ctx.db.patch(user._id, { role: "admin" });
        return `User ${args.email} is now an ADMIN.`;
    },
});

// Promote user to driver (for fixing accounts that were created as customer)
export const promoteToDriver = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        if (!user) {
            throw new Error(`User with email ${args.email} not found.`);
        }

        await ctx.db.patch(user._id, { role: "driver" });
        return `User ${args.email} is now a DRIVER.`;
    },
});

// Get pending drivers with enriched user data
export const getPendingDriversEnriched = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const pendingDrivers = await ctx.db
            .query("drivers")
            .filter((q) => q.eq(q.field("verified"), false))
            .collect();

        // Enrich with user profile data and document URLs
        const enrichedDrivers = await Promise.all(
            pendingDrivers.map(async (driver) => {
                const userProfile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", driver.clerkId))
                    .first();

                const vehicle = await ctx.db
                    .query("vehicles")
                    .withIndex("by_driver", (q) => q.eq("driver_clerk_id", driver.clerkId))
                    .first();

                // Get document URLs
                let nida_photo = null;
                let license_photo = null;
                if (driver.documents?.nida_photo) {
                    nida_photo = await ctx.storage.getUrl(driver.documents.nida_photo);
                }
                if (driver.documents?.license_photo) {
                    license_photo = await ctx.storage.getUrl(driver.documents.license_photo);
                }

                return {
                    ...driver,
                    user_name: userProfile?.name || "Unknown",
                    user_phone: userProfile?.phone || "N/A",
                    user_email: userProfile?.email || "N/A",
                    // Use vehicle_type from driver record (new schema) or fallback to vehicles table (legacy)
                    vehicle_type: (driver as any).vehicle_type || vehicle?.type || "N/A",
                    vehicle_plate: vehicle?.plate_number || "N/A",
                    nida_photo,
                    license_photo,
                };
            })
        );

        return enrichedDrivers;
    },
});

// Get all drivers
export const getAllDrivers = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const drivers = await ctx.db.query("drivers").collect();

        // Enrich with user profile data
        const enrichedDrivers = await Promise.all(
            drivers.map(async (driver) => {
                const userProfile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", driver.clerkId))
                    .first();

                const vehicle = await ctx.db
                    .query("vehicles")
                    .withIndex("by_driver", (q) => q.eq("driver_clerk_id", driver.clerkId))
                    .first();

                return {
                    ...driver,
                    user_name: userProfile?.name || "Unknown",
                    user_phone: userProfile?.phone || "N/A",
                    // Use vehicle_type from driver record (new schema) or fallback to vehicles table (legacy)
                    vehicle_type: (driver as any).vehicle_type || vehicle?.type || "N/A",
                    vehicle_plate: vehicle?.plate_number || "N/A",
                };
            })
        );

        return enrichedDrivers;
    },
});

// Get all rides with enriched customer/driver names
export const getAllRidesEnriched = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        let rides;
        if (args.status !== undefined) {
            const statusFilter = args.status;
            rides = await ctx.db
                .query("rides")
                .withIndex("by_status", (q) => q.eq("status", statusFilter))
                .order("desc")
                .take(100);
        } else {
            rides = await ctx.db.query("rides").order("desc").take(100);
        }

        // Enrich with names
        const enrichedRides = await Promise.all(
            rides.map(async (ride) => {
                const customer = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.customer_clerk_id))
                    .first();

                let driver = null;
                if (ride.driver_clerk_id) {
                    const driverClerkId = ride.driver_clerk_id;
                    driver = await ctx.db
                        .query("userProfiles")
                        .withIndex("by_clerk_id", (q) => q.eq("clerkId", driverClerkId))
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

// Get platform analytics
export const getAnalytics = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const allDrivers = await ctx.db.query("drivers").collect();
        const verifiedDrivers = allDrivers.filter((d) => d.verified);
        const onlineDrivers = allDrivers.filter((d) => d.is_online);

        const allRides = await ctx.db.query("rides").collect();
        const completedRides = allRides.filter((r) => r.status === "completed");

        // Calculate total revenue (platform commission)
        let totalRevenue = 0;
        for (const ride of completedRides) {
            const fare = ride.final_fare || ride.fare_estimate;
            // Assuming 15% platform commission
            totalRevenue += fare * 0.15;
        }

        return {
            totalDrivers: allDrivers.length,
            verifiedDrivers: verifiedDrivers.length,
            onlineDrivers: onlineDrivers.length,
            totalRides: allRides.length,
            completedRides: completedRides.length,
            totalRevenue: Math.round(totalRevenue),
        };
    },
});

// Verify a driver
export const verifyDriver = mutation({
    args: { driver_id: v.id("drivers") },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        await ctx.db.patch(args.driver_id, { verified: true });

        // Optionally send notification to driver
        const driver = await ctx.db.get(args.driver_id);
        if (driver) {
            await ctx.db.insert("notifications", {
                user_clerk_id: driver.clerkId,
                type: "verification",
                title: "Account Verified! ✅",
                body: "Congratulations! Your driver account has been verified. You can now go online and start accepting rides.",
                read: false,
                created_at: new Date().toISOString(),
            });
        }

        return { success: true };
    },
});

// Reject a driver
export const rejectDriver = mutation({
    args: {
        driver_id: v.id("drivers"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        const driver = await ctx.db.get(args.driver_id);
        if (!driver) {
            throw new Error("Driver not found");
        }

        // Send rejection notification
        await ctx.db.insert("notifications", {
            user_clerk_id: driver.clerkId,
            type: "verification",
            title: "Verification Update",
            body: `Your driver application was not approved. Reason: ${args.reason}. Please update your documents and try again.`,
            read: false,
            created_at: new Date().toISOString(),
        });

        // Optionally: Delete the driver record or mark as rejected
        // For now, we'll keep it but it remains unverified
        return { success: true };
    },
});
