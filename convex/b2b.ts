import { v } from "convex/values";
// B2B Module - For Sync
import { mutation, query } from "./_generated/server";
import { nanoid } from "nanoid";
import { calculateFare } from "./pricing";

// Get organization by ID
export const getOrganization = query({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Get my organization
export const getMyOrganization = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId) return null;

        return await ctx.db.get(user.orgId);
    },
});

// Create organization (B2B signup) - THE REAL REGISTRATION
export const createOrganization = mutation({
    args: {
        name: v.string(),
        tinNumber: v.string(), // MANDATORY for Empire Edition
        category: v.optional(v.string()),
        adminEmail: v.string(),
        phone: v.optional(v.string()),
        contactPerson: v.optional(v.string()),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            address: v.optional(v.string()),
        })),
        licensePhotoId: v.optional(v.id("_storage")), // Storage ID for license photo
        industry: v.optional(v.string()),
        logisticsNeeds: v.optional(v.array(v.string())),
        expectedMonthlyVolume: v.optional(v.number()),
        specialRequirements: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Check if user already has an org
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (user?.orgId) {
            throw new Error("You are already part of an organization");
        }

        // Get photo URL if provided
        let licensePhotoUrl = undefined;
        if (args.licensePhotoId) {
            licensePhotoUrl = await ctx.storage.getUrl(args.licensePhotoId);
        }

        // Create the organization with PENDING status
        const orgId = await ctx.db.insert("organizations", {
            name: args.name,
            tinNumber: args.tinNumber,
            walletBalance: 0,
            reservedBalance: 0,
            creditLimit: 0,
            billingModel: "prepaid",
            adminEmail: args.adminEmail,
            phone: args.phone,
            contactPerson: args.contactPerson,
            location: args.location ? { lat: args.location.lat, lng: args.location.lng, address: args.location.address || '' } : undefined,
            industry: args.category || args.industry, // Use category if provided
            logisticsNeeds: args.logisticsNeeds,
            expectedMonthlyVolume: args.expectedMonthlyVolume,
            specialRequirements: args.specialRequirements,
            tier: "starter",
            commissionRate: 0.15, // 15% for starter
            apiEnabled: false,
            monthlyVolume: 0,
            verified: false,
            status: "pending", // 🔥 THE GATEKEEPER - Start as pending
            created_at: new Date().toISOString(),
        });

        // Update user profile to link to org and set as admin
        if (user) {
            await ctx.db.patch(user._id, {
                orgId: orgId,
                orgRole: "admin",
            });
        }

        return orgId;
    },
});

// Upgrade organization tier
export const upgradeTier = mutation({
    args: {
        tier: v.union(v.literal("business"), v.literal("enterprise")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgRole !== "admin") {
            throw new Error("Only organization admins can upgrade");
        }

        const commissionRates = {
            business: 0.12, // 12%
            enterprise: 0.08, // 8%
        };

        await ctx.db.patch(user.orgId, {
            tier: args.tier,
            commissionRate: commissionRates[args.tier],
        });

        return { success: true };
    },
});

// Generate API key (enterprise only)
export const generateApiKey = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgRole !== "admin") {
            throw new Error("Unauthorized");
        }

        const org = await ctx.db.get(user.orgId);
        if (!org || org.tier !== "enterprise") {
            throw new Error("API access is only available for Enterprise tier");
        }

        const apiKey = `bx_${nanoid(32)}`;

        await ctx.db.patch(user.orgId, {
            apiKey: apiKey,
            apiEnabled: true,
        });

        return { apiKey };
    },
});

// Add team member to organization
export const addTeamMember = mutation({
    args: {
        memberClerkId: v.string(),
        role: v.union(v.literal("admin"), v.literal("user")),
        spendingLimit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgRole !== "admin") {
            throw new Error("Only organization admins can add members");
        }

        // Find the new member
        const member = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.memberClerkId))
            .first();

        if (!member) {
            throw new Error("User not found");
        }

        if (member.orgId) {
            throw new Error("User is already part of an organization");
        }

        await ctx.db.patch(member._id, {
            orgId: user.orgId,
            orgRole: args.role,
            spendingLimitPerDay: args.spendingLimit,
        });

        return { success: true };
    },
});

