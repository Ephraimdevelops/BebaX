import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Save or update user's Expo push token
 */
export const savePushToken = mutation({
    args: {
        pushToken: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile) {
            throw new Error("Profile not found");
        }

        await ctx.db.patch(profile._id, {
            pushToken: args.pushToken,
        });

        return { success: true };
    },
});

/**
 * Get user's push token
 */
export const getPushToken = async (ctx: any, clerkId: string): Promise<string | null> => {
    const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();

    return profile?.pushToken || null;
};
