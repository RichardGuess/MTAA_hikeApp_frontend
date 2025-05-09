// File: components/HikeDetail.tsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import React from 'react';
import { Hike } from '../types/hike';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function HikeDetail({ hike }: { hike: Hike | null }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.staticValue}>{hike?.name}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Created:</Text>
        <Text style={styles.staticValue}>
          {hike?.created_at ? new Date(hike.created_at).toLocaleDateString() : ''}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Start:</Text>
        <Text style={styles.staticValue}>{hike?.start_point?.toString()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Destination:</Text>
        <Text style={styles.staticValue}>{hike?.dest_point?.toString()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Distance:</Text>
        <Text style={styles.staticValue}>{hike?.distance}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Calories:</Text>
        <Text style={styles.staticValue}>{hike?.calories}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { fontWeight: 'bold', width: 100 },
  staticValue: { flex: 1 }
});
