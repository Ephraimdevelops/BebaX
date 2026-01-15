import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { BlurView } from 'expo-blur';
import { Id } from '../../src/convex/_generated/dataModel';

export default function RateRideScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const rideId = params.rideId as Id<"rides"> | undefined;

    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const rateRide = useMutation(api.rides.rateRide);

    // Optional: Fetch ride details to show driver info (skip if no rideId)
    const ride = useQuery(api.rides.getRide, rideId ? { ride_id: rideId } : "skip");

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert("Rating Required", "Please select a star rating.");
            return;
        }

        if (!rideId) {
            Alert.alert("Error", "No ride ID found.");
            return;
        }

        setSubmitting(true);
        try {
            await rateRide({
                ride_id: rideId,
                rating: rating,
            });

            Alert.alert("Asante! 🎉", "Thanks for your feedback!", [
                { text: "OK", onPress: () => router.push('/') }
            ]);
        } catch (error: any) {
            Alert.alert("Error", "Failed to submit rating. Please try again.");
            setSubmitting(false);
        }
    };

    // Guard: If no rideId, redirect back
    if (!rideId) {
        return (
            <View style={styles.container}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#f0f0f0' }]} />
                <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFillObject} />
                <View style={styles.content}>
                    <Text style={styles.title}>No ride to rate</Text>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => router.push('/')}
                    >
                        <Text style={styles.submitText}>Go Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background Pattern or Color */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#f0f0f0' }]} />
            <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFillObject} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Trip Completed!</Text>
                    <Text style={styles.subtitle}>How was your ride with {ride?.driver_name || 'the driver'}?</Text>
                </View>

                {/* Driver Avatar */}
                <View style={styles.driverContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {ride?.driver_name?.charAt(0) || 'D'}
                        </Text>
                    </View>
                    <Text style={styles.driverName}>{ride?.driver_name}</Text>
                    <Text style={styles.vehicleText}>{ride?.vehicle_type?.toUpperCase()}</Text>
                </View>

                {/* Star Rating */}
                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setRating(star)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={rating >= star ? "star" : "star-border"}
                                size={48}
                                color={rating >= star ? "#F59E0B" : Colors.textDim}
                                style={styles.star}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.ratingLabels}>
                    <Text style={styles.ratingLabel}>{rating === 0 ? 'Tap to Rate' : rating === 5 ? 'Excellent!' : rating >= 4 ? 'Good' : rating >= 3 ? 'Okay' : 'Bad'}</Text>
                </View>

                {/* Submit Action */}
                <TouchableOpacity
                    style={[styles.submitButton, rating === 0 && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={rating === 0 || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitText}>SUBMIT REVIEW</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => router.push('/')}
                >
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    content: {
        width: '90%',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textDim,
        textAlign: 'center',
    },
    driverContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    driverName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    vehicleText: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 4,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 8,
    },
    star: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    ratingLabels: {
        height: 24,
        marginBottom: 30,
    },
    ratingLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary,
    },
    submitButton: {
        width: '100%',
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
        shadowOpacity: 0,
    },
    submitText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    skipButton: {
        padding: 10,
    },
    skipText: {
        color: Colors.textDim,
        fontSize: 16,
        fontWeight: '500',
    },
});
