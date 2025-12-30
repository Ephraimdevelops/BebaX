import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all insurance tiers
export const getTiers = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("insurance_tiers")
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

// Get a specific tier by code
export const getTierByCode = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        const tier = await ctx.db
            .query("insurance_tiers")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();
        return tier;
    },
});

// Seed default insurance tiers (run once)
export const seedTiers = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("insurance_tiers").first();
        if (existing) {
            return { message: "Tiers already exist" };
        }

        const tiers = [
            {
                name: "Basic",
                code: "basic",
                fee: 0,
                maxCoverage: 100000, // 100K TZS
                description: "Liability coverage only. Free with every ride.",
                isActive: true,
                created_at: new Date().toISOString(),
            },
            {
                name: "Standard",
                code: "standard",
                fee: 2500,
                maxCoverage: 1000000, // 1M TZS
                description: "Covers damage and theft. Photo verification required.",
                isActive: true,
                created_at: new Date().toISOString(),
            },
            {
                name: "Premium",
                code: "premium",
                fee: 10000,
                maxCoverage: 10000000, // 10M TZS
                description: "Full declared value coverage. Express claim processing.",
                isActive: true,
                created_at: new Date().toISOString(),
            },
        ];

        for (const tier of tiers) {
            await ctx.db.insert("insurance_tiers", tier);
        }

        return { message: "Seeded 3 insurance tiers" };
    },
});

// File a claim
export const fileClaim = mutation({
    args: {
        rideId: v.id("rides"),
        tierId: v.id("insurance_tiers"),
        declaredValue: v.number(),
        claimAmount: v.number(),
        claimReason: v.string(),
        evidencePhotos: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Get the ride to verify ownership
        const ride = await ctx.db.get(args.rideId);
        if (!ride || ride.customer_clerk_id !== identity.subject) {
            throw new Error("Ride not found or unauthorized");
        }

        // Get the tier to verify coverage
        const tier = await ctx.db.get(args.tierId);
        if (!tier) throw new Error("Insurance tier not found");

        if (args.claimAmount > tier.maxCoverage) {
            throw new Error(`Claim amount exceeds maximum coverage of ${tier.maxCoverage} TZS`);
        }

        const claimId = await ctx.db.insert("insurance_claims", {
            rideId: args.rideId,
            customerClerkId: identity.subject,
            tierId: args.tierId,
            declaredValue: args.declaredValue,
            claimAmount: args.claimAmount,
            claimReason: args.claimReason,
            evidencePhotos: args.evidencePhotos,
            status: "pending",
            created_at: new Date().toISOString(),
        });

        return claimId;
    },
});

// Get claims for a customer
export const getMyClai = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const claims = await ctx.db
            .query("insurance_claims")
            .withIndex("by_customer", (q) => q.eq("customerClerkId", identity.subject))
            .order("desc")
            .collect();

        // Enrich with tier info
        const enriched = await Promise.all(
            claims.map(async (claim) => {
                const tier = await ctx.db.get(claim.tierId);
                const ride = await ctx.db.get(claim.rideId);
                return { ...claim, tier, ride };
            })
        );

        return enriched;
    },
});

// Admin: Get all pending claims
export const getPendingClaims = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Check if user is admin
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const claims = await ctx.db
            .query("insurance_claims")
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "pending"),
                    q.eq(q.field("status"), "under_review")
                )
            )
            .collect();

        // Enrich
        const enriched = await Promise.all(
            claims.map(async (claim) => {
                const tier = await ctx.db.get(claim.tierId);
                const ride = await ctx.db.get(claim.rideId);
                const customer = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", claim.customerClerkId))
                    .first();
                return { ...claim, tier, ride, customer };
            })
        );

        return enriched;
    },
});

// Admin: Update claim status
export const updateClaimStatus = mutation({
    args: {
        claimId: v.id("insurance_claims"),
        status: v.union(
            v.literal("under_review"),
            v.literal("approved"),
            v.literal("rejected"),
            v.literal("paid")
        ),
        adminNotes: v.optional(v.string()),
        approvedAmount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Check if user is admin
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const updates: Record<string, unknown> = {
            status: args.status,
        };

        if (args.adminNotes) updates.adminNotes = args.adminNotes;
        if (args.approvedAmount !== undefined) updates.approvedAmount = args.approvedAmount;
        if (args.status === "approved" || args.status === "rejected" || args.status === "paid") {
            updates.resolvedAt = new Date().toISOString();
        }

        await ctx.db.patch(args.claimId, updates);

        return { success: true };
    },
});
