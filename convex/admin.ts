import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to check if user is admin
async function checkAdmin(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated");
    }

    const user = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .first();

    if (!user || user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
    }

    return user;
}

// Promote user to admin
export const promoteToAdmin = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        if (!user) {
            throw new Error(`User with email ${args.email} not found.`);
        }

        await ctx.db.patch(user._id, { role: "admin" });
        return `User ${args.email} is now an ADMIN.`;
    },
});

// Promote user to driver (for fixing accounts that were created as customer)
export const promoteToDriver = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        if (!user) {
            throw new Error(`User with email ${args.email} not found.`);
        }

        await ctx.db.patch(user._id, { role: "driver" });
        return `User ${args.email} is now a DRIVER.`;
    },
});

// Get pending drivers with enriched user data
export const getPendingDriversEnriched = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const pendingDrivers = await ctx.db
            .query("drivers")
            .filter((q) => q.eq(q.field("verified"), false))
            .collect();

        // Enrich with user profile data and document URLs
        const enrichedDrivers = await Promise.all(
            pendingDrivers.map(async (driver) => {
                const userProfile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", driver.clerkId))
                    .first();

                const vehicle = await ctx.db
                    .query("vehicles")
                    .withIndex("by_driver", (q) => q.eq("driver_clerk_id", driver.clerkId))
                    .first();

                // Get document URLs
                let nida_photo = null;
                let license_photo = null;
                if (driver.documents?.nida_photo) {
                    nida_photo = await ctx.storage.getUrl(driver.documents.nida_photo);
                }
                if (driver.documents?.license_photo) {
                    license_photo = await ctx.storage.getUrl(driver.documents.license_photo);
                }

                return {
                    ...driver,
                    user_name: userProfile?.name || "Unknown",
                    user_phone: userProfile?.phone || "N/A",
                    user_email: userProfile?.email || "N/A",
                    // Use vehicle_type from driver record (new schema) or fallback to vehicles table (legacy)
                    vehicle_type: (driver as any).vehicle_type || vehicle?.type || "N/A",
                    vehicle_plate: vehicle?.plate_number || "N/A",
                    nida_photo,
                    license_photo,
                };
            })
        );

        return enrichedDrivers;
    },
});

// Get all drivers
export const getAllDrivers = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const drivers = await ctx.db.query("drivers").collect();

        // Enrich with user profile data
        const enrichedDrivers = await Promise.all(
            drivers.map(async (driver) => {
                const userProfile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", driver.clerkId))
                    .first();

                const vehicle = await ctx.db
                    .query("vehicles")
                    .withIndex("by_driver", (q) => q.eq("driver_clerk_id", driver.clerkId))
                    .first();

                return {
                    ...driver,
                    user_name: userProfile?.name || "Unknown",
                    user_phone: userProfile?.phone || "N/A",
                    // Use vehicle_type from driver record (new schema) or fallback to vehicles table (legacy)
                    vehicle_type: (driver as any).vehicle_type || vehicle?.type || "N/A",
                    vehicle_plate: vehicle?.plate_number || "N/A",
                };
            })
        );

        return enrichedDrivers;
    },
});

// Get all rides with enriched customer/driver names
export const getAllRidesEnriched = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        let rides;
        if (args.status !== undefined) {
            const statusFilter = args.status;
            rides = await ctx.db
                .query("rides")
                .withIndex("by_status", (q) => q.eq("status", statusFilter))
                .order("desc")
                .take(100);
        } else {
            rides = await ctx.db.query("rides").order("desc").take(100);
        }

        // Enrich with names
        const enrichedRides = await Promise.all(
            rides.map(async (ride) => {
                const customer = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.customer_clerk_id))
                    .first();

                let driver = null;
                if (ride.driver_clerk_id) {
                    const driverClerkId = ride.driver_clerk_id;
                    driver = await ctx.db
                        .query("userProfiles")
                        .withIndex("by_clerk_id", (q) => q.eq("clerkId", driverClerkId))
                        .first();
                }

                return {
                    ...ride,
                    customer_name: customer?.name || "Unknown",
                    driver_name: driver?.name || "Unassigned",
                };
            })
        );

        return enrichedRides;
    },
});

