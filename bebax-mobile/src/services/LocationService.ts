import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'BEBAX_LOCATION_TRACKER';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        // Error occurred - check `error.message` for more details.
        console.error("Location task error:", error);
        return;
    }
    if (data) {
        const { locations } = data as any;
        // console.log('[Background Location]', locations);
        // TODO: Send to Convex backend (driver_location_updates)
    }
});

export const LocationService = {
    requestPermissions: async () => {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') return false;

        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        return bgStatus === 'granted';
    },

    startTracking: async (onTrip: boolean = false) => {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (hasStarted) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }

        console.log(`Starting location tracking. On Trip: ${onTrip}`);

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: onTrip ? 10000 : 60000, // 10s vs 60s
            distanceInterval: onTrip ? 50 : 300, // 50m vs 300m
            foregroundService: {
                notificationTitle: "BebaX Driver",
                notificationBody: onTrip ? "Tracking your trip..." : "You are online",
                notificationColor: "#2563EB",
            },
            pausesUpdatesAutomatically: false,
            showsBackgroundLocationIndicator: true, // iOS
        });
    },

    stopTracking: async () => {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (hasStarted) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            console.log("Stopped location tracking");
        }
    }
};
