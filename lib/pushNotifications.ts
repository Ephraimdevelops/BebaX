import { Expo, ExpoPushMessage } from 'expo-server-sdk';

/**
 * Push Notification Service for BebaX
 * Sends notifications to customers and drivers via Expo Push
 */

const expo = new Expo();

export interface PushNotification {
    to: string; // Expo push token
    title: string;
    body: string;
    data?: any;
    sound?: 'default' | null;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
}

/**
 * Send a push notification
 */
export async function sendPushNotification(notification: PushNotification): Promise<void> {
    // Check that the token is valid
    if (!Expo.isExpoPushToken(notification.to)) {
        console.error(`Push token ${notification.to} is not a valid Expo push token`);
        return;
    }

    const message: ExpoPushMessage = {
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
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

/**
 * Send notifications to multiple recipients
 */
export async function sendBulkPushNotifications(
    notifications: PushNotification[]
): Promise<void> {
    const messages: ExpoPushMessage[] = notifications
        .filter((n) => Expo.isExpoPushToken(n.to))
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
    } catch (error) {
        console.error('Error sending bulk push notifications:', error);
    }
}

/**
 * Notification templates for BebaX
 */
export const NotificationTemplates = {
    newRideRequest: (distance: number, fare: number, vehicleType: string) => ({
        title: '🚚 New Ride Request!',
        body: `${vehicleType} needed - ${distance.toFixed(1)}km - ${fare.toLocaleString()} TZS`,
        sound: 'default' as const,
        priority: 'high' as const,
    }),

    rideAccepted: (driverName: string) => ({
        title: '✅ Driver Found!',
        body: `${driverName} accepted your ride. They're on the way!`,
        sound: 'default' as const,
        priority: 'high' as const,
    }),

    driverArrived: () => ({
        title: '📍 Driver Arrived',
        body: 'Your driver has arrived at the pickup location',
        sound: 'default' as const,
        priority: 'high' as const,
    }),

    tripStarted: () => ({
        title: '🚀 Trip Started',
        body: 'Your items are on the way to the destination',
        sound: 'default' as const,
        priority: 'normal' as const,
    }),

    tripCompleted: (fare: number) => ({
        title: '✅ Trip Completed',
        body: `Delivered successfully! Fare: ${fare.toLocaleString()} TZS`,
        sound: 'default' as const,
        priority: 'normal' as const,
    }),

    driverVerified: () => ({
        title: '🎉 Account Approved!',
        body: 'Your driver account has been verified. You can now go online and accept rides!',
        sound: 'default' as const,
        priority: 'high' as const,
    }),

    driverRejected: (reason: string) => ({
        title: '❌ Verification Failed',
        body: `Your application was rejected: ${reason}`,
        sound: 'default' as const,
        priority: 'high' as const,
    }),
};
