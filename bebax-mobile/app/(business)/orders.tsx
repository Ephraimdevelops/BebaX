import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';

type FilterType = 'all' | 'active' | 'completed';

// Reusable Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, { bg: string; text: string }> = {
        pending: { bg: '#FEF3C7', text: '#D97706' },
        ongoing: { bg: '#DBEAFE', text: '#2563EB' },
        completed: { bg: '#D1FAE5', text: '#059669' },
        cancelled: { bg: '#FEE2E2', text: '#DC2626' },
    };
    const color = colors[status] || { bg: '#F1F5F9', text: '#64748B' };

    return (
        <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
            <Text style={[styles.statusText, { color: color.text }]}>
                {status.toUpperCase()}
            </Text>
        </View>
    );
};

export default function BusinessOrders() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [filter, setFilter] = useState<FilterType>('all');

    const orgStats = useQuery(api.b2b.getOrgStats);

    // Mock data - Production would use: api.rides.getByOrg
    const mockOrders = [
        { id: '1', waybill: 'WB-X7A221', recipient: 'Mama Juma', phone: '+255755123456', status: 'ongoing', vehicle: 'Canter', fare: 45000, time: '2h ago' },
        { id: '2', waybill: 'WB-B3C102', recipient: 'Mohamed Ali', phone: '+255712987654', status: 'completed', vehicle: 'Pickup', fare: 25000, time: '5h ago' },
        { id: '3', waybill: 'WB-K9D443', recipient: 'Rose Mwanga', phone: '+255789456123', status: 'pending', vehicle: 'Boda', fare: 8000, time: '10m ago' },
    ];

    const filteredOrders = mockOrders.filter(order => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['pending', 'ongoing'].includes(order.status);
        if (filter === 'completed') return order.status === 'completed';
        return true;
    });

    // Compact Ledger Row - High Density Design
    const renderOrder = ({ item }: { item: typeof mockOrders[0] }) => (
        <TouchableOpacity style={styles.orderRow} activeOpacity={0.7}>
            {/* LEFT: Waybill (THE PRIMARY IDENTIFIER) */}
            <View style={styles.waybillCol}>
                <Text style={styles.waybillNumber}>{item.waybill}</Text>
                <Text style={styles.timeText}>{item.time}</Text>
            </View>

            {/* CENTER: Recipient + Vehicle */}
            <View style={styles.detailsCol}>
                <Text style={styles.recipientName} numberOfLines={1}>{item.recipient}</Text>
                <Text style={styles.vehicleText}>{item.vehicle} • TZS {item.fare.toLocaleString()}</Text>
            </View>

            {/* RIGHT: Status Badge */}
            <StatusBadge status={item.status} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* HEADER - Dark Industrial Style */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View>
                    <Text style={styles.title}>Order Ledger</Text>
                    <Text style={styles.subtitle}>{filteredOrders.length} dispatches</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn}>
                    <MaterialIcons name="refresh" size={22} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
                {/* Filters */}
                <View style={styles.filterRow}>
                    {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Orders List - Compact Rows */}
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialIcons name="local-shipping" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No orders found</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },

    // HEADER - Dark Industrial Style
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#0F172A',
    },
    title: { fontSize: 28, fontWeight: '800', color: '#FFF' },
    subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // CONTENT - White rounded container
    content: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
    },

    // Filters
    filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
    filterBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
    filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    filterTextActive: { color: '#FFF' },

    // List
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    separator: { height: 1, backgroundColor: '#E2E8F0' },

    // ORDER ROW - Compact Ledger Design (HIGH DENSITY)
    orderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 14,
        paddingHorizontal: 12,
        gap: 12,
    },
    waybillCol: {},
    waybillNumber: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        fontFamily: 'monospace',
        letterSpacing: 0.5,
    },
    timeText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

    detailsCol: { flex: 1 },
    recipientName: { fontSize: 14, fontWeight: '600', color: '#334155' },
    vehicleText: { fontSize: 12, color: '#64748B', marginTop: 2 },

    // STATUS BADGE - Pill Design
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Empty State
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyText: { marginTop: 12, fontSize: 15, color: '#94A3B8' },
});
