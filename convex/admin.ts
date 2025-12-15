import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const promoteToAdmin = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        if (!user) {
            throw new Error(`User with email ${args.email} not found.`);
        }

        await ctx.db.patch(user._id, { role: "admin" });
        return `User ${args.email} is now an ADMIN.`;
    },
});
