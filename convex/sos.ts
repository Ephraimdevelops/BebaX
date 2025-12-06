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

        // In a real app, we would trigger an SMS/Push notification to admin/contacts here
        // await sendSMS(adminPhone, "SOS Alert triggered!");

        return alertId;
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
