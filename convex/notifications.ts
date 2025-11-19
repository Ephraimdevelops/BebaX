import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a notification
export const create = mutation({
    args: {
        user_clerk_id: v.string(),
        type: v.union(
            v.literal("ride_request"),
            v.literal("ride_accepted"),
            v.literal("ride_completed"),
            v.literal("payment"),
            v.literal("verification"),
            v.literal("promotion")
        ),
        title: v.string(),
        body: v.string(),
        ride_id: v.optional(v.id("rides")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("notifications", {
            user_clerk_id: args.user_clerk_id,
            type: args.type,
            title: args.title,
            body: args.body,
            read: false,
            ride_id: args.ride_id,
            created_at: new Date().toISOString(),
        });
    },
});

// Get user's notifications
export const getMyNotifications = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        return await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("user_clerk_id", identity.subject))
            .order("desc")
            .take(50);
    },
});

// Get unread count
export const getUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return 0;
        }

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("user_clerk_id", identity.subject))
            .filter((q) => q.eq(q.field("read"), false))
            .collect();

        return unread.length;
    },
});

// Mark as read
export const markAsRead = mutation({
    args: {
        notification_id: v.id("notifications"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const notification = await ctx.db.get(args.notification_id);
        if (!notification) {
            throw new Error("Notification not found");
        }

        if (notification.user_clerk_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        await ctx.db.patch(args.notification_id, { read: true });
    },
});

// Mark all as read
export const markAllAsRead = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("user_clerk_id", identity.subject))
            .filter((q) => q.eq(q.field("read"), false))
            .collect();

        for (const notification of unread) {
            await ctx.db.patch(notification._id, { read: true });
        }
    },
});
