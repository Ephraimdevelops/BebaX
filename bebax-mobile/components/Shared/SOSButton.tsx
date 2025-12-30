import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Linking,
    Vibration,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { ShieldAlert, Phone, X, CheckCircle } from 'lucide-react-native';
import { Id } from '../../src/convex/_generated/dataModel';
import * as Location from 'expo-location';

interface SOSButtonProps {
    rideId?: Id<"rides">;
    onTriggered?: () => void;
}

const LONG_PRESS_DURATION = 1500; // 1.5 seconds to trigger
const EMERGENCY_NUMBER = '112'; // Tanzania emergency number

export default function SOSButton({ rideId, onTriggered }: SOSButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [alertSent, setAlertSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);

    const progressAnim = useRef(new Animated.Value(0)).current;
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    const triggerSOS = useMutation(api.sos.trigger);

    const startLongPress = () => {
        setProgress(0);
        progressAnim.setValue(0);

        // Animate progress ring
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: LONG_PRESS_DURATION,
            useNativeDriver: false,
        }).start();

        // Update progress percentage
        const startTime = Date.now();
        progressInterval.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(elapsed / LONG_PRESS_DURATION, 1);
            setProgress(newProgress);

            if (newProgress >= 1) {
                clearInterval(progressInterval.current!);
                handleSOSTrigger();
            }
        }, 50);
    };

    const cancelLongPress = () => {
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
        }
        progressAnim.stopAnimation();
        setProgress(0);
        progressAnim.setValue(0);
    };

    const handleSOSTrigger = async () => {
        // Vibrate to confirm
        Vibration.vibrate([0, 100, 100, 100]);
        setShowModal(true);
        setSending(true);

        try {
            // Get current location
            const { status } = await Location.requestForegroundPermissionsAsync();
            let locationData = { lat: -6.7924, lng: 39.2083, address: 'Location unavailable' };

            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                locationData = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    address: 'Emergency Location',
                };

                // Try to get address (optional)
                try {
                    const [address] = await Location.reverseGeocodeAsync({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    });
                    if (address) {
                        locationData.address = `${address.street || ''} ${address.city || ''}, ${address.region || ''}`.trim();
                    }
                } catch (e) {
                    console.log('Address lookup failed:', e);
                }
            }

            // Send SOS alert
            await triggerSOS({
                ride_id: rideId,
                location: locationData,
            });

            setAlertSent(true);
            onTriggered?.();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to send SOS alert. Please call emergency services directly.');
            console.error('SOS Error:', error);
        } finally {
            setSending(false);
        }
    };

    const handleCallEmergency = () => {
        Linking.openURL(`tel:${EMERGENCY_NUMBER}`);
    };

    const handleClose = () => {
        setShowModal(false);
        setAlertSent(false);
        setProgress(0);
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <>
            {/* SOS Button */}
            <TouchableOpacity
                style={styles.sosButton}
                onPressIn={startLongPress}
                onPressOut={cancelLongPress}
                activeOpacity={0.9}
            >
                <View style={styles.progressRing}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            { width: progressWidth }
                        ]}
                    />
                </View>
                <ShieldAlert size={24} color="white" />
                <Text style={styles.sosText}>SOS</Text>
                {progress > 0 && (
                    <Text style={styles.holdText}>
                        {Math.round(progress * 100)}%
                    </Text>
                )}
            </TouchableOpacity>

            {/* SOS Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {sending ? (
                            <>
                                <ActivityIndicator size="large" color={Colors.error} />
                                <Text style={styles.modalTitle}>Sending Alert...</Text>
                                <Text style={styles.modalSubtitle}>
                                    Getting your location and notifying support
                                </Text>
                            </>
                        ) : alertSent ? (
                            <>
                                <View style={styles.successIcon}>
                                    <CheckCircle size={48} color={Colors.success} />
                                </View>
                                <Text style={styles.modalTitle}>🆘 Help is on the way!</Text>
                                <Text style={styles.modalSubtitle}>
                                    Admin has been notified of your location. Stay calm and stay safe.
                                </Text>

                                <TouchableOpacity
                                    style={styles.emergencyButton}
                                    onPress={handleCallEmergency}
                                >
                                    <Phone size={20} color="white" />
                                    <Text style={styles.emergencyButtonText}>
                                        Call Emergency ({EMERGENCY_NUMBER})
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={handleClose}
                                >
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <X size={32} color={Colors.error} />
                                <Text style={styles.modalTitle}>Alert Failed</Text>
                                <Text style={styles.modalSubtitle}>
                                    Please call emergency services directly.
                                </Text>
                                <TouchableOpacity
                                    style={styles.emergencyButton}
                                    onPress={handleCallEmergency}
                                >
                                    <Phone size={20} color="white" />
                                    <Text style={styles.emergencyButtonText}>
                                        Call {EMERGENCY_NUMBER}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    sosButton: {
        position: 'absolute',
        bottom: 160,
        right: 16,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
        overflow: 'hidden',
    },
    progressRing: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    progressFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    sosText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
        marginTop: 2,
    },
    holdText: {
        position: 'absolute',
        bottom: 4,
        color: 'white',
        fontSize: 8,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        alignItems: 'center',
    },
    successIcon: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: Colors.textDim,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    emergencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.error,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        width: '100%',
        gap: 10,
    },
    emergencyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    closeButton: {
        marginTop: 16,
        paddingVertical: 12,
    },
    closeButtonText: {
        color: Colors.textDim,
        fontSize: 15,
        fontWeight: '500',
    },
});
