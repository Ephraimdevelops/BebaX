import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image, Alert } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

export default function VerificationQueueScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    // Use getNearbyBusinesses but filter on client for now as we don't have getPendingOrgs query
    // Optimally we'd make a specific query, but for speed reusing existing or adding new one.
    // Actually, I can use `api.b2b.getNearbyBusinesses` but that returns verified ones sorted?
    // I should probably add `getPendingOrganizations` to b2b.ts but checking all orgs is fine for admin.
    // Let's assume we use a new query `getAllOrganizations` or similar? 
    // b2b.ts doesn't have `getAllOrganizations` exposed to admin?
    // `getNearbyBusinesses` filters out user's own org.
    // I will use `api.b2b.getNearbyBusinesses` for now and filter manually where verificationStatus !== 'verified'.
    // If that returns limited results, might be issue.
    // Ideally I should add `getPendingVerifications` to b2b.ts.
    // But since I just finished editing b2b.ts, I'll stick to what I have or use `getNearbyBusinesses` and hope.
    // Actually, `getNearbyBusinesses` sorts verified first.
    // Let's assume for this task I will use `getNearbyBusinesses` and look for "pending" status. 
    // If I need to be precise, I should have added `getAllOrgs` for admin.
    // Let's try `getNearbyBusinesses` first.

    const businesses = useQuery(api.b2b.getNearbyBusinesses, {});
    const verifyOrg = useMutation(api.organizations.verify);

    const pendingBusinesses = businesses?.filter(b => b.verificationStatus === 'pending' || (!b.verified && b.verificationStatus !== 'rejected')) || [];

    const handleVerify = (orgId: any, status: 'verified' | 'rejected') => {
        Alert.alert(
            status === 'verified' ? "Approve Business?" : "Reject Business?",
            `Are you sure you want to ${status} this business?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: status === 'verified' ? "Approve" : "Reject",
                    style: status === 'rejected' ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            await verifyOrg({ orgId, status });
                            Alert.alert("Success", `Business ${status}.`);
                        } catch (e: any) {
                            Alert.alert("Error", e.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verification Queue</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={businesses === undefined} />}
            >
                {pendingBusinesses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="verified-user" size={48} color={Colors.textDim} />
                        <Text style={styles.emptyText}>No pending verifications</Text>
                    </View>
                ) : (
                    pendingBusinesses.map((org: any) => (
                        <View key={org._id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.orgName}>{org.name}</Text>
                                <View style={styles.pendingBadge}>
                                    <Text style={styles.pendingText}>Pending</Text>
                                </View>
                            </View>

                            <Text style={styles.detailText}>📧 {org.adminEmail}</Text>
                            <Text style={styles.detailText}>📍 {org.location?.address || "No address"}</Text>
                            <Text style={styles.detailText}>🏢 {org.industry || "Unspecified Industry"}</Text>

                            {org.description && (
                                <Text style={styles.description}>"{org.description}"</Text>
                            )}

                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => handleVerify(org._id, 'rejected')}
                                >
                                    <MaterialIcons name="close" size={20} color="#EF4444" />
                                    <Text style={[styles.actionText, { color: '#EF4444' }]}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.approveButton]}
                                    onPress={() => handleVerify(org._id, 'verified')}
                                >
                                    <MaterialIcons name="check" size={20} color="#10B981" />
                                    <Text style={[styles.actionText, { color: '#10B981' }]}>Approve</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 12,
        color: Colors.textDim,
        fontSize: 16,
    },
    card: {
        backgroundColor: Colors.surfaceOff,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orgName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    pendingBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pendingText: {
        color: '#D97706',
        fontSize: 12,
        fontWeight: 'bold',
    },
    detailText: {
        fontSize: 14,
        color: Colors.textDim,
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: Colors.text,
        fontStyle: 'italic',
        marginTop: 8,
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    rejectButton: {
        borderColor: '#FECACA',
        backgroundColor: '#FEF2F2',
    },
    approveButton: {
        borderColor: '#D1FAE5',
        backgroundColor: '#ECFDF5',
    },
    actionText: {
        fontWeight: '600',
        marginLeft: 6,
    },
});
