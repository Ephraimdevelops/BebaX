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

const CustomerDashboard = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        await loadRides(user.id);
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
      const response = await fetch(`${API_BASE_URL}/rides?userId=${userId}&role=customer`);
      const userRides = await response.json();
      setRides(userRides);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentUser) {
      await loadRides(currentUser.id);
    }
    setRefreshing(false);
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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('currentUser');
            // This will trigger app restart and show auth screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{currentUser?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Icon name="logout" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Book Ride')}
        >
          <Icon name="add-circle" size={32} color="#2563eb" />
          <Text style={styles.actionText}>Book New Ride</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Bookings</Text>
        {rides.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="local-shipping" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubtext}>Book your first moving service!</Text>
          </View>
        ) : (
          rides.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              style={styles.rideCard}
              onPress={() => navigation.navigate('RideDetails', { ride })}
            >
              <View style={styles.rideHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
                </View>
                <View style={styles.fareInfo}>
                  <Text style={styles.fareAmount}>{ride.fare_estimate.toLocaleString()} TZS</Text>
                  <Text style={styles.distance}>{ride.distance} km</Text>
                </View>
              </View>
              
              <Text style={styles.rideDescription} numberOfLines={2}>
                {ride.items_description}
              </Text>
              
              <View style={styles.rideFooter}>
                <Icon name="schedule" size={16} color="#64748b" />
                <Text style={styles.rideTime}>
                  {new Date(ride.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.vehicleType}>{ride.vehicle_type}</Text>
              </View>
              
              {ride.driver_info?.[0] && (
                <View style={styles.driverInfo}>
                  <Icon name="person" size={16} color="#16a34a" />
                  <Text style={styles.driverText}>
                    Driver: {ride.driver_info[0].name}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
  quickActions: {
    padding: 20,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
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
    marginBottom: 12,
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
  fareInfo: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
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
    alignItems: 'center',
    gap: 8,
  },
  rideTime: {
    fontSize: 12,
    color: '#64748b',
  },
  vehicleType: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
    marginLeft: 'auto',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    gap: 4,
  },
  driverText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
});

export default CustomerDashboard;