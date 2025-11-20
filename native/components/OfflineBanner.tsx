import React, { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaView } from 'react-native-safe-area-context';

export function OfflineBanner() {
    const [isConnected, setIsConnected] = useState(true);
    const [height] = useState(new Animated.Value(0));

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const offline = state.isConnected === false;
            setIsConnected(!offline);

            Animated.timing(height, {
                toValue: offline ? 40 : 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        });

        return () => unsubscribe();
    }, []);

    if (isConnected) return null;

    return (
        <Animated.View style={{ height, backgroundColor: '#374151' }} className="w-full overflow-hidden">
            <SafeAreaView edges={['top']} className="bg-gray-700">
                <View className="h-10 justify-center items-center bg-gray-700">
                    <Text className="text-white font-medium text-xs">
                        You are currently offline. Changes will sync when you reconnect.
                    </Text>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
}
