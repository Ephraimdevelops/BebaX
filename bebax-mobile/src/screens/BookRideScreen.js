import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL } from '../../App';

const BookRideScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    pickup_address: '',
    dropoff_address: '',
    pickup_location: { lat: 0, lng: 0 },
    dropoff_location: { lat: 0, lng: 0 },
    vehicle_type: '',
    items_description: '',
  });

  const vehicleTypes = [
    { label: 'Tricycle Cabin (Small items) - from 2,000 TZS', value: 'tricycle' },
    { label: 'Van (Medium items) - from 5,000 TZS', value: 'van' },
    { label: 'Truck (Large items) - from 8,000 TZS', value: 'truck' },
    { label: 'Semi-trailer (Commercial) - from 15,000 TZS', value: 'semitrailer' },
  ];

  useEffect(() => {
    loadCurrentUser();
    requestLocationPermission();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'BebaX needs location access to show pickup and dropoff locations'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setBookingData({
        ...bookingData,
        pickup_location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
      });
      
      // Get address from coordinates
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (address.length > 0) {
        const addr = address[0];
        const fullAddress = `${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`;
        setBookingData(prev => ({
          ...prev,
          pickup_address: fullAddress.trim(),
        }));
      }
      
      Alert.alert('Success', 'Current location set as pickup point');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleBookRide = async () => {
    if (!bookingData.pickup_address || !bookingData.dropoff_address || 
        !bookingData.vehicle_type || !bookingData.items_description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    setLoading(true);
    try {
      // Get current location if not set
      let pickup = bookingData.pickup_location;
      if (pickup.lat === 0 && pickup.lng === 0) {
        const location = await Location.getCurrentPositionAsync({});
        pickup = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
      }

      // For demo, set dropoff to a nearby location
      const dropoff = bookingData.dropoff_location.lat === 0 
        ? { lat: pickup.lat + 0.01, lng: pickup.lng + 0.01 }
        : bookingData.dropoff_location;

      const response = await fetch(`${API_BASE_URL}/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: currentUser.id,
          pickup_location: pickup,
          dropoff_location: dropoff,
          vehicle_type: bookingData.vehicle_type,
          items_description: bookingData.items_description,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Ride booked successfully! Drivers will be notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                setBookingData({
                  pickup_address: '',
                  dropoff_address: '',
                  pickup_location: { lat: 0, lng: 0 },
                  dropoff_location: { lat: 0, lng: 0 },
                  vehicle_type: '',
                  items_description: '',
                });
                navigation.navigate('Dashboard');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to book ride');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Book a Moving Service</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Address</Text>
            <View style={styles.addressInputContainer}>
              <TextInput
                style={[styles.input, styles.addressInput]}
                placeholder="Enter pickup location"
                value={bookingData.pickup_address}
                onChangeText={(text) => 
                  setBookingData({ ...bookingData, pickup_address: text })
                }
              />
              <TouchableOpacity 
                style={styles.locationButton} 
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                <Icon 
                  name="my-location" 
                  size={20} 
                  color={locationLoading ? "#94a3b8" : "#2563eb"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Drop-off Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter destination"
              value={bookingData.dropoff_address}
              onChangeText={(text) => 
                setBookingData({ ...bookingData, dropoff_address: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={bookingData.vehicle_type}
                style={styles.picker}
                onValueChange={(itemValue) => 
                  setBookingData({ ...bookingData, vehicle_type: itemValue })
                }
              >
                <Picker.Item label="Select vehicle type" value="" />
                {vehicleTypes.map((vehicle) => (
                  <Picker.Item 
                    key={vehicle.value} 
                    label={vehicle.label} 
                    value={vehicle.value} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Items Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what you're moving (furniture, boxes, etc.)"
              value={bookingData.items_description}
              onChangeText={(text) => 
                setBookingData({ ...bookingData, items_description: text })
              }
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleBookRide}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Booking...' : 'Book Moving Service'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
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
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    marginRight: 8,
  },
  locationButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookRideScreen;