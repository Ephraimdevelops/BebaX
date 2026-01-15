import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import Svg, { Circle } from 'react-native-svg';

interface LoadingTimerProps {
    rideId: Id<"rides">;
    onLoadingComplete?: () => void;
}

/**
 * Loading Timer Component - "Truth Timer"
 * Displays countdown during loading phase
 * Fetches server-side loading_start_time for accuracy
 * Shows demurrage fee when overtime
 */
export default function LoadingTimer({ rideId, onLoadingComplete }: LoadingTimerProps) {
    const loadingStatus = useQuery(api.rides.getLoadingStatus, { ride_id: rideId });
    const startLoading = useMutation(api.rides.startLoading);
    const stopLoading = useMutation(api.rides.stopLoading);

    const [timeDisplay, setTimeDisplay] = useState('00:00');
    const [progress, setProgress] = useState(1);
    const [isOvertime, setIsOvertime] = useState(false);
    const [overtimeAlerted, setOvertimeAlerted] = useState(false);

    // Calculate timer display
    useEffect(() => {
        if (!loadingStatus || loadingStatus.status === 'not_started' || loadingStatus.status === 'completed') {
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const startTime = loadingStatus.loading_start_time || now;
            const elapsedMs = now - startTime;
            const elapsedSec = Math.floor(elapsedMs / 1000);
            const windowSec = (loadingStatus.loading_window_min || 30) * 60;
            const remainingSec = Math.max(0, windowSec - elapsedSec);

            // Update progress (0 to 1)
            const newProgress = Math.max(0, remainingSec / windowSec);
            setProgress(newProgress);

            // Check overtime
            if (remainingSec === 0 && !overtimeAlerted) {
                setIsOvertime(true);
                setOvertimeAlerted(true);
                Vibration.vibrate([500, 200, 500]); // Alert vibration
            }

            // Format time
            if (remainingSec > 0) {
                const mins = Math.floor(remainingSec / 60);
                const secs = remainingSec % 60;
                setTimeDisplay(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
            } else {
                // Show overtime duration
                const overtimeSec = elapsedSec - windowSec;
                const overtimeMins = Math.floor(overtimeSec / 60);
                const overtimeSecs = overtimeSec % 60;
                setTimeDisplay(`+${overtimeMins}:${overtimeSecs.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [loadingStatus, overtimeAlerted]);

    // Get color based on progress
    const getColor = () => {
        if (isOvertime) return '#EF4444'; // Red
        if (progress < 0.25) return '#EF4444'; // Red
        if (progress < 0.5) return '#F59E0B'; // Yellow
        return '#10B981'; // Green
    };

    const handleStartLoading = async () => {
        try {
            await startLoading({ ride_id: rideId });
        } catch (error) {
            console.error('Failed to start loading:', error);
        }
    };

    const handleStopLoading = async () => {
        try {
            const result = await stopLoading({ ride_id: rideId });
            if (onLoadingComplete) {
                onLoadingComplete();
            }
        } catch (error) {
            console.error('Failed to stop loading:', error);
        }
    };

    // Loading not started yet
    if (!loadingStatus || loadingStatus.status === 'not_started') {
        return (
            <View style={styles.container}>
                <View style={styles.infoBox}>
                    <Ionicons name="timer-outline" size={24} color={Colors.textDim} />
                    <Text style={styles.infoText}>
                        Free loading: {loadingStatus?.loading_window_min || 30} min
                    </Text>
                </View>
                <TouchableOpacity style={styles.startBtn} onPress={handleStartLoading}>
                    <Ionicons name="play" size={20} color="white" />
                    <Text style={styles.startBtnText}>Start Loading</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Loading completed
    if (loadingStatus.status === 'completed') {
        return (
            <View style={styles.container}>
                <View style={styles.completedBox}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <Text style={styles.completedText}>Loading Complete</Text>
                    {loadingStatus.demurrage_fee > 0 && (
                        <Text style={styles.demurrageText}>
                            Demurrage: TZS {loadingStatus.demurrage_fee.toLocaleString()}
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    // Active timer
    const size = 160;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <View style={styles.container}>
            <View style={styles.timerWrapper}>
                {/* Circular Progress */}
                <Svg width={size} height={size} style={styles.svg}>
                    {/* Background circle */}
                    <Circle
                        stroke="#E5E7EB"
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <Circle
                        stroke={getColor()}
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>

                {/* Timer Text */}
                <View style={styles.timerTextContainer}>
                    <Text style={[styles.timerText, { color: getColor() }]}>
                        {timeDisplay}
                    </Text>
                    {isOvertime && (
                        <Text style={styles.overtimeLabel}>OVERTIME</Text>
                    )}
                </View>
            </View>

            {/* Demurrage Warning */}
            {isOvertime && (
                <View style={styles.demurrageWarning}>
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    <Text style={styles.demurrageWarningText}>
                        Demurrage Fee Active: TZS {loadingStatus.demurrage_rate}/min
                    </Text>
                </View>
            )}

            {/* Current Demurrage */}
            {isOvertime && loadingStatus.current_demurrage > 0 && (
                <Text style={styles.currentDemurrage}>
                    Current Fee: TZS {loadingStatus.current_demurrage.toLocaleString()}
                </Text>
            )}

            {/* Stop Loading Button */}
            <TouchableOpacity style={styles.stopBtn} onPress={handleStopLoading}>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.stopBtnText}>Done Loading</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 16,
        color: Colors.textDim,
    },
    startBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    startBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    completedBox: {
        alignItems: 'center',
        gap: 8,
    },
    completedText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10B981',
    },
    demurrageText: {
        fontSize: 14,
        color: Colors.textDim,
    },
    timerWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        transform: [{ rotateZ: '0deg' }],
    },
    timerTextContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    timerText: {
        fontSize: 36,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    overtimeLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EF4444',
        marginTop: 4,
    },
    demurrageWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 16,
    },
    demurrageWarningText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
    currentDemurrage: {
        fontSize: 18,
        fontWeight: '700',
        color: '#EF4444',
        marginTop: 8,
    },
    stopBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 20,
    },
    stopBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
});
