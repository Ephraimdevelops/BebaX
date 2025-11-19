import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Customer makes an offer
export const customerOffer = mutation({
    args: {
        ride_id: v.id("rides"),
        amount: v.number(),
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

        if (ride.customer_clerk_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        const negotiationEntry = {
            from: "customer" as const,
            amount: args.amount,
            timestamp: new Date().toISOString(),
        };

        const history = ride.negotiation_history || [];
        history.push(negotiationEntry);

        await ctx.db.patch(args.ride_id, {
            negotiation_history: history,
            negotiated_fare: args.amount,
        });

        // Notify driver if assigned
        if (ride.driver_clerk_id) {
            await ctx.db.insert("notifications", {
                user_clerk_id: ride.driver_clerk_id,
                type: "ride_request",
                title: "New Price Offer",
                body: `Customer offered ${args.amount} TZS`,
                read: false,
                ride_id: args.ride_id,
                created_at: new Date().toISOString(),
            });
        }

        return negotiationEntry;
    },
});

// Driver makes a counteroffer
export const driverCounteroffer = mutation({
    args: {
        ride_id: v.id("rides"),
        amount: v.number(),
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

        if (ride.driver_clerk_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        const negotiationEntry = {
            from: "driver" as const,
            amount: args.amount,
            timestamp: new Date().toISOString(),
        };

        const history = ride.negotiation_history || [];
        history.push(negotiationEntry);

        await ctx.db.patch(args.ride_id, {
            negotiation_history: history,
            negotiated_fare: args.amount,
        });

        // Notify customer
        await ctx.db.insert("notifications", {
            user_clerk_id: ride.customer_clerk_id,
            type: "ride_request",
            title: "Driver Counteroffer",
            body: `Driver offered ${args.amount} TZS`,
            read: false,
            ride_id: args.ride_id,
            created_at: new Date().toISOString(),
        });

        return negotiationEntry;
    },
});

// Accept the current negotiated price
export const acceptOffer = mutation({
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

        // Either customer or driver can accept
        if (
            ride.customer_clerk_id !== identity.subject &&
            ride.driver_clerk_id !== identity.subject
        ) {
            throw new Error("Not authorized");
        }

        if (!ride.negotiated_fare) {
            throw new Error("No negotiated price to accept");
        }

        await ctx.db.patch(args.ride_id, {
            final_fare: ride.negotiated_fare,
            status: "accepted",
            accepted_at: new Date().toISOString(),
        });

        // Notify the other party
        const notifyId =
            identity.subject === ride.customer_clerk_id
                ? ride.driver_clerk_id
                : ride.customer_clerk_id;

        if (notifyId) {
            await ctx.db.insert("notifications", {
                user_clerk_id: notifyId,
                type: "ride_accepted",
                title: "Price Accepted!",
                body: `Price of ${ride.negotiated_fare} TZS has been accepted`,
                read: false,
                ride_id: args.ride_id,
                created_at: new Date().toISOString(),
            });
        }
    },
});

// Reject the offer
export const rejectOffer = mutation({
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

        if (
            ride.customer_clerk_id !== identity.subject &&
            ride.driver_clerk_id !== identity.subject
        ) {
            throw new Error("Not authorized");
        }

        await ctx.db.patch(args.ride_id, {
            negotiated_fare: undefined,
        });
    },
});

// Get negotiation history
export const getHistory = query({
    args: { ride_id: v.id("rides") },
    handler: async (ctx, args) => {
        const ride = await ctx.db.get(args.ride_id);
        return ride?.negotiation_history || [];
    },
});
