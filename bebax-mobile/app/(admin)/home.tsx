import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, StatusBar, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AdminHome() {
    const { signOut } = useAuth();
    const [activeTab, setActiveTab] = useState('loads'); // 'loads' | 'team'
    const insets = useSafeAreaInsets();
    const [showTopUp, setShowTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('50000');

    // QUERIES
    const org = useQuery(api.b2b.getMyOrganization);
    const rides = useQuery(api.organizations.getOrgRides, org ? { orgId: org._id } : "skip");
    const team = useQuery(api.organizations.getMembers, org ? { orgId: org._id } : "skip");

    const topUpWallet = useMutation(api.b2b.topUpWallet);

    const handleTopUp = async () => {
        try {
            await topUpWallet({ amount: parseInt(topUpAmount) });
            Alert.alert("Success", "Funds added to wallet.");
            setShowTopUp(false);
        } catch (err) {
            Alert.alert("Error", "Failed to top up.");
        }
    };

    const renderHeader = () => (
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.headerLabel}>CORPORATE ACCOUNT</Text>
                    <Text style={styles.companyName}>{org?.name || "Loading..."}</Text>
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
                        <Text style={styles.balanceText}>
                            TZS {org?.walletBalance?.toLocaleString() || "0"}
                        </Text>
                        <Text style={styles.creditLabel}>
                            Credit Limit: {org?.creditLimit?.toLocaleString() || 0}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowTopUp(true)} style={styles.walletIcon}>
                        <Ionicons name="add" size={32} color="#FFF" />
                    </TouchableOpacity>
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
                    <Text style={styles.itemTitle}>Trip to {item.dropoff_location?.address?.split(',')[0] || 'Destination'}</Text>
                    <Text style={styles.itemSubtitle}>
                        {item.vehicle_type?.toUpperCase()} • {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.priceColumn}>
                    <Text style={styles.itemPrice}>{(item.final_fare || item.fare_estimate).toLocaleString()}</Text>
                    <View style={[styles.statusBadge, {
                        backgroundColor: item.status === 'ongoing' ? '#E3FCEF' : '#FFF8E6'
                    }]}>
                        <Text style={[styles.statusText, {
                            color: item.status === 'ongoing' ? '#006644' : '#B95000'
                        }]}>
                            {item.status?.toUpperCase() || "PENDING"}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderTeamItem = ({ item }: { item: any }) => (
        <View style={styles.cardItem}>
            <View style={styles.cardRow}>
                <View style={[styles.avatarBox, { backgroundColor: '#E3FCEF' }]}>
                    <Text style={[styles.avatarText, { color: '#006644' }]}>
                        {item.name?.charAt(0) || "U"}
                    </Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemSubtitle}>{item.orgRole === 'admin' ? 'Manager' : 'Employee'}</Text>
                </View>
                <View style={styles.limitColumn}>
                    <Text style={styles.limitLabel}>Daily Limit</Text>
                    <Text style={styles.limitValue}>
                        {item.spendingLimitPerDay ? `${item.spendingLimitPerDay.toLocaleString()}` : 'Unlimited'}
                    </Text>
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

                {(!org) ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={activeTab === 'loads' ? rides : team}
                        keyExtractor={(item) => item._id}
                        renderItem={activeTab === 'loads' ? renderLoadItem : renderTeamItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </LinearGradient>

            {/* Simple Top Up Modal */}
            <Modal visible={showTopUp} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Top Up Wallet</Text>
                        <TextInput
                            value={topUpAmount}
                            onChangeText={setTopUpAmount}
                            keyboardType="numeric"
                            style={styles.input}
                        />
                        <TouchableOpacity onPress={handleTopUp} style={styles.modalBtn}>
                            <Text style={styles.modalBtnText}>Add Funds</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowTopUp(false)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    creditLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 4,
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
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        marginBottom: 16,
    },
    modalBtn: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    modalBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    closeBtn: {
        padding: 16,
        alignItems: 'center',
    },
    closeBtnText: {
        color: Colors.textDim,
        fontSize: 16,
    }
});
