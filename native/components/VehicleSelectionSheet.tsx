import React, { useState, useCallback, memo, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Image, Alert } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { styled } from 'nativewind';
import { VEHICLE_FLEET } from '../constants/vehicleRegistry';
import { getIcon } from './VehicleIcons';
import { Shield, Wallet, Banknote, Camera, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const { width } = Dimensions.get('window');

// Insurance Tiers (Matching Backend)
const INSURANCE_TIERS = {
    BASIC: { id: 'basic', name: 'Basic', fee: 500, label: 'Liability Only' },
    STANDARD: { id: 'standard', name: 'Standard', fee: 2500, label: 'Full Coverage' },
    CORPORATE: { id: 'corporate', name: 'Corporate', fee: 0, label: 'B2B Included' },
};

const VehicleCard = memo(({ item, isSelected, onSelect }: any) => {
    const scale = useSharedValue(1);
    const borderColor = useSharedValue('#E2E8F0');

    useEffect(() => {
        if (isSelected) {
            scale.value = withSpring(1.05);
            borderColor.value = withTiming('#FF5722');
        } else {
            scale.value = withSpring(1);
            borderColor.value = withTiming('#E2E8F0');
        }
    }, [isSelected]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderColor: borderColor.value,
    }));

    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(item.id);
    }, [item.id, onSelect]);

    const Icon = getIcon(item.id);

    return (
        <Animated.View style={[animatedStyle, { borderWidth: 2, borderRadius: 16, marginRight: 12, backgroundColor: '#FFFFFF' }]}>
            <StyledTouchableOpacity
                onPress={handlePress}
                className="p-4 items-center justify-center w-[130px] h-[150px]"
            >
                <View className="mb-3">
                    <Icon color={isSelected ? '#FF5722' : '#121212'} width={40} height={40} />
                </View>
                <StyledText className={`font-bold text-lg ${isSelected ? 'text-[#FF5722]' : 'text-[#121212]'}`}>
                    {item.label}
                </StyledText>
                <StyledText className="text-xs text-gray-500 mt-1 text-center" numberOfLines={2}>
                    {item.capacity}
                </StyledText>
            </StyledTouchableOpacity>
        </Animated.View>
    );
}, (prev, next) => prev.isSelected === next.isSelected && prev.item.id === next.item.id);

interface VehicleSelectionSheetProps {
    onSelectVehicle: (id: string) => void;
    userProfile?: any; // Passed from parent
    onPaymentChange?: (method: 'cash' | 'wallet') => void;
    onInsuranceChange?: (tier: string, photo?: string) => void;
}

