import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import ngeohash from 'ngeohash';

interface LocationState {
    location: Location.LocationObject | null;
    errorMsg: string | null;
}

/**
 * Hook for tracking driver location and syncing to Convex
 * Updates every 10 seconds or 50 meters
 */
export const useDriverLocation = () => {
    const [state, setState] = useState<LocationState>({
        location: null,
        errorMsg: null,
    });

    const updateLocation = useMutation(api.drivers.updateLocation);

    const sendLocationUpdate = useCallback(async (loc: Location.LocationObject) => {
        try {
            const { latitude, longitude } = loc.coords;
            const hash = ngeohash.encode(latitude, longitude);

            await updateLocation({
                location: {
                    lat: latitude,
                    lng: longitude,
                    geohash: hash,
                },
            });
        } catch (error) {
            console.error('Failed to update location:', error);
        }
    }, [updateLocation]);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setState(prev => ({ ...prev, errorMsg: 'Location permission denied' }));
                return;
            }

            // Get initial location
            const currentLocation = await Location.getCurrentPositionAsync({});
            setState(prev => ({ ...prev, location: currentLocation }));
            await sendLocationUpdate(currentLocation);

            // Watch position changes
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 10000, // Every 10 seconds
                    distanceInterval: 50, // Or every 50 meters
                },
                (newLocation) => {
                    setState(prev => ({ ...prev, location: newLocation }));
                    sendLocationUpdate(newLocation);
                }
            );
        })();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [sendLocationUpdate]);

    return state;
};
