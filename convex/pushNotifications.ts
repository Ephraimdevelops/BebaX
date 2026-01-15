"use node";

import { action, internalAction } from "./_generated/server";
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

// ============================================
// ADMIN ALERT NOTIFICATIONS
// Critical alerts for Super Admins
// ============================================

/**
 * Notify all admins of an SOS alert (CRITICAL)
 */
export const notifyAdminsSOS = internalAction({
    args: {
        admin_tokens: v.array(v.string()),
        user_name: v.string(),
        user_phone: v.string(),
        location_address: v.string(),
        sos_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const notifications = args.admin_tokens.map((token) => ({
            to: token,
            title: '🆘 EMERGENCY SOS ALERT',
            body: `${args.user_name} (${args.user_phone}) triggered SOS at ${args.location_address}`,
            sound: 'default' as const,
            priority: 'high' as const,
            data: { type: 'sos', sosId: args.sos_id },
            categoryId: 'sos_alert',
        }));

        await sendBulkPushNotifications(notifications);
    },
});

/**
 * Notify admins of new support ticket
 */
export const notifyAdminsNewTicket = internalAction({
    args: {
        admin_tokens: v.array(v.string()),
        ticket_subject: v.string(),
        issue_type: v.string(),
        priority: v.string(),
        ticket_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const priorityEmoji = args.priority === 'critical' ? '🔴' : args.priority === 'high' ? '🟠' : '🟡';

        const notifications = args.admin_tokens.map((token) => ({
            to: token,
            title: `${priorityEmoji} New Support Ticket`,
            body: `[${args.issue_type}] ${args.ticket_subject}`,
            sound: 'default' as const,
            priority: args.priority === 'critical' ? 'high' as const : 'normal' as const,
            data: { type: 'support_ticket', ticketId: args.ticket_id },
        }));

        await sendBulkPushNotifications(notifications);
    },
});

/**
 * Notify admins of new driver application
 */
export const notifyAdminsNewDriver = internalAction({
    args: {
        admin_tokens: v.array(v.string()),
        driver_name: v.string(),
        vehicle_type: v.string(),
        driver_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const notifications = args.admin_tokens.map((token) => ({
            to: token,
            title: '🚛 New Driver Application',
            body: `${args.driver_name} applied with ${args.vehicle_type}. Review pending.`,
            sound: 'default' as const,
            priority: 'normal' as const,
            data: { type: 'driver_application', driverId: args.driver_id },
        }));

        await sendBulkPushNotifications(notifications);
    },
});

/**
 * Notify admins of critically low driver balance
 */
export const notifyAdminsLowBalance = action({
    args: {
        admin_tokens: v.array(v.string()),
        driver_name: v.string(),
        balance: v.number(),
        driver_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const notifications = args.admin_tokens.map((token) => ({
            to: token,
            title: '💸 Low Balance Alert',
            body: `${args.driver_name} has TZS ${args.balance.toLocaleString()} balance`,
            sound: 'default' as const,
            priority: 'normal' as const,
            data: { type: 'low_balance', driverId: args.driver_id },
        }));

        await sendBulkPushNotifications(notifications);
    },
});

/**
 * Notify admins of large cash trip (fraud monitoring)
 */
export const notifyAdminsLargeCashTrip = internalAction({
    args: {
        admin_tokens: v.array(v.string()),
        fare: v.number(),
        driver_name: v.string(),
        customer_name: v.string(),
        ride_id: v.id("rides"),
    },
    handler: async (ctx, args) => {
        const notifications = args.admin_tokens.map((token) => ({
            to: token,
            title: '💰 Large Cash Trip Alert',
            body: `TZS ${args.fare.toLocaleString()} cash trip by ${args.driver_name}`,
            sound: 'default' as const,
            priority: 'high' as const,
            data: { type: 'large_cash_trip', rideId: args.ride_id },
        }));

        await sendBulkPushNotifications(notifications);
    },
});
