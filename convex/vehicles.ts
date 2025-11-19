import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a vehicle
export const create = mutation({
    args: {
        type: v.union(
            v.literal("tricycle"),
            v.literal("van"),
            v.literal("truck"),
            v.literal("semitrailer")
        ),
        plate_number: v.string(),
        capacity_kg: v.number(),
        photos: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Check if driver exists
        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!driver) {
            throw new Error("Driver profile not found");
        }

        // Set pricing based on vehicle type
        const pricing = {
            tricycle: { base_fare: 2000, per_km_rate: 300 },
            van: { base_fare: 5000, per_km_rate: 500 },
            truck: { base_fare: 8000, per_km_rate: 800 },
            semitrailer: { base_fare: 15000, per_km_rate: 1200 },
        };

        const vehicleId = await ctx.db.insert("vehicles", {
            driver_clerk_id: identity.subject,
            type: args.type,
            plate_number: args.plate_number,
            capacity_kg: args.capacity_kg,
            photos: args.photos,
            base_fare: pricing[args.type].base_fare,
            per_km_rate: pricing[args.type].per_km_rate,
            created_at: new Date().toISOString(),
        });

        return vehicleId;
    },
});

// Get driver's vehicles
export const getMyVehicles = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        return await ctx.db
            .query("vehicles")
            .withIndex("by_driver", (q) => q.eq("driver_clerk_id", identity.subject))
            .collect();
    },
});

// Update vehicle
export const update = mutation({
    args: {
        vehicle_id: v.id("vehicles"),
        plate_number: v.optional(v.string()),
        capacity_kg: v.optional(v.number()),
        photos: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const vehicle = await ctx.db.get(args.vehicle_id);
        if (!vehicle) {
            throw new Error("Vehicle not found");
        }

        if (vehicle.driver_clerk_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        const updates: any = {};
        if (args.plate_number) updates.plate_number = args.plate_number;
        if (args.capacity_kg) updates.capacity_kg = args.capacity_kg;
        if (args.photos) updates.photos = args.photos;

        await ctx.db.patch(args.vehicle_id, updates);
    },
});

// Get vehicle by ID
export const getById = query({
    args: { vehicle_id: v.id("vehicles") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.vehicle_id);
    },
});
