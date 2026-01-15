import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'logistics', label: 'Logistics', icon: 'boat' },
    { id: 'retail', label: 'Retail', icon: 'cart' },
    { id: 'mechanic', label: 'Mechanic', icon: 'build' },
    { id: 'construction', label: 'Constr.', icon: 'hammer' },
];

import { useUser } from '@clerk/clerk-expo';

export default function BusinessScreen() {
    const { user } = useUser();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // View Mode State: 'list' | 'map'
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Get user location for nearby sorting
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                });
            }
        })();
    }, []);

    // Fetch nearby businesses
    const businesses = useQuery(api.b2b.getNearbyBusinesses, {
        userLat: userLocation?.lat,
        userLng: userLocation?.lng,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
    });

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Filter logic
    const filteredBusinesses = businesses?.filter(biz =>
        searchQuery === '' ||
        biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDistance = (distance?: number) => {
        if (!distance || distance > 100000) return '';
        if (distance < 1) return `${Math.round(distance * 1000)}m`;
        return `${distance.toFixed(1)}km`;
    };

    return (
        <View style={styles.container}>
            {/* TOP HEADER: Location + Toggle + Profile */}
            <View style={[styles.topHeader, { paddingTop: insets.top }]}>
                {/* Location Pill (Left) */}
                <View style={styles.locationContainer}>
                    <Text style={styles.locationLabel}>Location</Text>
                    <View style={styles.addressRow}>
                        <Ionicons name="location" size={16} color={Colors.primary} />
                        <Text style={styles.addressText} numberOfLines={1}>Current Location</Text>
                        <Ionicons name="chevron-down" size={16} color="#0F172A" />
                    </View>
                </View>

                {/* View Switcher (Center-Right) */}
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('list')}
                    >
                        <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('map')}
                    >
                        <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* SEARCH BAR (Floating under header) */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={viewMode === 'map' ? "Search area..." : "Food, mechanics, logistics..."}
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* MAIN CONTENT AREA */}
            <View style={{ flex: 1 }}>

                {/* --- LIST VIEW --- */}
                {viewMode === 'list' && (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                        }
                    >
                        {/* 1. VISUAL CATEGORIES (Uber Style) */}
                        <View style={styles.categorySection}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={styles.catItem}
                                        onPress={() => setSelectedCategory(cat.id)}
                                    >
                                        <View style={[
                                            styles.catIconCircle,
                                            selectedCategory === cat.id && styles.catIconCircleActive
                                        ]}>
                                            <Ionicons
                                                name={cat.icon as any}
                                                size={24}
                                                color={selectedCategory === cat.id ? 'white' : '#1E293B'}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.catLabel,
                                            selectedCategory === cat.id && styles.catLabelActive
                                        ]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* 2. FEATURED BANNER (Dynamic based on Role) */}
                        <View style={styles.featuredSection}>
                            <Text style={styles.sectionTitle}>
                                {user?.unsafeMetadata?.role === 'business' ? 'My Business' : 'Partner with BebaX'}
                            </Text>

                            {user?.unsafeMetadata?.role === 'business' ? (
                                // BUSINESS OWNER VIEW
                                <TouchableOpacity
                                    style={styles.heroCard}
                                    onPress={() => router.push('/(customer)/my-business')} // Restored correct link
                                    activeOpacity={0.95}
                                >
                                    <LinearGradient
                                        colors={['#F0FDF4', '#DCFCE7'] as any}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                        style={styles.heroGradient}
                                    >
                                        <View style={styles.heroContent}>
                                            <View style={styles.heroBadge}>
                                                <Text style={styles.heroBadgeText}>MANAGEMENT</Text>
                                            </View>
                                            <Text style={styles.heroTitle}>{(user.publicMetadata?.businessName as string) || user.fullName || 'My Business'}</Text>
                                            <Text style={styles.heroSubtitle}>Manage inventory, orders, and analytics.</Text>
                                            <View style={styles.heroButton}>
                                                <Text style={styles.heroBtnText}>Dashboard</Text>
                                                <Ionicons name="stats-chart" size={16} color="#0F172A" />
                                            </View>
                                        </View>
                                        <Ionicons name="briefcase" size={100} color="rgba(255,255,255,0.05)" style={styles.heroBgIcon} />
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* 3. HORIZONTAL "RECOMMENDED" (Mockup logic) */}
                        <View style={styles.horizontalSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recommended for you</Text>
                                <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                                {filteredBusinesses?.slice(0, 3).map((biz, idx) => (
                                    <TouchableOpacity
                                        key={`rec-${biz._id}`}
                                        style={styles.miniCard}
                                        onPress={() => router.push(`/(customer)/business/${biz._id}`)}
                                    >
                                        <View style={[styles.miniCardImage, { backgroundColor: idx % 2 ? '#E0E7FF' : '#FEF3C7' }]}>
                                            <Ionicons name="storefront" size={32} color={idx % 2 ? '#4338CA' : '#D97706'} />
                                        </View>
                                        <View style={styles.miniCardInfo}>
                                            <Text style={styles.miniCardTitle} numberOfLines={1}>{biz.name}</Text>
                                            <Text style={styles.miniCardSub}>{biz.industry} • {biz.rating.toFixed(1)} ⭐</Text>
                                            <Text style={styles.miniCardTime}>15-20 min</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* 4. ALL BUSINESSES (Vertical) */}
                        <View style={styles.listSection}>
                            <Text style={styles.sectionTitle}>Near you</Text>
                            {filteredBusinesses?.map((biz) => {
                                // Generate a deterministic gradient color based on name/category
                                const getGradientColors = (category: string) => {
                                    switch (category) {
                                        case 'Logistics': return ['#4F46E5', '#818CF8']; // Indigo
                                        case 'Food': return ['#EA580C', '#FB923C']; // Orange
                                        case 'Retail': return ['#059669', '#34D399']; // Emerald
                                        case 'Mechanic': return ['#475569', '#94A3B8']; // Slate
                                        default: return ['#2563EB', '#60A5FA']; // Blue
                                    }
                                };
                                const gradColors = getGradientColors(biz.industry);

                                return (
                                    <TouchableOpacity
                                        key={biz._id}
                                        style={styles.richCard}
                                        onPress={() => router.push(`/(customer)/business/${biz._id}`)}
                                        activeOpacity={0.95}
                                    >
                                        {/* Card Header / Cover Gradient */}
                                        <LinearGradient
                                            colors={gradColors}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.cardHeaderGradient}
                                        >
                                            {/* Category Badge */}
                                            <View style={styles.categoryBadge}>
                                                <Text style={styles.categoryText}>{biz.industry}</Text>
                                            </View>

                                            <View style={styles.cardHeaderOverlay}>
                                                <View style={styles.cardIconCircle}>
                                                    <Ionicons name="storefront" size={24} color={gradColors[0]} />
                                                </View>
                                            </View>
                                        </LinearGradient>

                                        {/* Card Content */}
                                        <View style={styles.cardContent}>
                                            <View style={styles.cardTopRow}>
                                                <Text style={styles.cardTitle} numberOfLines={1}>{biz.name}</Text>
                                                {biz.verified && <Ionicons name="shield-checkmark" size={18} color="#059669" />}
                                            </View>

                                            {/* Rating & Distance Row */}
                                            <View style={styles.cardMetaRow}>
                                                <View style={styles.ratingBox}>
                                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                                    <Text style={styles.ratingVal}>{biz.rating.toFixed(1)}</Text>
                                                    <Text style={styles.ratingCount}>(120+)</Text>
                                                </View>
                                                <View style={styles.dotSeparator} />
                                                {!!biz.distance && (
                                                    <View style={styles.distanceBox}>
                                                        <Ionicons name="location-outline" size={12} color="#64748B" />
                                                        <Text style={styles.distanceVal}>{formatDistance(biz.distance)}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Description / Highlights */}
                                            <Text style={styles.cardDesc} numberOfLines={2}>
                                                Premium services for all your needs.
                                            </Text>

                                            {/* Action Buttons */}
                                            <View style={styles.cardActions}>
                                                <TouchableOpacity style={styles.actionBtn}>
                                                    <Ionicons name="call-outline" size={16} color={Colors.primary} />
                                                    <Text style={styles.actionBtnText}>Call</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]}>
                                                    <Ionicons name="navigate-outline" size={16} color="#FFF" />
                                                    <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Directions</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {/* --- MAP VIEW --- */}
                {viewMode === 'map' && (
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: userLocation?.lat || -6.7924,
                                longitude: userLocation?.lng || 39.2083,
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            }}
                            showsUserLocation
                        >
                            {filteredBusinesses?.map((biz) => (
                                <Marker
                                    key={biz._id}
                                    coordinate={{
                                        latitude: biz.location?.lat || 0,
                                        longitude: biz.location?.lng || 0
                                    }}
                                    title={biz.name}
                                    description={biz.industry}
                                >
                                    <View style={styles.mapMarker}>
                                        <Ionicons name="storefront" size={16} color="white" />
                                    </View>
                                </Marker>
                            ))}
                        </MapView>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // High-end white background
    },

    // --- TOP HEADER ---
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: 'white',
        zIndex: 10,
    },
    locationContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 2,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        maxWidth: '80%',
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        padding: 4,
        marginLeft: 16,
    },
    toggleBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    toggleBtnActive: {
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    toggleTextActive: {
        color: '#0F172A',
    },

    // --- SEARCH BAR ---
    searchSection: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: 'white',
        zIndex: 9,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '500',
        color: '#0F172A',
    },

    // --- CATEGORIES (UBER STYLE) ---
    categorySection: {
        paddingTop: 16,
        paddingBottom: 8,
    },
    categoryList: {
        paddingHorizontal: 20,
        gap: 16,
    },
    catItem: {
        alignItems: 'center',
        width: 70,
    },
    catIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F1F5F9', // Default grey
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    catIconCircleActive: {
        backgroundColor: '#0F172A', // Active black
    },
    catLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    catLabelActive: {
        color: '#0F172A',
        fontWeight: '700',
    },

    // --- HERO SECTION ---
    featuredSection: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    heroCard: {
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        marginTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    heroGradient: {
        flex: 1,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroContent: {
        flex: 1,
        zIndex: 2,
    },
    heroBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    heroBadgeText: { color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 20,
        lineHeight: 20,
    },
    heroButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'white',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    heroBtnText: {
        color: '#0F172A',
        fontWeight: '700',
        fontSize: 13,
    },
    heroBgIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        transform: [{ rotate: '-15deg' }],
    },

    // --- HORIZONTAL SECTIONS ---
    horizontalSection: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    seeAllText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
    },
    horizontalList: {
        paddingHorizontal: 20,
        gap: 16,
    },
    miniCard: {
        width: 200,
        marginRight: 4,
    },
    miniCardImage: {
        height: 120,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniCardInfo: {},
    miniCardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
    miniCardSub: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 2 },
    miniCardTime: { fontSize: 12, color: '#94A3B8', fontWeight: '400' },

    // --- VERTICAL LIST (NEARBY) ---
    listSection: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    standardCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9', // Very subtle border
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.03,
        // shadowRadius: 8,
    },
    stdCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stdIconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stdContent: {
        flex: 1,
    },
    stdTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    stdSub: { fontSize: 14, color: '#64748B', marginVertical: 4 },
    stdRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    stdRatingText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
    stdAction: {
        justifyContent: 'center',
    },

    // --- MAP VIEW ---
    mapContainer: {
        flex: 1,
        backgroundColor: '#E2E8F0',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapMarker: {
        backgroundColor: Colors.primary,
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },

    // --- RICH LIST CARD (UBER STYLE) ---
    richCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeaderGradient: {
        height: 120, // Taller header
        padding: 16,
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    categoryBadge: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    categoryText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardHeaderOverlay: {
        alignSelf: 'flex-start',
    },
    cardIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardContent: {
        padding: 16,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        marginRight: 8,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    ratingVal: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B45309',
    },
    ratingCount: {
        fontSize: 12,
        color: '#B45309',
        opacity: 0.8,
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    distanceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    distanceVal: {
        fontSize: 13,
        color: '#64748B',
    },
    cardDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
    },
    actionBtnPrimary: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
    },

    scrollContent: {
        paddingBottom: 40,
    },
});
