import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Truck, Box, Bike } from 'lucide-react-native';

export type VehicleType = 'boda' | 'bajaji' | 'kirikuu' | 'canter' | 'semi';

interface VehicleCardProps {
    type: VehicleType;
    label: string;
    price: number;
    eta: string;
    selected: boolean;
    onSelect: () => void;
    imageSource?: any; // Require source
}

export default function VehicleCard({ type, label, price, eta, selected, onSelect, imageSource }: VehicleCardProps) {

    const renderIcon = () => {
        const color = selected ? Colors.primary : Colors.textDim;
        const size = 32;

        switch (type) {
            case 'boda': return <Bike size={size} color={color} />;
            case 'bajaji': return <Box size={size} color={color} />; // Placeholder
            default: return <Truck size={size} color={color} />;
        }
    };

    return (
        <TouchableOpacity
            onPress={onSelect}
            style={[
                styles.card,
                selected && styles.selectedCard
            ]}
        >
            <View style={styles.imageContainer}>
                {imageSource ? (
                    <Image source={imageSource} style={styles.image} resizeMode="contain" />
                ) : (
                    renderIcon()
                )}
            </View>

            <View style={styles.info}>
                <Text style={[styles.label, selected && styles.selectedText]}>{label}</Text>
                <Text style={styles.price}>TSh {price.toLocaleString()}</Text>
                <Text style={styles.eta}>{eta}</Text>
            </View>

            {selected && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>✓</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 140, // Larger
        height: 190, // Taller
        backgroundColor: Colors.surface,
        borderRadius: 20, // Softer corners
        padding: 12,
        marginRight: 16,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'space-between',
        // Soft premium shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    selectedCard: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF5F0', // Soft primary tint
        transform: [{ scale: 1.02 }], // Subtle pop
    },
    imageContainer: {
        height: 100, // Larger image area
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    info: {
        alignItems: 'center',
        width: '100%',
    },
    label: {
        fontSize: 16, // Larger text
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
        textTransform: 'capitalize',
        letterSpacing: 0.5,
    },
    selectedText: {
        color: Colors.primary,
    },
    price: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '600',
        opacity: 0.8,
    },
    eta: {
        fontSize: 12,
        color: Colors.success,
        marginTop: 4,
        fontWeight: '500',
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
