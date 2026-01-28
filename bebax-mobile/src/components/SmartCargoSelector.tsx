import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Colors } from '../constants/Colors';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { HOUSE_SIZES } from '../constants/CargoReferences';
import * as Haptics from 'expo-haptics';

export type MissionMode = 'item' | 'move';
export type CargoReference = {
    id: string;
    label: string;
    icon: string;
    category: string;
    vehicle_class: string; // Restored for Logic
    photo_required?: boolean;
};
export type HouseSize = typeof HOUSE_SIZES[0];

// Expanded Reference Objects with Categories
const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: 'apps' },
    { id: 'furniture', label: 'Furniture', icon: 'sofa' },
    { id: 'construction', label: 'Construction', icon: 'hammer' },
    { id: 'business', label: 'Business', icon: 'briefcase' },
    { id: 'agri', label: 'Agri & Food', icon: 'sprout' },
];

// === REFERENCE DATA (By Size) ===
const SIZE_OPTIONS = [
    {
        id: 'small',
        label: 'Small',
        desc: 'Envelope, Keys, Food',
        icon: 'email-outline',
        vehicles: ['boda'],
        photo_required: false
    },
    {
        id: 'medium',
        label: 'Medium',
        desc: 'Box, Bag, Electronics',
        icon: 'package-variant',
        vehicles: ['boda', 'toyo'],
        photo_required: false
    },
    {
        id: 'large',
        label: 'Large',
        desc: 'Sofa, Fridge, Bed',
        icon: 'sofa-outline',
        vehicles: ['kirikuu', 'canter'],
        photo_required: true
    },
    {
        id: 'agri',
        label: 'Agri',
        desc: 'Sacks (Mkaa), Crops',
        icon: 'sprout-outline',
        vehicles: ['toyo', 'kirikuu'],
        photo_required: true
    },
    {
        id: 'construction',
        label: 'Huge',
        desc: 'Timber, Cement, Pipes',
        icon: 'ladder',
        vehicles: ['canter', 'fuso'],
        photo_required: true
    }
];

interface SmartCargoSelectorProps {
    mode: MissionMode;
    setMode: (mode: MissionMode) => void;
    // We now select a "Size Option" instead of a specific "Ref"
    selectedRef: string | null;
    onSelectRef: (ref: any) => void; // ref is now a SizeOption
    selectedHouse: string | null;
    onSelectHouse: (house: HouseSize) => void;
    hasPhoto: boolean;
    onTakePhoto: () => void;
}

