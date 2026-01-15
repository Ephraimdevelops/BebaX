import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Submit a review after a ride (both driver and customer can review)
 */
export const submitReview = mutation({
    args: {
        ride_id: v.id("rides"),
        rating: v.number(), // 1-5
        comment: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Validate rating
        if (args.rating < 1 || args.rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }

        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            throw new Error("Ride not found");
        }

        // Determine reviewer role and reviewee
        const isDriver = ride.driver_clerk_id === identity.subject;
        const isCustomer = ride.customer_clerk_id === identity.subject;

        if (!isDriver && !isCustomer) {
            throw new Error("You are not part of this ride");
        }

        // Check if already reviewed
        const existingReview = await ctx.db
            .query("reviews")
            .withIndex("by_ride", (q) => q.eq("ride_id", args.ride_id))
            .filter((q) => q.eq(q.field("reviewer_clerk_id"), identity.subject))
            .first();

        if (existingReview) {
            throw new Error("You have already reviewed this ride");
        }

        const revieweeId = isDriver ? ride.customer_clerk_id : ride.driver_clerk_id;

        // Create review
        await ctx.db.insert("reviews", {
            ride_id: args.ride_id,
            reviewer_clerk_id: identity.subject,
            reviewee_clerk_id: revieweeId!,
            reviewer_role: isDriver ? "driver" : "customer",
            rating: args.rating,
            comment: args.comment,
            created_at: new Date().toISOString(),
        });

        // Update the reviewee's average rating
        const allReviews = await ctx.db
            .query("reviews")
            .withIndex("by_reviewee", (q) => q.eq("reviewee_clerk_id", revieweeId!))
            .collect();

        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        // Update user profile rating
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", revieweeId!))
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, {
                rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            });
        }

        return { success: true, newRating: avgRating };
    },
});

/**
 * Get reviews for a specific user
 */
export const getUserReviews = query({
    args: {
        clerk_id: v.string(),
    },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_reviewee", (q) => q.eq("reviewee_clerk_id", args.clerk_id))
            .order("desc")
            .take(50);

        return reviews;
    },
});

/**
 * Check if current user can review a ride
 */
export const canReviewRide = query({
    args: {
        ride_id: v.id("rides"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { canReview: false, reason: "Not authenticated" };
        }

        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            return { canReview: false, reason: "Ride not found" };
        }

        // Check if ride is completed
        if (ride.status !== "delivered" && ride.status !== "completed") {
            return { canReview: false, reason: "Ride not yet completed" };
        }

        // Check if already reviewed
        const existingReview = await ctx.db
            .query("reviews")
            .withIndex("by_ride", (q) => q.eq("ride_id", args.ride_id))
            .filter((q) => q.eq(q.field("reviewer_clerk_id"), identity.subject))
            .first();

        if (existingReview) {
            return { canReview: false, reason: "Already reviewed" };
        }

        return { canReview: true };
    },
});
