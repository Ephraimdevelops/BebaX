import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

// TODO: Create missing components (HapticTab, IconSymbol, Colors, useColorScheme)

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1E3A8A',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Text style={{ color }}>✈️</Text>,
        }}
      />
    </Tabs>
  );
}
