import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

// Admin Dark Theme
const Colors = {
    background: '#0A0A0A',
    surface: '#141414',
    surfaceLight: '#1E1E1E',
    primary: '#FF6B35',
    accent: '#00D4AA',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#FFFFFF',
    textDim: '#6B7280',
    border: '#2D2D2D',
};

export default function KillSwitchScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Real-time service status
    const serviceStatus = useQuery(api.admin.getServiceStatus);
    const serviceActive = serviceStatus?.isActive ?? true;

    // Toggle mutation
    const toggleService = useMutation(api.admin.toggleService);

    const handleToggle = () => {
        Vibration.vibrate(100);

        Alert.alert(
            serviceActive ? '⚠️ DISABLE SERVICE?' : '✅ ENABLE SERVICE?',
            serviceActive
                ? 'This will prevent ALL new bookings. Active rides will continue. This is for emergencies only.'
                : 'This will re-enable the booking system for all users.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: serviceActive ? 'DISABLE' : 'ENABLE',
                    style: serviceActive ? 'destructive' : 'default',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const result = await toggleService({ active: !serviceActive });
                            Vibration.vibrate([200, 100, 200]);
                            Alert.alert(
                                serviceActive ? '🔴 Service Disabled' : '✅ Service Enabled',
                                result.message
                            );
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to toggle service');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kill Switch</Text>
            </View>

            <View style={styles.content}>
                {/* Status Display */}
                <View style={[
                    styles.statusCard,
                    { borderColor: serviceActive ? Colors.accent : Colors.danger }
                ]}>
                    <Ionicons
                        name={serviceActive ? "checkmark-circle" : "close-circle"}
                        size={48}
                        color={serviceActive ? Colors.accent : Colors.danger}
                    />
                    <Text style={[
                        styles.statusText,
                        { color: serviceActive ? Colors.accent : Colors.danger }
                    ]}>
                        {serviceActive ? 'SERVICE ACTIVE' : 'SERVICE DISABLED'}
                    </Text>
                    <Text style={styles.statusDescription}>
                        {serviceActive
                            ? 'All systems operational. Bookings are being processed normally.'
                            : 'Emergency mode active. No new bookings are being accepted.'
                        }
                    </Text>
                </View>

                {/* Warning */}
                <View style={styles.warningBox}>
                    <Ionicons name="warning" size={24} color={Colors.warning} />
                    <Text style={styles.warningText}>
                        The Kill Switch is for emergencies only. Use during:
                        {'\n'}• System outages
                        {'\n'}• Major incidents
                        {'\n'}• Natural disasters
                    </Text>
                </View>

                {/* THE BIG RED BUTTON */}
                <TouchableOpacity
                    style={[
                        styles.killButton,
                        { backgroundColor: serviceActive ? Colors.danger : Colors.accent }
                    ]}
                    onPress={handleToggle}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <Text style={styles.killButtonText}>PROCESSING...</Text>
                    ) : (
                        <>
                            <Ionicons
                                name={serviceActive ? "power" : "rocket"}
                                size={32}
                                color="white"
                            />
                            <Text style={styles.killButtonText}>
                                {serviceActive ? 'DISABLE SERVICE' : 'ENABLE SERVICE'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                    Super Admin access required. All actions are logged.
                </Text>
            </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 12,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusCard: {
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 32,
        borderWidth: 2,
        width: '100%',
        marginBottom: 24,
    },
    statusText: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 16,
    },
    statusDescription: {
        fontSize: 14,
        color: Colors.textDim,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.warning + '15',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        width: '100%',
        marginBottom: 32,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: Colors.warning,
        lineHeight: 22,
    },
    killButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    killButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginTop: 8,
        textAlign: 'center',
    },
    footerNote: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 32,
        textAlign: 'center',
    },
});
