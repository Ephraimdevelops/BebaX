"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { sendPushNotification, sendBulkPushNotifications, NotificationTemplates } from "../lib/pushNotifications";

/**
 * Send push notification for new ride request to nearby drivers
 */
export const notifyDriversOfNewRide = action({
    args: {
        ride_id: v.id("rides"),
        driver_tokens: v.array(v.string()),
        distance: v.number(),
        fare: v.number(),
        vehicle_type: v.string(),
    },
    handler: async (ctx, args) => {
        const template = NotificationTemplates.newRideRequest(
            args.distance,
            args.fare,
            args.vehicle_type
        );

        const notifications = args.driver_tokens.map((token) => ({
            to: token,
            ...template,
            data: { rideId: args.ride_id },
        }));

        await sendBulkPushNotifications(notifications);
    },
});

/**
 * Notify customer that driver accepted their ride
 */
export const notifyCustomerRideAccepted = action({
    args: {
        customer_token: v.string(),
        driver_name: v.string(),
        ride_id: v.id("rides"),
    },
    handler: async (ctx, args) => {
        const template = NotificationTemplates.rideAccepted(args.driver_name);

        await sendPushNotification({
            to: args.customer_token,
            ...template,
            data: { rideId: args.ride_id },
        });
    },
});

/**
 * Notify customer that driver arrived
 */
export const notifyCustomerDriverArrived = action({
    args: {
        customer_token: v.string(),
        ride_id: v.id("rides"),
    },
    handler: async (ctx, args) => {
        const template = NotificationTemplates.driverArrived();

        await sendPushNotification({
            to: args.customer_token,
            ...template,
            data: { rideId: args.ride_id },
        });
    },
});

/**
 * Notify both parties that trip started
 */
export const notifyTripStarted = action({
    args: {
        customer_token: v.string(),
        driver_token: v.string(),
        ride_id: v.id("rides"),
    },
    handler: async (ctx, args) => {
        const template = NotificationTemplates.tripStarted();

        await sendBulkPushNotifications([
            {
                to: args.customer_token,
                ...template,
                data: { rideId: args.ride_id },
            },
            {
                to: args.driver_token,
                ...template,
                body: 'Trip started. Drive safely!',
                data: { rideId: args.ride_id },
            },
        ]);
    },
});

/**
 * Notify both parties that trip completed
 */
export const notifyTripCompleted = action({
    args: {
        customer_token: v.string(),
        driver_token: v.string(),
        ride_id: v.id("rides"),
        fare: v.number(),
    },
    handler: async (ctx, args) => {
        const customerTemplate = NotificationTemplates.tripCompleted(args.fare);
        const driverTemplate = {
            title: '✅ Trip Completed',
            body: `Earned ${args.fare.toLocaleString()} TZS. Great job!`,
            sound: 'default' as const,
            priority: 'normal' as const,
        };

        await sendBulkPushNotifications([
            {
                to: args.customer_token,
                ...customerTemplate,
                data: { rideId: args.ride_id },
            },
            {
                to: args.driver_token,
                ...driverTemplate,
                data: { rideId: args.ride_id },
            },
        ]);
    },
});

/**
 * Notify driver of verification status
 */
export const notifyDriverVerification = action({
    args: {
        driver_token: v.string(),
        verified: v.boolean(),
        rejection_reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const template = args.verified
            ? NotificationTemplates.driverVerified()
            : NotificationTemplates.driverRejected(args.rejection_reason || 'Please contact support');

        await sendPushNotification({
            to: args.driver_token,
            ...template,
        });
    },
});
