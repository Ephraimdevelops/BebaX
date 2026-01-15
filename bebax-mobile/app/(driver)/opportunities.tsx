import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

export default function OpportunitiesScreen() {
    const router = useRouter();
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [applying, setApplying] = useState(false);

    // Queries
    const listings = useQuery(api.businessListings.getListings, {});
    const myApplications = useQuery(api.businessListings.getMyApplications);
    const driverProfile = useQuery(api.drivers.getCurrentDriver);

    // Mutations
    const applyToListing = useMutation(api.businessListings.applyToListing);

    const handleApply = (listing: any) => {
        // Verification Check
        if (!driverProfile?.verified) {
            Alert.alert(
                "Verification Required",
                "You must verify your documents before applying for business contracts.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Verify Now", onPress: () => router.push('/(driver)/profile') }
                ]
            );
            return;
        }

        setSelectedListing(listing);
        setCoverLetter('');
        setShowApplyModal(true);
    };

    const submitApplication = async () => {
        if (!selectedListing) return;

        setApplying(true);
        try {
            await applyToListing({
                listingId: selectedListing._id,
                coverLetter: coverLetter || undefined,
            });
            Alert.alert(
                "✅ Ombi Limetumwa!",
                "Your application has been submitted. The business will review and respond soon.",
                [{ text: "OK" }]
            );
            setShowApplyModal(false);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to apply. Try again.");
        } finally {
            setApplying(false);
        }
    };

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'daily': return 'Kila Siku';
            case 'weekly': return 'Kila Wiki';
            case 'monthly': return 'Kila Mwezi';
            case 'on_demand': return 'Inapohitajika';
            default: return freq;
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'retail': return 'store';
            case 'construction': return 'construction';
            case 'agriculture': return 'eco';
            case 'manufacturing': return 'precision-manufacturing';
            case 'e-commerce': return 'shopping-cart';
            default: return 'business';
        }
    };

    const hasApplied = (listingId: string) => {
        return myApplications?.some(app => app.listingId === listingId);
    };

    const getApplicationStatus = (listingId: string) => {
        const app = myApplications?.find(a => a.listingId === listingId);
        return app?.status;
    };

    const [activeTab, setActiveTab] = useState<'marketplace' | 'my_business'>('marketplace');

    // Status counts
    const activeApps = myApplications?.filter(a => a.status === 'accepted').length || 0;
    const pendingApps = myApplications?.filter(a => a.status === 'pending').length || 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Business Hub Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Biashara Hub</Text>
                        <Text style={styles.headerSub}>Business Opportunities & Contracts</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <MaterialIcons name="business-center" size={24} color={Colors.primary} />
                    </View>
                </View>

                {/* Custom Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'marketplace' && styles.activeTab]}
                        onPress={() => setActiveTab('marketplace')}
                    >
                        <MaterialIcons name="storefront" size={20} color={activeTab === 'marketplace' ? '#FFF' : '#666'} />
                        <Text style={[styles.tabText, activeTab === 'marketplace' && styles.activeTabText]}>Marketplace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'my_business' && styles.activeTab]}
                        onPress={() => setActiveTab('my_business')}
                    >
                        <MaterialIcons name="folder-shared" size={20} color={activeTab === 'my_business' ? '#FFF' : '#666'} />
                        <Text style={[styles.tabText, activeTab === 'my_business' && styles.activeTabText]}>My Business</Text>
                        {myApplications && myApplications.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{myApplications.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'my_business' && (
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{activeApps}</Text>
                            <Text style={styles.statLabel}>Active Contracts</Text>
                            <MaterialIcons name="check-circle" size={16} color={Colors.success} style={styles.statIcon} />
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{pendingApps}</Text>
                            <Text style={styles.statLabel}>Pending Apps</Text>
                            <MaterialIcons name="pending" size={16} color="#F59E0B" style={styles.statIcon} />
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                            <MaterialIcons name="assignment-turned-in" size={16} color={Colors.primary} style={styles.statIcon} />
                        </View>
                    </View>
                )}

                {activeTab === 'marketplace' ? (
                    // MARKETPLACE LISTINGS
                    listings === undefined ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.loadingText}>Finding opportunities...</Text>
                        </View>
                    ) : listings.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="store-mall-directory" size={64} color="#E5E7EB" />
                            <Text style={styles.emptyTitle}>No Jobs Available</Text>
                            <Text style={styles.emptyText}>There are no business listings at the moment.</Text>
                        </View>
                    ) : (
                        listings.map((listing: any) => {
                            const applied = hasApplied(listing._id);
                            const status = getApplicationStatus(listing._id);

                            return (
                                <View key={listing._id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.companyIcon}>
                                            <MaterialIcons name={getCategoryIcon(listing.category)} size={24} color={Colors.primary} />
                                        </View>
                                        <View style={styles.companyInfo}>
                                            <Text style={styles.companyName}>{listing.organization?.name || 'Business'}</Text>
                                            {listing.organization?.verified && (
                                                <View style={styles.verifiedBadge}>
                                                    <MaterialIcons name="verified" size={12} color={Colors.success} />
                                                    <Text style={styles.verifiedText}>Verified Business</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>{listing.category}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.jobTitle}>{listing.title}</Text>
                                    <Text style={styles.jobDescription} numberOfLines={3}>{listing.description}</Text>

                                    <View style={styles.metaRow}>
                                        <View style={styles.metaItem}>
                                            <MaterialIcons name="repeat" size={14} color={Colors.textDim} />
                                            <Text style={styles.metaText}>{getFrequencyLabel(listing.frequency)}</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <MaterialIcons name="map" size={14} color={Colors.textDim} />
                                            <Text style={styles.metaText}>{listing.routeType === 'local' ? 'Local' : listing.routeType === 'regional' ? 'Regional' : 'National'}</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <MaterialIcons name="local-shipping" size={14} color={Colors.textDim} />
                                            <Text style={styles.metaText}>{listing.estimatedMonthlyTrips} trips/mo</Text>
                                        </View>
                                    </View>

                                    {applied ? (
                                        <View style={[styles.statusBanner,
                                        status === 'accepted' ? styles.statusAccepted :
                                            status === 'rejected' ? styles.statusRejected : styles.statusPending
                                        ]}>
                                            <Text style={[styles.statusText,
                                            status === 'accepted' ? { color: '#065F46' } :
                                                status === 'rejected' ? { color: '#991B1B' } : { color: '#92400E' }
                                            ]}>
                                                {status === 'accepted' ? '✅ CONTRACT ACTIVE' :
                                                    status === 'rejected' ? '❌ APPLICATION REJECTED' : '⏳ APPLICATION PENDING'}
                                            </Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.applyButton} onPress={() => handleApply(listing)}>
                                            <Text style={styles.applyButtonText}>Apply Now</Text>
                                            <MaterialIcons name="arrow-forward" size={18} color="white" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })
                    )
                ) : (
                    // MY BUSINESS / APPLICATIONS
                    myApplications === undefined ? (
                        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
                    ) : myApplications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="folder-open" size={64} color="#E5E7EB" />
                            <Text style={styles.emptyTitle}>No Applications Yet</Text>
                            <Text style={styles.emptyText}>Apply to jobs in the Marketplace to see them here.</Text>
                            <TouchableOpacity style={styles.ctaButton} onPress={() => setActiveTab('marketplace')}>
                                <Text style={styles.ctaText}>Browse Marketplace</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        myApplications.map((app: any) => (
                            <View key={app._id} style={styles.appCard}>
                                <View style={styles.appHeader}>
                                    <Text style={styles.appDate}>Applied {new Date(app._creationTime).toLocaleDateString()}</Text>
                                    <View style={[styles.statusPill,
                                    app.status === 'accepted' ? styles.pillAccepted :
                                        app.status === 'rejected' ? styles.pillRejected : styles.pillPending
                                    ]}>
                                        <Text style={[styles.pillText,
                                        app.status === 'accepted' ? { color: '#064E3B' } :
                                            app.status === 'rejected' ? { color: '#7F1D1D' } : { color: '#78350F' }
                                        ]}>{app.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <Text style={styles.appJobTitle}>{app.listing?.title || 'Job Listing'}</Text>
                                <Text style={styles.appName}>{app.listing?.organization?.name}</Text>
                                {app.status === 'accepted' && (
                                    <TouchableOpacity style={styles.viewContractBtn}>
                                        <Text style={styles.viewContractText}>View Contract Details</Text>
                                        <MaterialIcons name="description" size={16} color={Colors.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    )
                )}
            </ScrollView>

            {/* Apply Modal */}
            <Modal visible={showApplyModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Apply to Job</Text>
                            <TouchableOpacity onPress={() => setShowApplyModal(false)} style={styles.closeModalBtn}>
                                <MaterialIcons name="close" size={20} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalJobTitle}>{selectedListing?.title}</Text>
                        <Text style={styles.modalCompany}>{selectedListing?.organization?.name}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Cover Letter</Text>
                            <Text style={styles.inputHint}>Explain why you are the best driver for this contract.</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="I have 5 years experience with..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={5}
                                value={coverLetter}
                                onChangeText={setCoverLetter}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={submitApplication}
                            disabled={applying}
                        >
                            {applying ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Submit Application</Text>
                                    <MaterialIcons name="send" size={18} color="white" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },

    // Tabs
    tabContainer: { flexDirection: 'row' },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: Colors.primary, backgroundColor: '#FFF' },
    tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    activeTabText: { color: Colors.primary, fontWeight: '700' },
    badge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 4 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

    content: { padding: 16 },

    // Stats
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    statNumber: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
    statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
    statIcon: { position: 'absolute', top: 12, right: 12, opacity: 0.5 },

    // Listings
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', marginBottom: 16 },
    companyIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    companyInfo: { flex: 1 },
    companyName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
    verifiedText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
    categoryBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    categoryText: { fontSize: 11, fontWeight: '600', color: '#4B5563', textTransform: 'capitalize' },
    jobTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 8 },
    jobDescription: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 16 },

    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

    applyButton: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    applyButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

    // Status Banners
    statusBanner: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    statusAccepted: { backgroundColor: '#ECFDF5' },
    statusRejected: { backgroundColor: '#FEF2F2' },
    statusPending: { backgroundColor: '#FFFBEB' },
    statusText: { fontSize: 12, fontWeight: '700' },

    // Applications List
    appCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: Colors.primary },
    appHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    appDate: { fontSize: 11, color: '#9CA3AF' },
    statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    pillAccepted: { backgroundColor: '#D1FAE5' },
    pillRejected: { backgroundColor: '#FEE2E2' },
    pillPending: { backgroundColor: '#FEF3C7' },
    pillText: { fontSize: 10, fontWeight: '700' },
    appJobTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
    appName: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
    viewContractBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    viewContractText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

    // Empty States
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
    ctaButton: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
    ctaText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    loadingContainer: { alignItems: 'center', paddingVertical: 40 },
    loadingText: { marginTop: 12, color: '#6B7280' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    closeModalBtn: { padding: 4, backgroundColor: '#F3F4F6', borderRadius: 20 },
    modalJobTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    modalCompany: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
    inputGroup: { marginBottom: 24 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    inputHint: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
    textInput: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, fontSize: 15, color: '#111827', minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E5E7EB' },
    submitButton: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
    submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
