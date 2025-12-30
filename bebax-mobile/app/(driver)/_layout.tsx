import { Tabs } from "expo-router";
import { Colors } from "../../src/constants/Colors";
import { Truck, Wallet, FileText, User, Briefcase } from "lucide-react-native";

export default function DriverLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textDim,
                tabBarStyle: {
                    backgroundColor: '#121212',
                    borderTopColor: '#333',
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                }
            }}
        >
            <Tabs.Screen
                name="cockpit"
                options={{
                    title: "Cockpit",
                    tabBarIcon: ({ color, size }) => (
                        <Truck color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="opportunities"
                options={{
                    title: "Biashara",
                    tabBarIcon: ({ color, size }) => (
                        <Briefcase color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: "Mapato",
                    tabBarIcon: ({ color, size }) => (
                        <Wallet color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "Safari",
                    tabBarIcon: ({ color, size }) => (
                        <FileText color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <User color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}

