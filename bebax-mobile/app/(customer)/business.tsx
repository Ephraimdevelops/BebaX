import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CATEGORIES = [
    { id: 'all', label: 'All', icon: 'storefront' },
    { id: 'food', label: 'Food', icon: 'restaurant' },
    { id: 'groceries', label: 'Groceries', icon: 'local-grocery-store' },
    { id: 'hardware', label: 'Hardware', icon: 'build' },
    { id: 'services', label: 'Services', icon: 'cleaning-services' },
];

const FEATURED_BUSINESSES = [
    { id: '1', name: 'Mama Ntilie Kitchen', type: 'Food', rating: 4.8, distance: '1.2 km', image: require('../../assets/images/bajaji.png') }, // Placeholders
    { id: '2', name: 'Juma Hardware', type: 'Hardware', rating: 4.5, distance: '2.5 km', image: require('../../assets/images/truck.png') },
    { id: '3', name: 'Fresh Market', type: 'Groceries', rating: 4.7, distance: '0.8 km', image: require('../../assets/images/boda.png') },
];

export default function BusinessScreen() {
    const insets = useSafeAreaInsets();
    const [selectedCategory, setSelectedCategory] = React.useState('all');

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover</Text>
                <Text style={styles.headerSubtitle}>Find shops & services near you</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color={Colors.textDim} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for businesses..."
                    placeholderTextColor={Colors.textDim}
                />
            </View>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat.id && styles.categoryChipActive
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <MaterialIcons
                                name={cat.icon as any}
                                size={20}
                                color={selectedCategory === cat.id ? Colors.primary : Colors.textDim}
                            />
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat.id && styles.categoryTextActive
                            ]}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* CTA: List Your Business */}
                <TouchableOpacity style={styles.ctaCard}>
                    <View style={styles.ctaContent}>
                        <Text style={styles.ctaTitle}>Own a business?</Text>
                        <Text style={styles.ctaDescription}>List your shop on BebaX and reach more customers today.</Text>
                        <View style={styles.ctaButton}>
                            <Text style={styles.ctaButtonText}>List My Business</Text>
                            <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                        </View>
                    </View>
                    <MaterialIcons name="store" size={80} color="rgba(255,255,255,0.2)" style={styles.ctaIcon} />
                </TouchableOpacity>

                {/* Featured Section */}
                <Text style={styles.sectionTitle}>Featured Near You</Text>

                {FEATURED_BUSINESSES.map((biz) => (
                    <TouchableOpacity key={biz.id} style={styles.businessCard}>
                        {/* Placeholder Image Container */}
                        <View style={styles.businessImageContainer}>
                            <MaterialIcons name="storefront" size={40} color={Colors.textDim} />
                        </View>

                        <View style={styles.businessInfo}>
                            <View style={styles.businessHeader}>
                                <Text style={styles.businessName}>{biz.name}</Text>
                                <View style={styles.ratingContainer}>
                                    <MaterialIcons name="star" size={14} color="#FFD700" />
                                    <Text style={styles.ratingText}>{biz.rating}</Text>
                                </View>
                            </View>
                            <Text style={styles.businessType}>{biz.type} • {biz.distance}</Text>
                        </View>

                        <TouchableOpacity style={styles.actionButton}>
                            <MaterialIcons name="directions" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
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
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.textDim,
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: 24,
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: Colors.text,
    },
    categoriesContainer: {
        marginBottom: 24,
    },
    categoriesList: {
        paddingHorizontal: 24,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        marginRight: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    categoryChipActive: {
        backgroundColor: '#FFF5F0',
        borderColor: Colors.primary,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textDim,
        marginLeft: 8,
    },
    categoryTextActive: {
        color: Colors.primary,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    ctaCard: {
        backgroundColor: Colors.text, // Dark card
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        overflow: 'hidden',
        position: 'relative',
    },
    ctaContent: {
        zIndex: 1,
    },
    ctaTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    ctaDescription: {
        fontSize: 14,
        color: '#E5E7EB',
        marginBottom: 16,
        lineHeight: 20,
        maxWidth: '70%',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    ctaButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 4,
    },
    ctaIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        transform: [{ rotate: '-15deg' }],
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 16,
    },
    businessCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    businessImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: Colors.surfaceOff,
        justifyContent: 'center',
        alignItems: 'center',
    },
    businessInfo: {
        flex: 1,
        marginLeft: 16,
    },
    businessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    businessName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#F57F17',
        marginLeft: 2,
    },
    businessType: {
        fontSize: 14,
        color: Colors.textDim,
    },
    actionButton: {
        padding: 8,
    },
});
