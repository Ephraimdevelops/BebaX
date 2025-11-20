"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplates = void 0;
exports.sendPushNotification = sendPushNotification;
exports.sendBulkPushNotifications = sendBulkPushNotifications;
const expo_server_sdk_1 = require("expo-server-sdk");
/**
 * Push Notification Service for BebaX
 * Sends notifications to customers and drivers via Expo Push
 */
const expo = new expo_server_sdk_1.Expo();
/**
 * Send a push notification
 */
async function sendPushNotification(notification) {
    // Check that the token is valid
    if (!expo_server_sdk_1.Expo.isExpoPushToken(notification.to)) {
        console.error(`Push token ${notification.to} is not a valid Expo push token`);
        return;
    }
    const message = {
        to: notification.to,
        sound: notification.sound || 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: notification.badge,
        priority: notification.priority || 'high',
    };
    try {
        const chunks = expo.chunkPushNotifications([message]);
        const tickets = [];
        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }
        console.log('Push notification sent:', tickets);
    }
    catch (error) {
        console.error('Error sending push notification:', error);
    }
}
/**
 * Send notifications to multiple recipients
 */
async function sendBulkPushNotifications(notifications) {
    const messages = notifications
        .filter((n) => expo_server_sdk_1.Expo.isExpoPushToken(n.to))
        .map((n) => ({
        to: n.to,
        sound: n.sound || 'default',
        title: n.title,
        body: n.body,
        data: n.data,
        badge: n.badge,
        priority: n.priority || 'high',
    }));
    if (messages.length === 0) {
        console.log('No valid push tokens to send to');
        return;
    }
    try {
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }
        console.log(`Sent ${messages.length} push notifications`);
    }
    catch (error) {
        console.error('Error sending bulk push notifications:', error);
    }
}
/**
 * Notification templates for BebaX
 */
exports.NotificationTemplates = {
    newRideRequest: (distance, fare, vehicleType) => ({
        title: '🚚 New Ride Request!',
        body: `${vehicleType} needed - ${distance.toFixed(1)}km - ${fare.toLocaleString()} TZS`,
        sound: 'default',
        priority: 'high',
    }),
    rideAccepted: (driverName) => ({
        title: '✅ Driver Found!',
        body: `${driverName} accepted your ride. They're on the way!`,
        sound: 'default',
        priority: 'high',
    }),
    driverArrived: () => ({
        title: '📍 Driver Arrived',
        body: 'Your driver has arrived at the pickup location',
        sound: 'default',
        priority: 'high',
    }),
    tripStarted: () => ({
        title: '🚀 Trip Started',
        body: 'Your items are on the way to the destination',
        sound: 'default',
        priority: 'normal',
    }),
    tripCompleted: (fare) => ({
        title: '✅ Trip Completed',
        body: `Delivered successfully! Fare: ${fare.toLocaleString()} TZS`,
        sound: 'default',
        priority: 'normal',
    }),
    driverVerified: () => ({
        title: '🎉 Account Approved!',
        body: 'Your driver account has been verified. You can now go online and accept rides!',
        sound: 'default',
        priority: 'high',
    }),
    driverRejected: (reason) => ({
        title: '❌ Verification Failed',
        body: `Your application was rejected: ${reason}`,
        sound: 'default',
        priority: 'high',
    }),
};
