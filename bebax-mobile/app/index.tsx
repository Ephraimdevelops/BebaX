import { Redirect } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../src/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Colors } from "../src/constants/Colors";
import { useEffect, useState } from "react";

// ===== THE TRAFFIC COP =====
// Routes users based on role and ensures profile exists

export default function Index() {
    const { isLoaded, isSignedIn } = useAuth();
    const [syncComplete, setSyncComplete] = useState(false);

    // The Bouncer - ensures profile exists (doesn't overwrite existing roles!)
    const syncUser = useMutation(api.users.syncUser);

    // Get user data 
    const userData = useQuery(
        api.users.getMyself,
        isSignedIn ? {} : "skip"
    );

    // Sync user profile when signed in (only if no profile exists)
    useEffect(() => {
        const doSync = async () => {
            // Only create profile if signed in, sync not done, AND we know profile doesn't exist
            // This prevents overwriting driver profiles created during signup
            if (isSignedIn && !syncComplete && userData !== undefined) {
                if (userData?.profile === null) {
                    try {
                        console.log("🔄 Creating new user profile via syncUser...");
                        await syncUser({});
                    } catch (error) {
                        console.error("Sync failed:", error);
                    }
                }
                setSyncComplete(true);
            }
        };
        doSync();
    }, [isSignedIn, syncComplete, userData]);

    // Show loading while Clerk initializes
    if (!isLoaded) {
        return (
            <View style={styles.container}>
                <Text style={styles.logoText}>BebaX</Text>
                <Text style={styles.tagline}>INDUSTRIAL LOGISTICS</Text>
                <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 20 }} />
            </View>
        );
    }

    // Not signed in - go to welcome/auth
    if (!isSignedIn) {
        return <Redirect href="/(auth)/welcome" />;
    }

    // Waiting for sync or data
    if (!syncComplete || userData === undefined) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.tagline}>LOADING...</Text>
            </View>
        );
    }

    // ===== THE TRAFFIC COP ROUTING =====
    const profile = userData?.profile;

    // Debug log
    console.log("🚦 Traffic Cop - Email:", profile?.email);
    console.log("🚦 Traffic Cop - Role:", profile?.role);

    // If profile exists, route based on role
    if (profile) {
        // Driver → Cockpit
        if (profile.role === "driver") {
            console.log("🚛 Redirecting to Driver Cockpit");
            return <Redirect href="/(driver)/cockpit" />;
        }

        // Admin → Admin Home
        if (profile.role === "admin") {
            console.log("🔑 Redirecting to Admin Home");
            return <Redirect href="/(admin)/home" />;
        }

        // Customer without phone → Force profile edit
        if (profile.role === "customer" && (!profile.phone || profile.phone === "")) {
            return <Redirect href="/(customer)/profile?edit=true" />;
        }
    }

    // DEFAULT: Customer dashboard
    console.log("👤 Redirecting to Customer Dashboard");
    return <Redirect href="/(customer)/dashboard" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    logoText: {
        fontSize: 48,
        fontWeight: "900",
        color: Colors.primary,
        letterSpacing: -1,
    },
    tagline: {
        color: Colors.textDim,
        marginTop: 10,
        fontSize: 14,
        letterSpacing: 3,
        fontWeight: '700',
    }
});
