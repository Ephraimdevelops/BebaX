import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Convex & Clerk
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { ConvexReactClient, useQuery, useConvexAuth } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import Constants from 'expo-constants';
import { tokenCache } from "./src/lib/cache";

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import CustomerDashboard from './src/screens/CustomerDashboard';
import DriverDashboard from './src/screens/DriverDashboard';
import AdminDashboard from './src/screens/AdminDashboard';
import BookRideScreen from './src/screens/BookRideScreen';
import RideDetailsScreen from './src/screens/RideDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import API (Assumes generated code is copied to src/convex/_generated)
import { api } from "./src/convex/_generated/api";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// API Configuration
// export const API_BASE_URL = ...; // DEPRECATED: Use Convex

const convex = new ConvexReactClient(Constants.expoConfig.extra.convexUrl, {
  unsavedChangesWarning: false,
});

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

function MainApp() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();

  // Fetch user profile from Convex to get role
  // This requires the schema to have `users.getMyself` or similar
  const userData = useQuery(api.users.getMyself);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            {/* Show Loading if userData is not yet loaded */}
            {userData === undefined ? (
              <Stack.Screen name="Loading" component={() => <></>} />
            ) : (
              // Determine Role
              <>
                {(userData?.role === 'customer' || !userData?.role) && (
                  <Stack.Screen name="CustomerApp" component={CustomerTabs} />
                )}
                {userData?.role === 'driver' && (
                  <Stack.Screen name="DriverApp" component={DriverTabs} />
                )}
                {userData?.role === 'admin' && (
                  <Stack.Screen name="AdminApp" component={AdminTabs} />
                )}
                <Stack.Screen
                  name="RideDetails"
                  component={RideDetailsScreen}
                  options={{ headerShown: true, title: 'Ride Details' }}
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={Constants.expoConfig.extra.clerkPublishableKey}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <MainApp />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}