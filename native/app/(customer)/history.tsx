import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function CustomerHistory() {
    const router = useRouter();
    const rides = useQuery(api.rides.listMyRides) || [];

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-200">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Text className="text-2xl">←</Text>
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold">Ride History</Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                {rides.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Text className="text-6xl mb-4">📦</Text>
                        <Text className="text-gray-500 text-lg">No rides yet</Text>
                        <Text className="text-gray-400 text-sm">Your ride history will appear here</Text>
                    </View>
                ) : (
                    rides.map((ride) => (
                        <View key={ride._id} className="bg-white p-4 rounded-xl mb-3 shadow-sm">
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-500 mb-1">
                                        {new Date(ride._creationTime).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                    <Text className="font-bold text-lg text-gray-800 capitalize">
                                        {ride.vehicle_type}
                                    </Text>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${ride.status === 'completed' ? 'bg-green-100' :
                                    ride.status === 'cancelled' ? 'bg-red-100' : 'bg-yellow-100'
                                    }`}>
                                    <Text className={`text-xs font-medium ${ride.status === 'completed' ? 'text-green-700' :
                                        ride.status === 'cancelled' ? 'text-red-700' : 'text-yellow-700'
                                        }`}>
                                        {ride.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <View className="mb-3">
                                <Text className="text-gray-600 text-sm mb-1">
                                    📍 {ride.pickup_location.address}
                                </Text>
                                <Text className="text-gray-600 text-sm">
                                    🏁 {ride.dropoff_location.address}
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                                <View>
                                    {ride.final_fare ? (
                                        <Text className="font-bold text-bebax-green">
                                            TSh {ride.final_fare.toLocaleString()}
                                        </Text>
                                    ) : ride.fare_estimate ? (
                                        <Text className="font-bold text-gray-600">
                                            TSh {ride.fare_estimate.toLocaleString()}
                                        </Text>
                                    ) : (
                                        <Text className="text-gray-500">-</Text>
                                    )}
                                </View>
                                {ride.driver_rating && (
                                    <View className="flex-row items-center">
                                        <Text className="text-yellow-500 mr-1">⭐</Text>
                                        <Text className="font-medium text-gray-700">{ride.driver_rating}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
