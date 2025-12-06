"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { Client } from "@googlemaps/google-maps-services-js";

// Initialize Google Maps Client
const client = new Client({});

export const calculateFare = action({
    args: {
        pickup: v.object({
            lat: v.number(),
            lng: v.number(),
        }),
        dropoff: v.object({
            lat: v.number(),
            lng: v.number(),
        }),
        vehicleType: v.string(),
    },
    handler: async (ctx, args) => {
        const { pickup, dropoff, vehicleType } = args;

        if (!process.env.GOOGLE_MAPS_API_KEY) {
            throw new Error("GOOGLE_MAPS_API_KEY is not set in environment variables");
        }

        try {
            // Fetch route from Google Directions API
            const response = await client.directions({
                params: {
                    origin: `${pickup.lat},${pickup.lng}`,
                    destination: `${dropoff.lat},${dropoff.lng}`,
                    key: process.env.GOOGLE_MAPS_API_KEY,
                },
            });

            if (response.data.status !== "OK" || response.data.routes.length === 0) {
                throw new Error("Could not calculate route");
            }

            const route = response.data.routes[0];
            const leg = route.legs[0];
            const distanceKm = leg.distance.value / 1000;
            const durationMins = leg.duration.value / 60;

            // Pricing Logic (TZS)
            // TODO: Move these rates to a database table for dynamic pricing
            const RATES: Record<string, { base: number; perKm: number; perMin: number }> = {
                tricycle: { base: 2000, perKm: 1000, perMin: 100 },
                van: { base: 5000, perKm: 2000, perMin: 200 },
                truck: { base: 15000, perKm: 4000, perMin: 300 },
                semitrailer: { base: 50000, perKm: 8000, perMin: 500 },
            };

            const rate = RATES[vehicleType] || RATES["van"];

            const distanceCost = distanceKm * rate.perKm;
            const timeCost = durationMins * rate.perMin;
            const totalFare = Math.ceil(rate.base + distanceCost + timeCost);

            return {
                distance: distanceKm,
                duration: durationMins,
                fare: totalFare,
                polyline: route.overview_polyline.points,
            };

        } catch (error) {
            console.error("Fare calculation error:", error);
            throw new Error("Failed to calculate fare");
        }
    },
});
