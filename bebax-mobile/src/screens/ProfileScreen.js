import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
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
            try {
              await AsyncStorage.removeItem('currentUser');
              // Restart the app navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role) => {
    const colors = {
      customer: '#3b82f6',
      driver: '#16a34a',
      admin: '#dc2626',
    };
    return colors[role] || '#6b7280';
  };

  const getRoleIcon = (role) => {
    const icons = {
      customer: 'person',
      driver: 'local-shipping',
      admin: 'admin-panel-settings',
    };
    return icons[role] || 'person';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: getRoleColor(currentUser?.role) }]}>
            <Icon 
              name={getRoleIcon(currentUser?.role)} 
              size={32} 
              color="#ffffff" 
            />
          </View>
          <Text style={styles.userName}>{currentUser?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(currentUser?.role) }]}>
            <Text style={styles.roleText}>{currentUser?.role?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{currentUser?.email}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{currentUser?.phone}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="calendar-today" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {new Date(currentUser?.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="info" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.infoRow}>
            <Icon name="help" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Help & Support</Text>
              <Text style={styles.infoSubtext}>Get help with BebaX</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#d1d5db" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.infoRow}>
            <Icon name="description" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Terms & Conditions</Text>
              <Text style={styles.infoSubtext}>Read our terms</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#d1d5db" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.infoRow}>
            <Icon name="privacy-tip" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Privacy Policy</Text>
              <Text style={styles.infoSubtext}>How we handle your data</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>🚛 BebaX</Text>
        <Text style={styles.footerSubtext}>Your trusted moving partner in Tanzania</Text>
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
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#64748b',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default ProfileScreen;