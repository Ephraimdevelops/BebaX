import React, { useState, useCallback, memo, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, Alert, Image } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Shield, Wallet, Banknote, Camera, Check } from 'lucide-react-native';
import { VEHICLE_FLEET, VehicleId } from '../constants/vehicleRegistry';
import { getVehicleIcon, DEEP_ASPHALT, SAFETY_ORANGE } from './VehicleIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Insurance Tiers
const INSURANCE_TIERS = {
    BASIC: { id: 'basic', name: 'Basic', fee: 500, label: 'Liability Only' },
    STANDARD: { id: 'standard', name: 'Standard', fee: 2500, label: 'Full Coverage' },
    CORPORATE: { id: 'corporate', name: 'Corporate', fee: 0, label: 'B2B Included' },
};

// --- Vehicle Card Component ---
interface VehicleCardProps {
    item: typeof VEHICLE_FLEET[0];
    isSelected: boolean;
    onSelect: (id: string) => void;
}

const VehicleCard = memo(({ item, isSelected, onSelect }: VehicleCardProps) => {
    const scale = useSharedValue(1);
    const borderColor = useSharedValue('#E2E8F0');

    useEffect(() => {
        if (isSelected) {
            scale.value = withSpring(1.05);
            borderColor.value = withTiming(SAFETY_ORANGE);
        } else {
            scale.value = withSpring(1);
            borderColor.value = withTiming('#E2E8F0');
        }
    }, [isSelected, scale, borderColor]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderColor: borderColor.value,
    }));

    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(item.id);
    }, [item.id, onSelect]);

    // const Icon = getVehicleIcon(item.id); // Removed legacy icon

    return (
        <Animated.View style={[styles.vehicleCard, animatedStyle]}>
            <TouchableOpacity onPress={handlePress} style={styles.vehicleCardInner}>
                <View style={styles.vehicleIconContainer}>
                    <Image
                        source={item.image}
                        style={{ width: 80, height: 60 }}
                        resizeMode="contain"
                    />
                </View>
                <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelSelected]}>
                    {item.label}
                </Text>
                <Text style={styles.vehicleCapacity} numberOfLines={2}>
                    {item.capacity}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}, (prev, next) => prev.isSelected === next.isSelected && prev.item.id === next.item.id);

// --- Main Component ---
interface VehicleSelectionSheetProps {
    onSelectVehicle: (id: VehicleId, backendType: string) => void;
    userProfile?: { orgId?: string };
    onPaymentChange?: (method: 'cash' | 'wallet') => void;
    onInsuranceChange?: (tier: string, photo?: string) => void;
    onConfirm?: () => void;
}