// Get team members
export const getTeamMembers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId) return [];

        const members = await ctx.db
            .query("userProfiles")
            .withIndex("by_org", (q) => q.eq("orgId", user.orgId))
            .collect();

        return members;
    },
});

// Get organization stats
export const getOrgStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId) return null;

        const org = await ctx.db.get(user.orgId);
        if (!org) return null;

        // Get all team members
        const members = await ctx.db
            .query("userProfiles")
            .withIndex("by_org", (q) => q.eq("orgId", user.orgId))
            .collect();

        // Get all rides for this org
        const rides = await ctx.db
            .query("rides")
            .filter((q) => q.eq(q.field("org_id"), user.orgId))
            .collect();

        const completedRides = rides.filter(r => r.status === "completed");
        const totalSpend = completedRides.reduce((sum, r) => sum + (r.final_fare || 0), 0);

        return {
            organization: org,
            stats: {
                totalMembers: members.length,
                totalRides: rides.length,
                completedRides: completedRides.length,
                totalSpend: totalSpend,
                walletBalance: org.walletBalance,
                tier: org.tier,
            },
        };
    },
});

// Get nearby businesses with verified+rating ranking
export const getNearbyBusinesses = query({
    args: {
        userLat: v.optional(v.number()),
        userLng: v.optional(v.number()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Get all organizations
        const orgs = await ctx.db.query("organizations").collect();

        // Filter out user's own org
        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        const filteredOrgs = orgs.filter(org => org._id !== user?.orgId);

        // Calculate distance if user location provided
        const orgsWithDistance = filteredOrgs.map(org => {
            let distance = 999999; // Default far distance
            if (args.userLat && args.userLng && org.location) {
                const R = 6371; // Earth's radius in km
                const dLat = (org.location.lat - args.userLat) * Math.PI / 180;
                const dLng = (org.location.lng - args.userLng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(args.userLat * Math.PI / 180) * Math.cos(org.location.lat * Math.PI / 180) *
                    Math.sin(dLng / 2) ** 2;
                distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            }
            return { ...org, distance };
        });

        // Get ratings for each org (count completed rides)
        const orgsWithRatings = await Promise.all(
            orgsWithDistance.map(async (org) => {
                const rides = await ctx.db
                    .query("rides")
                    .filter((q) => q.eq(q.field("org_id"), org._id))
                    .collect();
                const completedRides = rides.filter(r => r.status === "completed");
                const totalRating = completedRides.reduce((sum: number, r: any) => sum + (r.customer_rating || 5), 0);
                const avgRating = completedRides.length > 0 ? totalRating / completedRides.length : 0;
                return {
                    ...org,
                    rating: avgRating,
                    totalTrips: completedRides.length,
                };
            })
        );

        // Sort: verified first, then by rating, then by distance
        const sorted = orgsWithRatings.sort((a, b) => {
            // Verified businesses first
            if (a.verified && !b.verified) return -1;
            if (!a.verified && b.verified) return 1;
            // Then by rating (higher first)
            if (b.rating !== a.rating) return b.rating - a.rating;
            // Then by distance (closer first)
            return a.distance - b.distance;
        });

        return sorted.slice(0, 50); // Limit to 50 results
    },
});

// Get business analytics with daily/weekly/monthly support
export const getBusinessAnalytics = query({
    args: {
        period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId) return null;

        const org = await ctx.db.get(user.orgId);
        if (!org) return null;

        // Determine date range based on period
        const now = new Date();
        let startDate: Date;
        switch (args.period) {
            case "daily":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
                break;
            case "weekly":
                startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000); // Last 4 weeks
                break;
            case "monthly":
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1); // Last 6 months
                break;
        }

        // Get all rides for this org
        const allRides = await ctx.db
            .query("rides")
            .filter((q) => q.eq(q.field("org_id"), user.orgId))
            .collect();

        // Filter by date range
        const rides = allRides.filter(r => new Date(r.created_at) >= startDate);
        const completedRides = rides.filter(r => r.status === "completed");

        // Calculate totals
        const totalSpend = completedRides.reduce((sum, r) => sum + (r.final_fare || 0), 0);
        const totalCommission = totalSpend * (org.commissionRate || 0.15);
        const netPayment = totalSpend - totalCommission;



        // Group by period
        const groupedData: Record<string, { trips: number; spend: number; commission: number }> = {};

        completedRides.forEach(ride => {
            const date = new Date(ride.created_at);
            let key: string;
            switch (args.period) {
                case "daily":
                    key = date.toISOString().split('T')[0];
                    break;
                case "weekly":
                    const weekNum = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
                    key = `Week ${4 - weekNum}`;
                    break;
                case "monthly":
                    key = date.toLocaleString('default', { month: 'short' });
                    break;
            }
            if (!groupedData[key]) {
                groupedData[key] = { trips: 0, spend: 0, commission: 0 };
            }
            groupedData[key].trips += 1;
            groupedData[key].spend += ride.final_fare || 0;
            groupedData[key].commission += (ride.final_fare || 0) * (org.commissionRate || 0.15);
        });

        // Driver performance
        const driverStats: Record<string, { trips: number; onTime: number; rating: number }> = {};
        for (const ride of completedRides) {
            const driverId = ride.driver_clerk_id;
            if (!driverId) continue;
            if (!driverStats[driverId]) {
                driverStats[driverId] = { trips: 0, onTime: 0, rating: 0 };
            }
            driverStats[driverId].trips += 1;
            driverStats[driverId].rating += ride.driver_rating || 5;
            // Assume on-time if completed within reasonable time (mock for now)
            driverStats[driverId].onTime += 1;
        }

        const avgCostPerDelivery = completedRides.length > 0 ? totalSpend / completedRides.length : 0;

        return {
            summary: {
                totalTrips: completedRides.length,
                pendingTrips: rides.filter(r => r.status === "pending").length,
                activeTrips: rides.filter(r => ["accepted", "loading", "ongoing"].includes(r.status)).length,
                totalSpend,
                totalCommission,
                netPayment,
                avgCostPerDelivery,
            },
            chartData: Object.entries(groupedData).map(([label, data]) => ({
                label,
                ...data,
            })),
            driverPerformance: Object.entries(driverStats).map(([id, stats]) => ({
                driverId: id,
                trips: stats.trips,
                onTimeRate: stats.trips > 0 ? (stats.onTime / stats.trips) * 100 : 0,
                avgRating: stats.trips > 0 ? stats.rating / stats.trips : 5,
            })),
            walletBalance: org.walletBalance,
            tier: org.tier,
            commissionRate: org.commissionRate || 0.15,
        };
    },
});

