import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Hike {
  id: string | number;
  name: string;
  nickname: string;
  created_at: string;
}

interface HikeViewProps {
  hike: Hike;
  onPress?: (hike: Hike) => void;
}

const HikeView: React.FC<HikeViewProps> = ({ hike, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(hike);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.hikeItem} 
      onPress={handlePress}
      disabled={!onPress}
    >
      <Text style={styles.hikeName}>{hike.name}</Text>
      <Text style={styles.hikeDetail}>Creator: {hike.nickname}</Text>
      <Text style={styles.hikeDetail}>Created: {new Date(hike.created_at).toLocaleString()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  hikeItem: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hikeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  hikeDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default HikeView;