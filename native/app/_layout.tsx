import "../global.css";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { registerForPushNotificationsAsync } from "../utils/pushNotifications";
import { api } from "../../convex/_generated/api";
import * as SecureStore from "expo-secure-store"; // Keep SecureStore for tokenCache
import { StatusBar } from "expo-status-bar"; // Keep StatusBar
import { View } from "react-native";
// import { OfflineBanner } from "../components/OfflineBanner"; // TODO: Re-enable after fixing template dependencies

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL!;
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const savePushToken = useMutation(api.users.savePushToken);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(customer)" || segments[0] === "(driver)";

    if (isSignedIn && !inAuthGroup) {
      // Redirect to role selection or dashboard if already has role
      // For now, we let the index page handle role check
    } else if (!isSignedIn && inAuthGroup) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, segments]);

  // Register for push notifications when signed in
  useEffect(() => {
    if (isSignedIn) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          savePushToken({ token });
        }
      });
    }
  }, [isSignedIn]);

  // ...

  return (
    <View className="flex-1">
      {/* <OfflineBanner /> */} {/* TODO: Re-enable offline detection */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
