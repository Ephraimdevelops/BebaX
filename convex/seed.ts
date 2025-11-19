import { mutation } from "./_generated/server";

/**
 * Seed platform account - Run once to initialize the platform revenue account
 * This should be run manually in the Convex dashboard after deployment
 */
export const seedPlatformAccount = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if platform account already exists
        const existing = await ctx.db
            .query("accounts")
            .withIndex("by_type", (q) => q.eq("type", "platform_revenue"))
            .first();

        if (existing) {
            return { message: "Platform account already exists", account_id: existing._id };
        }

        // Create platform revenue account
        const accountId = await ctx.db.insert("accounts", {
            type: "platform_revenue",
            currency: "TZS",
            created_at: new Date().toISOString(),
        });

        return { message: "Platform account created successfully", account_id: accountId };
    },
});
