import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Alert } from 'react-native';
import MapView, { MapPressEvent, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { GOOGLE_MAPS_API, LOCAL_IP } from '../../../assets/constants';
import { router, useLocalSearchParams } from "expo-router";
import { useHikeStore, formatCoordinates, parseCoordinates, LatLng } from '../../../context/store';

const { width } = Dimensions.get('window');

type ValidReturnPaths = '/hike/hike';

export default function MapScreen() {
  const searchRef = useRef<any>(null);
  const mapRef = useRef<MapView>(null);
  const { currentHike, updateCurrentHikeField, setCurrentHike } = useHikeStore();

  const [points, setPoints] = useState<LatLng[]>([]);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [region, setRegion] = useState({
    latitude: 48.1486,
    longitude: 17.1077,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  // Get parameters when map is opened in location selection mode
  const params = useLocalSearchParams();
  const returnToHike = params.returnToHike?.toString() as ValidReturnPaths; // Path to return to HikeSpecs
  const locationField = params.fieldType?.toString() as 'start_point' | 'dest_point'; // Which field we're setting
  const initialLocation = params.initialLocation?.toString(); // Initial location if any
  const hikeId = params.id?.toString(); // Hike ID if available
  
  // Check if we're in location selection mode
  const isLocationPicker = !!returnToHike && !!locationField;

  useEffect(() => {
    // If we have a hike ID but no current hike, try to load it from the store
    if (hikeId && !currentHike) {
      const hikes = useHikeStore.getState().hikes;
      const hikeToEdit = hikes.find(h => h.id === Number(hikeId));
      if (hikeToEdit) {
        setCurrentHike(hikeToEdit);
      }
    }
    
    // Initialize points based on current field value
    if (currentHike && locationField) {
      const fieldValue = currentHike[locationField];
      if (typeof fieldValue === 'object' && fieldValue !== null) {
        // If it's already an object, use it directly
        setPoints([fieldValue as unknown as LatLng]);
        
        // Update region to focus on this point
        setRegion({
          latitude: (fieldValue as unknown as LatLng).latitude,
          longitude: (fieldValue as unknown as LatLng).longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else if (typeof fieldValue === 'string') {
        // If it's a string, try to parse it
        const coords = parseCoordinates(fieldValue as string);
        if (coords) {
          setPoints([coords]);
          setRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    } else if (initialLocation) {
      // If no current value but we have initialLocation, try to parse it
      try {
        const coords = parseCoordinates(initialLocation);
        if (coords) {
          setPoints([coords]);
          setRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (error) {
        console.error('Failed to parse initial location:', error);
      }
    }
  }, [currentHike, locationField, initialLocation, hikeId]);

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (isLocationPicker) {
      // In location picker mode, we only need one point
      const newPoint = { latitude, longitude };
      setPoints([newPoint]);
    }
  };
  
  // Confirm selected location and return to HikeSpecs
  const confirmLocation = () => {
    if (isLocationPicker && points.length > 0) {
      const selectedPoint = points[0];
      
      // Update the appropriate field in currentHike
      if (locationField === 'start_point' || locationField === 'dest_point') {
        updateCurrentHikeField(locationField, selectedPoint);
      }
      
      // Navigate back to the hike details screen
      router.back();
    } else {
      Alert.alert('Please select a location on the map first');
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
        style={styles.map}
        region={region}
        onPress={onMapPress}
      >
        {points.map((point, index) => (
          <Marker
            key={index}
            coordinate={point}
            pinColor={locationField === 'start_point' ? 'green' : 'red'}
          />
        ))}
        
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={3}
            strokeColor="#3498db"
          />
        )}
      </MapView>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          ref={searchRef}
          placeholder="Search location"
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details && details.geometry) {
              const { lat, lng } = details.geometry.location;
              const newRegion = {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              };
              setRegion(newRegion);
              mapRef.current?.animateToRegion(newRegion, 300);
              
              if (isLocationPicker) {
                setPoints([{ latitude: lat, longitude: lng }]);
              }
            }
          }}
          query={{
            key: GOOGLE_MAPS_API,
            language: 'en',
          }}
          styles={{
            container: {
              flex: 0,
            },
            textInputContainer: {
              width: '100%',
            },
            textInput: {
              height: 38,
              fontSize: 16,
            },
            listView: {
              backgroundColor: 'white',
            },
          }}
        />
      </View>
      
      {/* Zoom Controls */}
      <View style={styles.zoomControlsContainer}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => zoom(true)}>
          <Ionicons name="add" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={() => zoom(false)}>
          <Ionicons name="remove" size={24} color="black" />
        </TouchableOpacity>
      </View>
      
      {/* Confirm Button (only in location picker mode) */}
      {isLocationPicker && (
        <TouchableOpacity style={styles.confirmButton} onPress={confirmLocation}>
          <Text style={styles.confirmButtonText}>
            Confirm {locationField === 'start_point' ? 'Starting Point' : 'Destination'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  zoomControlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});