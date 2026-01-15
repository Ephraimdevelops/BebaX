import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
    Easing,
    LayoutAnimation,
    Platform,
    UIManager,
    Linking,
    Dimensions,
    Vibration,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// Free waiting time in seconds (5 minutes)
const FREE_WAITING_SECONDS = 300;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type RideStatus = 'SEARCHING' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS';

export interface DriverInfo {
    name: string;
    photo?: string;
    rating: number;
    trips: number;
    phone: string;
    vehicleModel: string;
    vehicleColor: string;
    plateNumber: string;
    eta: number; // minutes
    pin: string; // 4-digit verification code
}

interface RideStatusSheetProps {
    status: RideStatus;
    driver?: DriverInfo;
    freeWaitingSeconds?: number;
    onCancel?: () => void;
    onCall?: () => void;
    onChat?: () => void;
    onShareRide?: () => void;
    onImComing?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA (For Demo)
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_DRIVER: DriverInfo = {
    name: 'Juma',
    photo: undefined, // Will use placeholder
    rating: 4.9,
    trips: 1247,
    phone: '+255712345678',
    vehicleModel: 'Honda Ace',
    vehicleColor: 'Red',
    plateNumber: 'MC 555-XYZ',
    eta: 4,
    pin: '8890',
};

const SEARCHING_TEXTS = [
    'Finding your ride...',
    'Scanning nearby drivers...',
    'Prioritizing high-rated drivers...',
    'Almost there...',
    'Matching you with the best driver...',
];

// ═══════════════════════════════════════════════════════════════════════════════
// RADAR ANIMATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const RadarPulse: React.FC = () => {
    const pulse1 = useRef(new Animated.Value(0)).current;
    const pulse2 = useRef(new Animated.Value(0)).current;
    const pulse3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createPulse = (anim: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const anim1 = createPulse(pulse1, 0);
        const anim2 = createPulse(pulse2, 666);
        const anim3 = createPulse(pulse3, 1333);

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, []);

