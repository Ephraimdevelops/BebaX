import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RideDetailsScreen = ({ route, navigation }) => {
  const { ride } = route.params;

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Ride Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
              <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
            </View>
            <Text style={styles.fareAmount}>{ride.fare_estimate.toLocaleString()} TZS</Text>
          </View>
          <Text style={styles.rideId}>Ride ID: {ride.id.slice(0, 8)}...</Text>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.detailRow}>
            <Icon name="radio-button-checked" size={16} color="#16a34a" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue}>
                Lat: {ride.pickup_location.lat.toFixed(4)}, Lng: {ride.pickup_location.lng.toFixed(4)}
              </Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.detailRow}>
            <Icon name="location-on" size={16} color="#dc2626" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Drop-off Location</Text>
              <Text style={styles.detailValue}>
                Lat: {ride.dropoff_location.lat.toFixed(4)}, Lng: {ride.dropoff_location.lng.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle & Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle & Items</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Icon name="local-shipping" size={20} color="#3b82f6" />
              <Text style={styles.infoLabel}>Vehicle Type</Text>
              <Text style={styles.infoValue}>{ride.vehicle_type}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="straighten" size={20} color="#8b5cf6" />
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{ride.distance} km</Text>
            </View>
          </View>
          <View style={styles.itemsCard}>
            <Text style={styles.itemsLabel}>Items Description:</Text>
            <Text style={styles.itemsDescription}>{ride.items_description}</Text>
          </View>
        </View>

        {/* Customer Information */}
        {ride.customer_info?.[0] && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.personCard}>
              <Icon name="person" size={24} color="#3b82f6" />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{ride.customer_info[0].name}</Text>
                <Text style={styles.personContact}>📞 {ride.customer_info[0].phone}</Text>
                <Text style={styles.personContact}>✉️ {ride.customer_info[0].email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Driver Information */}
        {ride.driver_info?.[0] && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            <View style={styles.personCard}>
              <Icon name="drive-eta" size={24} color="#16a34a" />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{ride.driver_info[0].name}</Text>
                <Text style={styles.personContact}>📞 {ride.driver_info[0].phone}</Text>
                <Text style={styles.personContact}>✉️ {ride.driver_info[0].email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineMarker, { backgroundColor: '#3b82f6' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Ride Created</Text>
                <Text style={styles.timelineTime}>{formatDate(ride.created_at)}</Text>
              </View>
            </View>
            
            {ride.accepted_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineMarker, { backgroundColor: '#16a34a' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Ride Accepted</Text>
                  <Text style={styles.timelineTime}>{formatDate(ride.accepted_at)}</Text>
                </View>
              </View>
            )}
            
            {ride.in_progress_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineMarker, { backgroundColor: '#f97316' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Ride Started</Text>
                  <Text style={styles.timelineTime}>{formatDate(ride.in_progress_at)}</Text>
                </View>
              </View>
            )}
            
            {ride.completed_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineMarker, { backgroundColor: '#10b981' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Ride Completed</Text>
                  <Text style={styles.timelineTime}>{formatDate(ride.completed_at)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  rideId: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#64748b',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#d1d5db',
    marginLeft: 7,
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  itemsCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  itemsDescription: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
  },
  personInfo: {
    marginLeft: 12,
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  personContact: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineContent: {
    marginLeft: 16,
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default RideDetailsScreen;