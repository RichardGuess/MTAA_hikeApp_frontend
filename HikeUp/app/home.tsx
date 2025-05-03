import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const [waypoints, setWaypoints] = useState([
    { id: 1, latitude: 48.1486, longitude: 17.1077 },
    { id: 2, latitude: 48.1490, longitude: 17.1111 },
    { id: 3, latitude: 48.1500, longitude: 17.1150 },
  ]);
  const [initialRegion, setInitialRegion] = useState<null | {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }>(null);

  const onMarkerDragEnd = (index: number, e: any) => {
    const newCoords = e.nativeEvent.coordinate;
    const updated = [...waypoints];
    updated[index] = { ...updated[index], ...newCoords };
    setWaypoints(updated);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to center the map.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setInitialRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      {initialRegion && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
        >
          <Polyline
            coordinates={waypoints.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
            strokeColor="#FF5722"
            strokeWidth={4}
          />
          {waypoints.map((point, index) => (
            <Marker
              key={point.id}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              draggable
              onDragEnd={(e) => onMarkerDragEnd(index, e)}
            />
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
