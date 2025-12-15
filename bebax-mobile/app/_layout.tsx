import { Slot, useRouter, useSegments } from "expo-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import Constants from "expo-constants";
import { useEffect } from "react";
import { tokenCache } from "../src/lib/cache";

const convex = new ConvexReactClient(Constants.expoConfig.extra.convexUrl, {
    unsavedChangesWarning: false,
});

function RootLayoutNav() {
    const { isLoaded, isSignedIn } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inDriverGroup = segments[0] === "(driver)";
        const inAdminGroup = segments[0] === "(admin)";

        // If signed in and trying to access auth pages, go to home
        if (isSignedIn && inAuthGroup) {
            router.replace("/");
        }

        // Protect driver and admin routes - redirect to auth if not signed in
        if (!isSignedIn && (inDriverGroup || inAdminGroup)) {
            router.replace("/(auth)/welcome");
        }

        // NOTE: Customer routes are now OPEN to guests!
        // Auth check happens when they try to book.

    }, [isLoaded, isSignedIn, segments]);

    return <Slot />;
}

export default function RootLayout() {
    return (
        <ClerkProvider
            publishableKey={Constants.expoConfig.extra.clerkPublishableKey}
            tokenCache={tokenCache}
        >
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <RootLayoutNav />
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
