import { mutation, query } from "./_generated/server";

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

// ============================================
// AFRICAN LOGISTICS ENGINE - SEED DATA
// ============================================

// Tanzania Matrix - 8 Vehicle Pricing Tiers
const TANZANIA_MATRIX = [
    {
        vehicle_type: "boda" as const,
        base_fare: 2000,
        rate_per_km: 200,
        rate_per_min: 20,
        min_fare: 3000,
        loading_window_min: 5,
        demurrage_rate: 100,
        commission_rate: 0.12,
        surge_cap: 1.5,
        min_hourly_net: 4000,
        currency: "TZS",
    },
    {
        vehicle_type: "toyo" as const,
        base_fare: 3000,
        rate_per_km: 300,
        rate_per_min: 30,
        min_fare: 5000,
        loading_window_min: 10,
        demurrage_rate: 150,
        commission_rate: 0.12,
        surge_cap: 1.5,
        min_hourly_net: 4000,
        currency: "TZS",
    },
    {
        vehicle_type: "bajaji" as const,
        base_fare: 3500,
        rate_per_km: 350,
        rate_per_min: 35,
        min_fare: 5500,
        loading_window_min: 10,
        demurrage_rate: 150,
        commission_rate: 0.12,
        surge_cap: 1.5,
        min_hourly_net: 4000,
        currency: "TZS",
    },
    {
        vehicle_type: "kirikuu" as const,
        base_fare: 5000,
        rate_per_km: 500,
        rate_per_min: 40,
        min_fare: 8000,
        loading_window_min: 20,
        demurrage_rate: 300,
        commission_rate: 0.12,
        surge_cap: 2.0,
        min_hourly_net: 4000,
        currency: "TZS",
    },
    {
        vehicle_type: "pickup" as const,
        base_fare: 8000,
        rate_per_km: 700,
        rate_per_min: 50,
        min_fare: 12000,
        loading_window_min: 20,
        demurrage_rate: 400,
        commission_rate: 0.12,
        surge_cap: 2.0,
        min_hourly_net: 4000,
        currency: "TZS",
    },
    {
        vehicle_type: "canter" as const,
        base_fare: 15000,
        rate_per_km: 1000,
        rate_per_min: 80,
        min_fare: 25000,
        loading_window_min: 30,
        demurrage_rate: 500,
        commission_rate: 0.10,
        surge_cap: 2.0,
        min_hourly_net: 4000,
        currency: "TZS",
    },
    {
        vehicle_type: "fuso" as const,
        base_fare: 30000,
        rate_per_km: 1500,
        rate_per_min: 100,
        min_fare: 50000,
        loading_window_min: 45,
        demurrage_rate: 750,
        commission_rate: 0.10,
        surge_cap: 2.0,
        min_hourly_net: 4000,
        currency: "TZS",
    },
    {
        vehicle_type: "trailer" as const,
        base_fare: 60000,
        rate_per_km: 2500,
        rate_per_min: 150,
        min_fare: 100000,
        loading_window_min: 60,
        demurrage_rate: 1000,
        commission_rate: 0.08,
        surge_cap: 2.0,
        min_hourly_net: 4000,
        currency: "TZS",
    },
];

/**
 * Seed the pricing_config table with the Tanzania Matrix
 * Run this once in Convex Dashboard to populate initial pricing data
 */
export const seedPricingConfig = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if already seeded
        const existing = await ctx.db.query("pricing_config").first();
        if (existing) {
            return { success: false, message: "Already seeded. Delete existing configs to reseed." };
        }

        const now = new Date().toISOString();

        // Insert all vehicle configs
        for (const config of TANZANIA_MATRIX) {
            await ctx.db.insert("pricing_config", {
                ...config,
                updated_at: now,
            });
        }

        return { success: true, message: `Seeded ${TANZANIA_MATRIX.length} vehicle pricing configs.` };
    },
});

/**
 * Get all pricing configs (for admin dashboard)
 */
export const getAllPricingConfigs = query({
    args: {},
    handler: async (ctx) => {
        const configs = await ctx.db.query("pricing_config").collect();
        return configs;
    },
});