export const SmartCargoSelector = ({
    mode, setMode,
    selectedRef, onSelectRef,
    selectedHouse, onSelectHouse,
    hasPhoto, onTakePhoto
}: SmartCargoSelectorProps) => {

    // Get selected item details for dynamic text
    const selectedItem = selectedRef ? SIZE_OPTIONS.find(r => r.id === selectedRef) : null;

    const handleModeSwitch = (newMode: MissionMode) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setMode(newMode);
    };

    return (
        <View style={styles.container}>
            {/* 1. Mode Toggle (Minimal) */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, mode === 'item' && styles.toggleBtnActive]}
                    onPress={() => handleModeSwitch('item')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.toggleText, mode === 'item' && styles.toggleTextActive]}>📦 Send Item</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, mode === 'move' && styles.toggleBtnActive]}
                    onPress={() => handleModeSwitch('move')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.toggleText, mode === 'move' && styles.toggleTextActive]}>🏠 Move House</Text>
                </TouchableOpacity>
            </View>

            {/* 2. Content Area */}
            {mode === 'item' ? (
                <View>
                    <Text style={styles.sectionTitle}>What are you sending?</Text>

                    {/* WIDE CARDS ROW */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cardsRow}
                    >
                        {/* A. ADD PHOTO TILE (Integrated, Wide) */}
                        <TouchableOpacity
                            style={[
                                styles.wideCard,
                                styles.photoTile,
                                hasPhoto && styles.photoTileSuccess
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                onTakePhoto();
                            }}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons
                                name={hasPhoto ? "check-circle" : "camera-plus-outline"}
                                size={22}
                                color={hasPhoto ? "#166534" : Colors.primary}
                            />
                            <Text style={[styles.wideLabel, { color: hasPhoto ? '#166534' : Colors.primary }]}>
                                {hasPhoto ? "Added" : "Photo"}
                            </Text>
                        </TouchableOpacity>

                        {/* B. SIZE TILES */}
                        {SIZE_OPTIONS.map((opt) => {
                            const isSelected = selectedRef === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.wideCard, isSelected && styles.wideCardSelected]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        onSelectRef({
                                            id: opt.id,
                                            label: opt.label,
                                            vehicle_class: opt.vehicles[0],
                                            photo_required: opt.photo_required,
                                            allowed_vehicles: opt.vehicles
                                        });
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <MaterialCommunityIcons
                                        name={opt.icon as any}
                                        size={22}
                                        color={isSelected ? Colors.primary : '#64748B'}
                                        style={{ marginBottom: 2 }}
                                    />
                                    <Text style={[styles.wideLabel, isSelected && styles.wideLabelSelected]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* DYNAMIC HELPER TEXT */}
                    <View style={styles.dynamicTextContainer}>
                        <Text style={styles.dynamicTextLabel}>
                            {selectedItem ? `Fits: ${selectedItem.desc}` : 'Select a size to filter vehicles.'}
                        </Text>
                    </View>
                </View>
            ) : (
                /* 3. Move House Mode */
                <View>
                    <Text style={styles.sectionTitle}>Select House Size</Text>
                    <View style={styles.gridContainer}>
                        {HOUSE_SIZES.map((house) => {
                            const isSelected = selectedHouse === house.id;
                            return (
                                <TouchableOpacity
                                    key={house.id}
                                    style={[styles.houseCard, isSelected && styles.houseCardSelected]}
                                    onPress={() => onSelectHouse(house)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.houseHeader}>
                                        <Text style={styles.houseIcon}>{house.icon}</Text>
                                        <Text style={[styles.houseLabel, isSelected && styles.labelSelected]}>
                                            {house.label}
                                        </Text>
                                    </View>
                                    <Text style={styles.houseDesc}>{house.description}</Text>
                                    <View style={styles.helpersTag}>
                                        <Text style={styles.helpersText}>{house.helpers} Helpers</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginVertical: 4 },

    // Toggle
    toggleContainer: {
        flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 16,
        width: '100%' // Ensure full width
    },
    toggleBtn: {
        flex: 1, // Share space equally
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10
    },
    toggleBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    toggleText: { fontSize: 14, fontWeight: '700', color: '#64748B' }, // Increased font size and weight
    toggleTextActive: { color: Colors.primary, fontWeight: '800' },

    // Section Title
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 10, marginLeft: 4 },

    // Wide Cards
    cardsRow: { gap: 8, paddingRight: 20, paddingBottom: 4 },
    wideCard: {
        width: 85, height: 60, // Wider and shorter
        backgroundColor: '#FFF', borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, elevation: 1
    },
    wideCardSelected: {
        borderColor: Colors.primary, backgroundColor: '#EFF6FF', borderWidth: 1.5
    },
    wideLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 2 },
    wideLabelSelected: { color: Colors.primary },

    // Photo Tile
    photoTile: {
        borderStyle: 'dashed', borderColor: Colors.primary, backgroundColor: '#F8FAFC', width: 80
    },
    photoTileSuccess: {
        borderStyle: 'solid', borderColor: '#16A34A', backgroundColor: '#F0FDF4'
    },

    // Dynamic Text
    dynamicTextContainer: {
        marginTop: 8, marginLeft: 4, paddingVertical: 4
    },
    dynamicTextLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },

    // House Cards (Move Mode)
    gridContainer: { gap: 8 },
    houseCard: {
        padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12,
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    houseCardSelected: { backgroundColor: '#EFF6FF', borderColor: Colors.primary },
    houseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    houseIcon: { fontSize: 18 },
    houseLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
    labelSelected: { color: Colors.primary },
    houseDesc: { fontSize: 11, color: '#64748B', marginBottom: 4 },
    helpersTag: { alignSelf: 'flex-start', backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    helpersText: { fontSize: 10, fontWeight: '600', color: '#166534' }
});

export default SmartCargoSelector;
