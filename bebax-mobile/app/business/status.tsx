import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

type VerificationStatus = 'pending' | 'active' | 'action_required' | 'rejected';

export default function BusinessStatusScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Get organization status from backend
    const orgData = useQuery(api.b2b.getMyOrganization);

    // Derive status
    const status: VerificationStatus = orgData?.status === 'active'
        ? 'active'
        : orgData?.status === 'action_required'
            ? 'action_required'
            : orgData?.status === 'rejected'
                ? 'rejected'
                : 'pending';

    const rejectionReason = orgData?.rejection_reason || null;
    const rejectionMessage = orgData?.rejection_message || null;

    // If approved, redirect to business dashboard
    useEffect(() => {
        if (orgData?.status === 'active') {
            router.replace('/(business)/home');
        }
    }, [orgData?.status]);

    const handleSupport = () => {
        Linking.openURL('https://wa.me/255752763787');
    };

    const handleFixNow = () => {
        // Navigate to the re-upload screen
        router.push('/business/register');
    };

    const handleContinue = () => {
        // Navigate to customer map
        router.replace('/(customer)/map');
    };

    // Status config
    const statusConfig = {
        pending: {
            icon: 'hourglass-top' as const,
            iconColor: '#F59E0B',
            iconBg: '#FEF3C7',
            title: 'Under Review',
            subtitle: 'Our team is reviewing your business documents. This usually takes 1-24 hours.',
        },
        active: {
            icon: 'verified' as const,
            iconColor: '#10B981',
            iconBg: '#D1FAE5',
            title: 'Approved!',
            subtitle: 'Congratulations! Your business is now verified. Start dispatching now!',
        },
        action_required: {
            icon: 'warning' as const,
            iconColor: '#EF4444',
            iconBg: '#FEE2E2',
            title: 'Action Required',
            subtitle: 'Please fix the issue below to complete your verification.',
        },
        rejected: {
            icon: 'cancel' as const,
            iconColor: '#6B7280',
            iconBg: '#F3F4F6',
            title: 'Application Rejected',
            subtitle: 'Unfortunately, your application could not be approved. Contact support for more details.',
        },
    };

    const config = statusConfig[status];

    // Loading state
    if (orgData === undefined) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ color: '#64748B', marginTop: 16 }}>Loading status...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleContinue} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Application Status</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
                {/* Status Icon */}
                <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
                    <MaterialIcons
                        name={config.icon}
                        size={80}
                        color={config.iconColor}
                    />
                </View>

                {/* Status Text */}
                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.subtitle}>{config.subtitle}</Text>

                {/* ACTION REQUIRED: Show Rejection Reason */}
                {status === 'action_required' && rejectionReason && (
                    <View style={styles.alertCard}>
                        <View style={styles.alertHeader}>
                            <MaterialIcons name="error-outline" size={24} color="#DC2626" />
                            <Text style={styles.alertTitle}>Issue Found</Text>
                        </View>
                        <Text style={styles.alertReason}>{rejectionReason}</Text>
                        {rejectionMessage && (
                            <Text style={styles.alertMessage}>"{rejectionMessage}"</Text>
                        )}
                        <TouchableOpacity style={styles.fixBtn} onPress={handleFixNow}>
                            <MaterialIcons name="edit" size={18} color="#FFF" />
                            <Text style={styles.fixBtnText}>Fix Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Progress Steps (Only show for pending) */}
                {status === 'pending' && (
                    <View style={styles.progressCard}>
                        <View style={styles.progressRow}>
                            <View style={[styles.progressDot, styles.progressDotComplete]}>
                                <Ionicons name="checkmark" size={14} color="#FFF" />
                            </View>
                            <Text style={styles.progressText}>Business Details Submitted</Text>
                        </View>
                        <View style={styles.progressLine} />
                        <View style={styles.progressRow}>
                            <View style={[styles.progressDot, styles.progressDotComplete]}>
                                <Ionicons name="checkmark" size={14} color="#FFF" />
                            </View>
                            <Text style={styles.progressText}>TIN Verification</Text>
                        </View>
                        <View style={styles.progressLine} />
                        <View style={styles.progressRow}>
                            <View style={[styles.progressDot, styles.progressDotActive]}>
                                <MaterialIcons name="search" size={12} color="#FFF" />
                            </View>
                            <Text style={styles.progressText}>Document Review</Text>
                        </View>
                        <View style={styles.progressLine} />
                        <View style={styles.progressRow}>
                            <View style={styles.progressDot}>
                                <Text style={styles.progressDotText}>4</Text>
                            </View>
                            <Text style={[styles.progressText, { color: '#94A3B8' }]}>Admin Approval</Text>
                        </View>
                    </View>
                )}

                {/* Notification Note */}
                {status === 'pending' && (
                    <View style={styles.noteCard}>
                        <Ionicons name="notifications-outline" size={18} color="#64748B" />
                        <Text style={styles.noteText}>
                            You'll receive an SMS when your business is approved.
                        </Text>
                    </View>
                )}

                {/* Contact Support */}
                <TouchableOpacity style={styles.supportBtn} onPress={handleSupport}>
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    <Text style={styles.supportBtnText}>Contact Support</Text>
                </TouchableOpacity>

                {/* Continue Using BebaX */}
                <TouchableOpacity style={styles.homeBtn} onPress={handleContinue}>
                    <Text style={styles.homeBtnText}>Continue Using BebaX →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.primary },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },

    // Content
    content: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
    },

    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },

    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: '90%',
        marginBottom: 24,
    },

    // Alert Card (Action Required)
    alertCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#DC2626',
    },
    alertReason: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 8,
    },
    alertMessage: {
        fontSize: 14,
        color: '#64748B',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    fixBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#DC2626',
        height: 48,
        borderRadius: 12,
    },
    fixBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // Progress Card
    progressCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotComplete: { backgroundColor: '#10B981' },
    progressDotActive: { backgroundColor: '#F59E0B' },
    progressDotText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
    progressText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
    progressLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E2E8F0',
        marginLeft: 13,
        marginVertical: 4,
    },

    // Note Card
    noteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        width: '100%',
        marginBottom: 24,
    },
    noteText: {
        fontSize: 13,
        color: '#64748B',
        flex: 1,
    },

    // Buttons
    supportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        height: 52,
        borderRadius: 12,
        width: '100%',
        marginBottom: 16,
    },
    supportBtnText: { color: '#16A34A', fontSize: 15, fontWeight: '700' },

    homeBtn: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    homeBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
