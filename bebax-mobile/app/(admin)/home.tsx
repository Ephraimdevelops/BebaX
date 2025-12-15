import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, StatusBar } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminHome() {
    const { signOut } = useAuth();
    const [activeTab, setActiveTab] = useState('loads'); // 'loads' | 'team'
    const insets = useSafeAreaInsets();

    // DUMMY DATA
    const loads = [
        { id: '1', route: 'Kariakoo -> Masaki', status: 'In Transit', vehicle: 'Canter', eta: '10:30 AM', price: '45,000' },
        { id: '2', route: 'Posta -> Mbezi', status: 'Loading', vehicle: 'Bajaji', eta: '11:00 AM', price: '15,000' },
        { id: '3', route: 'Airport -> CBD', status: 'Pending', vehicle: 'Semi', eta: '2:00 PM', price: '120,000' },
    ];

    const team = [
        { id: '1', name: 'Juma Kaseja', role: 'Senior Driver', spendLimit: '500k', status: 'Active' },
        { id: '2', name: 'Asha Mdee', role: 'Logistics Mgr', spendLimit: 'Unlimited', status: 'Active' },
        { id: '3', name: 'Baraka Obama', role: 'Driver', spendLimit: '200k', status: 'On Leave' },
    ];

    const renderHeader = () => (
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.headerLabel}>CORPORATE ACCOUNT</Text>
                    <Text style={styles.companyName}>BebaX Logistics Ltd</Text>
                </View>
                <TouchableOpacity onPress={() => signOut()} style={styles.logoutButton}>
                    <MaterialIcons name="logout" size={20} color={Colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.balanceCard}>
                <LinearGradient
                    colors={['#1a1a1a', '#333333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceGradient}
                >
                    <View>
                        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                        <Text style={styles.balanceText}>TZS 4,500,000</Text>
                    </View>
                    <View style={styles.walletIcon}>
                        <Ionicons name="wallet" size={24} color="#FFF" />
                    </View>
                </LinearGradient>
            </View>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'loads' && styles.activeTab]}
                onPress={() => setActiveTab('loads')}
            >
                <Text style={[styles.tabText, activeTab === 'loads' && styles.activeTabText]}>Active Loads</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'team' && styles.activeTab]}
                onPress={() => setActiveTab('team')}
            >
                <Text style={[styles.tabText, activeTab === 'team' && styles.activeTabText]}>Team & Limits</Text>
            </TouchableOpacity>
        </View>
    );

    const renderLoadItem = ({ item }: { item: any }) => (
        <View style={styles.cardItem}>
            <View style={styles.cardRow}>
                <View style={styles.iconBox}>
                    <FontAwesome5 name="truck" size={16} color={Colors.primary} />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.itemTitle}>{item.route}</Text>
                    <Text style={styles.itemSubtitle}>{item.vehicle} • ETA {item.eta}</Text>
                </View>
                <View style={styles.priceColumn}>
                    <Text style={styles.itemPrice}>{item.price}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'In Transit' ? '#E3FCEF' : '#FFF8E6' }]}>
                        <Text style={[styles.statusText, { color: item.status === 'In Transit' ? '#006644' : '#B95000' }]}>{item.status}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderTeamItem = ({ item }: { item: any }) => (
        <View style={styles.cardItem}>
            <View style={styles.cardRow}>
                <View style={[styles.avatarBox, { backgroundColor: item.status === 'Active' ? '#E3FCEF' : '#FFEBE6' }]}>
                    <Text style={[styles.avatarText, { color: item.status === 'Active' ? '#006644' : '#BF2600' }]}>
                        {item.name.charAt(0)}
                    </Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemSubtitle}>{item.role}</Text>
                </View>
                <View style={styles.limitColumn}>
                    <Text style={styles.limitLabel}>Limit</Text>
                    <Text style={styles.limitValue}>{item.spendLimit}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient
                colors={['#fff', '#f8f9fa']}
                style={styles.container}
            >
                {renderHeader()}
                {renderTabs()}

                <FlatList
                    data={activeTab === 'loads' ? loads : team}
                    keyExtractor={(item) => item.id}
                    renderItem={activeTab === 'loads' ? renderLoadItem : renderTeamItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
                    showsVerticalScrollIndicator={false}
                />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        backgroundColor: '#fff',
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 10,
    },
    headerLabel: {
        color: Colors.textDim,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    companyName: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: '900',
    },
    logoutButton: {
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
    },
    balanceCard: {
        marginHorizontal: 24,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    balanceGradient: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    balanceText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    walletIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 24,
        marginBottom: 16,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginRight: 12,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    activeTab: {
        backgroundColor: Colors.text, // Black for "Corporate" look
        borderColor: Colors.text,
    },
    tabText: {
        color: Colors.textDim,
        fontWeight: '600',
        fontSize: 14,
    },
    activeTabText: {
        color: '#fff',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    cardItem: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF0EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardContent: {
        flex: 1,
    },
    itemTitle: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    itemSubtitle: {
        color: Colors.textDim,
        fontSize: 13,
    },
    priceColumn: {
        alignItems: 'flex-end',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    limitColumn: {
        alignItems: 'flex-end',
    },
    limitLabel: {
        fontSize: 11,
        color: Colors.textDim,
        marginBottom: 2,
    },
    limitValue: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textDim,
        marginTop: 40,
        fontSize: 16,
    }
});
