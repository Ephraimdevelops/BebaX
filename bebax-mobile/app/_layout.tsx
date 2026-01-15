import { Slot, useRouter, useSegments } from "expo-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { tokenCache } from "../src/lib/cache";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from "../src/convex/_generated/api";
import { LocationService } from "../src/services/LocationService";

const convex = new ConvexReactClient(Constants.expoConfig.extra.convexUrl, {
    unsavedChangesWarning: false,
});

function RootLayoutNav() {
    const { isLoaded, isSignedIn } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    // 1. FRESH DATA (Network) - Optimistic Fetch
    // This query is lightweight (only returns status/role)
    const sessionContext = useQuery(api.users.getSessionContext);

    useEffect(() => {
        if (!isLoaded) return;

        const handleLogic = async () => {
            console.log('🚦 [TRAFFIC COP] Running... isSignedIn:', isSignedIn, 'segments:', segments);

            // A. CACHE MANAGEMENT
            if (sessionContext) {
                console.log('📦 [TRAFFIC COP] sessionContext from server:', sessionContext);
                await AsyncStorage.setItem('user_session', JSON.stringify(sessionContext));
            }

            // B. ROUTING CONTEXT: Prefer fresh, fallback to cache
            let activeSession = sessionContext;
            if (!activeSession) {
                try {
                    const cached = await AsyncStorage.getItem('user_session');
                    if (cached) {
                        activeSession = JSON.parse(cached);
                        console.log('📦 [TRAFFIC COP] Using CACHED session:', activeSession);
                    } else {
                        console.log('⚠️ [TRAFFIC COP] No session data (fresh or cached)');
                    }
                } catch (e) { /* Ignore */ }
            }

            // C. ROUTING LOGIC ("The Sorting Hat")
            const inAuthGroup = segments[0] === "(auth)";
            const inDriverGroup = segments[0] === "(driver)";
            const inAdminGroup = segments[0] === "(admin)";
            const inCustomerGroup = segments[0] === "(customer)";
            const inProtectedGroup = inDriverGroup || inAdminGroup || inCustomerGroup;

            console.log('🚦 [TRAFFIC COP] Route context:', { inAuthGroup, inCustomerGroup, inDriverGroup, inAdminGroup });

            if (isSignedIn) {
                console.log('✅ [TRAFFIC COP] User IS signed in');
                // 1. Have we been Sorted? (Profile Check)
                if (!activeSession) {
                    console.log('⚠️ [TRAFFIC COP] Signed in but NO profile -> role-selection');
                    // We are signed in but have NO profile -> Go to Sorting Hat
                    // Allow specific auth routes (like sign-out)
                    const isRoleSelection = segments.length > 1 && segments[1] === 'role-selection';
                    if (!isRoleSelection) {
                        router.replace("/(auth)/role-selection");
                    }
                } else {
                    console.log('✅ [TRAFFIC COP] User has profile, role:', activeSession.role);
                    // 2. We are Sorted. Check Mode & Status
                    const inBusinessGroup = segments[0] === "(business)";
                    const inBusinessRoute = segments[0] === "business"; // For /business/register or /business/status
                    const inCustomerGroup = segments[0] === "(customer)";
                    const isBusiness = !!activeSession.orgId;
                    const orgStatus = activeSession.orgStatus;

                    // A. BUSINESS USER (Has Org ID)
                    if (isBusiness) {
                        if (orgStatus === 'active') {
                            // APPROVED -> Enforce Business Dashboard
                            if (!inBusinessGroup && !inAuthGroup && !inCustomerGroup) {
                                router.replace("/(business)");
                                return;
                            }
                        } else if (orgStatus === 'pending' || orgStatus === 'action_required') {
                            // PENDING/ACTION_REQUIRED -> Block business features, allow customer mode
                            // Only redirect to status if they try to access business dashboard
                            if (inBusinessGroup) {
                                router.replace("/business/status");
                                return;
                            }
                            // Allow /business/status and customer mode
                        } else {
                            // REJECTED/SUSPENDED -> Enforce Consumer Mode
                            if (inBusinessGroup || (inBusinessRoute && segments[1] === 'status')) {
                                router.replace("/(customer)/map");
                                return;
                            }
                        }
                    }

                    // B. CONSUMER USER (No Org ID)
                    else {
                        // Creating a business? Allow /business/register
                        const isRegistering = segments[0] === 'business' && segments[1] === 'register';

                        // If trying to access locked business areas without registering
                        if ((inBusinessGroup || inBusinessRoute) && !isRegistering) {
                            router.replace("/(customer)/map");
                            return;
                        }
                    }

                    // C. DRIVER USER (Has Driver ID) - THE TRI-MODE TRAFFIC COP
                    const isDriver = !!activeSession.driverId;
                    const driverStatus = activeSession.driverStatus;
                    const inDriverRoute = segments[0] === 'driver'; // For /driver/apply or /driver/status

                    if (isDriver) {
                        if (driverStatus === 'active' || activeSession.driverVerified === true) {
                            // APPROVED DRIVER -> Enforce Cockpit (unless already there)
                            if (!inDriverGroup && !inAuthGroup && !inDriverRoute) {
                                // Only redirect if explicitly trying to access driver areas
                                // Allow customers who are also drivers to use customer mode
                            }
                        } else if (driverStatus === 'pending') {
                            // PENDING DRIVER -> Enforce Waiting Room
                            const isStatusPage = segments[0] === 'driver' && segments[1] === 'status';
                            const isApplyPage = segments[0] === 'driver' && segments[1] === 'apply';
                            if (!isStatusPage && !isApplyPage && inDriverGroup) {
                                router.replace("/driver/status");
                                return;
                            }
                        }
                    }
                }
            } else if (inProtectedGroup && segments[0] !== '(customer)') {
                // Not Signed In and in admin/driver area -> Go to map (guest mode)
                router.replace('/');
            }
            // Guest users in (customer) group are allowed - the map has a login button

            // D. HEARTBEAT (Background GPS)
            if (isSignedIn && activeSession?.role === 'driver') {
                // Request permissions and start tracking if valid driver
                const hasPerms = await LocationService.requestPermissions();
                if (hasPerms) {
                    await LocationService.startTracking(false);
                }
            }
        };

        handleLogic();
    }, [isLoaded, isSignedIn, segments, sessionContext]);

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
