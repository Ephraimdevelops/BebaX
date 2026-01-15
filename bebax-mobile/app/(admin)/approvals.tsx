import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, Modal, TextInput, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { REJECTION_REASONS, sendMockSMS, VERIFICATION_MESSAGES, RejectionAction } from '../../src/utils/notificationUtils';

type TabType = 'organizations' | 'drivers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// REJECTION MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface RejectionModalProps {
    visible: boolean;
    type: 'driver' | 'business';
    targetName: string;
    onClose: () => void;
    onSubmit: (action: RejectionAction, reasonId: string, reasonLabel: string, customMessage?: string) => void;
}

const RejectionModal: React.FC<RejectionModalProps> = ({
    visible,
    type,
    targetName,
    onClose,
    onSubmit,
}) => {
    const [action, setAction] = useState<RejectionAction>('request_changes');
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [customMessage, setCustomMessage] = useState('');

    const reasons = type === 'driver' ? REJECTION_REASONS.DRIVER : REJECTION_REASONS.BUSINESS;

    const handleSubmit = () => {
        if (!selectedReason) {
            Alert.alert('Error', 'Please select a reason');
            return;
        }
        const reason = reasons.find(r => r.id === selectedReason);
        onSubmit(action, selectedReason, reason?.label || '', customMessage);
        // Reset state
        setSelectedReason(null);
        setCustomMessage('');
        setAction('request_changes');
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    {/* Header */}
                    <View style={modalStyles.header}>
                        <MaterialIcons
                            name={action === 'request_changes' ? 'edit' : 'block'}
                            size={28}
                            color={action === 'request_changes' ? '#F59E0B' : '#EF4444'}
                        />
                        <Text style={modalStyles.title}>
                            {action === 'request_changes' ? 'Request Changes' : 'Reject Application'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Target Name */}
                        <Text style={modalStyles.targetName}>For: {targetName}</Text>

                        {/* Action Selection */}
                        <Text style={modalStyles.sectionTitle}>Action Type</Text>
                        <View style={modalStyles.actionRow}>
                            <TouchableOpacity
                                style={[
                                    modalStyles.actionOption,
                                    action === 'request_changes' && modalStyles.actionOptionActive,
                                ]}
                                onPress={() => setAction('request_changes')}
                            >
                                <MaterialIcons name="edit" size={20} color={action === 'request_changes' ? '#F59E0B' : '#64748B'} />
                                <Text style={[modalStyles.actionText, action === 'request_changes' && { color: '#F59E0B', fontWeight: '700' }]}>
                                    Request Changes
                                </Text>
                                <Text style={modalStyles.actionDesc}>User can fix & resubmit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    modalStyles.actionOption,
                                    action === 'permanent_ban' && modalStyles.actionOptionDanger,
                                ]}
                                onPress={() => setAction('permanent_ban')}
                            >
                                <MaterialIcons name="block" size={20} color={action === 'permanent_ban' ? '#EF4444' : '#64748B'} />
                                <Text style={[modalStyles.actionText, action === 'permanent_ban' && { color: '#EF4444', fontWeight: '700' }]}>
                                    Permanently Ban
                                </Text>
                                <Text style={modalStyles.actionDesc}>No resubmission allowed</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Reason Selection */}
                        <Text style={modalStyles.sectionTitle}>Reason</Text>
                        <View style={modalStyles.reasonList}>
                            {reasons.map((reason) => (
                                <TouchableOpacity
                                    key={reason.id}
                                    style={[
                                        modalStyles.reasonItem,
                                        selectedReason === reason.id && modalStyles.reasonItemActive,
                                    ]}
                                    onPress={() => setSelectedReason(reason.id)}
                                >
                                    <View style={modalStyles.reasonRadio}>
                                        {selectedReason === reason.id && (
                                            <View style={modalStyles.reasonRadioInner} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={modalStyles.reasonLabel}>{reason.label}</Text>
                                        <Text style={modalStyles.reasonDesc}>{reason.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Custom Message (for "Other") */}
                        {selectedReason === 'other' && (
                            <View style={modalStyles.customSection}>
                                <Text style={modalStyles.sectionTitle}>Custom Message</Text>
                                <TextInput
                                    style={modalStyles.customInput}
                                    placeholder="Describe the issue..."
                                    placeholderTextColor="#94A3B8"
                                    value={customMessage}
                                    onChangeText={setCustomMessage}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        )}
                    </ScrollView>

                    {/* Actions */}
                    <View style={modalStyles.footer}>
                        <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                            <Text style={modalStyles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                modalStyles.submitBtn,
                                action === 'permanent_ban' && modalStyles.submitBtnDanger,
                            ]}
                            onPress={handleSubmit}
                        >
                            <Text style={modalStyles.submitText}>
                                {action === 'request_changes' ? 'Send Request' : 'Reject & Ban'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT VIEWER MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface DocumentViewerProps {
    visible: boolean;
    uri: string | null;
    title: string;
    onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ visible, uri, title, onClose }) => {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={docStyles.overlay}>
                <View style={docStyles.header}>
                    <Text style={docStyles.title}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={docStyles.closeBtn}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <View style={docStyles.imageContainer}>
                    {uri ? (
                        <Image source={{ uri }} style={docStyles.image} resizeMode="contain" />
                    ) : (
                        <View style={docStyles.placeholder}>
                            <MaterialIcons name="image-not-supported" size={64} color="#64748B" />
                            <Text style={docStyles.placeholderText}>No document uploaded</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APPROVALS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminApprovalsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<TabType>('organizations');
    const [approving, setApproving] = useState<string | null>(null);

    // Rejection Modal State
    const [rejectModal, setRejectModal] = useState<{
        visible: boolean;
        type: 'driver' | 'business';
        id: any;
        name: string;
    }>({ visible: false, type: 'driver', id: null, name: '' });

    // Document Viewer State
    const [docViewer, setDocViewer] = useState<{
        visible: boolean;
        uri: string | null;
        title: string;
    }>({ visible: false, uri: null, title: '' });

    // Real data from Convex: Organizations
    const pendingOrgs = useQuery(api.admin.getPendingOrganizations);
    const approveOrg = useMutation(api.admin.approveOrganization);
    const rejectOrg = useMutation(api.admin.rejectOrganization);

    // Real data from Convex: Drivers
    const pendingDrivers = useQuery(api.admin.getPendingDrivers);
    const approveDriver = useMutation(api.admin.approveDriver);
    const rejectDriver = useMutation(api.admin.rejectDriver);

    // Security Check (God Mode)
    const isAdmin = user?.primaryPhoneNumber?.phoneNumber === '+255752763787';

    if (!isAdmin) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialIcons name="lock" size={64} color={Colors.error} />
                <Text style={styles.accessDenied}>Access Denied</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ========== ORGANIZATION HANDLERS ==========
    const handleApproveOrg = async (id: any, name: string, phone?: string) => {
        setApproving(id);
        try {
            await approveOrg({ orgId: id });
            // Send mock notification
            sendMockSMS(phone || 'N/A', VERIFICATION_MESSAGES.BUSINESS.APPROVED(name));
            Alert.alert("✓ Approved", `${name} is now active. SMS notification sent.`);
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to approve");
        } finally {
            setApproving(null);
        }
    };

    const openRejectOrgModal = (id: any, name: string) => {
        setRejectModal({ visible: true, type: 'business', id, name });
    };

    const handleRejectOrg = async (action: RejectionAction, reasonId: string, reasonLabel: string, customMessage?: string) => {
        const { id, name } = rejectModal;
        try {
            await rejectOrg({
                orgId: id,
                action,
                reason: reasonLabel,
                message: customMessage,
            });
            // Send mock notification
            const msg = action === 'request_changes'
                ? VERIFICATION_MESSAGES.BUSINESS.CHANGES_REQUESTED(reasonLabel)
                : VERIFICATION_MESSAGES.BUSINESS.REJECTED(reasonLabel);
            sendMockSMS('N/A', msg);
            Alert.alert(
                action === 'request_changes' ? "✓ Changes Requested" : "✗ Rejected",
                `${name} has been notified.`
            );
            setRejectModal({ visible: false, type: 'driver', id: null, name: '' });
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    // ========== DRIVER HANDLERS ==========
    const handleApproveDriver = async (id: any, name: string, phone?: string) => {
        setApproving(id);
        try {
            await approveDriver({ driverId: id });
            sendMockSMS(phone || 'N/A', VERIFICATION_MESSAGES.DRIVER.APPROVED(name));
            Alert.alert("✓ Approved", `${name} can now accept rides! SMS notification sent.`);
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to approve");
        } finally {
            setApproving(null);
        }
    };

    const openRejectDriverModal = (id: any, name: string) => {
        setRejectModal({ visible: true, type: 'driver', id, name });
    };

    const handleRejectDriver = async (action: RejectionAction, reasonId: string, reasonLabel: string, customMessage?: string) => {
        const { id, name } = rejectModal;
        try {
            await rejectDriver({
                driverId: id,
                action,
                reason: reasonLabel,
                message: customMessage,
            });
            const msg = action === 'request_changes'
                ? VERIFICATION_MESSAGES.DRIVER.CHANGES_REQUESTED(reasonLabel)
                : VERIFICATION_MESSAGES.DRIVER.REJECTED(reasonLabel);
            sendMockSMS('N/A', msg);
            Alert.alert(
                action === 'request_changes' ? "✓ Changes Requested" : "✗ Rejected",
                `${name} has been notified.`
            );
            setRejectModal({ visible: false, type: 'driver', id: null, name: '' });
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    // ========== RENDER ITEMS ==========
    const renderOrgItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.bizName}>{item.name}</Text>
                    <Text style={styles.bizMeta}>{item.industry || 'Business'} • {new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.tinBadge}>
                    <Text style={styles.tinText}>TIN: {item.tinNumber}</Text>
                </View>
            </View>

            {/* Document Preview */}
            <View style={styles.docsRow}>
                <TouchableOpacity
                    style={styles.docThumb}
                    onPress={() => setDocViewer({ visible: true, uri: item.licensePhotoUrl, title: 'Business License' })}
                >
                    <MaterialIcons name="description" size={20} color="#64748B" />
                    <Text style={styles.docThumbText}>License</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => openRejectOrgModal(item._id, item.name)}>
                    <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApproveOrg(item._id, item.name, item.phone)} disabled={!!approving}>
                    {approving === item._id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.approveText}>Approve</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderDriverItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.driverHeader}>
                <TouchableOpacity
                    style={styles.driverPhoto}
                    onPress={() => setDocViewer({ visible: true, uri: item.selfie_photo_url, title: 'Driver Selfie' })}
                >
                    {item.selfie_photo_url ? (
                        <Image source={{ uri: item.selfie_photo_url }} style={styles.driverImage} />
                    ) : (
                        <MaterialIcons name="person" size={40} color="#94A3B8" />
                    )}
                </TouchableOpacity>
                <View style={styles.driverInfo}>
                    <Text style={styles.bizName}>{item.user_name || 'Driver'}</Text>
                    <Text style={styles.bizMeta}>{item.vehicle_type} • {item.vehicle_plate}</Text>
                    <View style={styles.nidaBadge}>
                        <Ionicons name="id-card" size={12} color="#475569" />
                        <Text style={styles.nidaText}>NIDA: {item.nida_number}</Text>
                    </View>
                </View>
            </View>

            {/* Document Thumbnails */}
            <View style={styles.docsRow}>
                <TouchableOpacity
                    style={styles.docThumb}
                    onPress={() => setDocViewer({ visible: true, uri: item.license_front_url, title: 'Driving License' })}
                >
                    <MaterialIcons name="badge" size={20} color="#64748B" />
                    <Text style={styles.docThumbText}>License</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.docThumb}
                    onPress={() => setDocViewer({ visible: true, uri: item.insurance_url, title: 'Insurance Document' })}
                >
                    <MaterialIcons name="verified-user" size={20} color="#64748B" />
                    <Text style={styles.docThumbText}>Insurance</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => openRejectDriverModal(item._id, item.user_name)}>
                    <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApproveDriver(item._id, item.user_name, item.user_phone)} disabled={!!approving}>
                    {approving === item._id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.approveText}>Approve</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );

    const orgCount = pendingOrgs?.length || 0;
    const driverCount = pendingDrivers?.length || 0;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Approvals</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* TABS */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'organizations' && styles.tabActive]}
                    onPress={() => setActiveTab('organizations')}
                >
                    <MaterialIcons name="business" size={18} color={activeTab === 'organizations' ? Colors.primary : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'organizations' && styles.tabTextActive]}>
                        Businesses ({orgCount})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'drivers' && styles.tabActive]}
                    onPress={() => setActiveTab('drivers')}
                >
                    <MaterialIcons name="two-wheeler" size={18} color={activeTab === 'drivers' ? Colors.primary : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'drivers' && styles.tabTextActive]}>
                        Drivers ({driverCount})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* LIST */}
            {activeTab === 'organizations' ? (
                pendingOrgs === undefined ? (
                    <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
                ) : (
                    <FlatList
                        data={pendingOrgs}
                        renderItem={renderOrgItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <MaterialIcons name="check-circle" size={48} color="#16A34A" />
                                <Text style={styles.emptyText}>No pending businesses!</Text>
                            </View>
                        }
                    />
                )
            ) : (
                pendingDrivers === undefined ? (
                    <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
                ) : (
                    <FlatList
                        data={pendingDrivers}
                        renderItem={renderDriverItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <MaterialIcons name="check-circle" size={48} color="#16A34A" />
                                <Text style={styles.emptyText}>No pending drivers!</Text>
                            </View>
                        }
                    />
                )
            )}

            {/* REJECTION MODAL */}
            <RejectionModal
                visible={rejectModal.visible}
                type={rejectModal.type}
                targetName={rejectModal.name}
                onClose={() => setRejectModal({ visible: false, type: 'driver', id: null, name: '' })}
                onSubmit={rejectModal.type === 'business' ? handleRejectOrg : handleRejectDriver}
            />

            {/* DOCUMENT VIEWER */}
            <DocumentViewer
                visible={docViewer.visible}
                uri={docViewer.uri}
                title={docViewer.title}
                onClose={() => setDocViewer({ visible: false, uri: null, title: '' })}
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
    },
    tabActive: {
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    tabTextActive: { color: Colors.primary },

    list: { padding: 16 },

    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    bizName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    bizMeta: { fontSize: 13, color: '#64748B', marginTop: 4 },
    tinBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tinText: { fontSize: 12, fontWeight: '600', color: '#475569' },

    driverHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    driverPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    driverImage: { width: 60, height: 60 },
    driverInfo: { flex: 1 },
    nidaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    nidaText: { fontSize: 11, fontWeight: '600', color: '#475569' },

    docsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    docThumb: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        backgroundColor: '#F0F9FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    docThumbText: { fontSize: 12, fontWeight: '600', color: '#0284C7' },

    actions: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
    rejectText: { color: '#EF4444', fontWeight: '600' },
    approveBtn: { backgroundColor: '#16A34A' },
    approveText: { color: '#FFF', fontWeight: '700' },

    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#94A3B8', marginTop: 12 },

    accessDenied: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginTop: 16, marginBottom: 24 },
    backBtn: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    backBtnText: { color: '#FFF', fontWeight: '600' },
});

