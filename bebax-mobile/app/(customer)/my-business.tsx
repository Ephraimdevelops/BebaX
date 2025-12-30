import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Id } from '../../src/convex/_generated/dataModel';

const SCREEN_WIDTH = Dimensions.get('window').width;

type TabId = 'overview' | 'listings' | 'analytics' | 'drivers';

export default function MyBusinessScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [refreshing, setRefreshing] = useState(false);
    const [showPostModal, setShowPostModal] = useState(false);

    // Queries
    const orgData = useQuery(api.b2b.getOrgStats);
    const analytics = useQuery(api.b2b.getBusinessAnalytics, { period: analyticsPeriod });
    const contractedDrivers = useQuery(api.b2b.getContractedDrivers);
    const myListings = useQuery(api.businessListings.getListings, {});

    // Filter to show only my org's listings
    const myOrgListings = myListings?.filter(l =>
        orgData?.organization && l.organizationId === orgData.organization._id
    ) || [];

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    if (orgData === undefined) {
        return (
            <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading your business...</Text>
            </View>
        );
    }

    if (!orgData) {
        return (
            <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
                <MaterialIcons name="store" size={80} color={Colors.textDim} />
                <Text style={styles.emptyTitle}>No Business Registered</Text>
                <Text style={styles.emptyText}>Register your business to start posting logistics jobs</Text>
                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => router.push('/(customer)/list-business')}
                >
                    <Text style={styles.registerButtonText}>Register Business</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { organization, stats } = orgData;

    const TABS: { id: TabId; label: string; icon: string }[] = [
        { id: 'overview', label: 'Overview', icon: 'dashboard' },
        { id: 'listings', label: 'Listings', icon: 'list-alt' },
        { id: 'analytics', label: 'Analytics', icon: 'insights' },
        { id: 'drivers', label: 'Drivers', icon: 'people' },
    ];

    const renderOverview = () => (
        <View style={styles.tabContent}>
            {/* Business Card */}
            <View style={styles.businessCard}>
                <View style={styles.businessIcon}>
                    <MaterialIcons name="business" size={32} color={Colors.primary} />
                </View>
                <View style={styles.businessInfo}>
                    <Text style={styles.businessName}>{organization.name}</Text>
                    <View style={styles.tierRow}>
                        <View style={[styles.tierBadge, { backgroundColor: organization.tier === 'enterprise' ? '#8B5CF6' : organization.tier === 'business' ? '#3B82F6' : Colors.primary }]}>
                            <Text style={styles.tierText}>{(organization.tier || 'starter').toUpperCase()}</Text>
                        </View>
                        {organization.verified ? (
                            <MaterialIcons name="verified" size={18} color="#10B981" />
                        ) : (
                            <View style={styles.pendingBadge}>
                                <Text style={styles.pendingText}>Pending</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <MaterialIcons name="local-shipping" size={24} color={Colors.primary} />
                    <Text style={styles.statValue}>{stats.totalRides}</Text>
                    <Text style={styles.statLabel}>Total Trips</Text>
                </View>
                <View style={styles.statCard}>
                    <MaterialIcons name="check-circle" size={24} color="#10B981" />
                    <Text style={styles.statValue}>{stats.completedRides}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                    <MaterialIcons name="people" size={24} color="#6366F1" />
                    <Text style={styles.statValue}>{stats.totalMembers}</Text>
                    <Text style={styles.statLabel}>Team</Text>
                </View>
                <View style={styles.statCard}>
                    <MaterialIcons name="account-balance-wallet" size={24} color="#F59E0B" />
                    <Text style={styles.statValue}>Tsh {(stats.walletBalance || 0).toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Balance</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('listings')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
                        <MaterialIcons name="add-circle" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.actionLabel}>Post Job</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(customer)/dashboard')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#3B82F620' }]}>
                        <MaterialIcons name="local-taxi" size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.actionLabel}>Book Ride</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('analytics')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
                        <MaterialIcons name="insights" size={24} color="#F59E0B" />
                    </View>
                    <Text style={styles.actionLabel}>Reports</Text>
                </TouchableOpacity>
            </View>

            {/* Location */}
            {organization.location && (
                <View style={styles.locationCard}>
                    <MaterialIcons name="location-on" size={20} color={Colors.primary} />
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>Business Location</Text>
                        <Text style={styles.locationAddress}>{organization.location.address}</Text>
                    </View>
                </View>
            )}
        </View>
    );

    const renderListings = () => (
        <View style={styles.tabContent}>
            <View style={styles.listingsHeader}>
                <Text style={styles.sectionTitle}>My Job Listings ({myOrgListings.length})</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => Alert.alert("Post Job", "Job posting form coming soon!")}
                >
                    <MaterialIcons name="add" size={20} color="white" />
                    <Text style={styles.addButtonText}>New</Text>
                </TouchableOpacity>
            </View>

            {myOrgListings.length === 0 ? (
                <View style={styles.emptyListings}>
                    <MaterialIcons name="post-add" size={48} color={Colors.textDim} />
                    <Text style={styles.emptyListingsText}>No job listings yet</Text>
                    <Text style={styles.emptyListingsSubtext}>Post a job to find drivers</Text>
                </View>
            ) : (
                myOrgListings.map((listing) => (
                    <TouchableOpacity
                        key={listing._id}
                        style={styles.listingCard}
                        onPress={() => Alert.alert("Listing Detail", "View applicants and trips for this listing")}
                    >
                        <View style={styles.listingHeader}>
                            <Text style={styles.listingTitle}>{listing.title}</Text>
                            <View style={[styles.statusBadge, listing.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                                <Text style={[styles.statusText, { color: listing.isActive ? '#10B981' : '#6B7280' }]}>
                                    {listing.isActive ? 'Active' : 'Closed'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.listingMeta}>
                            {listing.routeType} • {listing.frequency} • {listing.estimatedMonthlyTrips} trips/mo
                        </Text>
                        <View style={styles.listingStats}>
                            <View style={styles.listingStat}>
                                <MaterialIcons name="inbox" size={14} color={Colors.textDim} />
                                <Text style={styles.listingStatText}>Applications</Text>
                            </View>
                            <View style={styles.listingStat}>
                                <MaterialIcons name="local-shipping" size={14} color={Colors.textDim} />
                                <Text style={styles.listingStatText}>Trips</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={Colors.textDim} />
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );

    const renderAnalytics = () => (
        <View style={styles.tabContent}>
            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[styles.periodButton, analyticsPeriod === period && styles.periodButtonActive]}
                        onPress={() => setAnalyticsPeriod(period)}
                    >
                        <Text style={[styles.periodText, analyticsPeriod === period && styles.periodTextActive]}>
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {analytics === undefined ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : analytics ? (
                <>
                    {/* Summary Cards */}
                    <View style={styles.analyticsGrid}>
                        <View style={[styles.analyticsCard, { backgroundColor: '#EFF6FF' }]}>
                            <Text style={styles.analyticsValue}>{analytics.summary.totalTrips}</Text>
                            <Text style={styles.analyticsLabel}>Total Trips</Text>
                        </View>
                        <View style={[styles.analyticsCard, { backgroundColor: '#F0FDF4' }]}>
                            <Text style={styles.analyticsValue}>Tsh {analytics.summary.totalSpend.toLocaleString()}</Text>
                            <Text style={styles.analyticsLabel}>Total Spend</Text>
                        </View>
                        <View style={[styles.analyticsCard, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={styles.analyticsValue}>Tsh {analytics.summary.totalCommission.toLocaleString()}</Text>
                            <Text style={styles.analyticsLabel}>Commission ({(analytics.commissionRate * 100).toFixed(0)}%)</Text>
                        </View>
                        <View style={[styles.analyticsCard, { backgroundColor: '#FDF4FF' }]}>
                            <Text style={styles.analyticsValue}>Tsh {analytics.summary.avgCostPerDelivery.toLocaleString()}</Text>
                            <Text style={styles.analyticsLabel}>Avg per Trip</Text>
                        </View>
                    </View>

                    {/* Active Trips */}
                    <View style={styles.activeTripsCard}>
                        <View style={styles.activeTripsHeader}>
                            <Text style={styles.activeTripsTitle}>Active Right Now</Text>
                            <View style={styles.activeDot} />
                        </View>
                        <View style={styles.activeTripsStats}>
                            <View style={styles.activeTripItem}>
                                <Text style={styles.activeTripValue}>{analytics.summary.pendingTrips}</Text>
                                <Text style={styles.activeTripLabel}>Pending</Text>
                            </View>
                            <View style={styles.activeTripItem}>
                                <Text style={styles.activeTripValue}>{analytics.summary.activeTrips}</Text>
                                <Text style={styles.activeTripLabel}>In Progress</Text>
                            </View>
                        </View>
                    </View>

                    {/* Wallet Balance */}
                    <View style={styles.walletCard}>
                        <MaterialIcons name="account-balance-wallet" size={24} color={Colors.primary} />
                        <View style={styles.walletInfo}>
                            <Text style={styles.walletLabel}>Wallet Balance</Text>
                            <Text style={styles.walletValue}>Tsh {(analytics.walletBalance || 0).toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity style={styles.topUpButton}>
                            <Text style={styles.topUpText}>Top Up</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No analytics data available</Text>
                </View>
            )}
        </View>
    );

    const renderDrivers = () => (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Contracted Drivers ({contractedDrivers?.length || 0})</Text>

            {contractedDrivers === undefined ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : contractedDrivers.length === 0 ? (
                <View style={styles.emptyListings}>
                    <MaterialIcons name="people-outline" size={48} color={Colors.textDim} />
                    <Text style={styles.emptyListingsText}>No contracted drivers yet</Text>
                    <Text style={styles.emptyListingsSubtext}>Accept driver applications to build your team</Text>
                </View>
            ) : (
                contractedDrivers.map((driver, index) => (
                    <View key={driver.clerkId || index} style={styles.driverCard}>
                        <View style={styles.driverAvatar}>
                            <MaterialIcons name="person" size={28} color={Colors.primary} />
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>{driver.name}</Text>
                            <View style={styles.driverMeta}>
                                <MaterialIcons name="star" size={14} color="#F59E0B" />
                                <Text style={styles.driverRating}>{driver.rating.toFixed(1)}</Text>
                                <Text style={styles.driverTrips}>{driver.totalTripsForOrg} trips</Text>
                            </View>
                        </View>
                        <View style={styles.driverStatus}>
                            <View style={[styles.onlineIndicator, { backgroundColor: driver.isOnline ? '#10B981' : '#9CA3AF' }]} />
                            <Text style={styles.onlineText}>{driver.isOnline ? 'Online' : 'Offline'}</Text>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Business</Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <MaterialIcons name="settings" size={22} color={Colors.textDim} />
                </TouchableOpacity>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <MaterialIcons
                                name={tab.icon as any}
                                size={20}
                                color={activeTab === tab.id ? Colors.primary : Colors.textDim}
                            />
                            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
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
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'listings' && renderListings()}
                {activeTab === 'analytics' && renderAnalytics()}
                {activeTab === 'drivers' && renderDrivers()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { color: Colors.textDim, marginTop: 16 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textLight, marginTop: 16 },
    emptyText: { color: Colors.textDim, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    registerButton: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
    registerButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Colors.border },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    settingsButton: { padding: 8 },
    tabBar: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Colors.border },
    tabBarContent: { paddingHorizontal: 12 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, marginRight: 4, gap: 6 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
    tabText: { fontSize: 14, fontWeight: '600', color: Colors.textDim },
    tabTextActive: { color: Colors.primary },
    scrollContent: { paddingBottom: 100 },
    tabContent: { padding: 16 },
    // Overview
    businessCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    businessIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#FFF5F0', justifyContent: 'center', alignItems: 'center' },
    businessInfo: { flex: 1, marginLeft: 14 },
    businessName: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    tierRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
    tierBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 8 },
    tierText: { fontSize: 10, fontWeight: '700', color: 'white' },
    pendingBadge: { backgroundColor: '#FEF3C7', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 8 },
    pendingText: { fontSize: 10, fontWeight: '600', color: '#92400E' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statCard: { width: '47%', backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginTop: 8 },
    statLabel: { fontSize: 12, color: Colors.textDim, marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
    actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    actionCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.text },
    locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, padding: 16 },
    locationInfo: { marginLeft: 12 },
    locationLabel: { fontSize: 12, color: Colors.textDim },
    locationAddress: { fontSize: 14, color: Colors.text, fontWeight: '500', marginTop: 2 },
    // Listings
    listingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, gap: 4 },
    addButtonText: { color: 'white', fontWeight: '700', fontSize: 13 },
    emptyListings: { backgroundColor: 'white', borderRadius: 16, padding: 32, alignItems: 'center' },
    emptyListingsText: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
    emptyListingsSubtext: { fontSize: 12, color: Colors.textDim, textAlign: 'center', marginTop: 4 },
    listingCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12 },
    listingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    listingTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1 },
    statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
    activeBadge: { backgroundColor: '#D1FAE5' },
    inactiveBadge: { backgroundColor: '#F3F4F6' },
    statusText: { fontSize: 10, fontWeight: '600' },
    listingMeta: { fontSize: 12, color: Colors.textDim, textTransform: 'capitalize', marginBottom: 10 },
    listingStats: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 16 },
    listingStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    listingStatText: { fontSize: 12, color: Colors.textDim },
    // Analytics
    periodSelector: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 4, marginBottom: 16 },
    periodButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    periodButtonActive: { backgroundColor: Colors.primary },
    periodText: { fontSize: 14, fontWeight: '600', color: Colors.textDim },
    periodTextActive: { color: 'white' },
    analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    analyticsCard: { width: '47%', borderRadius: 14, padding: 16 },
    analyticsValue: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    analyticsLabel: { fontSize: 12, color: Colors.textDim, marginTop: 4 },
    activeTripsCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 16 },
    activeTripsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    activeTripsTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginLeft: 8 },
    activeTripsStats: { flexDirection: 'row', gap: 20 },
    activeTripItem: { alignItems: 'center' },
    activeTripValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
    activeTripLabel: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
    walletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, padding: 16 },
    walletInfo: { flex: 1, marginLeft: 12 },
    walletLabel: { fontSize: 12, color: Colors.textDim },
    walletValue: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginTop: 2 },
    topUpButton: { backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
    topUpText: { color: 'white', fontWeight: '700', fontSize: 13 },
    // Drivers
    driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10 },
    driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF5F0', justifyContent: 'center', alignItems: 'center' },
    driverInfo: { flex: 1, marginLeft: 12 },
    driverName: { fontSize: 15, fontWeight: '600', color: Colors.text },
    driverMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    driverRating: { fontSize: 13, fontWeight: '600', color: '#92400E', marginRight: 8 },
    driverTrips: { fontSize: 12, color: Colors.textDim },
    driverStatus: { alignItems: 'center' },
    onlineIndicator: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
    onlineText: { fontSize: 11, color: Colors.textDim },
    loadingContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
});
