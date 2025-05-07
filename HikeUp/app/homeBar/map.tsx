import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { GOOGLE_MAPS_API, LOCAL_IP } from '../../assets/constants';
import { router } from "expo-router";

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const searchRef = useRef<any>(null);
  const mapRef = useRef<MapView>(null);

  const [points, setPoints] = useState<LatLng[]>([]);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [region, setRegion] = useState({
    latitude: 48.1486,
    longitude: 17.1077,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    setPoints([]);
    setRouteCoords([]);
  }, []);

  // 🔁 Fetch route when both points are selected
  useEffect(() => {
    if (points.length === 2) {
      fetchRoute();
    }
  }, [points]);

  const decodePolyline = (t: string): LatLng[] => {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  const fetchRoute = async () => {
    const origin = `${points[0].latitude},${points[0].longitude}`;
    const destination = `${points[1].latitude},${points[1].longitude}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=walking&key=${GOOGLE_MAPS_API}`;
    console.log('Fetching route from URL:', url);

    try {
      const res = await fetch(url);
      const text = await res.text();
      const json = JSON.parse(text);
      console.log('Directions API result:', JSON.stringify(json));

      if (json.routes?.length) {
        const polyline = json.routes[0].overview_polyline.points;
        const coords = decodePolyline(polyline);
        setRouteCoords(coords);
      } else {
        Alert.alert('Routing error', 'No route found');
      }
    } catch (err: any) {
      console.error('Route fetch error:', err);
      Alert.alert('Error fetching route', err.message || 'Unknown error');
    }
  };

  const onMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (points.length < 2) {
      setPoints([...points, { latitude, longitude }]);
    } else {
      Alert.alert('Limit reached', 'Only 2 points (start and end) allowed.');
    }
  };

  const createHike = async () => {
    if (points.length < 2) {
      Alert.alert('Error', 'Please select at least a start and end point.');
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${LOCAL_IP}/api/hikes/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'My New Hike' }),
      });

      if (!res.ok) throw new Error(await res.text());
      const hike = await res.json();
      const hikeId = hike?.hikeId || hike?.id || hike?.hike_id || hike?.response?.id;
      if (!hikeId) throw new Error('Missing hike ID from response');

      const updates = points.map((pt, index) => ({
        type: 'insert',
        latitude: pt.latitude,
        longitude: pt.longitude,
        order_number: index + 1,
        name: index === 0 ? 'start' : 'end',
      }));

      const wpRes = await fetch(`${LOCAL_IP}/api/mapbox/waypoints`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hike_id: hikeId, updates }),
      });

      if (!wpRes.ok) {
        await fetch(`${LOCAL_IP}/api/hikes/delete?hike_id=${hikeId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        throw new Error('Waypoint creation failed. Hike was rolled back.');
      }

      setPoints([]);
      setRouteCoords([]);
      Alert.alert('Success', 'Hike and waypoints created.');
      // wait before navigating to avoid race condition
      setTimeout(() => {
        router.push({
          pathname: '/hike',
          params: {
            id: hikeId.toString(),
            editable: 'true'
          }
        });
      }, 1000);
    
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const zoom = (zoomIn: boolean) => {
    const factor = zoomIn ? 0.5 : 2;
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={onMapPress}
      >
        {(routeCoords.length > 0 || points.length > 0) && (
          <Polyline
            coordinates={routeCoords.length > 0 ? routeCoords : points}
            strokeColor="blue"
            strokeWidth={4}
          />
        )}
        {points.map((point, index) => (
          <Marker key={index} coordinate={point} />
        ))}
      </MapView>

      <View style={styles.searchContainer} pointerEvents="box-none">
        <GooglePlacesAutocomplete
          ref={searchRef}
          placeholder="Search"
          fetchDetails
          onPress={(data, details = null) => {
            const loc = details?.geometry?.location;
            if (loc) {
              const newRegion = {
                latitude: loc.lat,
                longitude: loc.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              };
              setRegion(newRegion);
              mapRef.current?.animateToRegion(newRegion, 300);
            }
          }}
          query={{ key: GOOGLE_MAPS_API, language: 'en' }}
          styles={{
            textInput: styles.searchInput,
            container: styles.searchBox,
          }}
          textInputProps={{
            placeholderTextColor: 'black'
          }}
          renderRightButton={() => (
            <TouchableOpacity
              onPress={() => searchRef.current?.setAddressText('')}
              style={styles.clearIconContainer}
            >
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.controlsContainer} pointerEvents="box-none">
        <View style={styles.zoomControls}>
          <TouchableOpacity onPress={() => zoom(true)} style={styles.zoomButton}>
            <Ionicons name="add" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => zoom(false)} style={styles.zoomButton}>
            <Ionicons name="remove" size={24} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            setPoints([]);
            setRouteCoords([]);
          }}
          style={styles.clearButton}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {points.length === 2 && (
        <TouchableOpacity onPress={createHike} style={styles.saveButton}>
          <Text style={{ color: 'white' }}>Create Hike</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    position: 'absolute',
    top: 50,
    width: width - 20,
    alignSelf: 'center',
    zIndex: 10,
  },
  searchBox: {
    flex: 1,
  },
  searchInput: {
    height: 44,
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    fontSize: 16,
  },
  clearIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 100,
    right: 10,
    alignItems: 'center',
  },
  zoomControls: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    marginBottom: 10,
  },
  zoomButton: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveButton: {
    position: 'absolute',
    bottom: 40,
    left: 10,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
  },
});

type LatLng = {
  latitude: number;
  longitude: number;
};
