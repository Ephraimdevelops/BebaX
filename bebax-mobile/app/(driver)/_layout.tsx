import { Tabs } from "expo-router";
import { Colors } from "../../src/constants/Colors";
import { Navigation2, Store, ClipboardList, UserCircle } from "lucide-react-native";
import { Platform } from "react-native";

export default function DriverLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: '#6B7280',
                tabBarStyle: {
                    backgroundColor: '#0A0A0A',
                    borderTopColor: '#1F1F1F',
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.3,
                }
            }}
        >
            {/* Main Cockpit - Map-first ride screen */}
            <Tabs.Screen
                name="cockpit"
                options={{
                    title: "Cockpit",
                    tabBarIcon: ({ color, size }) => (
                        <Navigation2 color={color} size={size} />
                    ),
                }}
            />

            {/* Biashara - Business Hub */}
            <Tabs.Screen
                name="opportunities"
                options={{
                    title: "Biashara",
                    tabBarIcon: ({ color, size }) => (
                        <Store color={color} size={size} />
                    ),
                }}
            />

            {/* History - Trip history (now visible) */}
            <Tabs.Screen
                name="history"
                options={{
                    title: "Historia",
                    tabBarIcon: ({ color, size }) => (
                        <ClipboardList color={color} size={size} />
                    ),
                }}
            />

            {/* Profile - Last tab, includes Documents */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profaili",
                    tabBarIcon: ({ color, size }) => (
                        <UserCircle color={color} size={size} />
                    ),
                }}
            />

            {/* Hidden Screens - accessed via navigation, not tabs */}
            <Tabs.Screen name="earnings" options={{ href: null }} />
            <Tabs.Screen name="documents" options={{ href: null }} />
            <Tabs.Screen name="history/[id]" options={{ href: null }} />
            <Tabs.Screen name="vehicle" options={{ href: null }} />
            <Tabs.Screen name="settings" options={{ href: null }} />
        </Tabs>
    );
}
