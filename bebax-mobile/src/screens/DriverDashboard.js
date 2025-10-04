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

const DriverDashboard = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [availableRides, setAvailableRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'my_rides'

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
          loadRides(user.id),
          loadAvailableRides()
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadRides = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rides?userId=${userId}&role=driver`);
      const userRides = await response.json();
      setRides(userRides);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const loadAvailableRides = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/available`);
      const available = await response.json();
      setAvailableRides(available);
    } catch (error) {
      console.error('Error loading available rides:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentUser) {
      await Promise.all([
        loadRides(currentUser.id),
        loadAvailableRides()
      ]);
    }
    setRefreshing(false);
  };

  const handleAcceptRide = async (rideId) => {
    Alert.alert(
      'Accept Ride',
      'Are you sure you want to accept this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/rides/accept`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ride_id: rideId,
                  driver_id: currentUser.id,
                }),
              });

              const result = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Ride accepted successfully!');
                await onRefresh();
                setActiveTab('my_rides');
              } else {
                Alert.alert('Error', result.error || 'Failed to accept ride');
              }
            } catch (error) {
              console.error('Error accepting ride:', error);
              Alert.alert('Error', 'Network error. Please try again.');
            }
          },
        },
      ]
    );
  };

  const updateRideStatus = async (rideId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ride_id: rideId, status }),
      });

      if (response.ok) {
        Alert.alert('Success', `Ride ${status.replace('_', ' ')}`);
        await onRefresh();
      } else {
        Alert.alert('Error', 'Failed to update ride status');
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
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
          <Text style={styles.welcomeText}>Driver Dashboard</Text>
          <Text style={styles.nameText}>{currentUser?.name}</Text>
        </View>
        <Icon name="local-shipping" size={32} color="#16a34a" />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available Rides ({availableRides.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my_rides' && styles.activeTab]}
          onPress={() => setActiveTab('my_rides')}
        >
          <Text style={[styles.tabText, activeTab === 'my_rides' && styles.activeTabText]}>
            My Rides ({rides.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'available' ? (
          <View style={styles.section}>
            {availableRides.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="hourglass-empty" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No available rides</Text>
                <Text style={styles.emptySubtext}>Pull to refresh for new rides</Text>
              </View>
            ) : (
              availableRides.map((ride) => (
                <View key={ride.id} style={styles.rideCard}>
                  <View style={styles.rideHeader}>
                    <View>
                      <Text style={styles.customerName}>
                        {ride.customer_info?.[0]?.name || 'Customer'}
                      </Text>
                      <View style={styles.vehicleBadge}>
                        <Text style={styles.vehicleText}>{ride.vehicle_type}</Text>
                      </View>
                    </View>
                    <View style={styles.fareInfo}>
                      <Text style={styles.fareAmount}>
                        {ride.fare_estimate.toLocaleString()} TZS
                      </Text>
                      <Text style={styles.distance}>{ride.distance} km</Text>
                    </View>
                  </View>

                  <Text style={styles.rideDescription} numberOfLines={2}>
                    {ride.items_description}
                  </Text>

                  <View style={styles.rideFooter}>
                    <View style={styles.timeInfo}>
                      <Icon name="schedule" size={16} color="#64748b" />
                      <Text style={styles.rideTime}>
                        {new Date(ride.created_at).toLocaleString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRide(ride.id)}
                    >
                      <Text style={styles.acceptButtonText}>Accept Ride</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {rides.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="work-off" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No active rides</Text>
                <Text style={styles.emptySubtext}>Accept rides to see them here</Text>
              </View>
            ) : (
              rides.map((ride) => (
                <View key={ride.id} style={styles.rideCard}>
                  <View style={styles.rideHeader}>
                    <View>
                      <Text style={styles.customerName}>
                        {ride.customer_info?.[0]?.name || 'Customer'}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
                      </View>
                    </View>
                    <View style={styles.fareInfo}>
                      <Text style={styles.fareAmount}>
                        {ride.fare_estimate.toLocaleString()} TZS
                      </Text>
                      <Text style={styles.distance}>{ride.distance} km</Text>
                    </View>
                  </View>

                  <Text style={styles.rideDescription} numberOfLines={2}>
                    {ride.items_description}
                  </Text>

                  <View style={styles.actionButtons}>
                    {ride.status === 'accepted' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.startButton]}
                        onPress={() => updateRideStatus(ride.id, 'in_progress')}
                      >
                        <Text style={styles.actionButtonText}>Start Ride</Text>
                      </TouchableOpacity>
                    )}
                    {ride.status === 'in_progress' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={() => updateRideStatus(ride.id, 'completed')}
                      >
                        <Text style={styles.actionButtonText}>Complete Ride</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#16a34a',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: 20,
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
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  vehicleBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  vehicleText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fareInfo: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  distance: {
    fontSize: 12,
    color: '#64748b',
  },
  rideDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rideTime: {
    fontSize: 12,
    color: '#64748b',
  },
  acceptButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#f97316',
  },
  completeButton: {
    backgroundColor: '#16a34a',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DriverDashboard;