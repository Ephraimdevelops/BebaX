import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { amount, rideId } = params;
    const [status, setStatus] = useState('processing'); // processing, success, failed

    useEffect(() => {
        // Simulate payment processing
        const timer = setTimeout(() => {
            setStatus('success');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleComplete = () => {
        Alert.alert("Payment Successful", "Thank you for your payment!", [
            { text: "OK", onPress: () => router.replace("/(customer)") }
        ]);
    };

    return (
        <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
            {status === 'processing' ? (
                <View className="items-center">
                    <ActivityIndicator size="large" color="#2563eb" className="mb-4" />
                    <Text className="text-xl font-bold text-gray-800 mb-2">Processing Payment...</Text>
                    <Text className="text-gray-500 text-center">
                        Please check your phone for the M-Pesa/Airtel Money prompt.
                    </Text>
                    <Text className="text-2xl font-bold text-blue-600 mt-6">
                        TZS {Number(amount).toLocaleString()}
                    </Text>
                </View>
            ) : (
                <View className="items-center">
                    <View className="w-24 h-24 bg-green-100 rounded-full justify-center items-center mb-6">
                        <Text className="text-5xl">✅</Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</Text>
                    <Text className="text-gray-500 text-center mb-8">
                        Your payment of TZS {Number(amount).toLocaleString()} has been received.
                    </Text>

                    <TouchableOpacity
                        onPress={handleComplete}
                        className="bg-blue-600 w-full py-4 rounded-xl px-12"
                    >
                        <Text className="text-white text-center font-bold text-lg">Done</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}