// Get platform analytics
export const getAnalytics = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const allDrivers = await ctx.db.query("drivers").collect();
        const verifiedDrivers = allDrivers.filter((d) => d.verified);
        const onlineDrivers = allDrivers.filter((d) => d.is_online);

        const allRides = await ctx.db.query("rides").collect();
        const completedRides = allRides.filter((r) => r.status === "completed");

        // Calculate total revenue (platform commission)
        let totalRevenue = 0;
        for (const ride of completedRides) {
            const fare = ride.final_fare || ride.fare_estimate;
            // Assuming 15% platform commission
            totalRevenue += fare * 0.15;
        }

        return {
            totalDrivers: allDrivers.length,
            verifiedDrivers: verifiedDrivers.length,
            onlineDrivers: onlineDrivers.length,
            totalRides: allRides.length,
            completedRides: completedRides.length,
            totalRevenue: Math.round(totalRevenue),
        };
    },
});

// Verify a driver
export const verifyDriver = mutation({
    args: { driver_id: v.id("drivers") },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        await ctx.db.patch(args.driver_id, { verified: true });

        // Optionally send notification to driver
        const driver = await ctx.db.get(args.driver_id);
        if (driver) {
            await ctx.db.insert("notifications", {
                user_clerk_id: driver.clerkId,
                type: "verification",
                title: "Account Verified! ✅",
                body: "Congratulations! Your driver account has been verified. You can now go online and start accepting rides.",
                read: false,
                created_at: new Date().toISOString(),
            });
        }

        return { success: true };
    },
});

// NOTE: rejectDriver mutation has been moved to line 1009 with enhanced functionality
// (action type: request_changes vs permanent_ban, reason, message)

// ============================================
// ADMIN WAR ROOM QUERIES
// ============================================

// Helper to check if user is admin (Safe version - no throw)
async function getAdminSafe(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .first();

    if (!user || user.role !== "admin") return null;

    return user;
}