export const VehicleSelectionSheet = memo(({ onSelectVehicle, userProfile, onPaymentChange, onInsuranceChange }: VehicleSelectionSheetProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    const [insuranceTier, setInsuranceTier] = useState<string>('basic');
    const [cargoPhoto, setCargoPhoto] = useState<string | null>(null);

    // Auto-select Corporate Insurance for Wallet
    useEffect(() => {
        if (paymentMethod === 'wallet') {
            setInsuranceTier('corporate');
            if (onInsuranceChange) onInsuranceChange('corporate');
        } else {
            setInsuranceTier('basic'); // Reset to basic for cash
            if (onInsuranceChange) onInsuranceChange('basic');
        }
    }, [paymentMethod]);

    const handleSelect = useCallback((id: string) => {
        setSelectedId(id);
        onSelectVehicle(id);
    }, [onSelectVehicle]);

    const handlePaymentToggle = (method: 'cash' | 'wallet') => {
        if (method === 'wallet' && !userProfile?.orgId) {
            Alert.alert("Company Wallet", "You must belong to an Organization to use this feature.");
            return;
        }
        setPaymentMethod(method);
        if (onPaymentChange) onPaymentChange(method);
        Haptics.selectionAsync();
    };

    const handleInsuranceSelect = async (tierId: string) => {
        if (paymentMethod === 'wallet' && tierId !== 'corporate') return; // Locked for wallet

        if (tierId === 'standard') {
            // Require Photo
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "Camera access is needed for high-value cargo verification.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (!result.canceled) {
                setCargoPhoto(result.assets[0].uri);
                setInsuranceTier(tierId);
                if (onInsuranceChange) onInsuranceChange(tierId, result.assets[0].uri);
            }
        } else {
            setInsuranceTier(tierId);
            if (onInsuranceChange) onInsuranceChange(tierId);
        }
        Haptics.selectionAsync();
    };

    const renderItem = useCallback(({ item }: any) => (
        <VehicleCard
            item={item}
            isSelected={selectedId === item.id}
            onSelect={handleSelect}
        />
    ), [selectedId, handleSelect]);

    return (
        <StyledView
            className="bg-white w-full py-6 rounded-t-3xl border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
            renderToHardwareTextureAndroid={true}
        >
            {/* Header */}
            <View className="px-6 mb-4 flex-row justify-between items-center">
                <StyledText className="text-[#121212] text-xl font-bold font-sans">Select Vehicle</StyledText>
                {userProfile?.orgId && (
                    <View className="bg-[#FF5722]/10 px-2 py-1 rounded-md">
                        <StyledText className="text-[#FF5722] text-xs font-bold">B2B ENABLED</StyledText>
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
                contentContainerStyle={{ paddingHorizontal: 24 }}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={2}
                removeClippedSubviews={true}
            />

            {/* B2B / Insurance Section */}
            {selectedId && (
                <Animated.View entering={withSpring({ opacity: 0, translateY: 20 })} className="px-6 mt-6 space-y-4">

                    {/* Payment Method Toggle */}
                    {userProfile?.orgId && (
                        <View className="flex-row bg-gray-100 p-1 rounded-xl mb-2">
                            <StyledTouchableOpacity
                                className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${paymentMethod === 'cash' ? 'bg-white shadow-sm' : ''}`}
                                onPress={() => handlePaymentToggle('cash')}
                            >
                                <Banknote size={16} color={paymentMethod === 'cash' ? '#121212' : '#9CA3AF'} />
                                <StyledText className={`ml-2 font-bold ${paymentMethod === 'cash' ? 'text-[#121212]' : 'text-gray-400'}`}>Cash</StyledText>
                            </StyledTouchableOpacity>
                            <StyledTouchableOpacity
                                className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${paymentMethod === 'wallet' ? 'bg-[#FF5722] shadow-sm' : ''}`}
                                onPress={() => handlePaymentToggle('wallet')}
                            >
                                <Wallet size={16} color={paymentMethod === 'wallet' ? '#FFFFFF' : '#9CA3AF'} />
                                <StyledText className={`ml-2 font-bold ${paymentMethod === 'wallet' ? 'text-white' : 'text-gray-400'}`}>Company Wallet</StyledText>
                            </StyledTouchableOpacity>
                        </View>
                    )}

                    {/* Insurance Selector */}
                    <View>
                        <StyledText className="text-xs font-bold text-gray-400 uppercase mb-2">Trip Protection</StyledText>
                        <View className="flex-row space-x-2">
                            {/* Basic */}
                            <StyledTouchableOpacity
                                onPress={() => handleInsuranceSelect('basic')}
                                className={`flex-1 p-3 rounded-xl border-2 ${insuranceTier === 'basic' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white'}`}
                                disabled={paymentMethod === 'wallet'}
                            >
                                <Shield size={20} color={insuranceTier === 'basic' ? '#121212' : '#9CA3AF'} />
                                <StyledText className="font-bold mt-2 text-xs">Basic</StyledText>
                                <StyledText className="text-[10px] text-gray-500">+500 TZS</StyledText>
                            </StyledTouchableOpacity>

                            {/* Standard */}
                            <StyledTouchableOpacity
                                onPress={() => handleInsuranceSelect('standard')}
                                className={`flex-1 p-3 rounded-xl border-2 ${insuranceTier === 'standard' ? 'border-[#FF5722] bg-orange-50' : 'border-gray-100 bg-white'}`}
                                disabled={paymentMethod === 'wallet'}
                            >
                                <View className="flex-row justify-between">
                                    <Shield size={20} color={insuranceTier === 'standard' ? '#FF5722' : '#9CA3AF'} />
                                    {insuranceTier === 'standard' && <Camera size={14} color="#FF5722" />}
                                </View>
                                <StyledText className={`font-bold mt-2 text-xs ${insuranceTier === 'standard' ? 'text-[#FF5722]' : 'text-gray-900'}`}>Standard</StyledText>
                                <StyledText className="text-[10px] text-gray-500">+2,500 TZS</StyledText>
                            </StyledTouchableOpacity>

                            {/* Corporate */}
                            {paymentMethod === 'wallet' && (
                                <StyledTouchableOpacity
                                    className="flex-1 p-3 rounded-xl border-2 border-[#FF5722] bg-[#FF5722]"
                                    disabled
                                >
                                    <View className="flex-row justify-between">
                                        <Shield size={20} color="#FFFFFF" />
                                        <Check size={14} color="#FFFFFF" />
                                    </View>
                                    <StyledText className="font-bold mt-2 text-xs text-white">Corporate</StyledText>
                                    <StyledText className="text-[10px] text-white/80">INCLUDED</StyledText>
                                </StyledTouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Confirm Button */}
                    <StyledTouchableOpacity
                        className="bg-[#121212] w-full py-4 rounded-xl items-center shadow-lg mt-2"
                        onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
                    >
                        <StyledText className="text-white font-bold text-lg">
                            CONFIRM {VEHICLE_FLEET.find(v => v.id === selectedId)?.label.toUpperCase()}
                        </StyledText>
                    </StyledTouchableOpacity>
                </Animated.View>
            )}
        </StyledView>
    );
});
