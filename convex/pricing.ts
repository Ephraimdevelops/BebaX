import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// CORE PRICING ALGORITHM (Helper)
export const calculateFare = async (
    ctx: any,
    args: {
        distanceKm: number;
        vehicleType: string;
        fuelPrice?: number; // Optional override
        isBusiness?: boolean;
    }
) => {
    // 1. Get Fuel Price
    let fuelPrice = args.fuelPrice;
    if (fuelPrice === undefined) {
        const setting = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q: any) => q.eq("setting_key", "fuel_price_tzs"))
            .first();
        fuelPrice = setting?.value || 3200; // Default fallback
    }

    // Ensure fuelPrice is a number
    const finalFuelPrice = fuelPrice as number;

    // 2. Get Pricing Rules
    const rule = await ctx.db
        .query("pricing_rules")
        .withIndex("by_vehicle", (q: any) => q.eq("vehicle_type", args.vehicleType))
        .first();

    if (!rule) {
        // If no rule, return 0 or throw? Let's return a safe mock for now to prevent crashes, but log it.
        console.error(`No pricing rule found for vehicle: ${args.vehicleType}`);
        // Fallback: 2000 per km * distance (just random heuristic)
        // But ideally we should throw.
        throw new Error(`Pricing rule missing for ${args.vehicleType}`);
    }

    // 3. Calculate Logic
    let price = 0;

    if (rule.pricing_model === 'range' && rule.range_tiers) {
        // HYBRID LOGIC A: Range Pricing (Boda/Toyo)
        // Find the tier that fits
        const tier = rule.range_tiers.find((t: any) => args.distanceKm <= t.max_km);

        if (tier) {
            // Flat rate for this range
            price = tier.multiplier * finalFuelPrice;
        } else {
            // Exceeds ranges -> Fallback to Linear
            // Formula: (Base + (Km * PerKm)) * Fuel
            price = (rule.base_fare_multiplier * finalFuelPrice) +
                (args.distanceKm * rule.per_km_multiplier * finalFuelPrice);
        }

    } else {
        // HYBRID LOGIC B: Linear Pricing (Trucks)

        // Formula: (Base * Fuel) + (Km * PerKm * Fuel)
        const baseComponent = rule.base_fare_multiplier * finalFuelPrice;
        const distanceComponent = args.distanceKm * rule.per_km_multiplier * finalFuelPrice;

        const calculatedPrice = baseComponent + distanceComponent;

        // 🛡️ SAFETY NET: Min Fare Floor 🛡️
        // "Never start the engine for less than X"
        const minPrice = rule.min_fare_multiplier * finalFuelPrice;

        price = Math.max(calculatedPrice, minPrice);
    }

    // 4. Rounding Strategy (Nearest 500 TZS for cleaner cash handling)
    // ceil(3421 / 500) * 500 = 3500
    let finalFare = Math.ceil(price / 500) * 500;

    // 5. B2B MARGIN (The Empire Tax)
    // If business trip, add invisible 5% margin
    if (args.isBusiness) {
        const margin = finalFare * 0.05;
        finalFare += margin;
        // Re-round
        finalFare = Math.ceil(finalFare / 500) * 500;
    }

    return {
        fare: finalFare,
        currency: "TZS",
        breakdown: {
            fuel_price: finalFuelPrice,
            distance: args.distanceKm,
            vehicle: args.vehicleType,
            model: rule.pricing_model,
            raw_price: price,
            is_business: !!args.isBusiness
        }
    };
};

// PUBLIC API: Get Ride Estimate
export const getEstimate = query({
    args: {
        distance: v.number(),
        vehicleType: v.string(),
        isBusiness: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        return await calculateFare(ctx, {
            distanceKm: args.distance,
            vehicleType: args.vehicleType,
            isBusiness: args.isBusiness
        });
    }
});

// ADMIN: Update Global Fuel Price (The Index)
export const updateFuelPrice = mutation({
    args: { price: v.number() },
    handler: async (ctx, args) => {
        // Auth Check
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || user.role !== "admin") {
            throw new Error("Only Admins can update Fuel Price");
        }

        // Check if setting exists
        const setting = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q) => q.eq("setting_key", "fuel_price_tzs"))
            .first();

        if (setting) {
            await ctx.db.patch(setting._id, {
                value: args.price,
                last_updated: Date.now(),
                updated_by: identity.subject
            });
        } else {
            await ctx.db.insert("system_settings", {
                setting_key: "fuel_price_tzs",
                value: args.price,
                description: "Global Fuel Price (TZS/Liter)",
                last_updated: Date.now(),
                updated_by: identity.subject
            });
        }

        return { success: true, new_price: args.price };
    }
});

