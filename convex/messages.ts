import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send a message
export const send = mutation({
    args: {
        ride_id: v.id("rides"),
        message: v.string(),
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

        // Only customer or driver can send messages
        if (
            ride.customer_clerk_id !== identity.subject &&
            ride.driver_clerk_id !== identity.subject
        ) {
            throw new Error("Not authorized");
        }

        const messageId = await ctx.db.insert("messages", {
            ride_id: args.ride_id,
            sender_clerk_id: identity.subject,
            message: args.message,
            timestamp: new Date().toISOString(),
            read: false,
        });

        // Notify the other party
        const recipientId =
            identity.subject === ride.customer_clerk_id
                ? ride.driver_clerk_id
                : ride.customer_clerk_id;

        if (recipientId) {
            await ctx.db.insert("notifications", {
                user_clerk_id: recipientId,
                type: "ride_request",
                title: "New Message",
                body: args.message.substring(0, 50),
                read: false,
                ride_id: args.ride_id,
                created_at: new Date().toISOString(),
            });
        }

        return messageId;
    },
});

// Get messages for a ride (real-time subscription)
export const getByRide = query({
    args: { ride_id: v.id("rides") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            return [];
        }

        // Only customer or driver can view messages
        if (
            ride.customer_clerk_id !== identity.subject &&
            ride.driver_clerk_id !== identity.subject
        ) {
            return [];
        }

        return await ctx.db
            .query("messages")
            .withIndex("by_ride", (q) => q.eq("ride_id", args.ride_id))
            .order("asc")
            .collect();
    },
});

// Mark messages as read
export const markAsRead = mutation({
    args: {
        ride_id: v.id("rides"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_ride", (q) => q.eq("ride_id", args.ride_id))
            .collect();

        // Mark all messages not sent by current user as read
        for (const message of messages) {
            if (message.sender_clerk_id !== identity.subject && !message.read) {
                await ctx.db.patch(message._id, { read: true });
            }
        }
    },
});
