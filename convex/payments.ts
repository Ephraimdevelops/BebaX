import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mark payment as completed
export const markPaid = mutation({
    args: {
        ride_id: v.id("rides"),
        payment_method: v.union(
            v.literal("cash"),
            v.literal("mobile_money"),
            v.literal("wallet")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            throw new Error("Ride not found");
        }

        // Only customer or driver can mark as paid
        if (ride.customer_clerk_id !== identity.subject && ride.driver_clerk_id !== identity.subject) {
            throw new Error("Not authorized");
        }

        await ctx.db.patch(args.ride_id, {
            payment_method: args.payment_method,
            payment_status: "paid",
        });

        // Update driver earnings
        if (ride.driver_clerk_id) {
            const driver = await ctx.db
                .query("drivers")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.driver_clerk_id!))
                .first();

            if (driver) {
                const fare = ride.final_fare || ride.fare_estimate;
                const earnings = fare * (1 - driver.commission_rate);

                await ctx.db.patch(driver._id, {
                    total_earnings: driver.total_earnings + earnings,
                    total_trips: driver.total_trips + 1,
                });
            }
        }

        // Notify customer
        await ctx.db.insert("notifications", {
            user_clerk_id: ride.customer_clerk_id,
            type: "payment",
            title: "Payment Confirmed",
            body: "Your payment has been processed",
            read: false,
            ride_id: args.ride_id,
            created_at: new Date().toISOString(),
        });
    },
});

/**
 * Settle cash trip - Record commission and update driver wallet
 * Called automatically when trip status changes to "delivered"
 */
export const settleCashTrip = mutation({
    args: {
        ride_id: v.id("rides"),
    },
    handler: async (ctx, args) => {
        // 1. Get ride and validate
        const ride = await ctx.db.get(args.ride_id);
        if (!ride) {
            throw new Error("Ride not found");
        }

        if (ride.payment_status === "collected") {
            // Already settled, skip (idempotent)
            return { success: true, message: "Already settled" };
        }

        if (!ride.driver_clerk_id) {
            throw new Error("No driver assigned to this ride");
        }

        // 2. Get driver
        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", ride.driver_clerk_id!))
            .first();

        if (!driver) {
            throw new Error("Driver not found");
        }

        // 3. Calculate commission
        const finalFare = ride.final_fare || ride.fare_estimate;
        const commission = Math.floor(finalFare * driver.commission_rate);

        // 4. Get or create driver wallet account
        let walletAccountId = driver.wallet_account_id;

        if (!walletAccountId) {
            walletAccountId = await ctx.db.insert("accounts", {
                type: "driver_wallet",
                reference_id: driver.clerkId,
                currency: "TZS",
                created_at: new Date().toISOString(),
            });

            // Update driver with wallet account
            await ctx.db.patch(driver._id, {
                wallet_account_id: walletAccountId,
            });
        }

        // 5. Get platform revenue account (create if doesn't exist)
        let platformAccount = await ctx.db
            .query("accounts")
            .withIndex("by_type", (q) => q.eq("type", "platform_revenue"))
            .first();

        if (!platformAccount) {
            const platformAccountId = await ctx.db.insert("accounts", {
                type: "platform_revenue",
                currency: "TZS",
                created_at: new Date().toISOString(),
            });
            platformAccount = await ctx.db.get(platformAccountId);
        }

        // 6. Create ledger entries (ATOMIC)
        const timestamp = new Date().toISOString();

        // Debit driver wallet (driver owes platform)
        await ctx.db.insert("ledger_entries", {
            account_id: walletAccountId,
            amount: commission,
            direction: "debit",
            type: "commission",
            related_trip_id: args.ride_id,
            provider: "cash",
            metadata: {
                note: "Cash trip commission",
                fare: finalFare,
                commission_rate: driver.commission_rate,
            },
            created_at: timestamp,
        });

        // Credit platform revenue
        await ctx.db.insert("ledger_entries", {
            account_id: platformAccount!._id,
            amount: commission,
            direction: "credit",
            type: "commission",
            related_trip_id: args.ride_id,
            provider: "cash",
            metadata: {
                note: "Cash trip commission",
                driver_clerk_id: driver.clerkId,
            },
            created_at: timestamp,
        });

        // 7. Update driver wallet balance
        const newBalance = driver.wallet_balance - commission;
        const LOCK_THRESHOLD = -100000; // -100,000 TZS
        const SOFT_THRESHOLD = -50000; // -50,000 TZS

        await ctx.db.patch(driver._id, {
            wallet_balance: newBalance,
            wallet_locked: newBalance < LOCK_THRESHOLD,
            wallet_lock_reason:
                newBalance < LOCK_THRESHOLD
                    ? `Una deni la ${Math.abs(newBalance).toLocaleString()} TZS. Lipa sasa ili kufungua akaunti.`
                    : undefined,
        });

        // 8. Update ride status
        await ctx.db.patch(args.ride_id, {
            payment_status: "collected",
            cash_collected: true,
        });

        // 9. Send notification if locked or soft warning
        if (newBalance < LOCK_THRESHOLD) {
            // Hard lock - send urgent notification
            await ctx.db.insert("notifications", {
                user_clerk_id: driver.clerkId,
                type: "wallet_locked",
                title: "⚠️ Akaunti Imefungwa",
                body: `Samahani - akaunti yako imefungwa kwa sababu una deni kubwa (${Math.abs(
                    newBalance
                ).toLocaleString()} TZS). Lipa sasa ili kufungua.`,
                read: false,
                ride_id: args.ride_id,
                created_at: timestamp,
            });
        } else if (newBalance < SOFT_THRESHOLD) {
            // Soft warning
            await ctx.db.insert("notifications", {
                user_clerk_id: driver.clerkId,
                type: "wallet_warning",
                title: "💰 Kumbusho la Malipo",
                body: `Tafadhali: una deni la ${Math.abs(
                    newBalance
                ).toLocaleString()} TZS kwa BebaX. Lipa sasa kwa M-Pesa ili kuepuka kusitishwa.`,
                read: false,
                ride_id: args.ride_id,
                created_at: timestamp,
            });
        }

        return {
            success: true,
            commission,
            new_balance: newBalance,
            locked: newBalance < LOCK_THRESHOLD,
            warning: newBalance < SOFT_THRESHOLD && newBalance >= LOCK_THRESHOLD,
        };
    },
});

