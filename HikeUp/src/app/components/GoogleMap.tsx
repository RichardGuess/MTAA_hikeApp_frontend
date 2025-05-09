import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent} from 'react-native-maps';

const { width } = Dimensions.get('window');

const PointPickerMap = () => {
  const mapRef = useRef(null);
  const [points, setPoints] = useState<{ latitude: number; longitude: number }[]>([]);

  const region = {
    latitude: 48.1486,
    longitude: 17.1077,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { latitude, longitude }]);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        onPress={onMapPress}
      >
        {points.map((point, index) => (
          <Marker key={index} coordinate={point} />
        ))}
      </MapView>
    </View>
  );
};

export default PointPickerMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});