import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function DriverWallet() {
    const router = useRouter();
    const driver = useQuery(api.drivers.getCurrentDriver);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const handleWithdraw = () => {
        if (!driver || driver.wallet_balance <= 0) {
            Alert.alert("Insufficient Funds", "You have no funds to withdraw.");
            return;
        }

        setIsWithdrawing(true);
        // Simulate API call
        setTimeout(() => {
            setIsWithdrawing(false);
            Alert.alert(
                "Withdrawal Request Sent",
                `Your request to withdraw TZS ${driver.wallet_balance.toLocaleString()} has been received. It will be processed within 24 hours.`
            );
        }, 2000);
    };

    if (!driver) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-bold">My Wallet</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Balance Card */}
                <View className="bg-blue-600 p-6 rounded-2xl shadow-lg mb-6">
                    <Text className="text-blue-100 text-sm font-medium mb-1">Available Balance</Text>
                    <Text className="text-white text-4xl font-bold mb-4">
                        TZS {driver.wallet_balance?.toLocaleString() || "0"}
                    </Text>
                    <View className="flex-row justify-between items-center bg-blue-500/30 p-3 rounded-xl">
                        <Text className="text-white">Total Earnings</Text>
                        <Text className="text-white font-bold">
                            TZS {driver.total_earnings?.toLocaleString() || "0"}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-4 mb-8">
                    <TouchableOpacity
                        onPress={handleWithdraw}
                        disabled={isWithdrawing}
                        className="flex-1 bg-white p-4 rounded-xl shadow-sm items-center justify-center border border-gray-100"
                    >
                        {isWithdrawing ? (
                            <ActivityIndicator color="#2563eb" />
                        ) : (
                            <>
                                <Text className="text-2xl mb-2">💸</Text>
                                <Text className="font-bold text-gray-800">Withdraw</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <View className="flex-1 bg-white p-4 rounded-xl shadow-sm items-center justify-center border border-gray-100 opacity-50">
                        <Text className="text-2xl mb-2">🏦</Text>
                        <Text className="font-bold text-gray-800">Bank Details</Text>
                    </View>
                </View>

                {/* Recent Transactions (Mock) */}
                <Text className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</Text>
                <View className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {[1, 2, 3].map((i) => (
                        <View key={i} className="p-4 border-b border-gray-100 flex-row justify-between items-center">
                            <View>
                                <Text className="font-bold text-gray-800">Ride Payment</Text>
                                <Text className="text-gray-500 text-xs">Today, 10:30 AM</Text>
                            </View>
                            <Text className="font-bold text-green-600">+ TZS 15,000</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
