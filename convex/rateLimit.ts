import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Rate Limiting Implementation
 * Uses sliding window algorithm with Convex database
 */

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
    "ride:create": { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
    "message:send": { maxRequests: 60, windowMs: 60 * 1000 }, // 60 per minute
    "driver:location": { maxRequests: 120, windowMs: 60 * 1000 }, // 120 per minute
    "negotiation:offer": { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
};

/**
 * Check rate limit for a user action
 * Returns true if allowed, throws error if rate limited
 */
export const checkRateLimit = async (
    ctx: any,
    action: string
): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated");
    }

    const config = RATE_LIMITS[action];
    if (!config) {
        // No rate limit configured for this action
        return true;
    }

    const key = `${identity.subject}:${action}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Find existing rate limit record
    const existing = await ctx.db
        .query("rateLimits")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

    if (!existing) {
        // First request, create new record
        await ctx.db.insert("rateLimits", {
            key,
            count: 1,
            windowStart: now,
            expiresAt: now + config.windowMs,
        });
        return true;
    }

    // Check if window has expired
    if (existing.windowStart < windowStart) {
        // Window expired, reset counter
        await ctx.db.patch(existing._id, {
            count: 1,
            windowStart: now,
            expiresAt: now + config.windowMs,
        });
        return true;
    }

    // Within window, check count
    if (existing.count >= config.maxRequests) {
        const resetIn = Math.ceil((existing.expiresAt - now) / 1000);
        throw new Error(
            `Rate limit exceeded. Try again in ${resetIn} seconds.`
        );
    }

    // Increment counter
    await ctx.db.patch(existing._id, {
        count: existing.count + 1,
    });

    return true;
};

/**
 * Cleanup expired rate limit records (run as cron job)
 */
export const cleanupExpiredLimits = mutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const expired = await ctx.db
            .query("rateLimits")
            .withIndex("by_expiry")
            .filter((q) => q.lt(q.field("expiresAt"), now))
            .collect();

        for (const record of expired) {
            await ctx.db.delete(record._id);
        }

        return { deleted: expired.length };
    },
});

/**
 * Get rate limit status for current user
 */
export const getRateLimitStatus = query({
    args: { action: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const config = RATE_LIMITS[args.action];
        if (!config) {
            return { limited: false };
        }

        const key = `${identity.subject}:${args.action}`;
        const now = Date.now();

        const existing = await ctx.db
            .query("rateLimits")
            .withIndex("by_key", (q) => q.eq("key", key))
            .first();

        if (!existing || existing.windowStart < now - config.windowMs) {
            return {
                limited: false,
                remaining: config.maxRequests,
                resetAt: null,
            };
        }

        const remaining = Math.max(0, config.maxRequests - existing.count);
        const resetAt = new Date(existing.expiresAt).toISOString();

        return {
            limited: remaining === 0,
            remaining,
            resetAt,
        };
    },
});

/**
 * Helper to use in other mutations
 * Example:
 * 
 * import { checkRateLimit } from "./rateLimit";
 * 
 * export const createRide = mutation({
 *   handler: async (ctx, args) => {
 *     await checkRateLimit(ctx, "ride:create");
 *     // ... rest of logic
 *   }
 * });
 */
