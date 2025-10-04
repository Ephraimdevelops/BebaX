import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL } from '../../App';

const AdminDashboard = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'drivers', 'rides'

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        await Promise.all([
          loadRides(),
          loadDrivers()
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadRides = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rides`);
      const allRides = await response.json();
      setRides(allRides);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`);
      const allDrivers = await response.json();
      setDrivers(allDrivers);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadRides(),
      loadDrivers()
    ]);
    setRefreshing(false);
  };

  const verifyDriver = async (driverId) => {
    Alert.alert(
      'Verify Driver',
      'Are you sure you want to verify this driver?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/drivers/verify`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ driver_id: driverId }),
              });

              if (response.ok) {
                Alert.alert('Success', 'Driver verified successfully!');
                await onRefresh();
              } else {
                Alert.alert('Error', 'Failed to verify driver');
              }
            } catch (error) {
              console.error('Error verifying driver:', error);
              Alert.alert('Error', 'Network error. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      accepted: '#3b82f6',
      in_progress: '#f97316',
      completed: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const verifiedDrivers = drivers.filter(d => d.verified).length;
  const pendingVerifications = drivers.filter(d => !d.verified).length;
  const completedRides = rides.filter(r => r.status === 'completed').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Admin Dashboard</Text>
          <Text style={styles.nameText}>{currentUser?.name}</Text>
        </View>
        <Icon name="admin-panel-settings" size={32} color="#dc2626" />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'drivers' && styles.activeTab]}
          onPress={() => setActiveTab('drivers')}
        >
          <Text style={[styles.tabText, activeTab === 'drivers' && styles.activeTabText]}>
            Drivers ({pendingVerifications})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rides' && styles.activeTab]}
          onPress={() => setActiveTab('rides')}
        >
          <Text style={[styles.tabText, activeTab === 'rides' && styles.activeTabText]}>
            Rides
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'overview' && (
          <View style={styles.section}>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.blueCard]}>
                <Text style={styles.statNumber}>{rides.length}</Text>
                <Text style={styles.statLabel}>Total Rides</Text>
              </View>
              <View style={[styles.statCard, styles.greenCard]}>
                <Text style={styles.statNumber}>{verifiedDrivers}</Text>
                <Text style={styles.statLabel}>Active Drivers</Text>
              </View>
              <View style={[styles.statCard, styles.orangeCard]}>
                <Text style={styles.statNumber}>{pendingVerifications}</Text>
                <Text style={styles.statLabel}>Pending Verifications</Text>
              </View>
              <View style={[styles.statCard, styles.purpleCard]}>
                <Text style={styles.statNumber}>{completedRides}</Text>
                <Text style={styles.statLabel}>Completed Rides</Text>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Rides</Text>
              {rides.slice(0, 5).map((ride) => (
                <View key={ride.id} style={styles.rideCard}>
                  <View style={styles.rideHeader}>
                    <Text style={styles.customerName}>
                      {ride.customer_info?.[0]?.name || 'Customer'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.rideDetails}>
                    <Text style={styles.fareAmount}>
                      {ride.fare_estimate.toLocaleString()} TZS
                    </Text>
                    <Text style={styles.distance}>{ride.distance} km</Text>
                    <Text style={styles.vehicleType}>{ride.vehicle_type}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'drivers' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Verifications</Text>
            {pendingVerifications === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="verified-user" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No pending verifications</Text>
                <Text style={styles.emptySubtext}>All drivers are verified</Text>
              </View>
            ) : (
              drivers.filter(d => !d.verified).map((driver) => (
                <View key={driver.id} style={styles.driverCard}>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>
                      {driver.user_info?.[0]?.name || 'Driver'}
                    </Text>
                    <Text style={styles.driverPhone}>
                      📞 {driver.user_info?.[0]?.phone || 'No phone'}
                    </Text>
                    <Text style={styles.driverDetail}>
                      License: {driver.license_number}
                    </Text>
                    <Text style={styles.driverDetail}>
                      Vehicle: {driver.vehicle_type} - {driver.vehicle_plate}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => verifyDriver(driver.id)}
                  >
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Verified Drivers */}
            {verifiedDrivers > 0 && (
              <View style={styles.verifiedSection}>
                <Text style={styles.sectionTitle}>Verified Drivers ({verifiedDrivers})</Text>
                {drivers.filter(d => d.verified).slice(0, 5).map((driver) => (
                  <View key={driver.id} style={styles.verifiedDriverCard}>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>
                        {driver.user_info?.[0]?.name || 'Driver'}
                      </Text>
                      <Text style={styles.driverDetail}>
                        {driver.vehicle_type} - {driver.vehicle_plate}
                      </Text>
                    </View>
                    <Icon name="verified" size={24} color="#16a34a" />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'rides' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Rides</Text>
            {rides.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="local-shipping" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No rides yet</Text>
              </View>
            ) : (
              rides.map((ride) => (
                <View key={ride.id} style={styles.rideCard}>
                  <View style={styles.rideHeader}>
                    <Text style={styles.customerName}>
                      {ride.customer_info?.[0]?.name || 'Customer'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.rideDescription} numberOfLines={2}>
                    {ride.items_description}
                  </Text>
                  <View style={styles.rideFooter}>
                    <Text style={styles.fareAmount}>
                      {ride.fare_estimate.toLocaleString()} TZS
                    </Text>
                    <Text style={styles.distance}>{ride.distance} km</Text>
                    <Text style={styles.vehicleType}>{ride.vehicle_type}</Text>
                  </View>
                  {ride.driver_info?.[0] && (
                    <Text style={styles.driverAssigned}>
                      Driver: {ride.driver_info[0].name}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#dc2626',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#dc2626',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  blueCard: {
    borderLeftColor: '#3b82f6',
  },
  greenCard: {
    borderLeftColor: '#10b981',
  },
  orangeCard: {
    borderLeftColor: '#f97316',
  },
  purpleCard: {
    borderLeftColor: '#8b5cf6',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  recentSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  rideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  fareAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  distance: {
    fontSize: 12,
    color: '#64748b',
  },
  vehicleType: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  rideDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  driverAssigned: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
    marginTop: 8,
  },
  driverCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  driverDetail: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  verifyButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedSection: {
    marginTop: 24,
  },
  verifiedDriverCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
});

export default AdminDashboard;