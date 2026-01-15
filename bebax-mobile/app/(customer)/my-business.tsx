import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    TextInput,
} from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

type TabId = 'overview' | 'listings' | 'analytics' | 'drivers';

export default function MyBusinessScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

    // Queries
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffName, setStaffName] = useState('');
    const [staffPhone, setStaffPhone] = useState('');
    const addStaff = useMutation(api.b2b.addStaff);

    const orgData = useQuery(api.b2b.getOrgStats);
    const showroomStats = useQuery(api.b2b.getShowroomStats);
    const myListings = useQuery(api.businessListings.getListings, {}) || [];

    // Filter to show only my org's listings
    const myOrgListings = myListings.filter(l =>
        orgData?.organization && l.organizationId === orgData.organization._id
    ) || [];

    if (orgData === undefined) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading Business Profile...</Text>
            </View>
        );
    }

    if (!orgData) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <MaterialIcons name="store" size={80} color={Colors.textDim} />
                <Text style={styles.emptyTitle}>No Business Registered</Text>
                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => router.push('/(customer)/list-business')}
                >
                    <Text style={styles.registerButtonText}>Register Now</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { organization, stats } = orgData;
    const leadsCount = showroomStats?.leads || 0;
    const viewsCount = showroomStats?.views || 0;
    const activeListingsCount = myOrgListings.length;

    const TABS: { id: TabId; label: string; icon: string }[] = [
        { id: 'overview', label: 'Overview', icon: 'dashboard' },
        { id: 'listings', label: 'Products', icon: 'inventory' },
        { id: 'analytics', label: 'Stats', icon: 'insights' },
        { id: 'drivers', label: 'Team', icon: 'people' },
    ];

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.profileRow}>
                <View style={styles.avatarWrapper}>
                    {organization.logo ? (
                        <Image source={{ uri: organization.logo }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                            <MaterialIcons name="store" size={32} color={Colors.primary} />
                        </View>
                    )}
                    {organization.verified && (
                        <View style={styles.verifiedBadgeIcon}>
                            <MaterialIcons name="verified" size={14} color="#FFF" />
                        </View>
                    )}
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.name}>{organization.name}</Text>
                    <View style={[styles.tierBadge, {
                        backgroundColor: organization.tier === 'enterprise' ? '#8B5CF6' :
                            organization.tier === 'business' ? '#3B82F6' : Colors.primary
                    }]}>
                        <Text style={styles.tierText}>{(organization.tier || 'Starter').toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            {/* QUICK STATS */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{viewsCount}</Text>
                    <Text style={styles.statLabel}>Views</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{activeListingsCount}</Text>
                    <Text style={styles.statLabel}>Listings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{leadsCount}</Text>
                    <Text style={styles.statLabel}>Leads</Text>
                </View>
            </View>
        </View>
    );

    const renderTabs = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            {TABS.map((tab) => (
                <TouchableOpacity
                    key={tab.id}
                    style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                    onPress={() => setActiveTab(tab.id)}
                >
                    <MaterialIcons
                        name={tab.icon as any}
                        size={18}
                        color={activeTab === tab.id ? '#FFF' : Colors.textDim}
                    />
                    <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );



    const handleAddStaff = async () => {
        if (!staffName || !staffPhone) return;
        try {
            const res = await addStaff({ name: staffName, phone: staffPhone });
            Alert.alert(res.success ? "Success" : "Notice", res.message);
            setShowStaffModal(false);
            setStaffName('');
            setStaffPhone('');
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    // Placeholder Content for Tabs
    const renderContent = () => {
        if (activeTab === 'listings') {
            return (
                <View style={styles.section}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(customer)/manage-products')}>
                        <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                            <MaterialIcons name="add-circle" size={24} color="#0284C7" />
                        </View>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>Manage Products</Text>
                            <Text style={styles.actionSub}>Add or edit showroom inventory</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#CCC" />
                    </TouchableOpacity>

                    {myOrgListings.map((item: any) => (
                        <View key={item._id} style={styles.listingItem}>
                            <Image source={{ uri: item.image || 'https://via.placeholder.com/60' }} style={styles.listingImg} />
                            <View style={styles.listingInfo}>
                                <Text style={styles.listingTitle}>{item.name}</Text>
                                <Text style={styles.listingPrice}>{item.price ? `Tsh ${item.price.toLocaleString()}` : 'Contact for Price'}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            );
        }

        if (activeTab === 'drivers') { // TEAM Tab
            return (
                <View style={styles.section}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => setShowStaffModal(true)}>
                        <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="person-add" size={24} color="#16A34A" />
                        </View>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>Add Staff Member</Text>
                            <Text style={styles.actionSub}>Grant booking access (No wallet access)</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.sectionHeader}>Team Members</Text>
                    {stats?.totalMembers ? (
                        <View style={styles.listingItem}>
                            <View style={[styles.listingImg, { justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ fontWeight: '700' }}>YOU</Text>
                            </View>
                            <View style={styles.listingInfo}>
                                <Text style={styles.listingTitle}>Admin (You)</Text>
                                <Text style={styles.listingPrice}>Full Access</Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>No staff added yet.</Text>
                    )}

                    {/* Modal Overlay would go here or use a Modal component */}
                    {showStaffModal && (
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalCard}>
                                <Text style={styles.modalTitle}>Add Staff</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Staff Name"
                                    value={staffName}
                                    onChangeText={setStaffName}
                                />
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Phone (e.g. +255...)"
                                    keyboardType="phone-pad"
                                    value={staffPhone}
                                    onChangeText={setStaffPhone}
                                />
                                <View style={styles.modalActions}>
                                    <TouchableOpacity onPress={() => setShowStaffModal(false)}>
                                        <Text style={styles.modalCancel}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.modalSave} onPress={handleAddStaff}>
                                        <Text style={styles.modalSaveText}>Add User</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            );
        }

        // Default Overview Layout
        return (
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Quick Actions</Text>
                <View style={styles.grid}>
                    <TouchableOpacity style={[styles.gridItem, { backgroundColor: '#1E293B' }]} onPress={() => router.push('/(business)/dispatch')}>
                        <MaterialIcons name="local-shipping" size={28} color="#FFF" />
                        <Text style={[styles.gridLabel, { color: '#FFF' }]}>Dispatch Console</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gridItem} onPress={() => setActiveTab('listings')}>
                        <MaterialIcons name="storefront" size={28} color="#10B981" />
                        <Text style={styles.gridLabel}>Showroom</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(customer)/wallet')}>
                        <MaterialIcons name="account-balance-wallet" size={28} color="#F59E0B" />
                        <Text style={styles.gridLabel}>Wallet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(customer)/activity')}>
                        <MaterialIcons name="receipt-long" size={28} color="#6366F1" />
                        <Text style={styles.gridLabel}>Orders</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Recent Activity</Text>
                <View style={styles.emptyCard}>
                    <MaterialIcons name="history" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No recent activity</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}>
                {renderHeader()}
                {renderTabs()}
                {renderContent()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#888' },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#333' },
    registerButton: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    registerButtonText: { color: '#FFF', fontWeight: 'bold' },

    scrollContent: { paddingBottom: 40 },

    // Header (Unified Style)
    header: {
        backgroundColor: '#FFF',
        paddingHorizontal: 24, paddingBottom: 24, paddingTop: 10,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
        marginBottom: 20
    },
    backButton: { marginBottom: 16 },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    avatarWrapper: { position: 'relative', marginRight: 16 },
    avatar: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#FFF' }, // Square rounded for Business
    placeholderAvatar: { borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    verifiedBadgeIcon: {
        position: 'absolute', bottom: -6, right: -6,
        backgroundColor: '#10B981', borderRadius: 10, padding: 2, borderWidth: 2, borderColor: '#FFF'
    },
    profileInfo: { flex: 1 },
    name: { fontSize: 22, fontWeight: '800', color: '#121212', marginBottom: 4 },
    tierBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    tierText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

    // Stats
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16 },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#121212' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '500' },
    statDivider: { width: 1, height: 24, backgroundColor: '#E0E0E0' },

    // Tabs
    tabsContainer: { paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', gap: 12 },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB'
    },
    activeTab: { backgroundColor: '#121212', borderColor: '#121212' },
    tabText: { fontSize: 13, fontWeight: '600', color: Colors.textDim },
    activeTabText: { color: '#FFF' },

    // Content
    section: { paddingHorizontal: 20 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#121212', marginBottom: 12 },

    grid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    gridItem: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16,
        alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
    },
    gridLabel: { fontSize: 12, fontWeight: '600', color: '#333' },

    emptyCard: { backgroundColor: '#F1F5F9', borderRadius: 16, padding: 32, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: '#94A3B8', marginTop: 8, fontWeight: '500' },

    // Listings Tab specific
    actionCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
    },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    actionInfo: { flex: 1 },
    actionTitle: { fontSize: 16, fontWeight: '700', color: '#121212' },
    actionSub: { fontSize: 12, color: '#64748B' },

    listingItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 10,
        borderWidth: 1, borderColor: '#F1F5F9'
    },
    listingImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#F1F5F9', marginRight: 12 },
    listingInfo: { flex: 1 },
    listingTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
    listingPrice: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

    // Modal
    modalOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100
    },
    modalCard: {
        width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 24, elevation: 5
    },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    modalInput: {
        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12,
        fontSize: 16, marginBottom: 12
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
    modalCancel: { color: '#64748B', fontWeight: '600', marginRight: 24, fontSize: 16 },
    modalSave: { backgroundColor: '#16A34A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    modalSaveText: { color: 'white', fontWeight: '700' }
});
