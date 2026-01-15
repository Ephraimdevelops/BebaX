import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
    FileText,
    Upload,
    CheckCircle,
    Clock,
    ChevronLeft,
    Camera,
    ShieldCheck,
    AlertCircle,
} from 'lucide-react-native';

const DOCUMENT_TYPES = [
    { key: 'nida_photo', label: 'NIDA ID', description: 'National ID Card (front & back)', icon: '🪪' },
    { key: 'license_photo', label: 'Driving License', description: 'Valid driving license', icon: '🚗' },
    { key: 'insurance_photo', label: 'Insurance', description: 'Vehicle insurance certificate', icon: '📋' },
    { key: 'road_permit_photo', label: 'Road Permit', description: 'TRA road permit', icon: '📜' },
];

export default function DocumentsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [uploading, setUploading] = useState<string | null>(null);

    // Queries & Mutations
    const documentUrls = useQuery(api.drivers.getDocumentUrls);
    const generateUploadUrl = useMutation(api.drivers.generateUploadUrl);
    const uploadDocuments = useMutation(api.drivers.uploadDocuments);

    const handleUploadDocument = async (docKey: string) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Required", "We need camera roll permissions to upload documents.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setUploading(docKey);
                const uri = result.assets[0].uri;

                // Get upload URL
                const postUrl = await generateUploadUrl();

                // Convert to blob and upload
                const response = await fetch(uri);
                const blob = await response.blob();

                const uploadResponse = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type },
                    body: blob,
                });
                const { storageId } = await uploadResponse.json();

                // Update document in database
                await uploadDocuments({ [docKey]: storageId });

                Alert.alert("✅ Success", "Document uploaded successfully!");
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to upload document: " + error.message);
        } finally {
            setUploading(null);
        }
    };

    const getDocumentStatus = (docKey: string) => {
        if (!documentUrls) return 'missing';
        const url = documentUrls[docKey as keyof typeof documentUrls];
        if (url && typeof url === 'string') return 'uploaded';
        return 'missing';
    };

    const completedCount = DOCUMENT_TYPES.filter(
        doc => getDocumentStatus(doc.key) === 'uploaded'
    ).length;

    const allComplete = completedCount === DOCUMENT_TYPES.length;
    const isVerified = documentUrls?.verified ?? false;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Documents</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${(completedCount / DOCUMENT_TYPES.length) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round((completedCount / DOCUMENT_TYPES.length) * 100)}% Complete</Text>
                </View>

                {/* Status Banner */}
                <View style={[styles.statusBanner, isVerified ? styles.verifiedBanner : styles.pendingBanner]}>
                    {isVerified ? (
                        <>
                            <ShieldCheck size={24} color="white" />
                            <View>
                                <Text style={styles.statusTitle}>Verified Driver</Text>
                                <Text style={styles.statusText}>You are fully approved to drive.</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Clock size={24} color="white" />
                            <View>
                                <Text style={styles.statusTitle}>Verification Pending</Text>
                                <Text style={styles.statusText}>
                                    {allComplete ? 'Under admin review (24h)' : 'Upload all documents to verify'}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Document Cards */}
                <View style={styles.documentList}>
                    {DOCUMENT_TYPES.map((doc) => {
                        const status = getDocumentStatus(doc.key);
                        const isUploading = uploading === doc.key;
                        const docUrl = documentUrls?.[doc.key as keyof typeof documentUrls];

                        return (
                            <View key={doc.key} style={[styles.documentCard, status === 'uploaded' && styles.cardUploaded]}>
                                <View style={styles.docHeader}>
                                    <View style={[styles.iconBox, status === 'uploaded' ? styles.iconBoxSuccess : styles.iconBoxPending]}>
                                        <Text style={{ fontSize: 20 }}>{doc.icon}</Text>
                                    </View>
                                    <View style={styles.docInfo}>
                                        <Text style={styles.docLabel}>{doc.label}</Text>
                                        <Text style={styles.docDescription}>{doc.description}</Text>
                                    </View>
                                    {status === 'uploaded' && (
                                        <View style={styles.checkBadge}>
                                            <CheckCircle size={14} color="white" />
                                        </View>
                                    )}
                                </View>

                                {/* Preview or Upload Button */}
                                {status === 'uploaded' && docUrl && typeof docUrl === 'string' ? (
                                    <View style={styles.previewContainer}>
                                        <Image
                                            source={{ uri: docUrl }}
                                            style={styles.docPreview}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.previewOverlay}>
                                            <TouchableOpacity
                                                style={styles.editDocBtn}
                                                onPress={() => handleUploadDocument(doc.key)}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <>
                                                        <Camera size={14} color="white" />
                                                        <Text style={styles.editDocText}>Change</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.uploadButton}
                                        onPress={() => handleUploadDocument(doc.key)}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <ActivityIndicator size="small" color={Colors.primary} />
                                        ) : (
                                            <>
                                                <Upload size={18} color={Colors.primary} />
                                                <Text style={styles.uploadText}>Tap to Upload</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Info Note */}
                <View style={styles.infoNote}>
                    <ShieldCheck size={20} color={Colors.textDim} />
                    <Text style={styles.infoText}>
                        Your documents are encrypted and only shared with verified authorities when required.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#F3F4F6' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    content: { flex: 1, padding: 20 },

    // Progress
    progressContainer: { marginBottom: 24 },
    progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 4 },
    progressText: { fontSize: 13, color: '#6B7280', fontWeight: '600', alignSelf: 'flex-end' },

    // Banner
    statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 },
    verifiedBanner: { backgroundColor: Colors.success },
    pendingBanner: { backgroundColor: '#F59E0B' },
    statusTitle: { color: 'white', fontSize: 16, fontWeight: '800', marginBottom: 2 },
    statusText: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },

    // List
    documentList: { gap: 16 },
    documentCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
    cardUploaded: { borderColor: Colors.success },

    docHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    iconBoxSuccess: { backgroundColor: '#ECFDF5' },
    iconBoxPending: { backgroundColor: '#FFFBEB' },
    docInfo: { flex: 1, marginLeft: 12 },
    docLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
    docDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    checkBadge: { backgroundColor: Colors.success, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },

    // Preview
    previewContainer: { borderRadius: 12, overflow: 'hidden', height: 140 },
    docPreview: { width: '100%', height: '100%' },
    previewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
    editDocBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    editDocText: { color: 'white', fontSize: 11, fontWeight: '700' },

    // Upload Btn
    uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 12, gap: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primary },
    uploadText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },

    infoNote: { flexDirection: 'row', alignItems: 'center', marginTop: 24, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 12, gap: 12, paddingBottom: 40 },
    infoText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18 },
});
