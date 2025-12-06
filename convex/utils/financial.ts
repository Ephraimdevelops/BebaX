import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { v } from "convex/values";
import { DataModel, Id } from "../_generated/dataModel";

// Reserve funds for a B2B ride
export async function reserveFunds(
    ctx: GenericMutationCtx<DataModel>,
    orgId: Id<"organizations">,
    amount: number
) {
    const org = await ctx.db.get(orgId);
    if (!org) throw new Error("Organization not found");

    const availableFunds = org.walletBalance + (org.creditLimit || 0);
    if (availableFunds < amount) {
        throw new Error("Insufficient funds in Company Wallet");
    }

    await ctx.db.patch(orgId, {
        walletBalance: org.walletBalance - amount,
        reservedBalance: org.reservedBalance + amount,
    });

    return {
        walletBalance: org.walletBalance - amount,
        reservedBalance: org.reservedBalance + amount,
    };
}

// Settle a B2B ride
export async function settleTrip(
    ctx: GenericMutationCtx<DataModel>,
    orgId: Id<"organizations">,
    estimatedFare: number,
    finalFare: number,
    driverClerkId?: string
) {
    const org = await ctx.db.get(orgId);
    if (!org) throw new Error("Organization not found");

    let newWalletBalance = org.walletBalance;
    const newReservedBalance = org.reservedBalance - estimatedFare;

    if (finalFare > estimatedFare) {
        // Deduct difference
        newWalletBalance -= (finalFare - estimatedFare);
    } else if (finalFare < estimatedFare) {
        // Refund difference
        newWalletBalance += (estimatedFare - finalFare);
    }

    await ctx.db.patch(orgId, {
        walletBalance: newWalletBalance,
        reservedBalance: newReservedBalance,
    });

    // Credit Driver Wallet (Offset Logic)
    if (driverClerkId) {
        const driver = await ctx.db
            .query("drivers")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", driverClerkId))
            .first();

        if (driver) {
            const commission = finalFare * 0.15; // 15% commission
            const driverEarnings = finalFare - commission;

            await ctx.db.patch(driver._id, {
                wallet_balance: driver.wallet_balance + driverEarnings
            });
        }
    }

    return {
        walletBalance: newWalletBalance,
        reservedBalance: newReservedBalance,
    };
}

// Refund reservation (Cancellation)
export async function refundReservation(
    ctx: GenericMutationCtx<DataModel>,
    orgId: Id<"organizations">,
    amount: number
) {
    const org = await ctx.db.get(orgId);
    if (!org) throw new Error("Organization not found");

    await ctx.db.patch(orgId, {
        walletBalance: org.walletBalance + amount,
        reservedBalance: org.reservedBalance - amount,
    });

    return {
        walletBalance: org.walletBalance + amount,
        reservedBalance: org.reservedBalance - amount,
    };
}
