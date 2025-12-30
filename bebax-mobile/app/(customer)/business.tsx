import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    RefreshControl,
} from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

const INDUSTRIES = [
    { id: 'all', label: 'All', icon: 'business' },
    { id: 'retail', label: 'Retail', icon: 'store' },
    { id: 'construction', label: 'Construction', icon: 'build' },
    { id: 'agriculture', label: 'Agriculture', icon: 'eco' },
    { id: 'manufacturing', label: 'Manufacturing', icon: 'precision-manufacturing' },
    { id: 'logistics', label: 'Logistics', icon: 'local-shipping' },
];

export default function BusinessScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('all');
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

    // Fetch nearby businesses with verified+rating ranking
    const businesses = useQuery(api.b2b.getNearbyBusinesses, {
        userLat: userLocation?.lat,
        userLng: userLocation?.lng,
        category: selectedIndustry === 'all' ? undefined : selectedIndustry,
    });

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Filter by search
    const filteredBusinesses = businesses?.filter(biz =>
        searchQuery === '' ||
        biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleContact = (phone?: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const formatDistance = (distance?: number) => {
        if (!distance || distance > 100000) return '';
        if (distance < 1) return `${Math.round(distance * 1000)}m away`;
        return `${distance.toFixed(1)}km away`;
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Business Directory</Text>
                    <Text style={styles.headerSubtitle}>
                        Find logistics partners near you
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.myBizButton}
                    onPress={() => router.push('/(customer)/my-business')}
                >
                    <MaterialIcons name="storefront" size={22} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={22} color={Colors.textDim} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search businesses..."
                    placeholderTextColor={Colors.textDim}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialIcons name="close" size={20} color={Colors.textDim} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Industry Filter */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
                    {INDUSTRIES.map((ind) => (
                        <TouchableOpacity
                            key={ind.id}
                            style={[
                                styles.filterChip,
                                selectedIndustry === ind.id && styles.filterChipActive
                            ]}
                            onPress={() => setSelectedIndustry(ind.id)}
                        >
                            <MaterialIcons
                                name={ind.icon as any}
                                size={16}
                                color={selectedIndustry === ind.id ? 'white' : Colors.textDim}
                            />
                            <Text style={[
                                styles.filterText,
                                selectedIndustry === ind.id && styles.filterTextActive
                            ]}>{ind.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                {/* My Business CTA */}
                <TouchableOpacity
                    style={styles.ctaCard}
                    onPress={() => router.push('/(customer)/my-business')}
                    activeOpacity={0.9}
                >
                    <View style={styles.ctaContent}>
                        <Text style={styles.ctaTitle}>🏢 Your Business</Text>
                        <Text style={styles.ctaDescription}>
                            Register your company to post logistics jobs and find drivers
                        </Text>
                        <View style={styles.ctaButton}>
                            <Text style={styles.ctaButtonText}>Go to Dashboard</Text>
                            <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Text style={styles.resultCount}>
                        {filteredBusinesses?.length || 0} businesses found
                    </Text>
                    {userLocation && (
                        <View style={styles.locationBadge}>
                            <MaterialIcons name="my-location" size={14} color={Colors.success} />
                            <Text style={styles.locationText}>Sorted by distance</Text>
                        </View>
                    )}
                </View>

                {/* Loading State */}
                {businesses === undefined && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Finding businesses near you...</Text>
                    </View>
                )}

                {/* Empty State */}
                {businesses?.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="business" size={64} color={Colors.textDim} />
                        <Text style={styles.emptyTitle}>No Businesses Found</Text>
                        <Text style={styles.emptyText}>Be the first to register your business!</Text>
                    </View>
                )}

                {/* Business Cards */}
                {filteredBusinesses?.map((biz) => (
                    <View key={biz._id} style={styles.bizCard}>
                        {/* Header */}
                        <View style={styles.bizHeader}>
                            <View style={styles.bizIcon}>
                                <MaterialIcons name="business" size={28} color={Colors.primary} />
                            </View>
                            <View style={styles.bizInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.bizName} numberOfLines={1}>{biz.name}</Text>
                                    {biz.verified && (
                                        <MaterialIcons name="verified" size={16} color="#10B981" style={{ marginLeft: 4 }} />
                                    )}
                                </View>
                                <View style={styles.metaRow}>
                                    {!!biz.industry && (
                                        <Text style={styles.industry}>{biz.industry}</Text>
                                    )}
                                    {(biz.distance || 0) > 0 && biz.distance! < 100 && (
                                        <Text style={styles.distance}>{formatDistance(biz.distance!)}</Text>
                                    )}
                                </View>
                            </View>
                            {/* Rating Badge */}
                            {biz.totalTrips > 0 && (
                                <View style={styles.ratingBadge}>
                                    <MaterialIcons name="star" size={14} color="#F59E0B" />
                                    <Text style={styles.ratingText}>{biz.rating.toFixed(1)}</Text>
                                </View>
                            )}
                        </View>

                        {/* Location */}
                        {biz.location && (
                            <View style={styles.locationRow}>
                                <MaterialIcons name="location-on" size={16} color={Colors.textDim} />
                                <Text style={styles.locationAddress} numberOfLines={1}>
                                    {biz.location.address}
                                </Text>
                            </View>
                        )}

                        {/* Stats Row */}
                        <View style={styles.bizStats}>
                            <View style={styles.statItem}>
                                <MaterialIcons name="local-shipping" size={16} color={Colors.primary} />
                                <Text style={styles.statValue}>{biz.totalTrips}</Text>
                                <Text style={styles.statLabel}>trips</Text>
                            </View>
                            <View style={styles.statItem}>
                                <MaterialIcons name="workspace-premium" size={16} color={Colors.primary} />
                                <Text style={styles.statValue}>{biz.tier || 'starter'}</Text>
                                <Text style={styles.statLabel}>tier</Text>
                            </View>
                            {biz.verified && (
                                <View style={styles.verifiedTag}>
                                    <MaterialIcons name="verified-user" size={14} color="#10B981" />
                                    <Text style={styles.verifiedText}>Verified</Text>
                                </View>
                            )}
                        </View>

                        {/* Actions */}
                        <View style={styles.actionRow}>
                            {biz.phone && (
                                <TouchableOpacity
                                    style={styles.callButton}
                                    onPress={() => handleContact(biz.phone)}
                                >
                                    <MaterialIcons name="phone" size={18} color="white" />
                                    <Text style={styles.callButtonText}>Contact</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => {
                                    // Future: Navigate to business profile
                                    // router.push(`/(customer)/business-profile?id=${biz._id}`)
                                }}
                            >
                                <MaterialIcons name="visibility" size={18} color={Colors.primary} />
                                <Text style={styles.viewButtonText}>View</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 8,
    },
    headerContent: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: Colors.textDim,
        marginTop: 2,
    },
    myBizButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF5F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: Colors.text,
    },
    filterContainer: {
        marginTop: 12,
    },
    filterList: {
        paddingHorizontal: 16,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'white',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 4,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textDim,
    },
    filterTextActive: {
        color: 'white',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    ctaCard: {
        backgroundColor: Colors.text,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    ctaContent: {},
    ctaTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 6,
    },
    ctaDescription: {
        fontSize: 13,
        color: '#E5E7EB',
        marginBottom: 14,
        lineHeight: 18,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 6,
    },
    ctaButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultCount: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 12,
        color: Colors.success,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        color: Colors.textDim,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 16,
    },
    emptyText: {
        color: Colors.textDim,
        marginTop: 8,
    },
    bizCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    bizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    bizIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#FFF5F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bizInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bizName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    industry: {
        fontSize: 12,
        color: Colors.textDim,
        textTransform: 'capitalize',
    },
    distance: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#92400E',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 4,
    },
    locationAddress: {
        flex: 1,
        fontSize: 13,
        color: Colors.textDim,
    },
    bizStats: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: 12,
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textDim,
    },
    verifiedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 4,
        marginLeft: 'auto',
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#065F46',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    callButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.success,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    callButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    viewButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF5F0',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    viewButtonText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
});
