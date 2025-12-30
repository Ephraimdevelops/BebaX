import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all active business listings
export const getListings = query({
    args: {
        category: v.optional(v.string()),
        routeType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let query = ctx.db.query("business_listings")
            .withIndex("by_active", (q) => q.eq("isActive", true));

        const listings = await query.collect();

        // Filter by category if provided
        let filtered = listings;
        if (args.category) {
            filtered = filtered.filter(l => l.category === args.category);
        }
        if (args.routeType) {
            filtered = filtered.filter(l => l.routeType === args.routeType);
        }

        // Enrich with organization data
        const enriched = await Promise.all(
            filtered.map(async (listing) => {
                const org = await ctx.db.get(listing.organizationId);
                return { ...listing, organization: org };
            })
        );

        return enriched;
    },
});

// Get listing by ID
export const getListing = query({
    args: { id: v.id("business_listings") },
    handler: async (ctx, args) => {
        const listing = await ctx.db.get(args.id);
        if (!listing) return null;

        const org = await ctx.db.get(listing.organizationId);
        const applications = await ctx.db
            .query("listing_applications")
            .withIndex("by_listing", (q) => q.eq("listingId", args.id))
            .collect();

        return { ...listing, organization: org, applicationCount: applications.length };
    },
});

// Create a business listing (org admin only)
export const createListing = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        category: v.union(
            v.literal("retail"),
            v.literal("construction"),
            v.literal("agriculture"),
            v.literal("manufacturing"),
            v.literal("e-commerce"),
            v.literal("logistics"),
            v.literal("other")
        ),
        routeType: v.union(v.literal("local"), v.literal("regional"), v.literal("national")),
        frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("on_demand")),
        vehicleRequirements: v.array(v.string()),
        estimatedMonthlyTrips: v.number(),
        payRate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Get user profile to find their org
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId) {
            throw new Error("You must be part of an organization to create listings");
        }

        if (user.orgRole !== "admin") {
            throw new Error("Only organization admins can create listings");
        }

        const listingId = await ctx.db.insert("business_listings", {
            organizationId: user.orgId,
            title: args.title,
            description: args.description,
            category: args.category,
            routeType: args.routeType,
            frequency: args.frequency,
            vehicleRequirements: args.vehicleRequirements,
            estimatedMonthlyTrips: args.estimatedMonthlyTrips,
            payRate: args.payRate,
            isActive: true,
            created_at: new Date().toISOString(),
        });

        return listingId;
    },
});

// Driver applies to a listing
export const applyToListing = mutation({
    args: {
        listingId: v.id("business_listings"),
        coverLetter: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Check if user is a driver
        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!driver) {
            throw new Error("Only verified drivers can apply to listings");
        }

        if (!driver.verified) {
            throw new Error("Your driver account must be verified first");
        }

        // Check if already applied
        const existing = await ctx.db
            .query("listing_applications")
            .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
            .filter((q) => q.eq(q.field("driverClerkId"), identity.subject))
            .first();

        if (existing) {
            throw new Error("You have already applied to this listing");
        }

        const applicationId = await ctx.db.insert("listing_applications", {
            listingId: args.listingId,
            driverClerkId: identity.subject,
            coverLetter: args.coverLetter,
            status: "pending",
            created_at: new Date().toISOString(),
        });

        return applicationId;
    },
});

// Get my applications (for drivers)
export const getMyApplications = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const applications = await ctx.db
            .query("listing_applications")
            .withIndex("by_driver", (q) => q.eq("driverClerkId", identity.subject))
            .order("desc")
            .collect();

        // Enrich with listing data
        const enriched = await Promise.all(
            applications.map(async (app) => {
                const listing = await ctx.db.get(app.listingId);
                const org = listing ? await ctx.db.get(listing.organizationId) : null;
                return { ...app, listing, organization: org };
            })
        );

        return enriched;
    },
});

// Get applications for a listing (org admin only)
export const getListingApplications = query({
    args: { listingId: v.id("business_listings") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const listing = await ctx.db.get(args.listingId);
        if (!listing) throw new Error("Listing not found");

        // Verify user is org admin
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgId !== listing.organizationId || user.orgRole !== "admin") {
            throw new Error("Unauthorized");
        }

        const applications = await ctx.db
            .query("listing_applications")
            .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
            .collect();

        // Enrich with driver data
        const enriched = await Promise.all(
            applications.map(async (app) => {
                const driver = await ctx.db
                    .query("drivers")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", app.driverClerkId))
                    .first();
                const profile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", app.driverClerkId))
                    .first();
                return { ...app, driver, profile };
            })
        );

        return enriched;
    },
});

// Respond to application (org admin only)
export const respondToApplication = mutation({
    args: {
        applicationId: v.id("listing_applications"),
        status: v.union(v.literal("accepted"), v.literal("rejected")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const application = await ctx.db.get(args.applicationId);
        if (!application) throw new Error("Application not found");

        const listing = await ctx.db.get(application.listingId);
        if (!listing) throw new Error("Listing not found");

        // Verify user is org admin
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgId !== listing.organizationId || user.orgRole !== "admin") {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.applicationId, {
            status: args.status,
            respondedAt: new Date().toISOString(),
        });

        return { success: true };
    },
});

// Get rides linked to a specific listing
export const getListingRides = query({
    args: { listingId: v.id("business_listings") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const listing = await ctx.db.get(args.listingId);
        if (!listing) return [];

        // Verify user is org admin for this listing
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgId !== listing.organizationId) {
            return [];
        }

        // Get rides linked to this listing
        const rides = await ctx.db
            .query("rides")
            .filter((q) => q.eq(q.field("listing_id"), args.listingId))
            .order("desc")
            .collect();

        // Enrich with driver info
        const enrichedRides = await Promise.all(
            rides.map(async (ride) => {
                let driverInfo = null;
                if (ride.driver_clerk_id) {
                    const driverProfile = await ctx.db
                        .query("userProfiles")
                        .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.driver_clerk_id!))
                        .first();
                    const driver = await ctx.db
                        .query("drivers")
                        .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.driver_clerk_id!))
                        .first();
                    driverInfo = {
                        name: driverProfile?.name || "Unknown",
                        phone: driverProfile?.phone,
                        rating: driver?.rating || 5.0,
                    };
                }
                return {
                    ...ride,
                    driver: driverInfo,
                };
            })
        );

        return enrichedRides;
    },
});

// Get listing statistics
export const getListingStats = query({
    args: { listingId: v.id("business_listings") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const listing = await ctx.db.get(args.listingId);
        if (!listing) return null;

        // Get applications
        const applications = await ctx.db
            .query("listing_applications")
            .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
            .collect();

        // Get rides for this listing
        const rides = await ctx.db
            .query("rides")
            .filter((q) => q.eq(q.field("listing_id"), args.listingId))
            .collect();

        const completedRides = rides.filter(r => r.status === "completed");
        const totalSpend = completedRides.reduce((sum, r) => sum + (r.final_fare || 0), 0);
        const avgRating = completedRides.length > 0
            ? completedRides.reduce((sum, r) => sum + (r.driver_rating || 5), 0) / completedRides.length
            : 0;

        return {
            listing,
            stats: {
                totalApplications: applications.length,
                pendingApplications: applications.filter(a => a.status === "pending").length,
                acceptedDrivers: applications.filter(a => a.status === "accepted").length,
                totalRides: rides.length,
                completedRides: completedRides.length,
                activeRides: rides.filter(r => ["accepted", "loading", "ongoing"].includes(r.status)).length,
                totalSpend,
                avgDriverRating: avgRating,
            },
        };
    },
});
