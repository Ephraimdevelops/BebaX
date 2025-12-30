import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Trigger an SOS alert
export const trigger = mutation({
    args: {
        ride_id: v.optional(v.id("rides")),
        location: v.object({
            lat: v.number(),
            lng: v.number(),
            address: v.string(),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const alertId = await ctx.db.insert("sos_alerts", {
            user_clerk_id: identity.subject,
            ride_id: args.ride_id,
            location: args.location,
            status: "active",
            created_at: new Date().toISOString(),
        });

        // Create urgent notification for all admins
        const admins = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .collect();

        for (const admin of admins) {
            await ctx.db.insert("notifications", {
                user_clerk_id: admin.clerkId,
                type: "sos_alert",
                title: "🆘 SOS ALERT",
                body: `Emergency alert triggered at ${args.location.address}`,
                read: false,
                created_at: new Date().toISOString(),
            });
        }

        return alertId;
    },
});

// Get user's own active alert
export const getMyActiveAlert = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        return await ctx.db
            .query("sos_alerts")
            .withIndex("by_user", (q) => q.eq("user_clerk_id", identity.subject))
            .filter((q) => q.eq(q.field("status"), "active"))
            .first();
    },
});

// Cancel an SOS alert (by the user who triggered it)
export const cancel = mutation({
    args: {
        alert_id: v.id("sos_alerts"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const alert = await ctx.db.get(args.alert_id);
        if (!alert) {
            throw new Error("Alert not found");
        }

        // Only the user who triggered it can cancel
        if (alert.user_clerk_id !== identity.subject) {
            throw new Error("Not authorized to cancel this alert");
        }

        await ctx.db.patch(args.alert_id, {
            status: "resolved",
            resolved_at: new Date().toISOString(),
        });
    },
});

// Resolve an SOS alert (Admin only)
export const resolve = mutation({
    args: {
        alert_id: v.id("sos_alerts"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Check if admin
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.alert_id, {
            status: "resolved",
            resolved_at: new Date().toISOString(),
        });
    },
});

// List active alerts (Admin only)
export const listActive = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        // Check if admin
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || user.role !== "admin") {
            return [];
        }

        return await ctx.db
            .query("sos_alerts")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();
    },
});

// List active alerts with enriched user data (Admin only)
export const listActiveEnriched = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        // Check if admin
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || user.role !== "admin") {
            return [];
        }

        const alerts = await ctx.db
            .query("sos_alerts")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        // Enrich with user data
        const enrichedAlerts = await Promise.all(
            alerts.map(async (alert) => {
                const alertUser = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", alert.user_clerk_id))
                    .first();

                let rideInfo = null;
                if (alert.ride_id) {
                    const ride = await ctx.db.get(alert.ride_id);
                    if (ride) {
                        rideInfo = {
                            pickup: ride.pickup_location.address,
                            dropoff: ride.dropoff_location.address,
                            status: ride.status,
                        };
                    }
                }

                return {
                    ...alert,
                    user_name: alertUser?.name || "Unknown",
                    user_phone: alertUser?.phone || "",
                    user_role: alertUser?.role || "customer",
                    ride_info: rideInfo,
                };
            })
        );

        return enrichedAlerts;
    },
});
