import { mutation } from "./_generated/server";

export const seedPricing = mutation({
    args: {},
    handler: async (ctx) => {
        // 1. System Settings
        const fuelPriceKey = "fuel_price_tzs";
        const fuelPriceSetting = await ctx.db.query("system_settings")
            .withIndex("by_key", q => q.eq("setting_key", fuelPriceKey))
            .first();

        if (!fuelPriceSetting) {
            await ctx.db.insert("system_settings", {
                setting_key: fuelPriceKey,
                value: 3200,
                description: "Current price of Diesel/Petrol per Liter",
                last_updated: Date.now()
            });
            console.log("✅ Seeded Fuel Price: 3200");
        } else {
            console.log("ℹ️ Fuel Price already exists: ", fuelPriceSetting.value);
        }

        // 2. Pricing Rules Definition
        // Multipliers based on FUEL PRICE (3200)
        const vehicles = [
            {
                type: "boda",
                model: "range",
                base: 0.8, // ~2560
                perKm: 0.15, // ~480
                min: 0.8, // ~2560
                ranges: [
                    { max_km: 3, multiplier: 0.8 }, // 0-3km Flat: ~2500
                    { max_km: 7, multiplier: 1.5 }, // 3-7km Flat: ~4800
                ]
            },
            {
                type: "toyo",
                model: "range",
                base: 1.5, // ~4800
                perKm: 0.25, // ~800
                min: 1.5, // ~4800
                ranges: [
                    { max_km: 3, multiplier: 1.5 }, // ~4800
                    { max_km: 7, multiplier: 2.2 }, // ~7000
                ]
            },
            {
                type: "kirikuu",
                model: "linear",
                base: 4.7, // ~15,000 (Start)
                perKm: 0.5, // ~1,600/km
                min: 5.0, // ~16,000 (Floor)
            },
            {
                type: "canter",
                model: "linear",
                base: 14.0, // ~45,000
                perKm: 0.8, // ~2,560/km
                min: 14.0, // ~45,000 Safety Floor
            },
            {
                type: "fuso",
                model: "linear",
                base: 28.0, // ~90,000
                perKm: 1.25, // ~4,000/km
                min: 28.0, // ~90,000 Safety Floor
            }
        ];

        // 3. Upsert Rules
        for (const v of vehicles) {
            const existing = await ctx.db.query("pricing_rules")
                .withIndex("by_vehicle", q => q.eq("vehicle_type", v.type))
                .first();

            const data = {
                vehicle_type: v.type,
                pricing_model: v.model as "range" | "linear",
                base_fare_multiplier: v.base,
                per_km_multiplier: v.perKm,
                min_fare_multiplier: v.min,
                range_tiers: v.ranges,
                // Defaults
                free_loading_minutes: v.type === 'boda' ? 5 : 45,
                demurrage_multiplier: 0.1,
                is_active: true,
                last_updated: Date.now()
            };

            if (existing) {
                await ctx.db.patch(existing._id, data);
                console.log(`Updated rule for ${v.type}`);
            } else {
                await ctx.db.insert("pricing_rules", data);
                console.log(`Created rule for ${v.type}`);
            }
        }
    }
});