// Get today's stats for the dashboard
export const getTodayStats = query({
    args: {},
    handler: async (ctx) => {
        // Use safe auth check to prevent frontend crash
        const adminUser = await getAdminSafe(ctx);
        if (!adminUser) {
            return {
                todayRides: 0,
                todayGMV: 0,
                todayCommission: 0,
                lowBalanceDrivers: 0,
                status: "unauthorized"
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // Optimized: Filter at query level instead of fetching all
        const todayRides = await ctx.db
            .query("rides")
            .filter((q) => q.gte(q.field("created_at"), todayISO))
            .collect();

        // Calculate stats
        const completedRides = todayRides.filter(r => r.status === 'completed');
        const todayGMV = completedRides.reduce((sum, r) => sum + (r.final_fare || r.fare_estimate || 0), 0);
        const todayCommission = Math.round(todayGMV * 0.12); // 12% average commission

        // Count low balance drivers
        const wallets = await ctx.db.query("driver_wallets").collect();
        const lowBalanceDrivers = wallets.filter(w => w.balance < -2000).length;

        return {
            todayRides: completedRides.length,
            todayGMV,
            todayCommission,
            lowBalanceDrivers,
            status: "ok"
        };
    },
});

// Get system health status
export const getSystemHealth = query({
    args: {},
    handler: async (ctx) => {
        // Simple health check - in production, check more services
        return {
            status: 'healthy',
            database: 'connected',
            lastChecked: new Date().toISOString(),
        };
    },
});

// Get low balance wallets for Wallet Watch
export const getLowBalanceWallets = query({
    args: {},
    handler: async (ctx) => {
        const wallets = await ctx.db
            .query("driver_wallets")
            .collect();

        // Filter wallets with balance below threshold
        const lowBalanceWallets = wallets.filter(w => w.balance < 0);

        // Enrich with driver info
        const enriched = await Promise.all(
            lowBalanceWallets.map(async (wallet) => {
                const driver = await ctx.db
                    .query("drivers")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", wallet.user_clerk_id))
                    .first();

                // Get user profile for name/phone
                const profile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", wallet.user_clerk_id))
                    .first();

                return {
                    ...wallet,
                    driver_name: profile?.name || 'Unknown',
                    phone: profile?.phone || 'N/A',
                };
            })
        );

        return enriched.sort((a, b) => a.balance - b.balance); // Worst first
    },
});

// ============================================
// ADMIN CONTROL MUTATIONS ("THE HAMMER")
// ============================================

// Helper to log admin actions
async function logAdminAction(ctx: any, adminClerkId: string, action: string, details: {
    targetType?: string;
    targetId?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
}) {
    await ctx.db.insert("admin_logs", {
        admin_clerk_id: adminClerkId,
        action,
        target_type: details.targetType,
        target_id: details.targetId,
        old_value: details.oldValue ? JSON.stringify(details.oldValue) : undefined,
        new_value: details.newValue ? JSON.stringify(details.newValue) : undefined,
        reason: details.reason,
        created_at: new Date().toISOString(),
    });
}

// Ban a driver
export const banDriver = mutation({
    args: {
        driver_id: v.id("drivers"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await checkAdmin(ctx);

        // Get driver
        const driver = await ctx.db.get(args.driver_id);
        if (!driver) throw new Error("Driver not found");

        // Update driver status
        await ctx.db.patch(args.driver_id, {
            verified: false,
            is_online: false,
            // Store ban info in the wallet lock fields
            wallet_locked: true,
            wallet_lock_reason: `BANNED: ${args.reason} `,
        });

        // Log action
        await logAdminAction(ctx, admin.clerkId, "ban_driver", {
            targetType: "driver",
            targetId: args.driver_id,
            newValue: { banned: true, reason: args.reason },
            reason: args.reason,
        });

        return { success: true, message: `Driver banned: ${args.reason} ` };
    },
});

// Unban a driver
export const unbanDriver = mutation({
    args: { driver_id: v.id("drivers") },
    handler: async (ctx, args) => {
        const admin = await checkAdmin(ctx);

        await ctx.db.patch(args.driver_id, {
            wallet_locked: false,
            wallet_lock_reason: undefined,
        });

        await logAdminAction(ctx, admin.clerkId, "unban_driver", {
            targetType: "driver",
            targetId: args.driver_id,
        });

        return { success: true };
    },
});

// Freeze a driver wallet (blocks cash trips)
export const freezeWallet = mutation({
    args: {
        driver_id: v.id("drivers"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await checkAdmin(ctx);

        // Get driver
        const driver = await ctx.db.get(args.driver_id);
        if (!driver) throw new Error("Driver not found");

        // Lock the wallet
        await ctx.db.patch(args.driver_id, {
            wallet_locked: true,
            wallet_lock_reason: args.reason,
        });

        // Also update driver_wallets if exists
        const wallet = await ctx.db
            .query("driver_wallets")
            .filter((q: any) => q.eq(q.field("user_clerk_id"), driver.clerkId))
            .first();

        if (wallet) {
            await ctx.db.patch(wallet._id, {
                status: "locked",
                locked_reason: args.reason,
            });
        }

        await logAdminAction(ctx, admin.clerkId, "freeze_wallet", {
            targetType: "driver",
            targetId: args.driver_id,
            reason: args.reason,
        });

        return { success: true, message: `Wallet frozen: ${args.reason} ` };
    },
});

// Unfreeze a driver wallet
export const unfreezeWallet = mutation({
    args: { driver_id: v.id("drivers") },
    handler: async (ctx, args) => {
        const admin = await checkAdmin(ctx);

        const driver = await ctx.db.get(args.driver_id);
        if (!driver) throw new Error("Driver not found");

        await ctx.db.patch(args.driver_id, {
            wallet_locked: false,
            wallet_lock_reason: undefined,
        });

        // Also update driver_wallets if exists
        const wallet = await ctx.db
            .query("driver_wallets")
            .filter((q: any) => q.eq(q.field("user_clerk_id"), driver.clerkId))
            .first();

        if (wallet) {
            await ctx.db.patch(wallet._id, {
                status: "active",
                locked_reason: undefined,
            });
        }

        await logAdminAction(ctx, admin.clerkId, "unfreeze_wallet", {
            targetType: "driver",
            targetId: args.driver_id,
        });

        return { success: true };
    },
});

// ============================================
// PRICING CONTROL ("ENGINE TUNING")
// ============================================

// Update pricing config with safety checks
export const updatePricingConfig = mutation({
    args: {
        vehicle_type: v.string(),
        base_fare: v.optional(v.number()),
        rate_per_km: v.optional(v.number()),
        rate_per_min: v.optional(v.number()),
        min_fare: v.optional(v.number()),
        surge_cap: v.optional(v.number()),
        demurrage_rate: v.optional(v.number()),
        commission_rate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const admin = await checkAdmin(ctx);

        // Safety checks
        if (args.base_fare !== undefined && args.base_fare < 500) {
            throw new Error("Safety: Base fare cannot be less than TZS 500 (typo protection)");
        }
        if (args.rate_per_km !== undefined && args.rate_per_km < 50) {
            throw new Error("Safety: Rate per km cannot be less than TZS 50");
        }
        if (args.commission_rate !== undefined && (args.commission_rate < 0 || args.commission_rate > 0.5)) {
            throw new Error("Safety: Commission rate must be between 0% and 50%");
        }

        // Find existing config
        const config = await ctx.db
            .query("pricing_config")
            .filter((q: any) => q.eq(q.field("vehicle_type"), args.vehicle_type))
            .first();

        if (!config) {
            throw new Error(`Pricing config not found for vehicle type: ${args.vehicle_type} `);
        }

        // Build update object
        const updates: any = { updated_at: new Date().toISOString() };
        const oldValues: any = {};

        if (args.base_fare !== undefined) { oldValues.base_fare = config.base_fare; updates.base_fare = args.base_fare; }
        if (args.rate_per_km !== undefined) { oldValues.rate_per_km = config.rate_per_km; updates.rate_per_km = args.rate_per_km; }
        if (args.rate_per_min !== undefined) { oldValues.rate_per_min = config.rate_per_min; updates.rate_per_min = args.rate_per_min; }
        if (args.min_fare !== undefined) { oldValues.min_fare = config.min_fare; updates.min_fare = args.min_fare; }
        if (args.surge_cap !== undefined) { oldValues.surge_cap = config.surge_cap; updates.surge_cap = args.surge_cap; }
        if (args.demurrage_rate !== undefined) { oldValues.demurrage_rate = config.demurrage_rate; updates.demurrage_rate = args.demurrage_rate; }
        if (args.commission_rate !== undefined) { oldValues.commission_rate = config.commission_rate; updates.commission_rate = args.commission_rate; }

        // Apply update
        await ctx.db.patch(config._id, updates);

        // Audit trail
        await logAdminAction(ctx, admin.clerkId, "update_pricing", {
            targetType: "pricing_config",
            targetId: args.vehicle_type,
            oldValue: oldValues,
            newValue: updates,
        });

        return { success: true, message: `${args.vehicle_type} pricing updated` };
    },
});

// ============================================
// KILL SWITCH ("EMERGENCY BRAKE")
// ============================================

// Toggle service active status
export const toggleService = mutation({
    args: { active: v.boolean() },
    handler: async (ctx, args) => {
        const admin = await checkAdmin(ctx);

        // Check if config exists
        const config = await ctx.db
            .query("system_config")
            .withIndex("by_key", (q: any) => q.eq("key", "is_service_active"))
            .first();

        if (config) {
            const oldValue = config.value;
            await ctx.db.patch(config._id, {
                value: JSON.stringify(args.active),
                updated_by: admin.clerkId,
                updated_at: new Date().toISOString(),
            });

            await logAdminAction(ctx, admin.clerkId, "toggle_service", {
                targetType: "system",
                oldValue: oldValue,
                newValue: JSON.stringify(args.active),
            });
        } else {
            await ctx.db.insert("system_config", {
                key: "is_service_active",
                value: JSON.stringify(args.active),
                updated_by: admin.clerkId,
                updated_at: new Date().toISOString(),
            });

            await logAdminAction(ctx, admin.clerkId, "toggle_service", {
                targetType: "system",
                newValue: JSON.stringify(args.active),
            });
        }

        return {
            success: true,
            message: args.active ? "Service ENABLED" : "Service DISABLED - All bookings blocked"
        };
    },
});

// Get service status
export const getServiceStatus = query({
    args: {},
    handler: async (ctx) => {
        const config = await ctx.db
            .query("system_config")
            .withIndex("by_key", (q: any) => q.eq("key", "is_service_active"))
            .first();

        if (!config) {
            return { isActive: true }; // Default to active
        }

        return { isActive: JSON.parse(config.value) };
    },
});

// ============================================
// SUPPORT TICKETS
// ============================================

// Create a ticket
export const createTicket = mutation({
    args: {
        issue_type: v.union(
            v.literal("ride_issue"),
            v.literal("payment_issue"),
            v.literal("driver_complaint"),
            v.literal("customer_complaint"),
            v.literal("app_bug"),
            v.literal("other")
        ),
        subject: v.string(),
        description: v.string(),
        ride_id: v.optional(v.id("rides")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
            .first();

        const now = new Date().toISOString();

        const ticketId = await ctx.db.insert("support_tickets", {
            user_clerk_id: identity.subject,
            user_type: profile?.role === "driver" ? "driver" : "customer",
            ride_id: args.ride_id,
            issue_type: args.issue_type,
            subject: args.subject,
            description: args.description,
            status: "open",
            priority: args.issue_type === "payment_issue" ? "high" : "medium",
            created_at: now,
            updated_at: now,
        });

        // Get admin push tokens and send notification
        const admins = await ctx.db
            .query("userProfiles")
            .filter((q: any) => q.eq(q.field("role"), "admin"))
            .collect();

        const adminTokens = admins
            .filter(a => a.pushToken)
            .map(a => a.pushToken as string);

        if (adminTokens.length > 0) {
            const priority = args.issue_type === "payment_issue" ? "high" : "medium";
            // Using string path to avoid TS2589 type recursion issue
            await ctx.scheduler.runAfter(0, "pushNotifications:notifyAdminsNewTicket" as any, {
                admin_tokens: adminTokens,
                ticket_subject: args.subject,
                issue_type: args.issue_type,
                priority: priority,
                ticket_id: ticketId as unknown as string,
            });
        }

        return { success: true, ticketId };
    },
});

// Get open tickets (admin only)
export const getOpenTickets = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const tickets = await ctx.db
            .query("support_tickets")
            .withIndex("by_status", (q: any) => q.eq("status", "open"))
            .order("desc")
            .take(50);

        return tickets;
    },
});

// Update ticket status (admin only)
export const updateTicketStatus = mutation({
    args: {
        ticket_id: v.id("support_tickets"),
        status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
        resolution: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await checkAdmin(ctx);

        await ctx.db.patch(args.ticket_id, {
            status: args.status,
            resolution: args.resolution,
            assigned_to: admin.clerkId,
            updated_at: new Date().toISOString(),
        });

        return { success: true };
    },
});

// ============================================
// ADMIN NOTIFICATION HELPERS
// ============================================

// Get all admin push tokens (for sending alerts)
export const getAdminPushTokens = query({
    args: {},
    handler: async (ctx) => {
        // Get all admin users
        const admins = await ctx.db
            .query("userProfiles")
            .filter((q: any) => q.eq(q.field("role"), "admin"))
            .collect();

        // Filter to only those with push tokens
        const tokens = admins
            .filter(a => a.pushToken)
            .map(a => a.pushToken as string);

        return tokens;
    },
});

// Get admin dashboard counts (for badges)
export const getAdminDashboardCounts = query({
    args: {},
    handler: async (ctx) => {
        // Open tickets
        const openTickets = await ctx.db
            .query("support_tickets")
            .withIndex("by_status", (q: any) => q.eq("status", "open"))
            .collect();

        // Active SOS alerts
        const activeSOS = await ctx.db
            .query("sos_alerts")
            .withIndex("by_status", (q: any) => q.eq("status", "active"))
            .collect();

        // Pending driver verifications
        const pendingDrivers = await ctx.db
            .query("drivers")
            .filter((q: any) => q.eq(q.field("verified"), false))
            .collect();

        // Low balance wallets
        const wallets = await ctx.db.query("driver_wallets").collect();
        const lowBalanceCount = wallets.filter(w => w.balance < -2000).length;

        return {
            openTickets: openTickets.length,
            activeSOS: activeSOS.length,
            pendingDrivers: pendingDrivers.length,
            lowBalanceWallets: lowBalanceCount,
        };
    },
});

// ============================================
// BUSINESS ORGANIZATION APPROVALS (Empire Edition)
// ============================================

// Get all pending organizations (for admin approval screen)
export const getPendingOrganizations = query({
    args: {},
    handler: async (ctx) => {
        // In production, add admin role check here
        const pendingOrgs = await ctx.db
            .query("organizations")
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        return pendingOrgs;
    },
});

// Approve an organization (sets status to 'active')
export const approveOrganization = mutation({
    args: { orgId: v.id("organizations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const org = await ctx.db.get(args.orgId);
        if (!org) throw new Error("Organization not found");

        if (org.status !== "pending") {
            throw new Error("Organization is not in pending state");
        }

        await ctx.db.patch(args.orgId, {
            status: "active",
            verified: true,
        });

        console.log(`[SMS] Organization ${org.name} has been approved and is now active.`);

        return { success: true };
    },
});

// Reject an organization (with reason and action type)
export const rejectOrganization = mutation({
    args: {
        orgId: v.id("organizations"),
        action: v.optional(v.union(v.literal("request_changes"), v.literal("permanent_ban"))),
        reason: v.optional(v.string()),
        message: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const org = await ctx.db.get(args.orgId);
        if (!org) throw new Error("Organization not found");

        const action = args.action || "request_changes";
        const newStatus = action === "permanent_ban" ? "rejected" : "action_required";

        await ctx.db.patch(args.orgId, {
            status: newStatus,
            rejection_reason: args.reason || "Unspecified",
            rejection_message: args.message,
            rejection_action: action,
            rejected_at: new Date().toISOString(),
        });

        console.log(`[SMS] Organization ${org.name} has been ${action === "permanent_ban" ? "rejected" : "asked to fix"}: ${args.reason}`);

        return { success: true, status: newStatus };
    },
});

// ============================================
// DRIVER APPROVALS (Captain's Exam)
// ============================================

// Get all pending drivers (for admin approval screen)
export const getPendingDrivers = query({
    args: {},
    handler: async (ctx) => {
        // Get drivers with verified === false (pending verification)
        const pendingDrivers = await ctx.db
            .query("drivers")
            .filter((q) => q.eq(q.field("verified"), false))
            .collect();

        // Enrich with user profile data
        const enriched = await Promise.all(
            pendingDrivers.map(async (driver) => {
                // Find user profile linked to this driver
                const userProfile = await ctx.db
                    .query("userProfiles")
                    .filter((q) => q.eq(q.field("clerkId"), driver.clerkId))
                    .first();

                // Get photo URLs from documents object if it exists
                const docs = driver.documents || {};

                return {
                    ...driver,
                    user_name: userProfile?.name || 'Unknown',
                    user_phone: userProfile?.phone || '',
                    // Get storage URLs for photos
                    selfie_photo_url: docs.nida_photo
                        ? await ctx.storage.getUrl(docs.nida_photo)
                        : null,
                    license_front_url: docs.license_photo
                        ? await ctx.storage.getUrl(docs.license_photo)
                        : null,
                    insurance_url: docs.insurance_photo
                        ? await ctx.storage.getUrl(docs.insurance_photo)
                        : null,
                };
            })
        );

        return enriched;
    },
});

// Approve a driver (sets verified to true)
export const approveDriver = mutation({
    args: { driverId: v.id("drivers") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const driver = await ctx.db.get(args.driverId);
        if (!driver) throw new Error("Driver not found");

        if (driver.verified === true) {
            throw new Error("Driver is already verified");
        }

        await ctx.db.patch(args.driverId, {
            verified: true,
        });

        // Also update the user profile to link the driver ID
        const userProfile = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("clerkId"), driver.clerkId))
            .first();

        if (userProfile) {
            await ctx.db.patch(userProfile._id, {
                driverId: args.driverId,
            });
        }

        console.log(`[SMS] Driver ${driver.clerkId} has been approved and is now active.`);

        return { success: true };
    },
});

// Reject a driver (with reason and action type)
export const rejectDriver = mutation({
    args: {
        driverId: v.id("drivers"),
        action: v.optional(v.union(v.literal("request_changes"), v.literal("permanent_ban"))),
        reason: v.optional(v.string()),
        message: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const driver = await ctx.db.get(args.driverId);
        if (!driver) throw new Error("Driver not found");

        const action = args.action || "request_changes";
        const newStatus = action === "permanent_ban" ? "rejected" : "action_required";

        await ctx.db.patch(args.driverId, {
            verified: false,
            verification_status: newStatus,
            rejection_reason: args.reason || "Unspecified",
            rejection_message: args.message,
            rejection_action: action,
            rejected_at: new Date().toISOString(),
        });

        console.log(`[SMS] Driver ${driver.clerkId} has been ${action === "permanent_ban" ? "rejected" : "asked to fix"}: ${args.reason}`);

        return { success: true, status: newStatus };
    },
});
