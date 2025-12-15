import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';

interface PhoneCaptureModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (phoneNumber: string) => Promise<void>;
}

export default function PhoneCaptureModal({ visible, onClose, onSubmit }: PhoneCaptureModalProps) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-format Tanzania phone number
    const formatPhoneNumber = (input: string) => {
        // Remove all non-digits
        const digits = input.replace(/\D/g, '');

        // Handle different input formats
        if (digits.startsWith('255')) {
            // Already has country code
            return `+${digits.slice(0, 12)}`;
        } else if (digits.startsWith('0')) {
            // Local format (07xx xxx xxx)
            return `+255${digits.slice(1, 10)}`;
        } else if (digits.startsWith('7')) {
            // Without leading 0
            return `+255${digits.slice(0, 9)}`;
        }
        return input;
    };

    const validateTanzaniaPhone = (phoneNumber: string): boolean => {
        // Tanzania phone: +255 followed by 9 digits (7xx, 6xx, etc.)
        const regex = /^\+255[67]\d{8}$/;
        return regex.test(phoneNumber);
    };

    const handleSubmit = async () => {
        const formattedPhone = formatPhoneNumber(phone);

        if (!validateTanzaniaPhone(formattedPhone)) {
            Alert.alert(
                'Invalid Phone Number',
                'Please enter a valid Tanzania phone number (e.g., 0712 345 678 or +255712345678)'
            );
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formattedPhone);
            setPhone(''); // Reset on success
        } catch (error) {
            console.error('Phone update error:', error);
            Alert.alert('Error', 'Failed to update phone number. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <MaterialIcons name="phone" size={32} color={Colors.primary} />
                        <Text style={styles.title}>Phone Number Required</Text>
                        <Text style={styles.subtitle}>
                            Drivers need to contact you for precise pickup locations
                        </Text>
                    </View>

                    {/* Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>PHONE NUMBER</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0712 345 678 or +255712345678"
                            placeholderTextColor={Colors.textDim}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            autoFocus
                            maxLength={15}
                        />
                        <Text style={styles.helperText}>
                            Format: +255 7XX XXX XXX or 07XX XXX XXX
                        </Text>
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading || !phone}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Saving...' : 'Continue to Booking'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        disabled={loading}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 12,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textDim,
        textAlign: 'center',
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textDim,
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.surfaceOff,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 8,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: Colors.textDim,
        fontSize: 14,
        fontWeight: '600',
    },
});