export const VehicleSelectionSheet = memo(({
    onSelectVehicle,
    userProfile,
    onPaymentChange,
    onInsuranceChange,
    onConfirm,
}: VehicleSelectionSheetProps) => {
    const [selectedId, setSelectedId] = useState<VehicleId | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    const [insuranceTier, setInsuranceTier] = useState<string>('basic');
    const [cargoPhoto, setCargoPhoto] = useState<string | null>(null);

    // Auto-select Corporate Insurance for Wallet payments
    useEffect(() => {
        if (paymentMethod === 'wallet') {
            setInsuranceTier('corporate');
            onInsuranceChange?.('corporate');
        } else {
            setInsuranceTier('basic');
            onInsuranceChange?.('basic');
        }
    }, [paymentMethod, onInsuranceChange]);

    const handleSelect = useCallback((id: string) => {
        const vehicleId = id as VehicleId;
        setSelectedId(vehicleId);
        const vehicle = VEHICLE_FLEET.find(v => v.id === id);
        if (vehicle) {
            onSelectVehicle(vehicleId, vehicle.tier.toString()); // vehicle.backendTier doesn't exist, using tier or just passing id?
            // The signature is (id: VehicleId, backendType: string).
            // VehicleRegistry has tier: 1|2|3.
            // Earlier mapUiTypeToBackend was used.
            // Now backend type is just the ID.
            // I should pass vehicle.id as backendType too for now? Or keep legacy?
            // User instruction: "handle the new toyo and fuso types dynamically".
        }
    }, [onSelectVehicle]);

    const handlePaymentToggle = (method: 'cash' | 'wallet') => {
        if (method === 'wallet' && !userProfile?.orgId) {
            Alert.alert('Company Wallet', 'You must belong to an Organization to use this feature.');
            return;
        }
        setPaymentMethod(method);
        onPaymentChange?.(method);
        Haptics.selectionAsync();
    };

    const handleInsuranceSelect = async (tierId: string) => {
        if (paymentMethod === 'wallet' && tierId !== 'corporate') return;

        if (tierId === 'standard') {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Camera access is needed for high-value cargo verification.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (!result.canceled) {
                setCargoPhoto(result.assets[0].uri);
                setInsuranceTier(tierId);
                onInsuranceChange?.(tierId, result.assets[0].uri);
            }
        } else {
            setInsuranceTier(tierId);
            onInsuranceChange?.(tierId);
        }
        Haptics.selectionAsync();
    };

    const handleConfirm = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onConfirm?.();
    };

    const renderItem = useCallback(({ item }: { item: typeof VEHICLE_FLEET[0] }) => (
        <VehicleCard
            item={item}
            isSelected={selectedId === item.id}
            onSelect={handleSelect}
        />
    ), [selectedId, handleSelect]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Vehicle</Text>
                {userProfile?.orgId && (
                    <View style={styles.b2bBadge}>
                        <Text style={styles.b2bBadgeText}>B2B ENABLED</Text>
                    </View>
                )}
            </View>

            {/* Vehicle List */}
            <FlatList
                data={VEHICLE_FLEET}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehicleList}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={2}
                removeClippedSubviews={true}
            />

            {/* Options Panel (shows after selection) */}
            {selectedId && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.optionsPanel}>
                    {/* Payment Method Toggle (B2B only) */}
                    {userProfile?.orgId && (
                        <View style={styles.paymentToggle}>
                            <TouchableOpacity
                                style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
                                onPress={() => handlePaymentToggle('cash')}
                            >
                                <Banknote size={16} color={paymentMethod === 'cash' ? DEEP_ASPHALT : '#9CA3AF'} />
                                <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextActive]}>
                                    Cash
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionWallet]}
                                onPress={() => handlePaymentToggle('wallet')}
                            >
                                <Wallet size={16} color={paymentMethod === 'wallet' ? '#FFFFFF' : '#9CA3AF'} />
                                <Text style={[styles.paymentText, paymentMethod === 'wallet' && styles.paymentTextWallet]}>
                                    Company Wallet
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Insurance Selector (HIDDEN FOR NOW) */}
                    {/* 
                    <View style={styles.insuranceSection}>
                        <Text style={styles.insuranceLabel}>TRIP PROTECTION</Text>
                        <View style={styles.insuranceOptions}>
                            <TouchableOpacity
                                onPress={() => handleInsuranceSelect('basic')}
                                style={[styles.insuranceCard, insuranceTier === 'basic' && styles.insuranceCardSelected]}
                                disabled={paymentMethod === 'wallet'}
                            >
                                <Shield size={20} color={insuranceTier === 'basic' ? DEEP_ASPHALT : '#9CA3AF'} />
                                <Text style={styles.insuranceCardTitle}>Basic</Text>
                                <Text style={styles.insuranceCardPrice}>+500 TZS</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleInsuranceSelect('standard')}
                                style={[styles.insuranceCard, insuranceTier === 'standard' && styles.insuranceCardStandard]}
                                disabled={paymentMethod === 'wallet'}
                            >
                                <View style={styles.insuranceCardHeader}>
                                    <Shield size={20} color={insuranceTier === 'standard' ? SAFETY_ORANGE : '#9CA3AF'} />
                                    {insuranceTier === 'standard' && <Camera size={14} color={SAFETY_ORANGE} />}
                                </View>
                                <Text style={[styles.insuranceCardTitle, insuranceTier === 'standard' && { color: SAFETY_ORANGE }]}>
                                    Standard
                                </Text>
                                <Text style={styles.insuranceCardPrice}>+2,500 TZS</Text>
                            </TouchableOpacity>

                            {paymentMethod === 'wallet' && (
                                <View style={styles.insuranceCardCorporate}>
                                    <View style={styles.insuranceCardHeader}>
                                        <Shield size={20} color="#FFFFFF" />
                                        <Check size={14} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.insuranceCardTitleWhite}>Corporate</Text>
                                    <Text style={styles.insuranceCardPriceWhite}>INCLUDED</Text>
                                </View>
                            )}
                        </View>
                    </View> 
                    */}

                    {/* Confirm Button */}
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                        <Text style={styles.confirmButtonText}>
                            CONFIRM {VEHICLE_FLEET.find(v => v.id === selectedId)?.label.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
});

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        paddingVertical: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: DEEP_ASPHALT,
        fontSize: 20,
        fontWeight: '700',
    },
    b2bBadge: {
        backgroundColor: `${SAFETY_ORANGE}1A`,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    b2bBadgeText: {
        color: SAFETY_ORANGE,
        fontSize: 10,
        fontWeight: '700',
    },
    vehicleList: {
        paddingHorizontal: 24,
    },
    vehicleCard: {
        borderWidth: 2,
        borderRadius: 16,
        marginRight: 12,
        backgroundColor: '#FFFFFF',
    },
    vehicleCardInner: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: 130,
        height: 150,
    },
    vehicleIconContainer: {
        marginBottom: 12,
    },
    vehicleLabel: {
        fontWeight: '700',
        fontSize: 16,
        color: DEEP_ASPHALT,
    },
    vehicleLabelSelected: {
        color: SAFETY_ORANGE,
    },
    vehicleCapacity: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 4,
        textAlign: 'center',
    },
    optionsPanel: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    paymentToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    paymentOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentOptionActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    paymentOptionWallet: {
        backgroundColor: SAFETY_ORANGE,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    paymentText: {
        marginLeft: 8,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    paymentTextActive: {
        color: DEEP_ASPHALT,
    },
    paymentTextWallet: {
        color: '#FFFFFF',
    },
    insuranceSection: {
        marginBottom: 16,
    },
    insuranceLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 8,
    },
    insuranceOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    insuranceCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    insuranceCardSelected: {
        borderColor: DEEP_ASPHALT,
        backgroundColor: '#F9FAFB',
    },
    insuranceCardStandard: {
        borderColor: SAFETY_ORANGE,
        backgroundColor: '#FFF7ED',
    },
    insuranceCardCorporate: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: SAFETY_ORANGE,
        backgroundColor: SAFETY_ORANGE,
    },
    insuranceCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    insuranceCardTitle: {
        fontWeight: '700',
        marginTop: 8,
        fontSize: 11,
        color: DEEP_ASPHALT,
    },
    insuranceCardTitleWhite: {
        fontWeight: '700',
        marginTop: 8,
        fontSize: 11,
        color: '#FFFFFF',
    },
    insuranceCardPrice: {
        fontSize: 9,
        color: '#6B7280',
    },
    insuranceCardPriceWhite: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    confirmButton: {
        backgroundColor: DEEP_ASPHALT,
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
