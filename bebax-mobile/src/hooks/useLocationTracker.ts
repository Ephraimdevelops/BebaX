import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

// ============================================
// BEBAX BACKGROUND LOCATION TRACKER
// "Always On" GPS for Online Drivers
// ============================================

const LOCATION_TASK_NAME = 'BEBAX_LOCATION_TRACKER';
const UPDATE_INTERVAL_MS = 30000; // 30 seconds
const DISTANCE_THRESHOLD_M = 50; // 50 meters

// Store for background location data
let backgroundLocationCallback: ((location: Location.LocationObject) => void) | null = null;

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('Location task error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const location = locations[0];

        if (location && backgroundLocationCallback) {
            backgroundLocationCallback(location);
        }

        // Also store for when app comes to foreground
        console.log('📍 Background location:', location?.coords?.latitude, location?.coords?.longitude);
    }
});

/**
 * Custom hook for driver location tracking
 * Handles both foreground and background tracking
 */
export function useLocationTracker(isOnline: boolean) {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
    const [isTracking, setIsTracking] = useState(false);
    const watchRef = useRef<Location.LocationSubscription | null>(null);

    // Convex mutation to update driver location
    const updateDriverLocation = useMutation(api.drivers.updateLocation);

    // Request permissions
    const requestPermissions = async () => {
        // First, request foreground permission
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

        if (foregroundStatus !== 'granted') {
            console.warn('⚠️ Foreground location permission denied');
            setPermissionStatus('denied');
            return false;
        }

        // Then, request background permission (critical for logistics)
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus !== 'granted') {
            console.warn('⚠️ Background location permission denied - tracking will stop when app is minimized');
            setPermissionStatus('foreground_only');
        } else {
            setPermissionStatus('granted');
        }

        return foregroundStatus === 'granted';
    };

    // Start tracking
    const startTracking = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        // Start foreground tracking
        watchRef.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: UPDATE_INTERVAL_MS,
                distanceInterval: DISTANCE_THRESHOLD_M,
            },
            (newLocation) => {
                setLocation(newLocation);

                // Send to backend
                updateDriverLocation({
                    lat: newLocation.coords.latitude,
                    lng: newLocation.coords.longitude,
                }).catch(console.error);
            }
        );

        // Start background tracking if permission granted
        if (permissionStatus === 'granted') {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: UPDATE_INTERVAL_MS,
                distanceInterval: DISTANCE_THRESHOLD_M,
                deferredUpdatesInterval: UPDATE_INTERVAL_MS,
                showsBackgroundLocationIndicator: true, // iOS: Show blue bar
                foregroundService: {
                    notificationTitle: 'BebaX Driver Active',
                    notificationBody: 'Tracking your location for ride requests',
                    notificationColor: '#FF6B35',
                },
            });

            // Set callback for background updates
            backgroundLocationCallback = (newLocation) => {
                updateDriverLocation({
                    lat: newLocation.coords.latitude,
                    lng: newLocation.coords.longitude,
                }).catch(console.error);
            };
        }

        setIsTracking(true);
        console.log('🚀 Location tracking started');
    };

    // Stop tracking
    const stopTracking = async () => {
        // Stop foreground watch
        if (watchRef.current) {
            watchRef.current.remove();
            watchRef.current = null;
        }

        // Stop background tracking
        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (isRegistered) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }

        backgroundLocationCallback = null;
        setIsTracking(false);
        console.log('🛑 Location tracking stopped');
    };

    // Auto-start/stop based on online status
    useEffect(() => {
        if (isOnline && !isTracking) {
            startTracking();
        } else if (!isOnline && isTracking) {
            stopTracking();
        }

        // Cleanup on unmount
        return () => {
            stopTracking();
        };
    }, [isOnline]);

    // Get current location once
    const getCurrentLocation = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;

        const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);
        return currentLocation;
    };

    return {
        location,
        permissionStatus,
        isTracking,
        startTracking,
        stopTracking,
        getCurrentLocation,
    };
}

/**
 * Check if background location is supported
 */
export async function isBackgroundLocationAvailable(): Promise<boolean> {
    return await Location.isBackgroundLocationAvailableAsync();
}

/**
 * Check if location task is currently running
 */
export async function isLocationTaskRunning(): Promise<boolean> {
    return await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
}