// Get contracted drivers (drivers who were accepted from listings)
export const getContractedDrivers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId) return [];

        // Get all listings for this org
        const listings = await ctx.db
            .query("business_listings")
            .filter((q) => q.eq(q.field("organizationId"), user.orgId))
            .collect();

        if (listings.length === 0) return [];

        // Get accepted applications
        const acceptedApps = [];
        for (const listing of listings) {
            const apps = await ctx.db
                .query("listing_applications")
                .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
                .filter((q) => q.eq(q.field("status"), "accepted"))
                .collect();
            acceptedApps.push(...apps);
        }

        // Get driver details and performance
        const drivers = await Promise.all(
            acceptedApps.map(async (app) => {
                const driver = await ctx.db
                    .query("drivers")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", app.driverClerkId))
                    .first();

                const profile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", app.driverClerkId))
                    .first();

                // Get rides this driver did for this org
                const rides = await ctx.db
                    .query("rides")
                    .filter((q) => q.and(
                        q.eq(q.field("org_id"), user.orgId),
                        q.eq(q.field("driver_clerk_id"), app.driverClerkId)
                    ))
                    .collect();

                const completedRides = rides.filter(r => r.status === "completed");
                const totalEarnings = completedRides.reduce((sum, r) => sum + (r.final_fare || 0), 0);

                return {
                    id: driver?._id,
                    clerkId: app.driverClerkId,
                    name: profile?.name || "Unknown",
                    phone: profile?.phone || "",
                    photo: profile?.profilePhoto,
                    rating: driver?.rating || 5.0,
                    totalTripsForOrg: completedRides.length,
                    activeTrips: rides.filter(r => ["accepted", "loading", "ongoing"].includes(r.status)).length,
                    totalEarningsFromOrg: totalEarnings,
                    isOnline: driver?.is_online || false,
                    acceptedAt: app.respondedAt,
                };
            })
        );

        // Remove duplicates (same driver accepted to multiple listings)
        const uniqueDrivers = drivers.reduce((acc, driver) => {
            if (!acc.find(d => d.clerkId === driver.clerkId)) {
                acc.push(driver);
            } else {
                // Merge stats if duplicate
                const existing = acc.find(d => d.clerkId === driver.clerkId)!;
                existing.totalTripsForOrg += driver.totalTripsForOrg;
                existing.totalEarningsFromOrg += driver.totalEarningsFromOrg;
                existing.activeTrips += driver.activeTrips;
            }
            return acc;
        }, [] as typeof drivers);

        return uniqueDrivers;
    },
});