// PRICING RULES - Required for calculateFare engine
const PRICING_RULES = [
    {
        vehicle_type: "boda",
        pricing_model: "range" as const,
        base_fare_multiplier: 0.7,
        per_km_multiplier: 0.1,
        min_fare_multiplier: 1.0,
        range_tiers: [
            { max_km: 3, multiplier: 0.8 },
            { max_km: 7, multiplier: 1.2 },
            { max_km: 15, multiplier: 1.8 },
        ],
        free_loading_minutes: 5,
        demurrage_multiplier: 0.03,
        is_active: true,
    },
    {
        vehicle_type: "toyo",
        pricing_model: "range" as const,
        base_fare_multiplier: 1.0,
        per_km_multiplier: 0.15,
        min_fare_multiplier: 1.5,
        range_tiers: [
            { max_km: 3, multiplier: 1.0 },
            { max_km: 7, multiplier: 1.5 },
            { max_km: 15, multiplier: 2.2 },
        ],
        free_loading_minutes: 10,
        demurrage_multiplier: 0.05,
        is_active: true,
    },
    {
        vehicle_type: "bajaji",
        pricing_model: "range" as const,
        base_fare_multiplier: 1.1,
        per_km_multiplier: 0.12,
        min_fare_multiplier: 1.7,
        range_tiers: [
            { max_km: 3, multiplier: 1.1 },
            { max_km: 7, multiplier: 1.6 },
            { max_km: 15, multiplier: 2.4 },
        ],
        free_loading_minutes: 10,
        demurrage_multiplier: 0.05,
        is_active: true,
    },
    {
        vehicle_type: "kirikuu",
        pricing_model: "linear" as const,
        base_fare_multiplier: 1.5,
        per_km_multiplier: 0.18,
        min_fare_multiplier: 2.5,
        range_tiers: undefined,
        free_loading_minutes: 20,
        demurrage_multiplier: 0.1,
        is_active: true,
    },
    {
        vehicle_type: "pickup",
        pricing_model: "linear" as const,
        base_fare_multiplier: 2.5,
        per_km_multiplier: 0.22,
        min_fare_multiplier: 3.5,
        range_tiers: undefined,
        free_loading_minutes: 20,
        demurrage_multiplier: 0.12,
        is_active: true,
    },
    {
        vehicle_type: "canter",
        pricing_model: "linear" as const,
        base_fare_multiplier: 5.0,
        per_km_multiplier: 0.35,
        min_fare_multiplier: 8.0,
        range_tiers: undefined,
        free_loading_minutes: 30,
        demurrage_multiplier: 0.15,
        is_active: true,
    },
    {
        vehicle_type: "fuso",
        pricing_model: "linear" as const,
        base_fare_multiplier: 10.0,
        per_km_multiplier: 0.5,
        min_fare_multiplier: 15.0,
        range_tiers: undefined,
        free_loading_minutes: 45,
        demurrage_multiplier: 0.2,
        is_active: true,
    },
    {
        vehicle_type: "trailer",
        pricing_model: "linear" as const,
        base_fare_multiplier: 20.0,
        per_km_multiplier: 0.8,
        min_fare_multiplier: 30.0,
        range_tiers: undefined,
        free_loading_minutes: 60,
        demurrage_multiplier: 0.3,
        is_active: true,
    },
];

/**
 * Seed the pricing_rules table - REQUIRED for ride booking
 * Run this once in Convex Dashboard: mutations -> seed:seedPricingRules
 */
export const seedPricingRules = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if already seeded
        const existing = await ctx.db.query("pricing_rules").first();
        if (existing) {
            return { success: false, message: "Already seeded. Delete existing rules to reseed." };
        }

        const now = Date.now();

        // Insert all vehicle pricing rules
        for (const rule of PRICING_RULES) {
            await ctx.db.insert("pricing_rules", {
                ...rule,
                last_updated: now,
            });
        }

        return { success: true, message: `Seeded ${PRICING_RULES.length} pricing rules.` };
    },
});
