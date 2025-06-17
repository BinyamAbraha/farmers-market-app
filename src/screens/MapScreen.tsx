import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.title}>🗺️ Farmers Markets Map</Text>
        <Text style={styles.subtitle}>Map functionality coming soon!</Text>
        <Text style={styles.description}>
          This will show all farmers markets in your area with real-time status updates.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    padding: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2E8B57',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#666',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
    lineHeight: 22,
  },
});