/**
 * Get driver wallet balance and ledger history
 */
export const getDriverWallet = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!driver || !driver.wallet_account_id) {
            return {
                balance: 0,
                locked: false,
                ledger_entries: [],
            };
        }

        // Get recent ledger entries
        const ledgerEntries = await ctx.db
            .query("ledger_entries")
            .withIndex("by_account", (q) => q.eq("account_id", driver.wallet_account_id!))
            .order("desc")
            .take(50);

        return {
            balance: driver.wallet_balance,
            locked: driver.wallet_locked,
            lock_reason: driver.wallet_lock_reason,
            ledger_entries: ledgerEntries,
        };
    },
});

/**
 * Get drivers with negative balances (for admin)
 */
export const getDriversOwingCommission = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Check if admin
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        const drivers = await ctx.db
            .query("drivers")
            .collect();

        // Filter drivers with negative balance and get user details
        const driversOwing = [];
        for (const driver of drivers) {
            if (driver.wallet_balance < 0) {
                const userProfile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", driver.clerkId))
                    .first();

                driversOwing.push({
                    driver_id: driver._id,
                    clerk_id: driver.clerkId,
                    name: userProfile?.name || "Unknown",
                    phone: userProfile?.phone || "",
                    wallet_balance: driver.wallet_balance,
                    wallet_locked: driver.wallet_locked,
                    total_trips: driver.total_trips,
                });
            }
        }

        // Sort by most owed
        return driversOwing.sort((a, b) => a.wallet_balance - b.wallet_balance);
    },
});

/**
 * Manual cash deposit (admin only)
 */
export const recordCashDeposit = mutation({
    args: {
        driver_clerk_id: v.string(),
        amount: v.number(),
        receipt_reference: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Check if admin
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        // Get driver
        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.driver_clerk_id))
            .first();

        if (!driver) throw new Error("Driver not found");

        if (!driver.wallet_account_id) {
            throw new Error("Driver wallet not initialized");
        }

        // Create settlement record
        const settlementId = await ctx.db.insert("settlements", {
            driver_clerk_id: args.driver_clerk_id,
            amount: args.amount,
            method: "cash_deposit",
            status: "completed",
            metadata: {
                receipt_reference: args.receipt_reference,
                notes: args.notes,
                recorded_by: identity.subject,
            },
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
        });

        // Create ledger entry (credit driver wallet)
        await ctx.db.insert("ledger_entries", {
            account_id: driver.wallet_account_id,
            amount: args.amount,
            direction: "credit",
            type: "settlement",
            related_settlement_id: settlementId,
            provider: "cash",
            metadata: {
                receipt_reference: args.receipt_reference,
                notes: args.notes,
            },
            created_at: new Date().toISOString(),
        });

        // Update driver wallet balance
        const newBalance = driver.wallet_balance + args.amount;

        await ctx.db.patch(driver._id, {
            wallet_balance: newBalance,
            wallet_locked: newBalance < -100000, // Unlock if above threshold
            wallet_lock_reason: newBalance >= -100000 ? undefined : driver.wallet_lock_reason,
        });

        // Notify driver
        await ctx.db.insert("notifications", {
            user_clerk_id: driver.clerkId,
            type: "settlement_received",
            title: "✅ Malipo Yamepokewa",
            body: `Malipo yako ya ${args.amount.toLocaleString()} TZS yamepokewa. Salio jipya: ${newBalance.toLocaleString()} TZS`,
            read: false,
            created_at: new Date().toISOString(),
        });

        return {
            success: true,
            settlement_id: settlementId,
            new_balance: newBalance,
            unlocked: newBalance >= -100000 && driver.wallet_locked,
        };
    },
});

// Get pending payouts (admin)
export const getPendingPayouts = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        return await ctx.db
            .query("payouts")
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
    },
});

// Process payout (admin)
export const processPayout = mutation({
    args: {
        payout_id: v.id("payouts"),
        transaction_id: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!profile || profile.role !== "admin") {
            throw new Error("Admin access required");
        }

        const payout = await ctx.db.get(args.payout_id);
        if (!payout) {
            throw new Error("Payout not found");
        }

        await ctx.db.patch(args.payout_id, {
            status: "completed",
            transaction_id: args.transaction_id,
            processed_at: new Date().toISOString(),
        });

        // Update driver balance
        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", payout.driver_clerk_id))
            .first();

        if (driver) {
            await ctx.db.patch(driver._id, {
                total_earnings: driver.total_earnings - payout.amount,
            });
        }

        // Notify driver
        await ctx.db.insert("notifications", {
            user_clerk_id: payout.driver_clerk_id,
            type: "payment",
            title: "Payout Processed",
            body: `${payout.net_amount} TZS has been sent to your ${payout.method} account`,
            read: false,
            created_at: new Date().toISOString(),
        });
    },
});

// Get driver payouts
export const getMyPayouts = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        return await ctx.db
            .query("payouts")
            .withIndex("by_driver", (q) => q.eq("driver_clerk_id", identity.subject))
            .order("desc")
            .collect();
    },
});
