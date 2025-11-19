import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const testInsert = internalMutation({
    args: {},
    handler: async (ctx) => {
        console.log("Testing insert...");
        try {
            const id = await ctx.db.insert("userProfiles", {
                clerkId: "test_clerk_id_123",
                role: "customer",
                phone: "0712345678",
                name: "Debug User",
                rating: 5.0,
                totalRides: 0,
                created_at: new Date().toISOString(),
            });
            console.log("Insert successful:", id);
            return id;
        } catch (e) {
            console.error("Insert failed:", e);
            throw e;
        }
    },
});
