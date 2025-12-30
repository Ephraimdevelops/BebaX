import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../src/convex/_generated/api';
import { Colors } from '../../src/constants/Colors';
import { HandCoins, Percent, Wallet, ArrowRight, TrendingUp, TrendingDown, Calendar, Clock, MapPin } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function EarningsScreen() {
    const earnings = useQuery(api.drivers.getEarnings);
    // @ts-ignore
    const history = useQuery(api.rides.listDriverHistory);
    const payCommission = useMutation(api.drivers.payCommission);

    const [refreshing, setRefreshing] = useState(false);
    const [paying, setPaying] = useState(false);

    // Default values
    const data = earnings || {
        today: 0,
        week: 0,
        previous_week: 0,
        month: 0,
        cash_collected: 0,
        wallet_balance: 0,
        commission_debt: 0,
    };

    const isDebt = data.wallet_balance < 0;
    const debtAmount = Math.abs(data.wallet_balance);
    const trend = data.week > data.previous_week ? 'up' : 'down';
    const trendPercent = data.previous_week > 0
        ? Math.round(((data.week - data.previous_week) / data.previous_week) * 100)
        : 100;

    const handlePayDebt = async () => {
        if (!isDebt) return;
        setPaying(true);
        try {
            // Simulate payment flow
            await payCommission({ amount: debtAmount });
            Alert.alert("Success", "Commission paid successfully! Wallet unlocked.");
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setPaying(false);
        }
    };

    const renderTripItem = (trip: any) => (
        <View key={trip._id} style={styles.tripCard}>
            <View style={styles.tripHeader}>
                <View style={styles.tripRoute}>
                    <Text style={styles.tripTime}>{new Date(trip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    <View style={styles.tripBadges}>
                        <View style={styles.vehicleBadge}>
                            <Text style={styles.vehicleText}>{trip.vehicle_type}</Text>
                        </View>
                        <Text style={styles.tripStatus}>{trip.status.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.tripFare}>TZS {trip.fare_estimate?.toLocaleString()}</Text>
            </View>

            <View style={styles.tripAddresses}>
                <View style={styles.addressRow}>
                    <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                    <Text numberOfLines={1} style={styles.addressText}>{trip.pickup_location.address}</Text>
                </View>
                <View style={[styles.line, { height: 12, marginLeft: 3 }]} />
                <View style={styles.addressRow}>
                    <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                    <Text numberOfLines={1} style={styles.addressText}>{trip.dropoff_location.address}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor="white" />
                }
            >
                {/* Hero Card */}
                <View style={styles.heroCard}>
                    <Text style={styles.heroTitle}>TOTAL EARNINGS (WEEK)</Text>
                    <Text style={styles.heroAmount}>TZS {data.week.toLocaleString()}</Text>

                    <View style={styles.trendRow}>
                        <View style={[styles.trendBadge, trend === 'up' ? styles.trendUp : styles.trendDown]}>
                            {trend === 'up' ? <TrendingUp size={16} color="white" /> : <TrendingDown size={16} color="white" />}
                            <Text style={styles.trendText}>{Math.abs(trendPercent)}% vs last week</Text>
                        </View>
                        <Text style={styles.todayText}>Today: TZS {data.today.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Financial Health Grid */}
                <View style={styles.gridContainer}>
                    <View style={styles.gridCard}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,193,7,0.1)' }]}>
                            <HandCoins size={20} color="#FFC107" />
                        </View>
                        <Text style={styles.gridLabel}>Cash in Hand</Text>
                        <Text style={styles.gridValue}>TZS {data.cash_collected.toLocaleString()}</Text>
                    </View>

                    <View style={styles.gridCard}>
                        <View style={[styles.iconCircle, { backgroundColor: isDebt ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }]}>
                            <Wallet size={20} color={isDebt ? Colors.error : Colors.success} />
                        </View>
                        <Text style={styles.gridLabel}>Wallet Balance</Text>
                        <Text style={[styles.gridValue, { color: isDebt ? Colors.error : Colors.success }]}>
                            TZS {data.wallet_balance.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Commission Action */}
                {isDebt && (
                    <View style={styles.debtCard}>
                        <View style={styles.debtContent}>
                            <View style={styles.debtInfo}>
                                <Text style={styles.debtTitle}>Commission Due</Text>
                                <Text style={styles.debtDesc}>Pay expected commission to unlock features.</Text>
                            </View>
                            <Text style={styles.debtAmount}>TZS {debtAmount.toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={handlePayDebt}
                            disabled={paying}
                        >
                            <Text style={styles.payButtonText}>{paying ? "Processing..." : "Lipa Deni Now"}</Text>
                            <ArrowRight size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Recent History */}
                <View style={styles.historySection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Trips</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {history ? (
                        history.length > 0 ? (
                            history.map(renderTripItem)
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No trips yet. Go online to start earning!</Text>
                            </View>
                        )
                    ) : (
                        <Text style={styles.loadingText}>Loading history...</Text>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    heroCard: {
        backgroundColor: '#1E1E24', // Slightly lighter dark
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    heroTitle: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    heroAmount: {
        color: 'white',
        fontSize: 36,
        fontWeight: '900',
        marginBottom: 16,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    trendUp: {
        backgroundColor: Colors.success,
    },
    trendDown: {
        backgroundColor: Colors.error,
    },
    trendText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    todayText: {
        color: '#CCC',
        fontSize: 12,
        fontWeight: '500',
    },
    // Grid
    gridContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    gridCard: {
        flex: 1,
        backgroundColor: '#1E1E24',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    gridLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    gridValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Debt Card
    debtCard: {
        backgroundColor: 'rgba(239,68,68,0.1)', // Red tint
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
    },
    debtContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    debtInfo: {
        flex: 1,
    },
    debtTitle: {
        color: Colors.error,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    debtDesc: {
        color: '#BBB',
        fontSize: 12,
    },
    debtAmount: {
        color: Colors.error,
        fontSize: 18,
        fontWeight: '900',
    },
    payButton: {
        backgroundColor: Colors.error,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    payButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    // History
    historySection: {
        marginTop: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    seeAllText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    loadingText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
    },
    // Trip Card
    tripCard: {
        backgroundColor: '#1E1E24',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tripRoute: {
        flex: 1,
    },
    tripTime: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    tripBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    vehicleBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    vehicleText: {
        color: '#CCC',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    tripStatus: {
        color: Colors.success,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tripFare: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tripAddresses: {
        marginTop: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    line: {
        width: 1,
        backgroundColor: '#444',
    },
    addressText: {
        color: '#BBB',
        fontSize: 13,
        flex: 1,
    },
});