// ============================================
// DIGITAL SHOWROOM - METRICS API
// ============================================

// Record interaction (view, lead, pickup) for B2B attribution
export const recordInteraction = mutation({
    args: {
        bizId: v.id("organizations"),
        type: v.union(v.literal("view"), v.literal("lead"), v.literal("pickup")),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.bizId);
        if (!org) return { success: false };

        switch (args.type) {
            case "view":
                await ctx.db.patch(args.bizId, {
                    profile_views: (org.profile_views || 0) + 1,
                });
                break;
            case "lead":
                await ctx.db.patch(args.bizId, {
                    lead_count: (org.lead_count || 0) + 1,
                });
                break;
            case "pickup":
                await ctx.db.patch(args.bizId, {
                    pickup_count: (org.pickup_count || 0) + 1,
                });
                break;
        }
        return { success: true };
    },
});

// Get showroom stats (for business dashboard)
export const getShowroomStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId) return null;

        const org = await ctx.db.get(user.orgId);
        if (!org) return null;

        // Get pickup rides count for this business
        const pickupRides = await ctx.db
            .query("rides")
            .filter((q) => q.eq(q.field("origin_business_id"), user.orgId))
            .collect();

        return {
            views: org.profile_views || 0,
            leads: org.lead_count || 0,
            pickups: pickupRides.length,
            verified: org.verified || false,
            locationLocked: org.location_locked || false,
        };
    },
});

// Update business profile (WhatsApp, operating hours)
export const updateBusinessProfile = mutation({
    args: {
        whatsapp_number: v.optional(v.string()),
        operating_hours: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgRole !== "admin") {
            throw new Error("Only organization admins can update profile");
        }

        await ctx.db.patch(user.orgId, {
            whatsapp_number: args.whatsapp_number,
            operating_hours: args.operating_hours,
            description: args.description,
        });

        return { success: true };
    },
});

// Top up organization wallet (Simulated payment)
export const topUpWallet = mutation({
    args: {
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId || user.orgRole !== "admin") {
            throw new Error("Only organization admins can add funds");
        }

        const org = await ctx.db.get(user.orgId);
        if (!org) throw new Error("Organization not found");

        await ctx.db.patch(user.orgId, {
            walletBalance: org.walletBalance + args.amount,
        });

        // Log transaction (Simulated)
        console.info(`[WALLET] Top up of ${args.amount} for org ${user.orgId} by ${user.name}`);

        return { success: true, newBalance: org.walletBalance + args.amount };
    },
});

// Check spending limit helper (Internal use)
export const checkSpendingLimit = async (
    ctx: any,
    userId: any,
    amount: number
) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.orgId) return { allowed: false, reason: "User not in organization" };

    const org = await ctx.db.get(user.orgId);
    if (!org) return { allowed: false, reason: "Organization not found" };

    // 1. Check Organization Balance
    if (org.walletBalance < amount) {
        return { allowed: false, reason: "Insufficient company funds" };
    }

    // 2. Check User Daily Limit
    if (user.spendingLimitPerDay) {
        // Calculate today's spend
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRides = await ctx.db
            .query("rides")
            .withIndex("by_customer", (q: any) => q.eq("customer_clerk_id", user.clerkId))
            .filter((q: any) => q.and(
                q.eq(q.field("org_id"), user.orgId),
                q.gte(q.field("created_at"), todayStr) // Simple string comparison for today
            ))
            .collect();

        const todaySpend = todayRides.reduce((sum: number, r: any) => sum + (r.final_fare || r.fare_estimate || 0), 0);

        if (todaySpend + amount > user.spendingLimitPerDay) {
            return {
                allowed: false,
                reason: `Daily limit exceeded. Spent: ${todaySpend}, Limit: ${user.spendingLimitPerDay}, Attempt: ${amount}`
            };
        }
    }


    return { allowed: true, orgId: user.orgId };
};

