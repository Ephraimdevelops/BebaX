import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

// Step indicator
const STEPS = ['Inventory', 'Complexity', 'Helpers', 'Confirm'];

// Volume tier options
const VOLUME_TIERS = [
    { id: 'small', icon: '🎒', title: 'Small Move', description: 'Bedsitter / Single Room', vehicle: 'Kirikuu' },
    { id: 'medium', icon: '🛋️', title: 'Medium Move', description: '1-2 Bedroom House', vehicle: 'Canter' },
    { id: 'large', icon: '🏠', title: 'Large Move', description: '3+ Bedroom / Office', vehicle: 'Fuso' },
];

export default function BookMoveScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const createMove = useMutation(api.moves.createMove);

    // Step state
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [volumeTier, setVolumeTier] = useState<'small' | 'medium' | 'large'>('small');
    const [floors, setFloors] = useState({ origin: 0, dest: 0 });
    const [hasElevator, setHasElevator] = useState(false);
    const [distanceToParking, setDistanceToParking] = useState<'close' | 'far'>('close');
    const [helperCount, setHelperCount] = useState(0);
    const [needHelpers, setNeedHelpers] = useState(true);
    const [itemsSummary, setItemsSummary] = useState('');
    const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // Quote calculation (simplified client-side preview)
    const calculateQuote = () => {
        const basePrices = { small: 80000, medium: 150000, large: 250000 };
        let quote = basePrices[volumeTier];

        if (!hasElevator) {
            quote += (floors.origin + floors.dest) * 2000;
        }
        if (distanceToParking === 'far') {
            quote += 5000;
        }
        quote += helperCount * 15000;

        return quote;
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            router.back();
        }
    };

    const handleSubmit = async () => {
        if (!pickup || !dropoff) {
            Alert.alert('Missing Location', 'Please select pickup and dropoff locations.');
            return;
        }

        if (!itemsSummary.trim()) {
            Alert.alert('Missing Details', 'Please describe what you are moving.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await createMove({
                volume_tier: volumeTier,
                items_summary: itemsSummary,
                floors,
                has_elevator: hasElevator,
                distance_to_parking: distanceToParking,
                helper_count: helperCount,
                photos: [], // TODO: Add photo picker
                pickup_location: pickup,
                dropoff_location: dropoff,
            });

            Alert.alert(
                'Move Booked! 🚛',
                `Quote: TZS ${result.quote_amount.toLocaleString()}\nVehicle: ${result.vehicle_type}`,
                [{ text: 'OK', onPress: () => router.replace('/') }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to book move');
        } finally {
            setIsLoading(false);
        }
    };

    // Render step content
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return renderInventoryStep();
            case 1:
                return renderComplexityStep();
            case 2:
                return renderHelpersStep();
            case 3:
                return renderConfirmStep();
            default:
                return null;
        }
    };

    // Step 1: Inventory
    const renderInventoryStep = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What are you moving?</Text>
            <Text style={styles.stepSubtitle}>Select the size of your move</Text>

            <View style={styles.tierGrid}>
                {VOLUME_TIERS.map((tier) => (
                    <TouchableOpacity
                        key={tier.id}
                        style={[
                            styles.tierCard,
                            volumeTier === tier.id && styles.tierCardSelected,
                        ]}
                        onPress={() => setVolumeTier(tier.id as any)}
                    >
                        <Text style={styles.tierIcon}>{tier.icon}</Text>
                        <Text style={[styles.tierTitle, volumeTier === tier.id && styles.tierTitleSelected]}>
                            {tier.title}
                        </Text>
                        <Text style={styles.tierDescription}>{tier.description}</Text>
                        <Text style={styles.tierVehicle}>→ {tier.vehicle}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Describe your items</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 2 sofas, dining table, queen bed..."
                    value={itemsSummary}
                    onChangeText={setItemsSummary}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={Colors.textDim}
                />
            </View>
        </View>
    );

    // Step 2: Complexity
    const renderComplexityStep = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How complex is this move?</Text>
            <Text style={styles.stepSubtitle}>This helps us calculate the effort</Text>

            <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Floor at Pickup: {floors.origin}</Text>
                <View style={styles.floorButtons}>
                    {[0, 1, 2, 3, 4, 5].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.floorBtn, floors.origin === f && styles.floorBtnSelected]}
                            onPress={() => setFloors({ ...floors, origin: f })}
                        >
                            <Text style={[styles.floorBtnText, floors.origin === f && styles.floorBtnTextSelected]}>
                                {f === 0 ? 'G' : f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Floor at Dropoff: {floors.dest}</Text>
                <View style={styles.floorButtons}>
                    {[0, 1, 2, 3, 4, 5].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.floorBtn, floors.dest === f && styles.floorBtnSelected]}
                            onPress={() => setFloors({ ...floors, dest: f })}
                        >
                            <Text style={[styles.floorBtnText, floors.dest === f && styles.floorBtnTextSelected]}>
                                {f === 0 ? 'G' : f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                    <Ionicons name="arrow-up-circle" size={24} color={Colors.primary} />
                    <Text style={styles.switchLabel}>Elevator Available?</Text>
                </View>
                <Switch
                    value={hasElevator}
                    onValueChange={setHasElevator}
                    trackColor={{ true: Colors.primary }}
                />
            </View>

            <View style={styles.parkingContainer}>
                <Text style={styles.inputLabel}>Distance to Parking</Text>
                <View style={styles.parkingOptions}>
                    <TouchableOpacity
                        style={[styles.parkingBtn, distanceToParking === 'close' && styles.parkingBtnSelected]}
                        onPress={() => setDistanceToParking('close')}
                    >
                        <Text style={[styles.parkingBtnText, distanceToParking === 'close' && styles.parkingBtnTextSelected]}>
                            &lt; 10m (Close)
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.parkingBtn, distanceToParking === 'far' && styles.parkingBtnSelected]}
                        onPress={() => setDistanceToParking('far')}
                    >
                        <Text style={[styles.parkingBtnText, distanceToParking === 'far' && styles.parkingBtnTextSelected]}>
                            &gt; 50m (Far)
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    // Step 3: Helpers
    const renderHelpersStep = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Need Loading Help?</Text>
            <Text style={styles.stepSubtitle}>Unahitaji Wapagazi?</Text>

            <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                    <MaterialCommunityIcons name="account-group" size={24} color={Colors.primary} />
                    <Text style={styles.switchLabel}>I need helpers</Text>
                </View>
                <Switch
                    value={needHelpers}
                    onValueChange={(value) => {
                        setNeedHelpers(value);
                        setHelperCount(value ? 2 : 0);
                    }}
                    trackColor={{ true: Colors.primary }}
                />
            </View>

            {needHelpers ? (
                <View style={styles.helperSelector}>
                    <Text style={styles.inputLabel}>How many helpers?</Text>
                    <View style={styles.helperButtons}>
                        {[2, 4].map((count) => (
                            <TouchableOpacity
                                key={count}
                                style={[styles.helperBtn, helperCount === count && styles.helperBtnSelected]}
                                onPress={() => setHelperCount(count)}
                            >
                                <Text style={[styles.helperBtnText, helperCount === count && styles.helperBtnTextSelected]}>
                                    {count} Helpers
                                </Text>
                                <Text style={styles.helperPrice}>+TZS {(count * 15000).toLocaleString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ) : (
                <View style={styles.warningBox}>
                    <Ionicons name="warning" size={24} color="#f59e0b" />
                    <Text style={styles.warningText}>
                        ⚠️ If you choose 'No helpers', the driver will NOT load your items.
                        You must provide your own labor.
                    </Text>
                </View>
            )}
        </View>
    );

    // Step 4: Confirm
    const renderConfirmStep = () => (
        <ScrollView style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirm Your Move</Text>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Quote Summary</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Move Size</Text>
                    <Text style={styles.summaryValue}>{VOLUME_TIERS.find(t => t.id === volumeTier)?.title}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Floors</Text>
                    <Text style={styles.summaryValue}>{floors.origin} → {floors.dest}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Elevator</Text>
                    <Text style={styles.summaryValue}>{hasElevator ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Helpers</Text>
                    <Text style={styles.summaryValue}>{helperCount} people</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Estimated Total</Text>
                    <Text style={styles.totalValue}>TZS {calculateQuote().toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.locationSection}>
                <Text style={styles.inputLabel}>Pickup Location</Text>
                <GooglePlacesAutocomplete
                    placeholder="Enter pickup address"
                    onPress={(data, details) => {
                        setPickup({
                            lat: details?.geometry?.location.lat || 0,
                            lng: details?.geometry?.location.lng || 0,
                            address: data.description,
                        });
                    }}
                    query={{ key: GOOGLE_API_KEY, language: 'en', components: 'country:tz' }}
                    fetchDetails={true}
                    styles={{
                        textInput: styles.locationInput,
                        container: { flex: 0 },
                    }}
                />
            </View>

            <View style={styles.locationSection}>
                <Text style={styles.inputLabel}>Dropoff Location</Text>
                <GooglePlacesAutocomplete
                    placeholder="Enter dropoff address"
                    onPress={(data, details) => {
                        setDropoff({
                            lat: details?.geometry?.location.lat || 0,
                            lng: details?.geometry?.location.lng || 0,
                            address: data.description,
                        });
                    }}
                    query={{ key: GOOGLE_API_KEY, language: 'en', components: 'country:tz' }}
                    fetchDetails={true}
                    styles={{
                        textInput: styles.locationInput,
                        container: { flex: 0 },
                    }}
                />
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book a Move</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                {STEPS.map((step, index) => (
                    <View key={step} style={styles.progressItem}>
                        <View style={[
                            styles.progressDot,
                            index <= currentStep && styles.progressDotActive,
                        ]}>
                            {index < currentStep && (
                                <Ionicons name="checkmark" size={14} color="white" />
                            )}
                        </View>
                        <Text style={[
                            styles.progressLabel,
                            index === currentStep && styles.progressLabelActive,
                        ]}>
                            {step}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Step Content */}
            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                {renderStep()}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
                {currentStep < STEPS.length - 1 ? (
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.nextBtn}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.nextBtnText}>Book Move</Text>
                                <MaterialCommunityIcons name="truck-check" size={20} color="white" />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
    },
    progressItem: {
        alignItems: 'center',
        flex: 1,
    },
    progressDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressDotActive: {
        backgroundColor: Colors.primary,
    },
    progressLabel: {
        fontSize: 11,
        color: Colors.textDim,
        marginTop: 4,
    },
    progressLabelActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    stepContent: {
        padding: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 16,
        color: Colors.textDim,
        marginBottom: 24,
    },
    tierGrid: {
        gap: 12,
    },
    tierCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    tierCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF7ED',
    },
    tierIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    tierTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    tierTitleSelected: {
        color: Colors.primary,
    },
    tierDescription: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 4,
    },
    tierVehicle: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
        marginTop: 8,
    },
    inputContainer: {
        marginTop: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    sliderContainer: {
        marginBottom: 24,
    },
    sliderLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 12,
    },
    floorButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    floorBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    floorBtnSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    floorBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    floorBtnTextSelected: {
        color: 'white',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    switchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    parkingContainer: {
        marginTop: 8,
    },
    parkingOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    parkingBtn: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    parkingBtnSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    parkingBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    parkingBtnTextSelected: {
        color: 'white',
    },
    helperSelector: {
        marginTop: 16,
    },
    helperButtons: {
        gap: 12,
    },
    helperBtn: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    helperBtnSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF7ED',
    },
    helperBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    helperBtnTextSelected: {
        color: Colors.primary,
    },
    helperPrice: {
        fontSize: 14,
        color: Colors.textDim,
        marginTop: 4,
    },
    warningBox: {
        backgroundColor: '#FEF3C7',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        flexDirection: 'row',
        gap: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.textDim,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    totalRow: {
        marginTop: 8,
        borderBottomWidth: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
    },
    locationSection: {
        marginBottom: 16,
    },
    locationInput: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    bottomActions: {
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    nextBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
});
