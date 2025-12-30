import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import * as Location from 'expo-location';

const INDUSTRIES = [
    { id: 'retail', label: 'Retail & Shops', icon: 'store' },
    { id: 'wholesale', label: 'Wholesale', icon: 'warehouse' },
    { id: 'construction', label: 'Construction', icon: 'build' },
    { id: 'agriculture', label: 'Agriculture', icon: 'eco' },
    { id: 'ecommerce', label: 'E-Commerce', icon: 'shopping-cart' },
    { id: 'manufacturing', label: 'Manufacturing', icon: 'precision-manufacturing' },
    { id: 'food', label: 'Food & Bev', icon: 'restaurant' },
    { id: 'other', label: 'Other', icon: 'category' },
];

const LOGISTICS_NEEDS = [
    { id: 'regular_delivery', label: 'Regular Deliveries', desc: 'Daily/weekly scheduled pickups' },
    { id: 'bulk_transport', label: 'Bulk Transport', desc: 'Large cargo & container moves' },
    { id: 'last_mile', label: 'Last Mile Delivery', desc: 'Customer doorstep delivery' },
    { id: 'express', label: 'Express/Same-Day', desc: 'Urgent time-sensitive cargo' },
    { id: 'cold_chain', label: 'Cold Chain', desc: 'Temperature-controlled goods' },
];

const VOLUME_OPTIONS = [
    { id: 'small', label: '1-10/mo', value: 10 },
    { id: 'medium', label: '10-50/mo', value: 50 },
    { id: 'large', label: '50-200/mo', value: 200 },
    { id: 'enterprise', label: '200+/mo', value: 500 },
];