    const renderPulse = (anim: Animated.Value, size: number) => {
        const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
        });
        const opacity = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.6, 0.3, 0],
        });

        return (
            <Animated.View
                style={[
                    styles.pulseCircle,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale }],
                        opacity,
                    },
                ]}
            />
        );
    };

    return (
        <View style={styles.radarContainer}>
            {renderPulse(pulse3, 200)}
            {renderPulse(pulse2, 150)}
            {renderPulse(pulse1, 100)}
            {/* Center Pin */}
            <View style={styles.radarCenter}>
                <Ionicons name="location" size={32} color="#FF6B00" />
            </View>
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const RideStatusSheet: React.FC<RideStatusSheetProps> = ({
    status,
    driver = MOCK_DRIVER,
    freeWaitingSeconds = FREE_WAITING_SECONDS,
    onCancel,
    onCall,
    onChat,
    onShareRide,
    onImComing,
}) => {
    const insets = useSafeAreaInsets();
    const [searchTextIndex, setSearchTextIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // ARRIVED state
    const [waitingTime, setWaitingTime] = useState(freeWaitingSeconds);
    const [hasNotifiedDriver, setHasNotifiedDriver] = useState(false);
    const pulseGreen = useRef(new Animated.Value(1)).current;

    // Rotate search texts
    useEffect(() => {
        if (status !== 'SEARCHING') return;

        const interval = setInterval(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setSearchTextIndex((prev) => (prev + 1) % SEARCHING_TEXTS.length);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [status]);

    // Countdown timer for ARRIVED state
    useEffect(() => {
        if (status !== 'ARRIVED') {
            setWaitingTime(freeWaitingSeconds);
            return;
        }

        // Vibrate on arrival
        Vibration.vibrate([0, 300, 100, 300]);

        const interval = setInterval(() => {
            setWaitingTime((prev) => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [status]);

    // Green pulse animation for ARRIVED header
    useEffect(() => {
        if (status !== 'ARRIVED') return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseGreen, {
                    toValue: 0.6,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseGreen, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [status]);

    // Smooth layout transition when status changes
    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [status]);

    // Handle phone call
    const handleCall = () => {
        if (onCall) {
            onCall();
        } else if (driver?.phone) {
            Linking.openURL(`tel:${driver.phone}`);
        }
    };

    // Handle "I'm Coming" button
    const handleImComing = () => {
        setHasNotifiedDriver(true);
        if (onImComing) {
            onImComing();
        }
        // Visual feedback
        Vibration.vibrate(100);
    };

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: SEARCHING STATE
    // ─────────────────────────────────────────────────────────────────────────────

    if (status === 'SEARCHING') {
        return (
            <View style={[styles.sheet, styles.sheetSearching, { paddingBottom: insets.bottom + 16 }]}>
                {/* Radar Animation */}
                <View style={styles.searchingContent}>
                    <RadarPulse />

                    {/* Animated Text */}
                    <Animated.Text style={[styles.searchingTitle, { opacity: fadeAnim }]}>
                        {SEARCHING_TEXTS[searchTextIndex]}
                    </Animated.Text>
                    <Text style={styles.searchingSubtitle}>
                        This usually takes less than a minute
                    </Text>
                </View>

                {/* Cancel Button */}
                <TouchableOpacity style={styles.cancelPill} onPress={onCancel} activeOpacity={0.8}>
                    <Text style={styles.cancelPillText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: ARRIVED STATE (The Handshake)
    // ─────────────────────────────────────────────────────────────────────────────

    if (status === 'ARRIVED') {
        const isOvertime = waitingTime <= 0;

        return (
            <View style={[styles.sheet, styles.sheetArrived, { paddingBottom: insets.bottom + 16 }]}>
                {/* Handle */}
                <View style={styles.sheetHandle} />

                {/* ARRIVED HEADER with pulsing green */}
                <Animated.View style={[styles.arrivedHeader, { opacity: pulseGreen }]}>
                    <View style={styles.arrivedBadge}>
                        <MaterialIcons name="check-circle" size={28} color="#22C55E" />
                        <Text style={styles.arrivedTitle}>DRIVER ARRIVED</Text>
                    </View>
                    <Text style={styles.arrivedSubtitle}>
                        Waiting at your pickup location
                    </Text>
                </Animated.View>

                {/* COUNTDOWN TIMER */}
                <View style={[styles.timerBlock, isOvertime && styles.timerBlockOvertime]}>
                    <Text style={styles.timerLabel}>
                        {isOvertime ? '⚠️ OVERTIME - Charges Apply' : 'Free Waiting Time'}
                    </Text>
                    <Text style={[styles.timerValue, isOvertime && styles.timerValueOvertime]}>
                        {isOvertime ? '+0:00' : formatTime(waitingTime)}
                    </Text>
                    {!isOvertime && (
                        <View style={styles.timerProgress}>
                            <View
                                style={[
                                    styles.timerProgressFill,
                                    { width: `${(waitingTime / freeWaitingSeconds) * 100}%` }
                                ]}
                            />
                        </View>
                    )}
                </View>

                {/* Driver Mini Card */}
                <View style={styles.driverMiniRow}>
                    <View style={styles.driverMiniInfo}>
                        <View style={styles.driverMiniPhotoContainer}>
                            {driver.photo ? (
                                <Image source={{ uri: driver.photo }} style={styles.driverMiniPhoto} />
                            ) : (
                                <View style={styles.driverMiniPhotoPlaceholder}>
                                    <Ionicons name="person" size={20} color="#94A3B8" />
                                </View>
                            )}
                        </View>
                        <View>
                            <Text style={styles.driverMiniName}>{driver.name}</Text>
                            <Text style={styles.driverMiniVehicle}>
                                {driver.vehicleModel} • {driver.vehicleColor}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.plateMini}>
                        <Text style={styles.plateMiniText}>{driver.plateNumber}</Text>
                    </View>
                </View>

                {/* I'M COMING BUTTON (Primary CTA) */}
                <TouchableOpacity
                    style={[
                        styles.imComingBtn,
                        hasNotifiedDriver && styles.imComingBtnNotified
                    ]}
                    onPress={handleImComing}
                    activeOpacity={0.8}
                    disabled={hasNotifiedDriver}
                >
                    {hasNotifiedDriver ? (
                        <>
                            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                            <Text style={styles.imComingBtnText}>Driver Notified ✓</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.imComingBtnEmoji}>🏃</Text>
                            <Text style={styles.imComingBtnText}>I'M COMING</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Secondary Actions */}
                <View style={styles.arrivedActionsRow}>
                    <TouchableOpacity style={styles.arrivedSecondaryBtn} onPress={handleCall}>
                        <Ionicons name="call" size={20} color="#22C55E" />
                        <Text style={styles.arrivedSecondaryText}>Call Driver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.arrivedSecondaryBtn} onPress={onChat}>
                        <Ionicons name="chatbubble-ellipses" size={20} color="#0EA5E9" />
                        <Text style={styles.arrivedSecondaryText}>Message</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: ACCEPTED STATE (Command Center)
    // ─────────────────────────────────────────────────────────────────────────────

    return (
        <View style={[styles.sheet, styles.sheetAccepted, { paddingBottom: insets.bottom + 16 }]}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* TOP ROW: ETA & Plate */}
            <View style={styles.topRow}>
                <View style={styles.etaBlock}>
                    <Text style={styles.etaNumber}>{driver.eta}</Text>
                    <Text style={styles.etaLabel}>min</Text>
                </View>

                <View style={styles.plateBlock}>
                    <Text style={styles.plateNumber}>{driver.plateNumber}</Text>
                </View>
            </View>

            {/* MIDDLE ROW: Driver Profile */}
            <View style={styles.driverRow}>
                {/* Driver Photo */}
                <View style={styles.driverPhotoContainer}>
                    {driver.photo ? (
                        <Image source={{ uri: driver.photo }} style={styles.driverPhoto} />
                    ) : (
                        <View style={styles.driverPhotoPlaceholder}>
                            <Ionicons name="person" size={36} color="#94A3B8" />
                        </View>
                    )}
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    </View>
                </View>

                {/* Driver Info */}
                <View style={styles.driverInfo}>
                    <View style={styles.driverNameRow}>
                        <Text style={styles.driverName}>{driver.name}</Text>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={14} color="#FBBF24" />
                            <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
                        </View>
                    </View>
                    <Text style={styles.vehicleInfo}>
                        {driver.vehicleModel} • {driver.vehicleColor}
                    </Text>
                    <Text style={styles.tripsCount}>{driver.trips.toLocaleString()} trips</Text>
                </View>
            </View>

            {/* SECURITY: PIN CODE */}
            <View style={styles.pinBlock}>
                <View style={styles.pinLabel}>
                    <MaterialIcons name="verified-user" size={18} color="#0EA5E9" />
                    <Text style={styles.pinLabelText}>Trip PIN</Text>
                </View>
                <View style={styles.pinCode}>
                    {driver.pin.split('').map((digit, i) => (
                        <View key={i} style={styles.pinDigit}>
                            <Text style={styles.pinDigitText}>{digit}</Text>
                        </View>
                    ))}
                </View>
                <Text style={styles.pinHint}>Share this with your driver</Text>
            </View>

            {/* BOTTOM ROW: Actions */}
            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.8}>
                    <View style={[styles.actionBtnCircle, { backgroundColor: '#22C55E' }]}>
                        <Ionicons name="call" size={24} color="#FFF" />
                    </View>
                    <Text style={styles.actionBtnLabel}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={onChat} activeOpacity={0.8}>
                    <View style={[styles.actionBtnCircle, { backgroundColor: '#0EA5E9' }]}>
                        <Ionicons name="chatbubble-ellipses" size={24} color="#FFF" />
                    </View>
                    <Text style={styles.actionBtnLabel}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={onCancel} activeOpacity={0.8}>
                    <View style={[styles.actionBtnCircle, { backgroundColor: '#EF4444' }]}>
                        <Ionicons name="close" size={24} color="#FFF" />
                    </View>
                    <Text style={styles.actionBtnLabel}>Cancel</Text>
                </TouchableOpacity>
            </View>

            {/* Share Ride */}
            <TouchableOpacity style={styles.shareBtn} onPress={onShareRide} activeOpacity={0.7}>
                <Ionicons name="share-social-outline" size={18} color="#64748B" />
                <Text style={styles.shareBtnText}>Share Ride Details</Text>
            </TouchableOpacity>
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    // SHEET BASE
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        // Elevation / Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    sheetSearching: {
        paddingTop: 32,
        minHeight: 320,
    },
    sheetAccepted: {
        paddingTop: 12,
        minHeight: 420,
    },
    sheetArrived: {
        paddingTop: 12,
        minHeight: 440,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },

    // SEARCHING STATE
    searchingContent: {
        alignItems: 'center',
        marginBottom: 32,
    },
    radarContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    pulseCircle: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#FF6B00',
        backgroundColor: 'rgba(255, 107, 0, 0.08)',
    },
    radarCenter: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF6B00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    searchingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    searchingSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    cancelPill: {
        alignSelf: 'center',
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: '#F1F5F9',
        borderRadius: 100,
    },
    cancelPillText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ARRIVED STATE STYLES
    // ═══════════════════════════════════════════════════════════════════════
    arrivedHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    arrivedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 100,
        marginBottom: 8,
    },
    arrivedTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#166534',
        marginLeft: 10,
        letterSpacing: 0.5,
    },
    arrivedSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },

    // TIMER BLOCK
    timerBlock: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    timerBlockOvertime: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    timerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    timerValue: {
        fontSize: 48,
        fontWeight: '800',
        color: '#0F172A',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: 2,
    },
    timerValueOvertime: {
        color: '#DC2626',
    },
    timerProgress: {
        width: '100%',
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        marginTop: 16,
        overflow: 'hidden',
    },
    timerProgressFill: {
        height: '100%',
        backgroundColor: '#22C55E',
        borderRadius: 3,
    },

    // DRIVER MINI ROW
    driverMiniRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    driverMiniInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverMiniPhotoContainer: {
        marginRight: 12,
    },
    driverMiniPhoto: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    driverMiniPhotoPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverMiniName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    driverMiniVehicle: {
        fontSize: 13,
        color: '#64748B',
    },
    plateMini: {
        backgroundColor: '#FBBF24',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    plateMiniText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },

    // I'M COMING BUTTON
    imComingBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22C55E',
        paddingVertical: 18,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    imComingBtnNotified: {
        backgroundColor: '#64748B',
        shadowColor: '#64748B',
    },
    imComingBtnEmoji: {
        fontSize: 24,
        marginRight: 10,
    },
    imComingBtnText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    // SECONDARY ACTIONS
    arrivedActionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    arrivedSecondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    arrivedSecondaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginLeft: 8,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ACCEPTED STATE STYLES
    // ═══════════════════════════════════════════════════════════════════════
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    etaBlock: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    etaNumber: {
        fontSize: 56,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -2,
    },
    etaLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
        marginLeft: 6,
    },
    plateBlock: {
        backgroundColor: '#FBBF24',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    plateNumber: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: 0.5,
    },

    // DRIVER ROW
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    driverPhotoContainer: {
        position: 'relative',
        marginRight: 16,
    },
    driverPhoto: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    driverPhotoPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#FFF',
        borderRadius: 12,
    },
    driverInfo: {
        flex: 1,
    },
    driverNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    driverName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        marginRight: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#92400E',
        marginLeft: 4,
    },
    vehicleInfo: {
        fontSize: 15,
        color: '#475569',
        marginBottom: 2,
    },
    tripsCount: {
        fontSize: 13,
        color: '#94A3B8',
    },

    // PIN BLOCK
    pinBlock: {
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    pinLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    pinLabelText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0284C7',
        marginLeft: 6,
    },
    pinCode: {
        flexDirection: 'row',
        gap: 10,
    },
    pinDigit: {
        width: 48,
        height: 56,
        backgroundColor: '#FFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    pinDigitText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
    },
    pinHint: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 10,
    },

    // ACTIONS ROW
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 16,
    },
    actionBtn: {
        alignItems: 'center',
    },
    actionBtnCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    actionBtnLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },

    // SHARE BUTTON
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    shareBtnText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 8,
    },
});

export default RideStatusSheet;
