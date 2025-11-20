import * as React from "react";
import { Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, CheckCircle, ArrowRight, ChevronLeft } from "lucide-react-native";

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [pendingVerification, setPendingVerification] = React.useState(false);
    const [code, setCode] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const onSignUpPress = async () => {
        if (!isLoaded) return;
        setIsLoading(true);

        try {
            await signUp.create({
                emailAddress,
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

            setPendingVerification(true);
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            alert(err.errors[0]?.message || "An error occurred during sign up.");
        } finally {
            setIsLoading(false);
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) return;
        setIsLoading(true);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            await setActive({ session: completeSignUp.createdSessionId });
            router.replace("/");
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            alert(err.errors[0]?.message || "Verification failed.");
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
                                <View className="w-20 h-20 bg-primary rounded-3xl justify-center items-center shadow-lg shadow-blue-900/20 mb-6 rotate-3">
                                    <Text className="text-4xl font-black text-white">B</Text>
                                </View>
                                <Text className="text-3xl font-bold text-text-primary mb-2">
                                    {!pendingVerification ? "Create Account" : "Verify Email"}
                                </Text>
                                <Text className="text-text-secondary text-center px-8">
                                    {!pendingVerification
                                        ? "Join BebaX today and experience the future of logistics."
                                        : `We've sent a verification code to ${emailAddress}`}
                                </Text>
                            </View>

                            {!pendingVerification ? (
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
                                                placeholder="Create a password"
                                                placeholderTextColor="#94a3b8"
                                                secureTextEntry={true}
                                                onChangeText={(password) => setPassword(password)}
                                                className="flex-1 text-text-primary font-medium text-base"
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={onSignUpPress}
                                        disabled={isLoading}
                                        className="w-full bg-primary py-4 rounded-2xl shadow-lg shadow-blue-900/20 mt-4 flex-row justify-center items-center"
                                    >
                                        {isLoading ? (
                                            <Text className="text-white font-bold text-lg">Creating Account...</Text>
                                        ) : (
                                            <>
                                                <Text className="text-white font-bold text-lg mr-2">Sign Up</Text>
                                                <ArrowRight size={20} color="white" />
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <View className="flex-row justify-center mt-6">
                                        <Text className="text-text-secondary">Already have an account? </Text>
                                        <TouchableOpacity onPress={() => router.push("/sign-in")}>
                                            <Text className="text-primary font-bold">Sign In</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View className="space-y-6">
                                    <View>
                                        <Text className="text-text-secondary text-xs font-bold uppercase mb-2 ml-1">Verification Code</Text>
                                        <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3.5 focus:border-primary focus:bg-blue-50/50 transition-all">
                                            <CheckCircle size={20} color="#64748B" className="mr-3" />
                                            <TextInput
                                                value={code}
                                                placeholder="Enter 6-digit code"
                                                placeholderTextColor="#94a3b8"
                                                onChangeText={(code) => setCode(code)}
                                                className="flex-1 text-text-primary font-medium text-base"
                                                keyboardType="number-pad"
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={onPressVerify}
                                        disabled={isLoading}
                                        className="w-full bg-primary py-4 rounded-2xl shadow-lg shadow-blue-900/20 mt-2"
                                    >
                                        <Text className="text-white text-center font-bold text-lg">
                                            {isLoading ? "Verifying..." : "Verify Email"}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setPendingVerification(false)}
                                        className="py-2"
                                    >
                                        <Text className="text-text-secondary text-center">Change Email</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