export default function ListBusinessScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [gettingLocation, setGettingLocation] = useState(false);

    // Form State
    const [businessName, setBusinessName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [locationText, setLocationText] = useState('');
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [industry, setIndustry] = useState('');
    const [logisticsNeeds, setLogisticsNeeds] = useState<string[]>([]);
    const [volume, setVolume] = useState('');
    const [specialRequirements, setSpecialRequirements] = useState('');

    const createOrg = useMutation(api.b2b.createOrganization);

    const toggleNeed = (id: string) => {
        setLogisticsNeeds(prev =>
            prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
        );
    };

    // Get current GPS location
    const getCurrentLocation = async () => {
        setGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Please allow location access to use this feature.");
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            setLocationCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });

            // Reverse geocode to get address
            const addresses = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            });

            if (addresses.length > 0) {
                const addr = addresses[0];
                const formatted = [addr.street, addr.district, addr.city, addr.region]
                    .filter(Boolean).join(', ');
                setLocationText(formatted || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
            }

            Alert.alert("Location Set", "Your current location has been captured for accurate pickups.");
        } catch (error) {
            Alert.alert("Error", "Could not get your location. Please enter manually.");
        } finally {
            setGettingLocation(false);
        }
    };

    const handleSubmit = async () => {
        if (!businessName.trim() || !email.trim() || !phone.trim()) {
            Alert.alert("Missing Information", "Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const volumeValue = VOLUME_OPTIONS.find(v => v.id === volume)?.value || 10;

            await createOrg({
                name: businessName,
                adminEmail: email,
                phone: phone,
                contactPerson: contactName,
                location: locationCoords ? {
                    lat: locationCoords.lat,
                    lng: locationCoords.lng,
                    address: locationText,
                } : undefined,
                industry: industry,
                logisticsNeeds: logisticsNeeds,
                expectedMonthlyVolume: volumeValue,
                specialRequirements: specialRequirements || undefined,
            });

            Alert.alert(
                "🎉 Welcome to BebaX Business!",
                "Your business is registered! You can now:\n\n• Post logistics job listings\n• Get bids from verified drivers\n• Track all shipments in real-time\n\nOur team will verify your account within 24 hours.",
                [{ text: "Go to My Dashboard", onPress: () => router.replace('/(customer)/my-business') }]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to register. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const canProceed = () => {
        if (step === 1) return businessName && email && phone;
        if (step === 2) return industry && (locationText || locationCoords);
        if (step === 3) return logisticsNeeds.length > 0 && volume;
        return true;
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
                    <MaterialIcons name={step > 1 ? "arrow-back" : "close"} size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Join BebaX Business</Text>
                <Text style={styles.stepIndicator}>{step}/3</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* STEP 1: Basic Info */}
                {step === 1 && (
                    <View>
                        <Text style={styles.stepTitle}>Tell us about your business</Text>
                        <Text style={styles.stepSubtitle}>We'll use this to set up your BebaX Business account</Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Business Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Kariakoo Wholesale Ltd"
                                placeholderTextColor={Colors.textDim}
                                value={businessName}
                                onChangeText={setBusinessName}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Contact Person</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Your full name"
                                placeholderTextColor={Colors.textDim}
                                value={contactName}
                                onChangeText={setContactName}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Business Email *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="info@yourbusiness.co.tz"
                                placeholderTextColor={Colors.textDim}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+255 7XX XXX XXX"
                                placeholderTextColor={Colors.textDim}
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        {/* Value Proposition Card */}
                        <View style={styles.benefitsCard}>
                            <Text style={styles.benefitsTitle}>What BebaX Business offers:</Text>
                            <BenefitItem icon="verified" text="Verified & vetted drivers" />
                            <BenefitItem icon="receipt-long" text="Monthly invoicing (pay later)" />
                            <BenefitItem icon="insights" text="Real-time tracking & analytics" />
                            <BenefitItem icon="support-agent" text="Dedicated account manager" />
                            <BenefitItem icon="local-offer" text="Volume discounts up to 25%" />
                        </View>
                    </View>
                )}

                {/* STEP 2: Location & Industry */}
                {step === 2 && (
                    <View>
                        <Text style={styles.stepTitle}>Where is your business?</Text>
                        <Text style={styles.stepSubtitle}>This helps drivers locate you for pickups</Text>

                        {/* GPS Location Button */}
                        <TouchableOpacity
                            style={styles.gpsButton}
                            onPress={getCurrentLocation}
                            disabled={gettingLocation}
                        >
                            {gettingLocation ? (
                                <ActivityIndicator color={Colors.primary} />
                            ) : (
                                <>
                                    <MaterialIcons name="my-location" size={22} color={Colors.primary} />
                                    <Text style={styles.gpsButtonText}>
                                        {locationCoords ? 'Location Captured ✓' : 'Use Current Location'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Business Address *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="e.g. Plot 123, Kariakoo Market, Dar es Salaam"
                                placeholderTextColor={Colors.textDim}
                                multiline
                                numberOfLines={3}
                                value={locationText}
                                onChangeText={setLocationText}
                            />
                            {locationCoords && (
                                <Text style={styles.coordsText}>
                                    📍 GPS: {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
                                </Text>
                            )}
                        </View>

                        <Text style={styles.label}>Industry *</Text>
                        <View style={styles.optionsGrid}>
                            {INDUSTRIES.map((ind) => (
                                <TouchableOpacity
                                    key={ind.id}
                                    style={[
                                        styles.industryCard,
                                        industry === ind.id && styles.industryCardActive
                                    ]}
                                    onPress={() => setIndustry(ind.id)}
                                >
                                    <MaterialIcons
                                        name={ind.icon as any}
                                        size={22}
                                        color={industry === ind.id ? Colors.primary : Colors.textDim}
                                    />
                                    <Text style={[
                                        styles.industryLabel,
                                        industry === ind.id && styles.industryLabelActive
                                    ]}>{ind.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* STEP 3: Logistics Needs */}
                {step === 3 && (
                    <View>
                        <Text style={styles.stepTitle}>What logistics services do you need?</Text>
                        <Text style={styles.stepSubtitle}>We'll match you with the right drivers</Text>

                        {LOGISTICS_NEEDS.map((need) => (
                            <TouchableOpacity
                                key={need.id}
                                style={[
                                    styles.needCard,
                                    logisticsNeeds.includes(need.id) && styles.needCardActive
                                ]}
                                onPress={() => toggleNeed(need.id)}
                            >
                                <View style={styles.needContent}>
                                    <Text style={[
                                        styles.needLabel,
                                        logisticsNeeds.includes(need.id) && styles.needLabelActive
                                    ]}>{need.label}</Text>
                                    <Text style={styles.needDesc}>{need.desc}</Text>
                                </View>
                                <View style={[
                                    styles.checkbox,
                                    logisticsNeeds.includes(need.id) && styles.checkboxActive
                                ]}>
                                    {logisticsNeeds.includes(need.id) && (
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}

                        <Text style={[styles.label, { marginTop: 24 }]}>Expected Monthly Trips *</Text>
                        <View style={styles.volumeRow}>
                            {VOLUME_OPTIONS.map((vol) => (
                                <TouchableOpacity
                                    key={vol.id}
                                    style={[
                                        styles.volumeChip,
                                        volume === vol.id && styles.volumeChipActive
                                    ]}
                                    onPress={() => setVolume(vol.id)}
                                >
                                    <Text style={[
                                        styles.volumeText,
                                        volume === vol.id && styles.volumeTextActive
                                    ]}>{vol.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Special Requirements (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="e.g. Need trucks with covers for electronics, require delivery photos..."
                                placeholderTextColor={Colors.textDim}
                                multiline
                                numberOfLines={3}
                                value={specialRequirements}
                                onChangeText={setSpecialRequirements}
                            />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Action */}
            <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.actionButton, !canProceed() && styles.actionButtonDisabled]}
                    onPress={() => step < 3 ? setStep(step + 1) : handleSubmit()}
                    disabled={!canProceed() || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.actionButtonText}>
                            {step < 3 ? 'Continue' : 'Complete Registration'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const BenefitItem = ({ icon, text }: { icon: string; text: string }) => (
    <View style={styles.benefitRow}>
        <MaterialIcons name={icon as any} size={18} color={Colors.primary} />
        <Text style={styles.benefitText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    stepIndicator: {
        fontSize: 14,
        color: Colors.textDim,
        fontWeight: '600',
    },
    progressContainer: {
        height: 4,
        backgroundColor: Colors.border,
        marginHorizontal: 16,
        borderRadius: 2,
    },
    progressBar: {
        height: 4,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    content: {
        padding: 24,
        paddingBottom: 120,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 14,
        color: Colors.textDim,
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.surfaceOff,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    gpsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF5F0',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        gap: 10,
    },
    gpsButtonText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 15,
    },
    coordsText: {
        fontSize: 12,
        color: Colors.success,
        marginTop: 8,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 8,
    },
    industryCard: {
        width: '48%',
        backgroundColor: Colors.surfaceOff,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    industryCardActive: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF5F0',
    },
    industryLabel: {
        fontSize: 11,
        color: Colors.textDim,
        marginTop: 6,
        textAlign: 'center',
    },
    industryLabelActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    needCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surfaceOff,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    needCardActive: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF5F0',
    },
    needContent: {
        flex: 1,
    },
    needLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    needLabelActive: {
        color: Colors.primary,
    },
    needDesc: {
        fontSize: 11,
        color: Colors.textDim,
        marginTop: 2,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    volumeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
        marginBottom: 24,
    },
    volumeChip: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: Colors.surfaceOff,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    volumeChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    volumeText: {
        fontSize: 12,
        color: Colors.text,
        fontWeight: '500',
    },
    volumeTextActive: {
        color: 'white',
    },
    benefitsCard: {
        backgroundColor: Colors.background,
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
    },
    benefitsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textLight,
        marginBottom: 14,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    benefitText: {
        fontSize: 13,
        color: Colors.textLight,
        marginLeft: 10,
    },
    bottomAction: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    actionButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
