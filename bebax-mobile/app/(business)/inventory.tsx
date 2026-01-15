import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

export default function BusinessInventory() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Fetch org
    const orgStats = useQuery(api.b2b.getOrgStats);
    const products = useQuery(
        api.products.getByOrg,
        orgStats?.organization?._id ? { orgId: orgStats.organization._id } : "skip"
    );

    if (products === undefined) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const handleShipProduct = (product: any) => {
        // Navigate to dispatch with product pre-filled
        router.push({
            pathname: '/(business)/dispatch',
            params: {
                productId: product._id,
                productName: product.name,
            }
        });
    };

    const renderProduct = ({ item }: { item: any }) => (
        <View style={styles.productCard}>
            {/* Image */}
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.productImage} />
            ) : (
                <View style={[styles.productImage, styles.placeholderImage]}>
                    <MaterialIcons name="inventory-2" size={32} color="#CBD5E1" />
                </View>
            )}

            {/* Info */}
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>
                    {item.price ? `TZS ${item.price.toLocaleString()}` : 'Ask for Price'}
                </Text>
            </View>

            {/* Ship Button */}
            <TouchableOpacity
                style={styles.shipBtn}
                onPress={() => handleShipProduct(item)}
            >
                <MaterialIcons name="local-shipping" size={18} color="#FFF" />
                <Text style={styles.shipBtnText}>Ship</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View>
                    <Text style={styles.title}>Inventory</Text>
                    <Text style={styles.subtitle}>{products?.length || 0} products</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/(customer)/manage-products')}
                >
                    <MaterialIcons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Products Grid */}
            <FlatList
                data={products || []}
                keyExtractor={(item) => item._id}
                renderItem={renderProduct}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.gridContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialIcons name="inventory" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No Products Yet</Text>
                        <Text style={styles.emptyText}>Add items to your inventory to start shipping</Text>
                        <TouchableOpacity
                            style={styles.emptyBtn}
                            onPress={() => router.push('/(customer)/manage-products')}
                        >
                            <MaterialIcons name="add" size={20} color="#FFF" />
                            <Text style={styles.emptyBtnText}>Add Product</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    },
    title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
    subtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
    addBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },

    // Grid
    gridContent: { padding: 16, paddingBottom: 100 },
    gridRow: { gap: 12 },

    // Product Card
    productCard: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
        marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
    },
    productImage: { width: '100%', height: 120, backgroundColor: '#F1F5F9' },
    placeholderImage: { justifyContent: 'center', alignItems: 'center' },
    productInfo: { padding: 12 },
    productName: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
    productPrice: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    shipBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#0F172A', marginHorizontal: 12, marginBottom: 12,
        paddingVertical: 10, borderRadius: 10,
    },
    shipBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

    // Empty State
    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginTop: 16 },
    emptyText: { fontSize: 14, color: '#64748B', marginTop: 8, textAlign: 'center' },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 12, marginTop: 24,
    },
    emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
