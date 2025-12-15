import { Redirect } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../src/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Colors } from "../src/constants/Colors";

export default function Index() {
    const { isLoaded, isSignedIn } = useAuth();
    const userData = useQuery(api.users.getMyself);

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

    // If signed in, redirect based on role
    if (isSignedIn && userData) {
        if (userData.role === "driver") {
            return <Redirect href="/(driver)/cockpit" />;
        }
        if (userData.role === "admin") {
            return <Redirect href="/(admin)/home" />;
        }
    }

    // DEFAULT: Let everyone (guest or customer) see the customer dashboard
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
