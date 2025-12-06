import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { reserveFunds, settleTrip } from "./utils/financial";

// 1. Setup Test Data
export const setupTestData = mutation({
    args: {},
    handler: async (ctx) => {
        // Create Org
        const orgId = await ctx.db.insert("organizations", {
            name: "Test Corp",
            tinNumber: "123-456-789",
            walletBalance: 100000, // 100k TZS
            reservedBalance: 0,
            creditLimit: 50000,
            billingModel: "prepaid",
            adminEmail: "admin@testcorp.com",
            created_at: new Date().toISOString(),
        });

        // Get a user (assuming one exists, or create one)
        const user = await ctx.db.query("userProfiles").first();
        if (!user) throw new Error("No user found to link");

        // Link User to Org
        await ctx.db.patch(user._id, {
            orgId: orgId,
            orgRole: "admin",
            spendingLimitPerDay: 20000,
        });

        return { orgId, userId: user._id };
    },
});

// 2. Verify Reservation
export const verifyReservation = query({
    args: { orgId: v.id("organizations") },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.orgId);
        return {
            walletBalance: org?.walletBalance,
            reservedBalance: org?.reservedBalance,
        };
    },
});

// 3. Simulate Booking (Reservation)
export const simulateBooking = mutation({
    args: {
        orgId: v.id("organizations"),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        return await reserveFunds(ctx, args.orgId, args.amount);
    },
});

// 4. Simulate Completion (Settlement)
export const simulateCompletion = mutation({
    args: {
        orgId: v.id("organizations"),
        estimatedFare: v.number(),
        finalFare: v.number(),
        driverClerkId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await settleTrip(ctx, args.orgId, args.estimatedFare, args.finalFare, args.driverClerkId);
    },
});
