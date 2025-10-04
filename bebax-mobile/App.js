import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import CustomerDashboard from './src/screens/CustomerDashboard';
import DriverDashboard from './src/screens/DriverDashboard';
import AdminDashboard from './src/screens/AdminDashboard';
import BookRideScreen from './src/screens/BookRideScreen';
import RideDetailsScreen from './src/screens/RideDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// API Configuration
const API_BASE_URL = 'https://cargomate-4.preview.emergentagent.com/api';

// Customer Tab Navigator
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Book Ride') {
            iconName = 'add-circle';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={CustomerDashboard} />
      <Tab.Screen name="Book Ride" component={BookRideScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Driver Tab Navigator
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Available Rides') {
            iconName = 'list';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DriverDashboard} />
      <Tab.Screen name="Available Rides" component={DriverDashboard} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Admin Tab Navigator
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on app load
  useEffect(() => {
    checkStoredUser();
  }, []);

  const checkStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Error checking stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (userData) => {
    setCurrentUser(userData);
    await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
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
            setCurrentUser(null);
            await AsyncStorage.removeItem('currentUser');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <Stack.Screen name="Auth">
            {props => <AuthScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            {currentUser.role === 'customer' && (
              <Stack.Screen name="CustomerApp" component={CustomerTabs} />
            )}
            {currentUser.role === 'driver' && (
              <Stack.Screen name="DriverApp" component={DriverTabs} />
            )}
            {currentUser.role === 'admin' && (
              <Stack.Screen name="AdminApp" component={AdminTabs} />
            )}
            <Stack.Screen 
              name="RideDetails" 
              component={RideDetailsScreen}
              options={{ headerShown: true, title: 'Ride Details' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Export API base URL for use in other components
export { API_BASE_URL };