import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Linking,
    Dimensions,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../src/convex/_generated/api';
import { Id } from '../../../src/convex/_generated/dataModel';
import { Colors } from '../../../src/constants/Colors';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function BusinessShowroom() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [cargoModal, setCargoModal] = useState(false);
    const [cargoDescription, setCargoDescription] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [productModal, setProductModal] = useState(false);

    // Fetch Organization & Products
    const org = useQuery(
        api.b2b.getOrganization,
        typeof id === 'string' ? { id: id as Id<"organizations"> } : "skip"
    );
    const products = useQuery(
        api.products.getByOrg,
        typeof id === 'string' ? { orgId: id as Id<"organizations"> } : "skip"
    );

    // Track view on page load
    const recordInteraction = useMutation(api.b2b.recordInteraction);

    useEffect(() => {
        if (org && typeof id === 'string') {
            recordInteraction({ bizId: id as Id<"organizations">, type: 'view' });
        }
    }, [org?._id]);

    // Handle WhatsApp with pre-filled message
    const handleWhatsApp = (productName?: string) => {
        if (!org?.whatsapp_number && !org?.phone) return;
        const phone = org.whatsapp_number || org.phone;
        const cleanPhone = phone?.replace(/[^0-9]/g, '');
        const message = productName
            ? `Habari, nimeona ${productName} kwenye BebaX. Iko available?`
            : `Habari, ninaangalia bidhaa zenu kwenye BebaX.`;
        const url = `whatsapp://send?phone=+255${cleanPhone}&text=${encodeURIComponent(message)}`;

        // Track lead
        if (typeof id === 'string') {
            recordInteraction({ bizId: id as Id<"organizations">, type: 'lead' });
        }
        Linking.openURL(url);
    };

    // Handle Call
    const handleCall = () => {
        if (!org?.phone) return;
        // Track lead
        if (typeof id === 'string') {
            recordInteraction({ bizId: id as Id<"organizations">, type: 'lead' });
        }
        Linking.openURL(`tel:${org.phone}`);
    };

    // Handle "Tuma Usafiri" - Request Pickup
    const handleRequestPickup = () => {
        setCargoModal(true);
    };

    // Confirm cargo and navigate to booking
    const confirmCargo = () => {
        if (!cargoDescription.trim()) return;
        setCargoModal(false);

        // Navigate to book-ride with pre-filled pickup
        router.push({
            pathname: '/(customer)/book-move',
            params: {
                prefillPickup: 'true',
                pickupLat: org?.location?.lat?.toString(),
                pickupLng: org?.location?.lng?.toString(),
                pickupAddress: org?.location?.address || org?.name,
                pickupNote: `Picking up from ${org?.name}: ${cargoDescription}`,
                origin_business_id: id as string,
            },
        });
    };

    // View product detail
    const openProductDetail = (product: any) => {
        setSelectedProduct(product);
        setProductModal(true);
    };

    if (org === undefined) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ color: Colors.textDim, marginTop: 16 }}>Loading showroom...</Text>
            </View>
        );
    }

    if (!org) {
        return (
            <View style={[styles.container, styles.center]}>
                <MaterialIcons name="store" size={80} color={Colors.textDim} />
                <Text style={{ color: Colors.textDim, marginTop: 16 }}>Business not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                    <Text style={{ color: Colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
                {/* Cover Photo */}
                <View style={styles.coverContainer}>
                    {org.coverPhoto ? (
                        <Image source={{ uri: org.coverPhoto }} style={styles.coverImage} />
                    ) : (
                        <View style={[styles.coverImage, styles.placeholderCover]}>
                            <MaterialIcons name="store" size={64} color="#FFF" opacity={0.5} />
                        </View>
                    )}

                    {/* Back Button */}
                    <TouchableOpacity
                        style={[styles.backButton, { top: insets.top + 10 }]}
                        onPress={() => router.back()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Profile Header */}
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <View style={styles.logoContainer}>
                            {org.logo ? (
                                <Image source={{ uri: org.logo }} style={styles.logo} />
                            ) : (
                                <Text style={styles.logoText}>{org.name?.charAt(0)}</Text>
                            )}
                        </View>
                        <View style={{ flex: 1, paddingTop: 10 }}>
                            <Text style={styles.bizName}>{org.name}</Text>
                            <View style={styles.badges}>
                                {org.verified ? (
                                    <View style={styles.verifiedBadge}>
                                        <MaterialIcons name="verified" size={14} color="#FFF" />
                                        <Text style={styles.verifiedText}>Verified</Text>
                                    </View>
                                ) : org.location_locked === false && (
                                    <View style={styles.unverifiedBadge}>
                                        <MaterialIcons name="warning" size={12} color="#92400E" />
                                        <Text style={styles.unverifiedText}>Unverified - Call to confirm</Text>
                                    </View>
                                )}
                                {org.industry && (
                                    <View style={styles.industryBadge}>
                                        <Text style={styles.industryText}>{org.industry}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.description}>
                            {org.description || "No description provided."}
                        </Text>

                        {/* Location */}
                        <TouchableOpacity style={styles.infoRow}>
                            <MaterialIcons name="location-pin" size={18} color={Colors.textDim} />
                            <Text style={styles.infoText} numberOfLines={2}>
                                {org.location?.address || "Location unavailable"}
                            </Text>
                        </TouchableOpacity>

                        {/* Operating Hours */}
                        {org.operating_hours && (
                            <View style={styles.infoRow}>
                                <MaterialIcons name="schedule" size={18} color={Colors.textDim} />
                                <Text style={styles.infoText}>{org.operating_hours}</Text>
                            </View>
                        )}
                    </View>

                    {/* Product Showroom - Pinterest Grid */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Showroom ({products?.length || 0})
                        </Text>

                        {products && products.length > 0 ? (
                            <View style={styles.productGrid}>
                                {products.map((product: any) => (
                                    <TouchableOpacity
                                        key={product._id}
                                        style={styles.productCard}
                                        onPress={() => openProductDetail(product)}
                                        activeOpacity={0.9}
                                    >
                                        <View style={styles.productImageContainer}>
                                            {product.image ? (
                                                <Image source={{ uri: product.image }} style={styles.productImage} />
                                            ) : (
                                                <MaterialIcons name="inventory-2" size={40} color={Colors.border} />
                                            )}
                                        </View>
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName} numberOfLines={2}>
                                                {product.name}
                                            </Text>
                                            {product.price ? (
                                                <Text style={styles.productPrice}>
                                                    TZS {product.price.toLocaleString()}
                                                </Text>
                                            ) : (
                                                <Text style={styles.productPriceAsk}>Ask for price</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyProducts}>
                                <MaterialIcons name="inventory" size={48} color={Colors.textDim} />
                                <Text style={styles.emptyText}>No products listed yet</Text>
                            </View>
                        )}
                    </View>

                    {/* Disclaimer */}
                    <View style={styles.disclaimer}>
                        <MaterialIcons name="info-outline" size={16} color={Colors.textDim} />
                        <Text style={styles.disclaimerText}>
                            BebaX charges for transport only. Pay the shop directly for goods.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Action Bar */}
            <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.whatsappBtn]}
                    onPress={() => handleWhatsApp()}
                >
                    <FontAwesome5 name="whatsapp" size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.callBtn]}
                    onPress={handleCall}
                >
                    <MaterialIcons name="phone" size={20} color={Colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.pickupBtn]}
                    onPress={handleRequestPickup}
                    disabled={!org.location}
                >
                    <MaterialIcons name="local-shipping" size={20} color="#FFF" />
                    <Text style={styles.pickupBtnText}>Tuma Usafiri</Text>
                </TouchableOpacity>
            </View>

            {/* Cargo Context Modal */}
            <Modal visible={cargoModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Unaagiza nini?</Text>
                        <Text style={styles.modalSubtitle}>What are you picking up?</Text>

                        <TextInput
                            style={styles.cargoInput}
                            placeholder="e.g., Mifuko 2 ya Cement"
                            placeholderTextColor={Colors.textDim}
                            value={cargoDescription}
                            onChangeText={setCargoDescription}
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setCargoModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, !cargoDescription.trim() && styles.confirmBtnDisabled]}
                                onPress={confirmCargo}
                                disabled={!cargoDescription.trim()}
                            >
                                <MaterialIcons name="local-shipping" size={20} color="#FFF" />
                                <Text style={styles.confirmBtnText}>Request Pickup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Product Detail Modal */}
            <Modal visible={productModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.productModalContent}>
                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setProductModal(false)}
                        >
                            <MaterialIcons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>

                        {selectedProduct?.image ? (
                            <Image source={{ uri: selectedProduct.image }} style={styles.productModalImage} />
                        ) : (
                            <View style={[styles.productModalImage, styles.productModalPlaceholder]}>
                                <MaterialIcons name="inventory-2" size={64} color={Colors.border} />
                            </View>
                        )}

                        <Text style={styles.productModalName}>{selectedProduct?.name}</Text>
                        {selectedProduct?.price ? (
                            <Text style={styles.productModalPrice}>
                                TZS {selectedProduct.price.toLocaleString()}
                            </Text>
                        ) : (
                            <Text style={styles.productModalPriceAsk}>Price on inquiry</Text>
                        )}

                        {selectedProduct?.description && (
                            <Text style={styles.productModalDesc}>{selectedProduct.description}</Text>
                        )}

                        <TouchableOpacity
                            style={styles.inquireBtn}
                            onPress={() => {
                                setProductModal(false);
                                handleWhatsApp(selectedProduct?.name);
                            }}
                        >
                            <FontAwesome5 name="whatsapp" size={18} color="#FFF" />
                            <Text style={styles.inquireBtnText}>Inquire about this</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { justifyContent: 'center', alignItems: 'center' },
    backLink: { marginTop: 20, padding: 12 },

    // Cover
    coverContainer: { height: 200, backgroundColor: Colors.text, position: 'relative' },
    coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderCover: { backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
    backButton: {
        position: 'absolute', left: 16, padding: 10, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },

    // Content
    contentContainer: {
        flex: 1, backgroundColor: '#FFF', marginTop: -30,
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        paddingHorizontal: 20, paddingTop: 10,
    },
    headerRow: { flexDirection: 'row', marginBottom: 20 },
    logoContainer: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF',
        borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center',
        marginTop: -40, marginRight: 16, shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    logo: { width: '100%', height: '100%', borderRadius: 40 },
    logoText: { fontSize: 32, fontWeight: 'bold', color: Colors.primary },
    bizName: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    verifiedBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4,
    },
    verifiedText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    unverifiedBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4,
    },
    unverifiedText: { color: '#92400E', fontSize: 10, fontWeight: '600' },
    industryBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    industryText: { color: Colors.textDim, fontSize: 11, fontWeight: '600' },

    // Sections
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
    description: { fontSize: 14, color: Colors.text, lineHeight: 22, marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    infoText: { fontSize: 14, color: Colors.textDim, flex: 1 },

    // Product Grid (Pinterest style)
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    productCard: {
        width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 16,
        overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    productImageContainer: {
        height: 140, backgroundColor: '#F8FAFC',
        justifyContent: 'center', alignItems: 'center',
    },
    productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    productInfo: { padding: 12 },
    productName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4, height: 36 },
    productPrice: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
    productPriceAsk: { fontSize: 12, color: Colors.textDim, fontStyle: 'italic' },
    emptyProducts: { padding: 40, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16 },
    emptyText: { color: Colors.textDim, marginTop: 12 },

    // Disclaimer
    disclaimer: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12,
    },
    disclaimerText: { flex: 1, fontSize: 12, color: '#92400E' },

    // Action Bar
    actionBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', padding: 16, backgroundColor: '#FFF',
        borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12,
    },
    actionBtn: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        padding: 14, borderRadius: 14, gap: 8,
    },
    whatsappBtn: { flex: 1, backgroundColor: '#25D366' },
    callBtn: { backgroundColor: '#EFF6FF', width: 52 },
    pickupBtn: { flex: 1.5, backgroundColor: Colors.primary },
    actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    pickupBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

    // Cargo Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24,
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
    modalSubtitle: { fontSize: 14, color: Colors.textDim, marginBottom: 20 },
    cargoInput: {
        backgroundColor: '#F3F4F6', borderRadius: 14, padding: 16,
        fontSize: 16, color: Colors.text, minHeight: 80, textAlignVertical: 'top',
    },
    modalActions: { flexDirection: 'row', marginTop: 20, gap: 12 },
    cancelBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 14, backgroundColor: '#F3F4F6' },
    cancelBtnText: { color: Colors.textDim, fontWeight: '600' },
    confirmBtn: {
        flex: 2, flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'center',
        borderRadius: 14, backgroundColor: Colors.primary, gap: 8,
    },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    // Product Modal
    productModalContent: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingTop: 16,
    },
    closeModalBtn: {
        alignSelf: 'flex-end', padding: 8, marginBottom: 8,
    },
    productModalImage: { width: '100%', height: 250, borderRadius: 16, marginBottom: 16 },
    productModalPlaceholder: { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    productModalName: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
    productModalPrice: { fontSize: 20, fontWeight: 'bold', color: Colors.primary, marginBottom: 12 },
    productModalPriceAsk: { fontSize: 16, color: Colors.textDim, fontStyle: 'italic', marginBottom: 12 },
    productModalDesc: { fontSize: 14, color: Colors.text, lineHeight: 22, marginBottom: 20 },
    inquireBtn: {
        flexDirection: 'row', backgroundColor: '#25D366', padding: 16,
        borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    inquireBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
