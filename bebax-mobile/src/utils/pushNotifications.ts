import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Register for push notifications and return the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token: string | undefined;

    // Android notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'BebaX Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF5722', // Safety Orange
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission not granted');
            return;
        }

        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            if (!projectId) {
                console.warn('EAS Project ID not found');
            }

            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;

            console.log('Push Token:', token);
        } catch (e) {
            console.error('Error getting push token:', e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

/**
 * Listen for incoming notifications
 */
export function addNotificationListener(
    callback: (notification: Notifications.Notification) => void
) {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listen for notification responses (user tapped notification)
 */
export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}
