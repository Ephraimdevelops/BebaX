import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function OpportunitiesScreen() {
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [applying, setApplying] = useState(false);

    // Queries
    const listings = useQuery(api.businessListings.getListings, {});
    const myApplications = useQuery(api.businessListings.getMyApplications);

    // Mutations
    const applyToListing = useMutation(api.businessListings.applyToListing);

    const handleApply = (listing: any) => {
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

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Biashara / Opportunities</Text>
                <Text style={styles.headerSub}>Pata kazi za kudumu kutoka kwa biashara</Text>
            </View>

            {/* My Applications Summary */}
            {myApplications && myApplications.length > 0 && (
                <View style={styles.applicationsSummary}>
                    <MaterialIcons name="work" size={20} color={Colors.primary} />
                    <Text style={styles.applicationsText}>
                        You have {myApplications.length} active application{myApplications.length > 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.content}>
                {listings === undefined ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading opportunities...</Text>
                    </View>
                ) : listings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="work-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>Hakuna Nafasi Kwa Sasa</Text>
                        <Text style={styles.emptyText}>No opportunities available. Check back later!</Text>
                    </View>
                ) : (
                    listings.map((listing: any) => {
                        const applied = hasApplied(listing._id);
                        const status = getApplicationStatus(listing._id);

                        return (
                            <View key={listing._id} style={styles.card}>
                                {/* Company Header */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.companyIcon}>
                                        <MaterialIcons
                                            name={getCategoryIcon(listing.category)}
                                            size={24}
                                            color={Colors.primary}
                                        />
                                    </View>
                                    <View style={styles.companyInfo}>
                                        <Text style={styles.companyName}>
                                            {listing.organization?.name || 'Business'}
                                        </Text>
                                        {listing.organization?.verified && (
                                            <View style={styles.verifiedBadge}>
                                                <MaterialIcons name="verified" size={12} color={Colors.success} />
                                                <Text style={styles.verifiedText}>Verified</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryText}>{listing.category}</Text>
                                    </View>
                                </View>

                                {/* Job Details */}
                                <Text style={styles.jobTitle}>{listing.title}</Text>
                                <Text style={styles.jobDescription} numberOfLines={2}>
                                    {listing.description}
                                </Text>

                                {/* Meta Info */}
                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <MaterialIcons name="schedule" size={16} color={Colors.textDim} />
                                        <Text style={styles.metaText}>{getFrequencyLabel(listing.frequency)}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <MaterialIcons name="route" size={16} color={Colors.textDim} />
                                        <Text style={styles.metaText}>
                                            {listing.routeType === 'local' ? 'Ndani ya Jiji' :
                                                listing.routeType === 'regional' ? 'Kikanda' : 'Kitaifa'}
                                        </Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <MaterialIcons name="local-shipping" size={16} color={Colors.textDim} />
                                        <Text style={styles.metaText}>{listing.estimatedMonthlyTrips}/mo</Text>
                                    </View>
                                </View>

                                {/* Pay Rate */}
                                {listing.payRate && (
                                    <View style={styles.payRate}>
                                        <Text style={styles.payLabel}>Pay Rate:</Text>
                                        <Text style={styles.payValue}>{listing.payRate}</Text>
                                    </View>
                                )}

                                {/* Apply Button */}
                                {applied ? (
                                    <View style={[styles.appliedBadge,
                                    status === 'accepted' && styles.acceptedBadge,
                                    status === 'rejected' && styles.rejectedBadge
                                    ]}>
                                        <Ionicons
                                            name={status === 'accepted' ? 'checkmark-circle' :
                                                status === 'rejected' ? 'close-circle' : 'time'}
                                            size={18}
                                            color={status === 'accepted' ? Colors.success :
                                                status === 'rejected' ? Colors.error : Colors.primary}
                                        />
                                        <Text style={[styles.appliedText,
                                        status === 'accepted' && { color: Colors.success },
                                        status === 'rejected' && { color: Colors.error }
                                        ]}>
                                            {status === 'accepted' ? 'ACCEPTED' :
                                                status === 'rejected' ? 'REJECTED' : 'APPLICATION PENDING'}
                                        </Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.applyButton}
                                        onPress={() => handleApply(listing)}
                                    >
                                        <Text style={styles.applyButtonText}>OMBA KAZI / APPLY</Text>
                                        <MaterialIcons name="send" size={18} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Apply Modal */}
            <Modal visible={showApplyModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Apply to Job</Text>
                            <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                                <MaterialIcons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalJobTitle}>{selectedListing?.title}</Text>
                        <Text style={styles.modalCompany}>{selectedListing?.organization?.name}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Cover Letter (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Eleza kwa nini unafaa kwa kazi hii..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
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
                                    <Text style={styles.submitButtonText}>TUMA OMBI / SUBMIT</Text>
                                    <MaterialIcons name="send" size={20} color="white" />
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
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#121212',
    },
    headerSub: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    applicationsSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F0',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#FFE0D0',
    },
    applicationsText: {
        marginLeft: 10,
        color: Colors.primary,
        fontWeight: '600',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: '#666',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#999',
        marginTop: 16,
    },
    emptyText: {
        color: '#BBB',
        marginTop: 8,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    companyIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#FFF5F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    companyInfo: {
        flex: 1,
        marginLeft: 12,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#121212',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    verifiedText: {
        fontSize: 11,
        color: Colors.success,
        marginLeft: 4,
        fontWeight: '600',
    },
    categoryBadge: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        textTransform: 'capitalize',
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#121212',
        marginBottom: 6,
    },
    jobDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 14,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 14,
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: Colors.textDim,
        marginLeft: 4,
        fontWeight: '500',
    },
    payRate: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
    },
    payLabel: {
        fontSize: 13,
        color: '#666',
    },
    payValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.success,
        marginLeft: 8,
    },
    applyButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    applyButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    appliedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FFF5F0',
        gap: 8,
    },
    acceptedBadge: {
        backgroundColor: '#E8F5E9',
    },
    rejectedBadge: {
        backgroundColor: '#FFEBEE',
    },
    appliedText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    modalJobTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#121212',
    },
    modalCompany: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#121212',
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    submitButton: {
        backgroundColor: Colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 10,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
});
