import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaView } from 'react-native-safe-area-context';

const GRAY_700 = '#374151';

/**
 * Offline Banner - Shows when device loses internet connection
 */
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
    }, [height]);

    if (isConnected) return null;

    return (
        <Animated.View style={[styles.container, { height }]}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.content}>
                    <Text style={styles.text}>
                        You are currently offline. Changes will sync when you reconnect.
                    </Text>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: GRAY_700,
        overflow: 'hidden',
    },
    safeArea: {
        backgroundColor: GRAY_700,
    },
    content: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: GRAY_700,
    },
    text: {
        color: '#FFFFFF',
        fontWeight: '500',
        fontSize: 12,
    },
});
