import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { PremiumInput } from '../../components/PremiumInput';
import { useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';

// Vehicle Types for the Captain's Exam
const VEHICLE_TYPES = [
    { id: 'boda', label: 'Boda', icon: 'two-wheeler', capacity: '50kg' },
    { id: 'bajaj', label: 'Bajaj', icon: 'electric-rickshaw', capacity: '200kg' },
    { id: 'pickup', label: 'Pickup', icon: 'local-shipping', capacity: '1 Ton' },
    { id: 'canter', label: 'Canter', icon: 'local-shipping', capacity: '3 Tons' },
    { id: 'fuso', label: 'Fuso', icon: 'local-shipping', capacity: '7 Tons' },
];

const CAPACITY_OPTIONS = ['50kg', '200kg', '500kg', '1 Ton', '3 Tons', '5 Tons', '7 Tons', '10+ Tons'];

// Interview Questions
const INTERVIEW_QUESTIONS = [
    {
        id: 'q1',
        question: 'A customer is 10 minutes late. What do you do?',
        options: [
            { id: 'a', text: 'Wait patiently and call them', correct: true },
            { id: 'b', text: 'Cancel immediately', correct: false },
        ]
    },
    {
        id: 'q2',
        question: 'Do you have a smartphone holder for navigation?',
        options: [
            { id: 'a', text: 'Yes, mounted on my vehicle', correct: true },
            { id: 'b', text: 'No, I hold my phone while driving', correct: false },
        ]
    },
    {
        id: 'q3',
        question: 'If cargo arrives damaged, you should:',
        options: [
            { id: 'a', text: 'Deny responsibility and leave', correct: false },
            { id: 'b', text: 'Document it, report to support, stay professional', correct: true },
        ]
    },
];

export default function DriverApply() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const generateUploadUrl = useMutation(api.drivers.generateUploadUrl);
    const registerDriver = useMutation(api.drivers.register);

    // Wizard State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        // Step 1: Identity
        name: '',
        nidaNumber: '',
        selfieUri: '',
        selfieStorageId: null as string | null,
        // Step 2: Vehicle
        vehicleType: '',
        plateNumber: '',
        capacity: '',
        // Step 3: Documents
        licenseFrontUri: '',
        licenseFrontStorageId: null as string | null,
        licenseBackUri: '',
        licenseBackStorageId: null as string | null,
        insuranceUri: '',
        insuranceStorageId: null as string | null,
        // Step 4: Interview
        answers: {} as Record<string, string>,
    });

    const updateField = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setError('');
    };

    // Image Picker
    const pickImage = async (field: string) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            updateField(field, result.assets[0].uri);
        }
    };

    const takePhoto = async (field: string) => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Denied', 'Camera access is required.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            updateField(field, result.assets[0].uri);
        }
    };

    // Upload Image to Convex Storage
    const uploadImage = async (uri: string): Promise<string | null> => {
        try {
            const postUrl = await generateUploadUrl();
            const response = await fetch(uri);
            const blob = await response.blob();
            const uploadResponse = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': blob.type || 'image/jpeg' },
                body: blob,
            });
            const { storageId } = await uploadResponse.json();
            return storageId;
        } catch (err) {
            console.error('Upload failed:', err);
            return null;
        }
    };

    // Validation per step
    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 1:
                if (!formData.name.trim()) { setError('Enter your full name'); return false; }
                if (!formData.nidaNumber.trim() || formData.nidaNumber.length < 10) {
                    setError('Enter a valid NIDA ID number');
                    return false;
                }
                if (!formData.selfieUri) { setError('Take a selfie for verification'); return false; }
                return true;
            case 2:
                if (!formData.vehicleType) { setError('Select your vehicle type'); return false; }
                if (!formData.plateNumber.trim()) { setError('Enter your plate number'); return false; }
                if (!formData.capacity) { setError('Select vehicle capacity'); return false; }
                return true;
            case 3:
                if (!formData.licenseFrontUri || !formData.licenseBackUri) {
                    setError('Upload both sides of your license');
                    return false;
                }
                if (!formData.insuranceUri) { setError('Upload insurance sticker'); return false; }
                return true;
            case 4:
                if (Object.keys(formData.answers).length < INTERVIEW_QUESTIONS.length) {
                    setError('Answer all questions');
                    return false;
                }
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else router.back();
    };

    const handleSubmit = async () => {
        if (!validateStep(4)) return;

        setLoading(true);
        setError('');

        try {
            // Upload all images
            const selfieId = await uploadImage(formData.selfieUri);
            const licenseFrontId = await uploadImage(formData.licenseFrontUri);
            const licenseBackId = await uploadImage(formData.licenseBackUri);
            const insuranceId = await uploadImage(formData.insuranceUri);

            if (!selfieId || !licenseFrontId || !licenseBackId) {
                throw new Error('Failed to upload documents');
            }

            // Submit to Convex
            await registerDriver({
                license_number: formData.nidaNumber, // Using NIDA as license for now
                nida_number: formData.nidaNumber,
                vehicle_type: formData.vehicleType,
                vehicle_plate: formData.plateNumber,
                capacity_kg: parseCapacity(formData.capacity),
                payout_method: 'mpesa',
                payout_number: '', // Will be set from profile
                location: { lat: -6.7924, lng: 39.2083 }, // Default DSM
                // Additional fields for pending verification
                selfie_photo_id: selfieId,
                license_front_id: licenseFrontId,
                license_back_id: licenseBackId,
                insurance_id: insuranceId,
            });

            // Success - navigate to waiting room
            router.replace('/driver/status');
        } catch (err: any) {
            setError(err.message || 'Application failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const parseCapacity = (cap: string): number => {
        if (cap.includes('kg')) return parseInt(cap);
        if (cap.includes('Ton')) return parseInt(cap) * 1000;
        return 500;
    };

    // Progress indicator
    const renderProgress = () => (
        <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((s) => (
                <View key={s} style={styles.progressStep}>
                    <View style={[
                        styles.progressDot,
                        s < step && styles.progressDotComplete,
                        s === step && styles.progressDotActive,
                    ]}>
                        {s < step ? (
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                        ) : (
                            <Text style={[styles.progressDotText, s === step && styles.progressDotTextActive]}>
                                {s}
                            </Text>
                        )}
                    </View>
                    {s < 4 && <View style={[styles.progressLine, s < step && styles.progressLineComplete]} />}
                </View>
            ))}
        </View>
    );

    const stepTitles = ['Identity', 'Vehicle', 'Documents', 'Interview'];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Captain's Exam</Text>
                    <Text style={styles.headerSub}>Step {step} of 4: {stepTitles[step - 1]}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* PROGRESS */}
            {renderProgress()}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* STEP 1: IDENTITY */}
                    {step === 1 && (
                        <View style={styles.stepContent}>
                            <Text style={styles.sectionTitle}>Who Are You?</Text>

                            <PremiumInput
                                label="Full Name"
                                value={formData.name}
                                onChangeText={(t) => updateField('name', t)}
                                placeholder="Enter your full name"
                            />

                            <PremiumInput
                                label="NIDA ID Number"
                                value={formData.nidaNumber}
                                onChangeText={(t) => updateField('nidaNumber', t)}
                                placeholder="e.g., 12345678901234567890"
                                keyboardType="number-pad"
                            />

                            <Text style={styles.fieldLabel}>Take a Selfie</Text>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={() => takePhoto('selfieUri')}
                            >
                                {formData.selfieUri ? (
                                    <Image source={{ uri: formData.selfieUri }} style={styles.photoPreview} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <MaterialIcons name="camera-alt" size={40} color="#94A3B8" />
                                        <Text style={styles.photoPlaceholderText}>Tap to capture</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* STEP 2: VEHICLE */}
                    {step === 2 && (
                        <View style={styles.stepContent}>
                            <Text style={styles.sectionTitle}>Your Vehicle</Text>

                            <Text style={styles.fieldLabel}>Select Type</Text>
                            <View style={styles.vehicleGrid}>
                                {VEHICLE_TYPES.map((v) => (
                                    <TouchableOpacity
                                        key={v.id}
                                        style={[
                                            styles.vehicleCard,
                                            formData.vehicleType === v.id && styles.vehicleCardActive,
                                        ]}
                                        onPress={() => updateField('vehicleType', v.id)}
                                    >
                                        <MaterialIcons
                                            name={v.icon as any}
                                            size={32}
                                            color={formData.vehicleType === v.id ? Colors.primary : '#64748B'}
                                        />
                                        <Text style={[
                                            styles.vehicleLabel,
                                            formData.vehicleType === v.id && styles.vehicleLabelActive,
                                        ]}>{v.label}</Text>
                                        <Text style={styles.vehicleCapacity}>{v.capacity}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <PremiumInput
                                label="Plate Number"
                                value={formData.plateNumber}
                                onChangeText={(t) => updateField('plateNumber', t.toUpperCase())}
                                placeholder="e.g., T 123 ABC"
                                autoCapitalize="characters"
                            />

                            <Text style={styles.fieldLabel}>Cargo Capacity</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.capacityScroll}>
                                {CAPACITY_OPTIONS.map((cap) => (
                                    <TouchableOpacity
                                        key={cap}
                                        style={[
                                            styles.capacityChip,
                                            formData.capacity === cap && styles.capacityChipActive,
                                        ]}
                                        onPress={() => updateField('capacity', cap)}
                                    >
                                        <Text style={[
                                            styles.capacityText,
                                            formData.capacity === cap && styles.capacityTextActive,
                                        ]}>{cap}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* STEP 3: DOCUMENTS */}
                    {step === 3 && (
                        <View style={styles.stepContent}>
                            <Text style={styles.sectionTitle}>Documents</Text>

                            <Text style={styles.fieldLabel}>License (Front)</Text>
                            <TouchableOpacity
                                style={styles.docButton}
                                onPress={() => pickImage('licenseFrontUri')}
                            >
                                {formData.licenseFrontUri ? (
                                    <Image source={{ uri: formData.licenseFrontUri }} style={styles.docPreview} />
                                ) : (
                                    <View style={styles.docPlaceholder}>
                                        <MaterialIcons name="badge" size={32} color="#94A3B8" />
                                        <Text style={styles.docPlaceholderText}>Upload Front</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.fieldLabel}>License (Back)</Text>
                            <TouchableOpacity
                                style={styles.docButton}
                                onPress={() => pickImage('licenseBackUri')}
                            >
                                {formData.licenseBackUri ? (
                                    <Image source={{ uri: formData.licenseBackUri }} style={styles.docPreview} />
                                ) : (
                                    <View style={styles.docPlaceholder}>
                                        <MaterialIcons name="badge" size={32} color="#94A3B8" />
                                        <Text style={styles.docPlaceholderText}>Upload Back</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.fieldLabel}>Insurance Sticker</Text>
                            <TouchableOpacity
                                style={styles.docButton}
                                onPress={() => pickImage('insuranceUri')}
                            >
                                {formData.insuranceUri ? (
                                    <Image source={{ uri: formData.insuranceUri }} style={styles.docPreview} />
                                ) : (
                                    <View style={styles.docPlaceholder}>
                                        <MaterialIcons name="verified-user" size={32} color="#94A3B8" />
                                        <Text style={styles.docPlaceholderText}>Upload Insurance</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* STEP 4: INTERVIEW */}
                    {step === 4 && (
                        <View style={styles.stepContent}>
                            <Text style={styles.sectionTitle}>Quick Interview</Text>
                            <Text style={styles.interviewIntro}>
                                Answer these questions to show you're ready to deliver professionally.
                            </Text>

                            {INTERVIEW_QUESTIONS.map((q, idx) => (
                                <View key={q.id} style={styles.questionCard}>
                                    <Text style={styles.questionNumber}>Q{idx + 1}</Text>
                                    <Text style={styles.questionText}>{q.question}</Text>
                                    <View style={styles.optionsContainer}>
                                        {q.options.map((opt) => (
                                            <TouchableOpacity
                                                key={opt.id}
                                                style={[
                                                    styles.optionButton,
                                                    formData.answers[q.id] === opt.id && styles.optionButtonActive,
                                                ]}
                                                onPress={() => updateField('answers', { ...formData.answers, [q.id]: opt.id })}
                                            >
                                                <Text style={[
                                                    styles.optionText,
                                                    formData.answers[q.id] === opt.id && styles.optionTextActive,
                                                ]}>{opt.text}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ERROR */}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* FOOTER BUTTONS */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                {step < 4 ? (
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNext}
                    >
                        <Text style={styles.nextButtonText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Submit Application</Text>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
    headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

    // Progress
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 16,
    },
    progressStep: { flexDirection: 'row', alignItems: 'center' },
    progressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotActive: { backgroundColor: Colors.primary },
    progressDotComplete: { backgroundColor: '#10B981' },
    progressDotText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
    progressDotTextActive: { color: '#FFF' },
    progressLine: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
    progressLineComplete: { backgroundColor: '#10B981' },

    // Content
    content: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 120,
        minHeight: '100%',
    },
    stepContent: { gap: 16 },
    sectionTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 8 },

    // Photo/Doc buttons
    photoButton: {
        width: 150,
        height: 150,
        borderRadius: 75,
        overflow: 'hidden',
        alignSelf: 'center',
        borderWidth: 3,
        borderColor: '#E2E8F0',
    },
    photoPreview: { width: '100%', height: '100%' },
    photoPlaceholder: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: { fontSize: 12, color: '#94A3B8', marginTop: 8 },

    docButton: {
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    docPreview: { width: '100%', height: '100%' },
    docPlaceholder: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    docPlaceholderText: { fontSize: 13, color: '#94A3B8', marginTop: 4 },

    // Vehicle Grid
    vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    vehicleCard: {
        width: '30%',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    vehicleCardActive: { borderColor: Colors.primary, backgroundColor: '#FFF7ED' },
    vehicleLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 4 },
    vehicleLabelActive: { color: Colors.primary },
    vehicleCapacity: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

    // Capacity chips
    capacityScroll: { marginTop: 8 },
    capacityChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
    },
    capacityChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    capacityText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    capacityTextActive: { color: '#FFF' },

    // Interview
    interviewIntro: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 16 },
    questionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    questionNumber: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
    questionText: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
    optionsContainer: { gap: 8 },
    optionButton: {
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    optionButtonActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
    optionText: { fontSize: 14, color: '#475569' },
    optionTextActive: { color: '#059669', fontWeight: '600' },

    // Error
    errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', marginTop: 16, fontWeight: '600' },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    nextButton: {
        backgroundColor: '#0F172A',
        height: 56,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    submitButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    disabledButton: { opacity: 0.7 },
});
