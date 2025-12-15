import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/constants/Colors";
import { Truck } from "lucide-react-native";

export default function DriverLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textDim,
                tabBarStyle: {
                    backgroundColor: Colors.background,
                    borderTopColor: Colors.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
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
        </Tabs>
    );
}
