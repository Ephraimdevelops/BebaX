import 'dotenv/config';

export default {
    expo: {
        name: "BebaX",
        slug: "bebax-moving-trucks",
        version: "1.0.0",
        sdkVersion: "54.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        assetBundlePatterns: [
            "**/*"
        ],
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.bebax.movingtrucks",
            infoPlist: {
                NSLocationWhenInUseUsageDescription: "BebaX needs location access to show pickup and dropoff locations",
                NSCameraUsageDescription: "BebaX needs camera access to upload driver documents"
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#FFFFFF"
            },
            package: "com.bebax.logistics",
            permissions: [
                "ACCESS_COARSE_LOCATION",
                "ACCESS_FINE_LOCATION",
                "CAMERA"
            ],
            config: {
                googleMaps: {
                    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
                }
            }
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        plugins: [
            "expo-location",
            "expo-camera",
            "expo-notifications",
            "expo-router"
        ],
        scheme: "bebax",
        extra: {
            convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL || "https://veracious-clownfish-919.convex.cloud",
            clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_bWF4aW11bS1icmVhbS0xMS5jbGVyay5hY2NvdW50cy5kZXYk",
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        }
    }
}
