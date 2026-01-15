import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
// Fuel Icon
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Admin Dark Theme
const Colors = {
    background: '#0A0A0A',
    surface: '#141414',
    surfaceLight: '#1E1E1E',
    primary: '#FF6B35',
    accent: '#00D4AA',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#FFFFFF',
    textDim: '#6B7280',
    border: '#2D2D2D',
};

type VehicleType = 'boda' | 'toyo' | 'bajaji' | 'kirikuu' | 'pickup' | 'canter' | 'fuso' | 'trailer';

export default function PricingMatrixScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('boda');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch all pricing configs
    const pricingConfigs = useQuery(api.seed.getAllPricingConfigs) || [];

    // Find selected config
    const currentConfig = pricingConfigs.find((c: any) => c.vehicle_type === selectedVehicle);

    // Local state for editing
    const [editValues, setEditValues] = useState({
        base_fare: '',
        rate_per_km: '',
        rate_per_min: '',
        min_fare: '',
        surge_cap: '',
    });

    // Mutation for updating pricing
    // Mutation for updating pricing
    const updatePricing = useMutation(api.admin.updatePricingConfig);

    // FUEL INDEX LOGIC
    const fuelPrice = useQuery(api.pricing.getFuelPrice);
    const dieselPrice = useQuery(api.pricing.getDieselPrice);
    const settings = useQuery(api.pricing.getAllSystemSettings);
    const updateFuel = useMutation(api.pricing.updateFuelPrice);
    const updateDiesel = useMutation(api.pricing.updateDieselPrice);
    const updateSetting = useMutation(api.pricing.updateSystemSetting);
    const [isEditingFuel, setIsEditingFuel] = useState(false);
    const [tempFuelPrice, setTempFuelPrice] = useState('');

    const handleUpdateFuel = async () => {
        if (!tempFuelPrice) return;
        Alert.alert(
            "⚠️ Update Petrol Price?",
            `Changing petrol to ${tempFuelPrice} TZS will affect Boda & Toyo fares.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "UPDATE",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateFuel({ price: parseFloat(tempFuelPrice) });
                            setIsEditingFuel(false);
                            Alert.alert("Success", "Petrol price updated!");
                        } catch (e: any) {
                            Alert.alert("Error", e.message);
                        }
                    }
                }
            ]
        );
    };

    const handleEditDiesel = () => {
        Alert.prompt(
            "Update Diesel Price",
            "Enter new diesel price in TZS/L",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Update",
                    onPress: async (value) => {
                        if (value) {
                            try {
                                await updateDiesel({ price: parseFloat(value) });
                                Alert.alert("Success", "Diesel price updated!");
                            } catch (e: any) {
                                Alert.alert("Error", e.message);
                            }
                        }
                    }
                }
            ],
            "plain-text",
            dieselPrice?.toString() || "3100"
        );
    };

    const handleEditSetting = (key: string, currentValue: number) => {
        const label = key === 'traffic_buffer' ? 'Traffic Buffer' : 'Profit Margin';
        const currentPercent = ((currentValue - 1) * 100).toFixed(0);

        Alert.prompt(
            `Update ${label}`,
            `Enter new ${label.toLowerCase()} percentage (e.g., 15 for 15%)`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Update",
                    onPress: async (value) => {
                        if (value) {
                            const multiplier = 1 + (parseFloat(value) / 100);
                            try {
                                await updateSetting({ key, value: multiplier });
                                Alert.alert("Success", `${label} updated to ${value}%!`);
                            } catch (e: any) {
                                Alert.alert("Error", e.message);
                            }
                        }
                    }
                }
            ],
            "plain-text",
            currentPercent
        );
    };

    const handleEdit = () => {
        if (currentConfig) {
            setEditValues({
                base_fare: currentConfig.base_fare.toString(),
                rate_per_km: currentConfig.rate_per_km.toString(),
                rate_per_min: currentConfig.rate_per_min.toString(),
                min_fare: currentConfig.min_fare.toString(),
                surge_cap: currentConfig.surge_cap.toString(),
            });
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        Alert.alert(
            'Update Live Pricing?',
            `This will immediately affect all ${selectedVehicle} fares.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        setIsSaving(true);
                        try {
                            await updatePricing({
                                vehicle_type: selectedVehicle,
                                base_fare: parseFloat(editValues.base_fare),
                                rate_per_km: parseFloat(editValues.rate_per_km),
                                rate_per_min: parseFloat(editValues.rate_per_min),
                                min_fare: parseFloat(editValues.min_fare),
                                surge_cap: parseFloat(editValues.surge_cap),
                            });
                            setIsSaving(false);
                            setIsEditing(false);
                            Alert.alert('Success ✓', 'Pricing updated and logged!');
                        } catch (error: any) {
                            setIsSaving(false);
                            Alert.alert('Error', error.message || 'Failed to update pricing');
                        }
                    }
                },
            ]
        );
    };

    const VEHICLES: VehicleType[] = ['boda', 'toyo', 'bajaji', 'kirikuu', 'pickup', 'canter', 'fuso', 'trailer'];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pricing Matrix</Text>
                {!isEditing ? (
                    <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                        <Ionicons name="pencil" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* GLOBAL PRICING CONFIG */}
            <View style={styles.fuelCard}>
                <View style={styles.fuelHeader}>
                    <View style={styles.fuelIconBg}>
                        <MaterialCommunityIcons name="gas-station" size={24} color="#FFF" />
                    </View>
                    <View>
                        <Text style={styles.fuelLabel}>GLOBAL FUEL CONFIG</Text>
                        <Text style={styles.fuelDesc}>The "Inflation Button" - Updates all prices instantly</Text>
                    </View>
                </View>

                {/* PETROL PRICE */}
                <View style={styles.fuelValueRow}>
                    <View style={styles.fuelLabelRow}>
                        <MaterialCommunityIcons name="water" size={16} color="#F59E0B" />
                        <Text style={styles.fuelTypeLabel}>Petrol</Text>
                    </View>
                    {isEditingFuel ? (
                        <TextInput
                            style={styles.fuelInput}
                            value={tempFuelPrice}
                            onChangeText={setTempFuelPrice}
                            placeholder="3200"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            autoFocus
                        />
                    ) : (
                        <Text style={styles.fuelValue}>{fuelPrice || '---'} <Text style={styles.fuelUnit}>TZS/L</Text></Text>
                    )}

                    {isEditingFuel ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity onPress={() => setIsEditingFuel(false)} style={styles.fuelCancelBtn}>
                                <Ionicons name="close" size={20} color="#EF4444" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateFuel} style={styles.fuelSaveBtn}>
                                <Ionicons name="checkmark" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={() => { setTempFuelPrice(fuelPrice?.toString() || ''); setIsEditingFuel(true); }} style={styles.fuelEditBtn}>
                            <Ionicons name="pencil" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* DIESEL PRICE */}
                <View style={[styles.fuelValueRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' }]}>
                    <View style={styles.fuelLabelRow}>
                        <MaterialCommunityIcons name="fuel" size={16} color="#3B82F6" />
                        <Text style={styles.fuelTypeLabel}>Diesel</Text>
                    </View>
                    <Text style={styles.fuelValue}>{dieselPrice || '3100'} <Text style={styles.fuelUnit}>TZS/L</Text></Text>
                    <TouchableOpacity onPress={handleEditDiesel} style={styles.fuelEditBtn}>
                        <Ionicons name="pencil" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* SYSTEM SETTINGS ROW */}
                <View style={[styles.fuelValueRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' }]}>
                    <View style={styles.fuelLabelRow}>
                        <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                        <Text style={styles.fuelTypeLabel}>Traffic Buffer</Text>
                    </View>
                    <Text style={styles.fuelValue}>{((settings?.traffic_buffer || 1.15) * 100 - 100).toFixed(0)}%</Text>
                    <TouchableOpacity onPress={() => handleEditSetting('traffic_buffer', settings?.traffic_buffer || 1.15)} style={styles.fuelEditBtn}>
                        <Ionicons name="pencil" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.fuelValueRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' }]}>
                    <View style={styles.fuelLabelRow}>
                        <Ionicons name="trending-up" size={16} color="#8B5CF6" />
                        <Text style={styles.fuelTypeLabel}>Profit Margin</Text>
                    </View>
                    <Text style={styles.fuelValue}>{((settings?.profit_margin || 1.3) * 100 - 100).toFixed(0)}%</Text>
                    <TouchableOpacity onPress={() => handleEditSetting('profit_margin', settings?.profit_margin || 1.3)} style={styles.fuelEditBtn}>
                        <Ionicons name="pencil" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Vehicle Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
                {VEHICLES.map((v) => (
                    <TouchableOpacity
                        key={v}
                        style={[styles.vehiclePill, selectedVehicle === v && styles.vehiclePillActive]}
                        onPress={() => {
                            setSelectedVehicle(v);
                            setIsEditing(false);
                        }}
                    >
                        <Text style={[styles.vehicleText, selectedVehicle === v && styles.vehicleTextActive]}>
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Config Display */}
            <ScrollView style={styles.content}>
                {currentConfig ? (
                    <View style={styles.configCard}>
                        <Text style={styles.configTitle}>{selectedVehicle.toUpperCase()} Pricing</Text>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Base Fare (Kiingilio)</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.configInput}
                                    value={editValues.base_fare}
                                    onChangeText={(t) => setEditValues({ ...editValues, base_fare: t })}
                                    keyboardType="numeric"
                                />
                            ) : (
                                <Text style={styles.configValue}>TZS {currentConfig.base_fare.toLocaleString()}</Text>
                            )}
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Rate per KM</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.configInput}
                                    value={editValues.rate_per_km}
                                    onChangeText={(t) => setEditValues({ ...editValues, rate_per_km: t })}
                                    keyboardType="numeric"
                                />
                            ) : (
                                <Text style={styles.configValue}>TZS {currentConfig.rate_per_km.toLocaleString()}</Text>
                            )}
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Rate per Minute</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.configInput}
                                    value={editValues.rate_per_min}
                                    onChangeText={(t) => setEditValues({ ...editValues, rate_per_min: t })}
                                    keyboardType="numeric"
                                />
                            ) : (
                                <Text style={styles.configValue}>TZS {currentConfig.rate_per_min.toLocaleString()}</Text>
                            )}
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Minimum Fare</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.configInput}
                                    value={editValues.min_fare}
                                    onChangeText={(t) => setEditValues({ ...editValues, min_fare: t })}
                                    keyboardType="numeric"
                                />
                            ) : (
                                <Text style={styles.configValue}>TZS {currentConfig.min_fare.toLocaleString()}</Text>
                            )}
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Surge Cap</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.configInput}
                                    value={editValues.surge_cap}
                                    onChangeText={(t) => setEditValues({ ...editValues, surge_cap: t })}
                                    keyboardType="numeric"
                                />
                            ) : (
                                <Text style={styles.configValue}>{currentConfig.surge_cap}x</Text>
                            )}
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Loading Window</Text>
                            <Text style={styles.configValue}>{currentConfig.loading_window_min} min</Text>
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Demurrage Rate</Text>
                            <Text style={styles.configValue}>TZS {currentConfig.demurrage_rate}/min</Text>
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Commission</Text>
                            <Text style={styles.configValue}>{(currentConfig.commission_rate * 100).toFixed(0)}%</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Run seedPricingConfig to populate data</Text>
                    </View>
                )}

                {isEditing && (
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload" size={20} color="white" />
                                <Text style={styles.saveButtonText}>Update Live Pricing</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 12,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.danger,
    },
    vehicleScroll: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxHeight: 60,
    },
    vehiclePill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 8,
    },
    vehiclePillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    vehicleText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textDim,
    },
    vehicleTextActive: {
        color: 'white',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    configCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    configTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 20,
    },
    configRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    configLabel: {
        fontSize: 14,
        color: Colors.textDim,
    },
    configValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    configInput: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        minWidth: 100,
        textAlign: 'right',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.accent,
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 20,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textDim,
    },
    // Fuel Card Styles
    fuelCard: {
        margin: 16, marginBottom: 8,
        padding: 16,
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    fuelHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
    fuelIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    fuelLabel: { color: '#AAA', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    fuelDesc: { color: '#666', fontSize: 11 },
    fuelValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fuelLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    fuelTypeLabel: { color: '#AAA', fontSize: 14, fontWeight: '600' },
    fuelValue: { fontSize: 24, fontWeight: '800', color: '#FFF', flex: 1, textAlign: 'right', marginRight: 12 },
    fuelUnit: { fontSize: 14, fontWeight: '600', color: '#666' },
    fuelEditBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
    fuelInput: { flex: 1, backgroundColor: '#000', color: '#FFF', fontSize: 24, fontWeight: 'bold', padding: 8, borderRadius: 8, marginRight: 12, borderWidth: 1, borderColor: Colors.primary },
    fuelSaveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
    fuelCancelBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
});
