import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🚀</Text>
          <Text style={styles.title}>Explore BebaX</Text>
          <Text style={styles.subtitle}>Coming Soon</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Analytics</Text>
          <Text style={styles.cardText}>
            Track your rides, earnings, and performance metrics
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Promotions</Text>
          <Text style={styles.cardText}>
            Discover special offers and bonus opportunities
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Service Areas</Text>
          <Text style={styles.cardText}>
            Explore where BebaX is available and expanding
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Tips & Guides</Text>
          <Text style={styles.cardText}>
            Learn best practices for maximizing your experience
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            More features coming soon! 🎉
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
