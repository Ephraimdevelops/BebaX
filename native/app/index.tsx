import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";

export default function LandingScreen() {
    const { isSignedIn } = useAuth();
    const router = useRouter();

    if (isSignedIn) {
        // Redirect will be handled by _layout.tsx
        return null;
    }

    return (
        <View className="flex-1 bg-slate-900">
            <ImageBackground
                source={{ uri: "https://images.unsplash.com/photo-1605218427360-6961d3748c28?q=80&w=2670&auto=format&fit=crop" }}
                className="flex-1"
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['transparent', 'rgba(15, 23, 42, 0.9)', '#0f172a']}
                    className="flex-1 justify-end pb-12 px-6"
                >
                    <SafeAreaView>
                        <View className="mb-8">
                            <View className="bg-blue-600 self-start px-4 py-1 rounded-full mb-4">
                                <Text className="text-white font-bold text-xs tracking-wider uppercase">
                                    Logistics Evolved
                                </Text>
                            </View>
                            <Text className="text-5xl font-extrabold text-white mb-2 leading-tight">
                                Beba<Text className="text-blue-500">X</Text>
                            </Text>
                            <Text className="text-xl text-gray-300 font-medium">
                                Move anything, anywhere.
                            </Text>
                            <Text className="text-gray-400 mt-4 leading-6">
                                Connect with reliable drivers for all your cargo needs.
                                From small parcels to heavy freight, we've got you covered.
                            </Text>
                        </View>

                        <View className="space-y-4">
                            <Link href="/sign-in" asChild>
                                <TouchableOpacity className="bg-blue-600 py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-blue-900/50">
                                    <Text className="text-white font-bold text-lg mr-2">Get Started</Text>
                                    <ArrowRight size={20} color="white" />
                                </TouchableOpacity>
                            </Link>

                            <Link href="/sign-up" asChild>
                                <TouchableOpacity className="bg-white/10 py-4 rounded-2xl flex-row justify-center items-center border border-white/20 backdrop-blur-sm">
                                    <Text className="text-white font-bold text-lg">Create Account</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                        <View className="mt-8 flex-row justify-center">
                            <Text className="text-gray-500 text-xs">
                                By continuing, you agree to our Terms & Privacy Policy
                            </Text>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}
