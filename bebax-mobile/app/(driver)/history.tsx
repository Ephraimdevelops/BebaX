import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { Clock, MapPin, TriangleAlert } from 'lucide-react-native';

export default function HistoryScreen() {
    // @ts-ignore
    const rides = useQuery(api.rides.listDriverHistory) || [];

    const renderItem = ({ item }: { item: any }) => {
        const date = new Date(item.created_at);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const day = date.toLocaleDateString([], { day: 'numeric', month: 'short' });

        return (
            <View style={styles.card}>
                {/* Time Column */}
                <View style={styles.timeCol}>
                    <Text style={styles.timeText}>{time}</Text>
                    <Text style={styles.dateText}>{day}</Text>
                </View>

                {/* Route Column */}
                <View style={styles.routeCol}>
                    <View style={styles.stopRow}>
                        <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.address} numberOfLines={1}>
                            {item.pickup_location.address}
                        </Text>
                    </View>
                    <View style={styles.verticalLine} />
                    <View style={styles.stopRow}>
                        <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                        <Text style={styles.address} numberOfLines={1}>
                            {item.dropoff_location.address}
                        </Text>
                    </View>
                </View>

                {/* Price Column */}
                <View style={styles.priceCol}>
                    <Text style={styles.price}>
                        {item.final_fare?.toLocaleString()}
                    </Text>
                    <Text style={styles.currency}>TZS</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Safari Zilizopita / Trip History</Text>
                <TouchableOpacity style={styles.reportBtn}>
                    <TriangleAlert size={20} color="#666" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={rides}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Hakuna Safari Bado</Text>
                        <Text style={styles.emptySub}>No trips yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#121212',
    },
    reportBtn: {
        padding: 8,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        // Shadow (Subtle)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    timeCol: {
        width: 60,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#F0F0F0',
        paddingRight: 10,
    },
    timeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    dateText: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    routeCol: {
        flex: 1,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    stopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    verticalLine: {
        width: 1,
        height: 10,
        backgroundColor: '#DDD',
        marginLeft: 3.5,
        marginVertical: 2,
    },
    address: {
        fontSize: 14,
        color: '#444',
    },
    priceCol: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 16,
        fontWeight: '900', // Bold Asphalt
        color: '#121212',
    },
    currency: {
        fontSize: 10,
        color: '#999',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#999',
    },
    emptySub: {
        fontSize: 14,
        color: '#BBB',
    },
});
