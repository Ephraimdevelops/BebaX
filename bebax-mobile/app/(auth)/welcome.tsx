import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthWelcome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = Dimensions.get('window');

    return (
        <View style={styles.container}>
            {/* Background Illustration/Image Area */}
            <View style={styles.imageContainer}>
                {/* Note: In a real app, use the actual asset path. Using the generated artifact path for now */}
                <Image
                    source={{ uri: 'file:///Users/ednangowi/.gemini/antigravity/brain/ce78f4e0-d7a0-4e84-a1e8-69c77a41ac49/bebax_hero_scene_1765822746133.png' }}
                    style={{ width: width, height: width, resizeMode: 'contain' }}
                />
            </View>

            {/* Bottom Sheet Content */}
            <View style={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.textBlock}>
                    <Text style={styles.title}>Move anything, anywhere.</Text>
                    <Text style={styles.subtitle}>
                        BebaX connects you with reliable trucks, bajajis, and motorcycles for all your cargo needs. Fast, safe, and secure.
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push('/(auth)/sign-up')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push('/(auth)/sign-in')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.secondaryButtonText}>I already have an account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Light grey background for the image area
        justifyContent: 'space-between',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    contentContainer: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 10,
    },
    textBlock: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textDim,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    buttonContainer: {
        gap: 16,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
});
