import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Support() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [sosActive, setSosActive] = useState(false);

    const handleCallSupport = () => {
        Linking.openURL('tel:+255700000000');
    };

    const handleSOS = () => {
        Alert.alert(
            "EMERGENCY SOS",
            "Are you in danger? This will alert our safety team and local authorities.",
            [
                { text: "CANCEL", style: "cancel" },
                { text: "I NEED HELP", style: "destructive", onPress: () => Alert.alert("SOS SENT", "Help is on the way.") }
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>SUPPORT & SAFETY</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* SOS Section */}
                <TouchableOpacity style={styles.sosCard} onPress={handleSOS} activeOpacity={0.8}>
                    <View style={styles.sosIconCircle}>
                        <MaterialIcons name="sos" size={40} color="#FFFFFF" />
                    </View>
                    <View>
                        <Text style={styles.sosTitle}>EMERGENCY SOS</Text>
                        <Text style={styles.sosSubtitle}>Press for immediate assistance</Text>
                    </View>
                </TouchableOpacity>

                {/* Contact Options */}
                <Text style={styles.sectionTitle}>CONTACT US</Text>

                <TouchableOpacity style={styles.contactItem} onPress={handleCallSupport}>
                    <MaterialIcons name="call" size={24} color={Colors.primary} />
                    <Text style={styles.contactText}>Call Customer Care</Text>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.textDim} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('https://bebax.co.tz')}>
                    <MaterialIcons name="language" size={24} color={Colors.primary} />
                    <Text style={styles.contactText}>Visit Website</Text>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.textDim} />
                </TouchableOpacity>

                {/* FAQ */}
                <Text style={styles.sectionTitle}>FAQ</Text>
                <View style={styles.faqItem}>
                    <Text style={styles.faqQ}>How do I track my cargo?</Text>
                    <Text style={styles.faqA}>You can track your cargo in real-time from the "My Activity" page or directly on the home dashboard during a trip.</Text>
                </View>
                <View style={styles.faqItem}>
                    <Text style={styles.faqQ}>What payments are accepted?</Text>
                    <Text style={styles.faqA}>We accept Cash, M-Pesa, Tigo Pesa, and Airtel Money.</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 1,
    },
    content: {
        padding: 20,
    },
    sosCard: {
        backgroundColor: '#D32F2F', // Danger Red
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
    },
    sosIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    sosTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    sosSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    sectionTitle: {
        color: Colors.textDim,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    contactText: {
        flex: 1,
        marginLeft: 16,
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    faqItem: {
        backgroundColor: Colors.surfaceOff,
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    faqQ: {
        color: Colors.text,
        fontWeight: '700',
        marginBottom: 4,
    },
    faqA: {
        color: Colors.textDim,
        fontSize: 14,
        lineHeight: 20,
    },
});
