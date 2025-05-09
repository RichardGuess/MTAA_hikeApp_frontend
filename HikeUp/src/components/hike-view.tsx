import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Touchable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Hike } from '../types/hike'

interface HikeViewProps {
  hike: Hike;
  onPress?: (hike: Hike) => void;
  onDownload?: (hike: Hike) => void;
  isOnline?:boolean;
}

const HikeView: React.FC<HikeViewProps> = ({ hike, onPress, onDownload, isOnline }) => {
  
  const handlePress = () => {
    if (onPress) {
      onPress(hike);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(hike);
    }
  };

  return (
    <TouchableOpacity style={styles.hikeItem} onPress={handlePress} disabled={!onPress}>
      <Text style={styles.hikeName}>{hike.name}</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hikeDetail}>Creator: {hike.nickname}</Text>
          <Text style={styles.hikeDetail}>
            Created: {new Date(hike.created_at).toLocaleString()}
          </Text>
        </View>
  
        {isOnline ? (
          <TouchableOpacity onPress={() => onDownload?.(hike)}>
            <Feather name="download" size={24} color="lightblue" />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  downloadButton: {
    color: 'blue',
    fontSize: 16,
    textDecorationLine: 'underline',
    paddingLeft: 10,
  },
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