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
                {/* Status Banner */}
                <View style={[styles.statusBanner, isVerified ? styles.verifiedBanner : styles.pendingBanner]}>
                    {isVerified ? (
                        <>
                            <ShieldCheck size={24} color="white" />
                            <Text style={styles.statusText}>All documents verified</Text>
                        </>
                    ) : (
                        <>
                            <Clock size={24} color="white" />
                            <Text style={styles.statusText}>
                                {allComplete ? 'Pending Admin Review' : `${completedCount}/${DOCUMENT_TYPES.length} Documents Uploaded`}
                            </Text>
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
                            <View key={doc.key} style={styles.documentCard}>
                                <View style={styles.docHeader}>
                                    <Text style={styles.docIcon}>{doc.icon}</Text>
                                    <View style={styles.docInfo}>
                                        <Text style={styles.docLabel}>{doc.label}</Text>
                                        <Text style={styles.docDescription}>{doc.description}</Text>
                                    </View>
                                    {status === 'uploaded' ? (
                                        <CheckCircle size={24} color={Colors.success} />
                                    ) : (
                                        <AlertCircle size={24} color={Colors.warning} />
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
                                        <TouchableOpacity
                                            style={styles.reuploadButton}
                                            onPress={() => handleUploadDocument(doc.key)}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <ActivityIndicator size="small" color={Colors.primary} />
                                            ) : (
                                                <>
                                                    <Camera size={16} color={Colors.primary} />
                                                    <Text style={styles.reuploadText}>Re-upload</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.uploadButton}
                                        onPress={() => handleUploadDocument(doc.key)}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <>
                                                <Upload size={20} color="white" />
                                                <Text style={styles.uploadText}>Upload Document</Text>
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
                    <FileText size={20} color={Colors.textDim} />
                    <Text style={styles.infoText}>
                        All documents are securely stored and reviewed by our verification team within 24-48 hours.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 20,
    },
    verifiedBanner: {
        backgroundColor: Colors.success,
    },
    pendingBanner: {
        backgroundColor: Colors.warning,
    },
    statusText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    documentList: {
        gap: 16,
    },
    documentCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    docHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    docIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    docInfo: {
        flex: 1,
    },
    docLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    docDescription: {
        fontSize: 13,
        color: Colors.textDim,
        marginTop: 2,
    },
    previewContainer: {
        position: 'relative',
    },
    docPreview: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
    },
    reuploadButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    reuploadText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 10,
    },
    uploadText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 40,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textDim,
        lineHeight: 18,
    },
});
