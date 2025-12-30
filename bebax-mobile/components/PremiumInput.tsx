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
    rightElement?: React.ReactNode;
}

export const PremiumInput = ({
    label,
    value,
    icon: Icon,
    error,
    description,
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
        const translateY = interpolate(floatVal.value, [0, 1], [18, 6], Extrapolation.CLAMP);
        const fontSize = interpolate(floatVal.value, [0, 1], [16, 11], Extrapolation.CLAMP);

        return {
            transform: [{ translateY }],
            fontSize,
        };
    });

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(error ? Colors.error : (isFocused.value ? '#121212' : '#E0E0E0'), { duration: 200 }),
            backgroundColor: withTiming(isFocused.value ? '#FFFFFF' : '#F9FAFB', { duration: 200 }),
        };
    });

    return (
        <View style={[styles.wrapper, style]}>
            <Animated.View style={[styles.container, animatedContainerStyle]}>
                <View style={styles.inputArea}>
                    <Animated.Text style={[styles.label, animatedLabelStyle, { color: error ? Colors.error : '#666' }]}>
                        {label}
                    </Animated.Text>
                    <TextInput
                        value={value}
                        style={styles.input}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholderTextColor="transparent"
                        cursorColor="#121212"
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
        marginBottom: 16,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1, // Thinner, cleaner border
        borderRadius: 8, // Less rounded, more professional
        height: 60, // Taller for better touch target
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
    },
    inputArea: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
    },
    label: {
        position: 'absolute',
        left: 0,
        fontWeight: '500',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#121212',
        paddingTop: 20, // Space for floating label
        paddingBottom: 4,
        height: '100%',
    },
    rightElement: {
        marginLeft: 12,
    },
    errorText: {
        color: Colors.error,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    }
});
