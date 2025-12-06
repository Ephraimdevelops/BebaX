import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import ngeohash from 'ngeohash';

export const useDriverLocation = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const updateLocation = useMutation(api.drivers.updateLocation);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            // Initial location
            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
            await sendLocationUpdate(currentLocation);

            // Watch position
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 10000, // Update every 10 seconds
                    distanceInterval: 50, // Or every 50 meters
                },
                (newLocation) => {
                    setLocation(newLocation);
                    sendLocationUpdate(newLocation);
                }
            );
        })();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, []);

    const sendLocationUpdate = async (loc: Location.LocationObject) => {
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
            console.error("Failed to update location:", error);
        }
    };

    return { location, errorMsg };
};