// ADMIN/PUBLIC: Get Current Fuel Price
export const getFuelPrice = query({
    args: {},
    handler: async (ctx) => {
        const setting = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q) => q.eq("setting_key", "fuel_price_tzs"))
            .first();
        return setting?.value || 3200;
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DIESEL PRICE SUPPORT
// ═══════════════════════════════════════════════════════════════════════════════

// ADMIN/PUBLIC: Get Diesel Price
export const getDieselPrice = query({
    args: {},
    handler: async (ctx) => {
        const setting = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q) => q.eq("setting_key", "diesel_price_tzs"))
            .first();
        return setting?.value || 3100;
    }
});

// ADMIN: Update Diesel Price
export const updateDieselPrice = mutation({
    args: { price: v.number() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user || user.role !== "admin") {
            throw new Error("Only Admins can update Diesel Price");
        }

        const setting = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q) => q.eq("setting_key", "diesel_price_tzs"))
            .first();

        if (setting) {
            await ctx.db.patch(setting._id, {
                value: args.price,
                last_updated: Date.now(),
                updated_by: identity.subject
            });
        } else {
            await ctx.db.insert("system_settings", {
                setting_key: "diesel_price_tzs",
                value: args.price,
                description: "Diesel Fuel Price (TZS/Liter)",
                last_updated: Date.now(),
                updated_by: identity.subject
            });
        }

        return { success: true, new_price: args.price };
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM SETTINGS (GLOBAL CONFIG)
// ═══════════════════════════════════════════════════════════════════════════════

// Get all system settings
export const getAllSystemSettings = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("system_settings").collect();
        const map: Record<string, number> = {};
        for (const s of settings) {
            map[s.setting_key] = s.value;
        }
        return map;
    }
});

// Initialize default system settings (Run once)
export const initializeSystemSettings = mutation({
    args: {},
    handler: async (ctx) => {
        const defaults = [
            { key: "fuel_price_tzs", value: 3200, description: "Petrol price per liter (TZS)" },
            { key: "diesel_price_tzs", value: 3100, description: "Diesel price per liter (TZS)" },
            { key: "profit_margin", value: 1.3, description: "Profit margin multiplier (1.3 = 30%)" },
            { key: "traffic_buffer", value: 1.15, description: "Traffic safety buffer (1.15 = 15%)" },
        ];

        let created = 0;
        for (const d of defaults) {
            const existing = await ctx.db
                .query("system_settings")
                .withIndex("by_key", (q) => q.eq("setting_key", d.key))
                .first();

            if (!existing) {
                await ctx.db.insert("system_settings", {
                    setting_key: d.key,
                    value: d.value,
                    description: d.description,
                    last_updated: Date.now(),
                });
                created++;
            }
        }

        return { success: true, created };
    }
});

// Update any system setting
export const updateSystemSetting = mutation({
    args: { key: v.string(), value: v.number() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q) => q.eq("setting_key", args.key))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                value: args.value,
                last_updated: Date.now(),
                updated_by: identity.subject,
            });
        } else {
            await ctx.db.insert("system_settings", {
                setting_key: args.key,
                value: args.value,
                last_updated: Date.now(),
                updated_by: identity.subject,
            });
        }

        console.log(`[PRICING] System setting "${args.key}" updated to ${args.value}`);
        return { success: true };
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING SNAPSHOT (For ride auditing)
// ═══════════════════════════════════════════════════════════════════════════════

// Get current pricing snapshot (to save with ride)
export const getPricingSnapshot = query({
    args: { vehicleType: v.string() },
    handler: async (ctx, args) => {
        const petrol = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q) => q.eq("setting_key", "fuel_price_tzs"))
            .first();

        const diesel = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q) => q.eq("setting_key", "diesel_price_tzs"))
            .first();

        const profitMargin = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q) => q.eq("setting_key", "profit_margin"))
            .first();

        const trafficBuffer = await ctx.db
            .query("system_settings")
            .withIndex("by_key", (q) => q.eq("setting_key", "traffic_buffer"))
            .first();

        const vehicleRule = await ctx.db
            .query("pricing_rules")
            .withIndex("by_vehicle", (q) => q.eq("vehicle_type", args.vehicleType))
            .first();

        return {
            timestamp: Date.now(),
            petrolPrice: petrol?.value || 3200,
            dieselPrice: diesel?.value || 3100,
            profitMargin: profitMargin?.value || 1.3,
            trafficBuffer: trafficBuffer?.value || 1.15,
            vehicleRule: vehicleRule ? {
                baseFareMultiplier: vehicleRule.base_fare_multiplier,
                perKmMultiplier: vehicleRule.per_km_multiplier,
                freeLoadingMinutes: vehicleRule.free_loading_minutes,
                demurrageMultiplier: vehicleRule.demurrage_multiplier,
            } : null,
        };
    }
});

// Get all vehicle pricing rules for admin display
export const getAllVehiclePricingRules = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("pricing_rules")
            .withIndex("by_active", (q) => q.eq("is_active", true))
            .collect();
    }
});