// ============================================
// BUSINESS LOGISTICS (DISPATCH & TEAM)
// ============================================

// Add Staff Member
export const addStaff = mutation({
    args: {
        name: v.string(),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const admin = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!admin?.orgId || admin.orgRole !== "admin") {
            throw new Error("Only admins can add staff");
        }

        // Check if user already exists by phone
        // Note: Ideally we index by phone, but for now we might scan or rely on Clerk sync.
        // Assuming current prototype behavior: Check if a user with this phone exists.
        // In a real app, we'd trigger an invite flow.
        const existingUser = await ctx.db
            .query("userProfiles")
            .filter(q => q.eq(q.field("phone"), args.phone))
            .first();

        if (existingUser) {
            if (existingUser.orgId) {
                throw new Error("User is already in an organization");
            }
            await ctx.db.patch(existingUser._id, {
                orgId: admin.orgId,
                orgRole: "user", // "user" = staff role
            });
            return { success: true, message: "User added to team" };
        } else {
            // Placeholder: In a real system we'd create an "Invite" record.
            // For this MVP, we'll return a message.
            // throw new Error("User not found on BebaX. Ask them to sign up first!");
            return { success: false, message: "User not found. Ask them to sign up first!" };
        }
    },
});

// Dispatch Ride (B2B Booking)
export const dispatchRide = mutation({
    args: {
        recipient_name: v.string(),
        recipient_phone: v.string(),
        vehicle_type: v.string(),
        cargo_description: v.string(),
        dropoff_location: v.object({
            lat: v.number(),
            lng: v.number(),
            address: v.string(),
        }),
        distance: v.number(),
        fare_estimate: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.orgId) throw new Error("Not part of an organization");

        const org = await ctx.db.get(user.orgId);
        if (!org) throw new Error("Organization not found");

        if (!org.location) throw new Error("Organization location not set (required for dispatch)");

        // 1. PRICE INTEGRITY CHECK (Backend is Source of Truth)
        const pricing = await calculateFare(ctx, {
            distanceKm: args.distance,
            vehicleType: args.vehicle_type,
            isBusiness: true, // Force B2B Margin
        });
        const authoritativeFare = pricing.fare;

        // 2. Check Wallet/Limits
        const limitCheck = await checkSpendingLimit(ctx, user._id, authoritativeFare);
        if (!limitCheck.allowed) {
            throw new Error(limitCheck.reason || "Spending limit exceeded");
        }

        // 3. Generate Waybill
        const waybillNumber = `WB-${nanoid(6).toUpperCase()}`;

        // 4. Create Ride
        const rideId = await ctx.db.insert("rides", {
            customer_clerk_id: user.clerkId,
            org_id: org._id,
            origin_business_id: org._id, // Attribution
            pickup_location: org.location, // LOCKED to Store Location
            dropoff_location: args.dropoff_location,
            vehicle_type: args.vehicle_type,
            cargo_details: args.cargo_description,
            recipient_name: args.recipient_name,
            recipient_phone: args.recipient_phone,
            waybill_number: waybillNumber,
            distance: args.distance,
            fare_estimate: authoritativeFare, // Use Backend Price
            status: "pending",
            payment_method: "wallet",
            payment_status: "pending", // Will be captured on completion
            created_at: new Date().toISOString(),
        });

        // 5. Update Org Reserved Balance (Hold funds)
        await ctx.db.patch(org._id, {
            reservedBalance: (org.reservedBalance || 0) + authoritativeFare,
        });

        // 6. External SMS Alert (Placeholder)
        console.log(`[SMS] To ${args.recipient_phone}: Your order from ${org.name} is on the way! Tracking: bebax.app/track/${rideId}`);

        return { rideId, waybillNumber };
    },
});
// End of file
