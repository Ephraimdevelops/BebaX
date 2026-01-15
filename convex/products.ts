import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create Product (Instagram-style: simple and fast)
export const create = mutation({
    args: {
        orgId: v.id("organizations"),
        name: v.string(),
        description: v.optional(v.string()),
        price: v.optional(v.number()), // Optional - "Ask for price" items
        category: v.optional(v.string()),
        image: v.optional(v.string()),
        inStock: v.optional(v.boolean()), // Default to true
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        // Verify admin
        if (!user?.orgId || user.orgId !== args.orgId || user.orgRole !== "admin") {
            throw new Error("Unauthorized");
        }

        const productId = await ctx.db.insert("products", {
            orgId: args.orgId,
            name: args.name,
            description: args.description,
            price: args.price,
            category: args.category,
            image: args.image,
            inStock: args.inStock ?? true, // Default to in stock
            created_at: new Date().toISOString(),
        });

        return productId;
    },
});

// Update Product
export const update = mutation({
    args: {
        productId: v.id("products"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        price: v.optional(v.number()),
        category: v.optional(v.string()),
        image: v.optional(v.string()),
        inStock: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgId !== product.orgId || user.orgRole !== "admin") {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.productId, {
            name: args.name,
            description: args.description,
            price: args.price,
            category: args.category,
            image: args.image,
            inStock: args.inStock,
        });

        return { success: true };
    },
});

// Get Products for an Org
export const getByOrg = query({
    args: { orgId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("products")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();
    },
});

// Delete Product
export const remove = mutation({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgId !== product.orgId || user.orgRole !== "admin") {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.productId);
    },
});
