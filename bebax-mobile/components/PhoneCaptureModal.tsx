import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Colors } from '../src/constants/Colors';
import { Phone } from 'lucide-react-native';

interface PhoneCaptureModalProps {
    visible: boolean;
    onSubmit: (phone: string) => Promise<void>;
    onClose: () => void;
}

export default function PhoneCaptureModal({ visible, onSubmit, onClose }: PhoneCaptureModalProps) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!phone.trim()) {
            setError('Please enter a phone number.');
            return;
        }

        // Basic validation for "Industrial" robustness
        // Must start with 0 or +255
        // Remove spaces/dashes
        const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '');

        if (!cleanPhone.startsWith('0') && !cleanPhone.startsWith('+255')) {
            setError('Start with 0 or +255 (e.g., 0712345678)');
            return;
        }

        if (cleanPhone.length < 10) {
            setError('Number is too short.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await onSubmit(cleanPhone);
            // Modal closes via parent updating state or onClose
        } catch (err) {
            setError('Failed to save. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.keyboardView}
                    >
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.iconCircle}>
                                    <Phone size={24} color="white" />
                                </View>
                                <Text style={styles.title}>Mawasiliano ya Dereva</Text>
                                <Text style={styles.subtitle}>Driver Contact</Text>
                            </View>

                            <Text style={styles.description}>
                                Tunahitaji namba yako ili dereva akupigie akikufikia.
                                {"\n"}
                                (We need your number so the driver can call you.)
                            </Text>

                            {/* Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="07..."
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={(text) => {
                                        setPhone(text);
                                        setError('');
                                    }}
                                    autoFocus={true}
                                />
                            </View>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            {/* Action Button */}
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.saveBtnText}>HIFADHI / SAVE</Text>
                                )}
                            </TouchableOpacity>

                            {/* Cancel */}
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>Ghairi / Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Deep Asphalt Overlay
        justifyContent: 'center',
        padding: 20,
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#121212', // Deep Asphalt
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#121212',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        marginTop: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#121212',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        textAlign: 'center',
    },
    errorText: {
        color: Colors.error || '#ef4444',
        marginBottom: 16,
        fontWeight: '600',
    },
    saveBtn: {
        width: '100%',
        backgroundColor: Colors.primary, // Safety Orange
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cancelBtn: {
        marginTop: 16,
        padding: 8,
    },
    cancelText: {
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
    },
});