// Modal Styles
const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.85,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    closeBtn: { position: 'absolute', right: 16 },
    targetName: { fontSize: 14, color: '#64748B', textAlign: 'center', paddingTop: 12 },

    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },

    actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
    actionOption: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    actionOptionActive: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
    actionOptionDanger: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    actionText: { fontSize: 14, fontWeight: '600', color: '#64748B', marginTop: 8 },
    actionDesc: { fontSize: 11, color: '#94A3B8', marginTop: 4 },

    reasonList: { paddingHorizontal: 20, gap: 8 },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    reasonItemActive: { borderColor: Colors.primary, backgroundColor: '#FFF7ED' },
    reasonRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    reasonRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
    reasonLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
    reasonDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },

    customSection: { paddingHorizontal: 20 },
    customInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        padding: 14,
        fontSize: 14,
        color: '#0F172A',
        minHeight: 80,
        textAlignVertical: 'top',
    },

    footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 20 },
    cancelBtn: { flex: 1, height: 50, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    cancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    submitBtn: { flex: 1, height: 50, borderRadius: 10, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' },
    submitBtnDanger: { backgroundColor: '#EF4444' },
    submitText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

// Document Viewer Styles
const docStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    title: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    closeBtn: { padding: 8 },
    imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    image: { width: SCREEN_WIDTH - 40, height: SCREEN_HEIGHT * 0.7 },
    placeholder: { alignItems: 'center' },
    placeholderText: { color: '#94A3B8', marginTop: 12 },
});
