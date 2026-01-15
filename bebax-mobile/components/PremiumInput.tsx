import React, { useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, TextInputProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { Colors } from '../src/constants/Colors';
import { LucideIcon } from 'lucide-react-native';

interface PremiumInputProps extends TextInputProps {
    label: string;
    icon?: LucideIcon;
    error?: string;
    description?: string;
    leftElement?: React.ReactNode;
    rightElement?: React.ReactNode;
}

export const PremiumInput = ({
    label,
    value,
    icon: Icon,
    error,
    description,
    leftElement,
    rightElement,
    style,
    onFocus,
    onBlur,
    ...props
}: PremiumInputProps) => {
    const isFocused = useSharedValue(false);
    const hasValue = value && value.length > 0;
    const floatVal = useSharedValue(hasValue ? 1 : 0);

    useEffect(() => {
        const shouldFloat = isFocused.value || (value && value.length > 0);
        floatVal.value = withTiming(shouldFloat ? 1 : 0, { duration: 200 });
    }, [value]);

    const handleFocus = (e: any) => {
        isFocused.value = true;
        floatVal.value = withTiming(1, { duration: 200 });
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        isFocused.value = false;
        if (!value || value.length === 0) {
            floatVal.value = withTiming(0, { duration: 200 });
        }
        onBlur?.(e);
    };

    const animatedLabelStyle = useAnimatedStyle(() => {
        // More dramatic move up to clear the text
        const translateY = interpolate(floatVal.value, [0, 1], [0, -12], Extrapolation.CLAMP);
        const fontSize = interpolate(floatVal.value, [0, 1], [16, 12], Extrapolation.CLAMP);

        return {
            transform: [{ translateY }],
            fontSize,
        };
    });

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(error ? Colors.error : (isFocused.value ? '#0F172A' : '#E2E8F0'), { duration: 200 }),
            borderWidth: withTiming(isFocused.value ? 1.5 : 1, { duration: 200 }),
            backgroundColor: '#FFFFFF', // Clean White always
        };
    });

    return (
        <View style={[styles.wrapper, style]}>
            <Animated.View style={[styles.container, animatedContainerStyle]}>
                {leftElement && (
                    <View style={styles.leftElement}>
                        {leftElement}
                    </View>
                )}

                <View style={styles.inputArea}>
                    {/* Floating Label Container to prevent overlap capability */}
                    <View style={styles.labelContainer}>
                        <Animated.Text style={[styles.label, animatedLabelStyle, { color: error ? Colors.error : '#64748B' }]}>
                            {label}
                        </Animated.Text>
                    </View>

                    <TextInput
                        value={value}
                        style={styles.input}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholderTextColor="transparent"
                        cursorColor={Colors.primary}
                        {...props}
                    />
                </View>

                {rightElement && (
                    <View style={styles.rightElement}>
                        {rightElement}
                    </View>
                )}
            </Animated.View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 20, // More space between inputs
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12, // Slightly more modern rounding
        height: 64, // Taller premium feel
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
    },
    leftElement: {
        marginRight: 12,
    },
    inputArea: {
        flex: 1,
        height: '100%',
        position: 'relative',
        justifyContent: 'center',
    },
    labelContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    label: {
        fontWeight: '500',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A', // Darker text
        paddingTop: 24, // Push text down to make room for label
        paddingBottom: 4,
        height: '100%',
        fontWeight: '500',
    },
    rightElement: {
        marginLeft: 12,
    },
    errorText: {
        color: Colors.error,
        fontSize: 13,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    }
});
