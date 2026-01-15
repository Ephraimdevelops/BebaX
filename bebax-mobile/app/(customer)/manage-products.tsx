import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { Id } from '../../src/convex/_generated/dataModel';

export default function ManageProducts() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // State
    const [mode, setMode] = useState<'list' | 'add'>('list');
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productImage, setProductImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Queries & Mutations
    const orgData = useQuery(api.b2b.getOrgStats);
    const products = useQuery(
        api.products.getByOrg,
        orgData?.organization?._id ? { orgId: orgData.organization._id } : "skip"
    );
    const createProduct = useMutation(api.products.create);
    const removeProduct = useMutation(api.products.remove);

    // Take photo from camera (Instagram-style)
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to take photos');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setProductImage(result.assets[0].uri);
            setMode('add');
        }
    };

    // Pick from gallery
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setProductImage(result.assets[0].uri);
            setMode('add');
        }
    };

    // Save product
    const handleSave = async () => {
        if (!productName.trim()) {
            Alert.alert('Name required', 'Enter a name for your product');
            return;
        }

        if (!orgData?.organization?._id) {
            Alert.alert('Error', 'Business not found');
            return;
        }

        setIsSubmitting(true);
        try {
            await createProduct({
                orgId: orgData.organization._id,
                name: productName.trim(),
                price: productPrice ? parseInt(productPrice.replace(/,/g, '')) : undefined,
                image: productImage || undefined,
            });

            // Reset and go back to list
            setProductName('');
            setProductPrice('');
            setProductImage(null);
            setMode('list');
            Alert.alert('✅ Added!', 'Product added to your showroom');
        } catch (error) {
            Alert.alert('Error', 'Failed to add product');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete product
    const handleDelete = (productId: Id<"products">, name: string) => {
        Alert.alert(
            'Remove Product',
            `Remove "${name}" from your showroom?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeProduct({ productId });
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove product');
                        }
                    },
                },
            ]
        );
    };

    // Render Add Mode (Instagram-style)
    if (mode === 'add') {
        return (
            <KeyboardAvoidingView
                style={[styles.container, { paddingTop: insets.top }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setMode('list')} style={styles.headerBtn}>
                        <MaterialIcons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add to Showroom</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isSubmitting || !productName.trim()}
                        style={styles.headerBtn}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <Text style={[
                                styles.saveBtn,
                                (!productName.trim()) && styles.saveBtnDisabled
                            ]}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.addContent}>
                    {/* Photo Preview */}
                    <TouchableOpacity style={styles.photoPreview} onPress={pickImage}>
                        {productImage ? (
                            <Image source={{ uri: productImage }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <MaterialIcons name="add-a-photo" size={48} color={Colors.textDim} />
                                <Text style={styles.photoHint}>Tap to add photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Tip */}
                    <View style={styles.tipBox}>
                        <MaterialIcons name="lightbulb" size={18} color="#92400E" />
                        <Text style={styles.tipText}>
                            Take a photo of the item ON YOUR SHELF. Real photos build trust!
                        </Text>
                    </View>

                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Product Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Mifuko ya Cement"
                            placeholderTextColor={Colors.textDim}
                            value={productName}
                            onChangeText={setProductName}
                            autoFocus
                        />
                    </View>

                    {/* Price Input (Optional) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Price (Optional)</Text>
                        <View style={styles.priceInputRow}>
                            <Text style={styles.currency}>TZS</Text>
                            <TextInput
                                style={[styles.input, styles.priceInput]}
                                placeholder="Leave empty for 'Ask for price'"
                                placeholderTextColor={Colors.textDim}
                                value={productPrice}
                                onChangeText={setProductPrice}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // Render List Mode
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Showroom</Text>
                <View style={styles.headerBtn} />
            </View>

            {/* Add Button - Instagram Style */}
            <View style={styles.addButtonsRow}>
                <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
                    <MaterialIcons name="camera-alt" size={28} color="#FFF" />
                    <Text style={styles.cameraBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
                    <MaterialIcons name="photo-library" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Product List */}
            <ScrollView contentContainerStyle={styles.listContent}>
                {products === undefined ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : products.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="inventory" size={64} color={Colors.textDim} />
                        <Text style={styles.emptyTitle}>No products yet</Text>
                        <Text style={styles.emptyText}>
                            Tap the camera to add your first product
                        </Text>
                    </View>
                ) : (
                    <View style={styles.productGrid}>
                        {products.map((product: any) => (
                            <View key={product._id} style={styles.productCard}>
                                <View style={styles.productImageContainer}>
                                    {product.image ? (
                                        <Image source={{ uri: product.image }} style={styles.productImage} />
                                    ) : (
                                        <MaterialIcons name="inventory-2" size={36} color={Colors.border} />
                                    )}
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                                    {product.price ? (
                                        <Text style={styles.productPrice}>TZS {product.price.toLocaleString()}</Text>
                                    ) : (
                                        <Text style={styles.productPriceAsk}>Ask for price</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handleDelete(product._id, product.name)}
                                >
                                    <MaterialIcons name="delete-outline" size={20} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerBtn: { width: 50, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    saveBtn: { fontSize: 16, fontWeight: '700', color: Colors.primary },
    saveBtnDisabled: { color: Colors.textDim },

    // Add Buttons
    addButtonsRow: {
        flexDirection: 'row', padding: 16, gap: 12,
    },
    cameraBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, gap: 10,
    },
    cameraBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    galleryBtn: {
        width: 56, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFF', borderRadius: 14, borderWidth: 2, borderColor: Colors.primary,
    },

    // Add Mode
    addContent: { padding: 20 },
    photoPreview: {
        width: '100%', aspectRatio: 1, backgroundColor: '#F3F4F6',
        borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    },
    previewImage: { width: '100%', height: '100%' },
    photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    photoHint: { color: Colors.textDim, marginTop: 8 },
    tipBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FEF3C7', padding: 14, borderRadius: 12, marginBottom: 20,
    },
    tipText: { flex: 1, fontSize: 13, color: '#92400E' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
    input: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: Colors.border,
        borderRadius: 12, padding: 16, fontSize: 16, color: Colors.text,
    },
    priceInputRow: { flexDirection: 'row', alignItems: 'center' },
    currency: {
        backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 16,
        borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
        fontSize: 16, fontWeight: '600', color: Colors.textDim,
    },
    priceInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },

    // List Mode
    listContent: { padding: 16, paddingBottom: 100 },
    loadingContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16 },
    emptyText: { color: Colors.textDim, marginTop: 8, textAlign: 'center' },

    // Product Grid
    productGrid: { gap: 12 },
    productCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        borderRadius: 14, padding: 12, gap: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    productImageContainer: {
        width: 70, height: 70, borderRadius: 12, backgroundColor: '#F8FAFC',
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    productImage: { width: '100%', height: '100%' },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
    productPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
    productPriceAsk: { fontSize: 13, color: Colors.textDim, fontStyle: 'italic' },
    deleteBtn: { padding: 10 },
});
