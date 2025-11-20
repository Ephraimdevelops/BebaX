import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, ArrowRight } from "lucide-react-native";

export default function SignInScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const onSignInPress = async () => {
        if (!isLoaded) return;
        setIsLoading(true);

        try {
            const completeSignIn = await signIn.create({
                identifier: emailAddress,
                password,
            });
            await setActive({ session: completeSignIn.createdSessionId });
            router.replace("/");
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            alert(err.errors[0]?.message || "Failed to sign in");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-surface">
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                        <View className="p-6 flex-1 justify-center">
                            {/* Header */}
                            <View className="items-center mb-10">
                                <View className="w-20 h-20 bg-primary rounded-3xl justify-center items-center shadow-lg shadow-blue-900/20 mb-6 -rotate-3">
                                    <Text className="text-4xl font-black text-white">B</Text>
                                </View>
                                <Text className="text-3xl font-bold text-text-primary mb-2">Welcome Back</Text>
                                <Text className="text-text-secondary text-center px-8">
                                    Sign in to continue managing your logistics and rides.
                                </Text>
                            </View>

                            <View className="space-y-5">
                                <View>
                                    <Text className="text-text-secondary text-xs font-bold uppercase mb-2 ml-1">Email Address</Text>
                                    <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3.5 focus:border-primary focus:bg-blue-50/50 transition-all">
                                        <Mail size={20} color="#64748B" className="mr-3" />
                                        <TextInput
                                            autoCapitalize="none"
                                            value={emailAddress}
                                            placeholder="name@example.com"
                                            placeholderTextColor="#94a3b8"
                                            onChangeText={(email) => setEmailAddress(email)}
                                            className="flex-1 text-text-primary font-medium text-base"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-text-secondary text-xs font-bold uppercase mb-2 ml-1">Password</Text>
                                    <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3.5 focus:border-primary focus:bg-blue-50/50 transition-all">
                                        <Lock size={20} color="#64748B" className="mr-3" />
                                        <TextInput
                                            value={password}
                                            placeholder="Enter your password"
                                            placeholderTextColor="#94a3b8"
                                            secureTextEntry={true}
                                            onChangeText={(password) => setPassword(password)}
                                            className="flex-1 text-text-primary font-medium text-base"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={onSignInPress}
                                    disabled={isLoading}
                                    className="w-full bg-primary py-4 rounded-2xl shadow-lg shadow-blue-900/20 mt-4 flex-row justify-center items-center"
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text className="text-white font-bold text-lg mr-2">Sign In</Text>
                                            <ArrowRight size={20} color="white" />
                                        </>
                                    )}
                                </TouchableOpacity>

                                <View className="flex-row justify-center mt-6">
                                    <Text className="text-gray-600 text-center">
                                        Don&apos;t have an account?{" "}
                                        <Link href="/sign-up" className="text-blue-600 font-bold">
                                            Sign Up
                                        </Link>
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
