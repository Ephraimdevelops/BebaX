import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================
// BEBAX PUSH NOTIFICATIONS
// "Wake Up" System for Driver Alerts
// ============================================

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Channel IDs
export const CHANNELS = {
    RIDE_REQUEST: 'ride-request',
    RIDE_UPDATE: 'ride-update',
    GENERAL: 'general',
};

/**
 * Initialize notification channels (Android only)
 * Call this on app startup
 */
export async function initializeNotifications() {
    if (Platform.OS === 'android') {
        // Ride Request Channel - MAX importance for aggressive alerts
        await Notifications.setNotificationChannelAsync(CHANNELS.RIDE_REQUEST, {
            name: 'Ride Requests',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250], // Aggressive vibration
            lightColor: '#FF6B35',
            sound: 'default',
            enableVibrate: true,
            enableLights: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true, // Bypass Do Not Disturb for urgent ride requests
        });

        // Ride Update Channel - HIGH importance
        await Notifications.setNotificationChannelAsync(CHANNELS.RIDE_UPDATE, {
            name: 'Ride Updates',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 100, 100, 100],
            lightColor: '#00D4AA',
            sound: 'default',
        });

        // General Channel - DEFAULT importance
        await Notifications.setNotificationChannelAsync(CHANNELS.GENERAL, {
            name: 'General',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'default',
        });
    }
}

/**
 * Request notification permissions
 * Returns true if permissions granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permissions not granted');
        return false;
    }

    return true;
}

/**
 * Get Expo push token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        if (!projectId) {
            console.warn('⚠️ No EAS projectId found');
            return null;
        }

        const token = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        return token.data;
    } catch (error) {
        console.error('Failed to get push token:', error);
        return null;
    }
}

/**
 * Send local notification for ride request (for testing/demo)
 */
export async function sendRideRequestNotification(params: {
    rideId: string;
    pickupAddress: string;
    fare: number;
    vehicleType: string;
}) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🚛 New Ride Request!',
            body: `${params.vehicleType.toUpperCase()} to ${params.pickupAddress}\nTZS ${params.fare.toLocaleString()}`,
            data: { rideId: params.rideId, type: 'ride_request' },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null, // Immediately
    });
}

/**
 * Send ride status update notification
 */
export async function sendRideUpdateNotification(params: {
    rideId: string;
    status: string;
    message: string;
}) {
    const statusEmoji: Record<string, string> = {
        accepted: '✅',
        loading: '📦',
        ongoing: '🚛',
        delivered: '📍',
        completed: '🎉',
        cancelled: '❌',
    };

    await Notifications.scheduleNotificationAsync({
        content: {
            title: `${statusEmoji[params.status] || '📢'} ${params.message}`,
            body: `Ride ${params.rideId.slice(-6)}`,
            data: { rideId: params.rideId, type: 'ride_update', status: params.status },
        },
        trigger: null,
    });
}

/**
 * Handle notification received - called when notification arrives
 */
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
) {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification response - called when user taps notification
 */
export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
}
