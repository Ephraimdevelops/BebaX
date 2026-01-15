import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TextInput, ActivityIndicator, SafeAreaView
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { Star, X, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    rideId: any;
    recipientName: string;
    recipientRole: 'driver' | 'customer';
}

export default function ReviewModal({
    visible,
    onClose,
    rideId,
    recipientName,
    recipientRole,
}: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const submitReview = useMutation(api.reviews.submitReview);

    const handleStarPress = (star: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRating(star);
    };

    const handleSubmit = async () => {
        if (!rideId) return;
        setSubmitting(true);
        try {
            await submitReview({
                ride_id: rideId,
                rating,
                comment: comment.trim() || undefined,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSubmitted(true);
            setTimeout(() => {
                onClose();
                setSubmitted(false);
                setRating(5);
                setComment('');
            }, 1500);
        } catch (error) {
            console.error('Review failed:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Rate Your Experience</Text>
                    <View style={{ width: 40 }} />
                </View>

                {submitted ? (
                    <View style={styles.successContainer}>
                        <Text style={styles.successEmoji}>🎉</Text>
                        <Text style={styles.successTitle}>Asante Sana!</Text>
                        <Text style={styles.successSubtitle}>Your review has been submitted</Text>
                    </View>
                ) : (
                    <View style={styles.content}>
                        {/* Recipient Info */}
                        <View style={styles.recipientSection}>
                            <Text style={styles.recipientLabel}>
                                {recipientRole === 'driver' ? 'How was your driver?' : 'How was your customer?'}
                            </Text>
                            <Text style={styles.recipientName}>{recipientName}</Text>
                        </View>

                        {/* Star Rating */}
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
                                    <Star
                                        size={48}
                                        color={star <= rating ? '#F59E0B' : '#E5E7EB'}
                                        fill={star <= rating ? '#F59E0B' : 'transparent'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Rating Text */}
                        <Text style={styles.ratingText}>
                            {rating === 5 ? 'Excellent! ⭐' :
                                rating === 4 ? 'Great!' :
                                    rating === 3 ? 'Good' :
                                        rating === 2 ? 'Fair' : 'Poor'}
                        </Text>

                        {/* Comment Input */}
                        <View style={styles.commentSection}>
                            <Text style={styles.commentLabel}>Add a comment (optional)</Text>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Share your experience..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                value={comment}
                                onChangeText={setComment}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.submitBtnText}>Submit Review</Text>
                                    <Send size={20} color="#FFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#121212',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    recipientSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    recipientLabel: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 8,
    },
    recipientName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#121212',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    ratingText: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: 32,
    },
    commentSection: {
        marginBottom: 32,
    },
    commentLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    commentInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#121212',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#121212',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
});
