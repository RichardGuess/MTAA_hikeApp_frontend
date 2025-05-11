import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Alert, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { GOOGLE_MAPS_API, LOCAL_IP } from '../../../assets/constants';
import { router } from "expo-router";
import { useThemeContext } from '../../../context/theme_context';
import * as Location from 'expo-location';
import MapWebView from '../../../components/offlineMap';


const { width } = Dimensions.get('window');

export default function MapScreen() {
const { theme, isDark } = useThemeContext();
const colors = theme.colors;
const styles = getStyles(colors, isDark);
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
const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
const [locationPermission, setLocationPermission] = useState(false);
const [trackingActive, setTrackingActive] = useState(false);
const [totalDistance, setTotalDistance] = useState(0); // in meters
const [currentSpeed, setCurrentSpeed] = useState(0); // in m/s
const [pathHistory, setPathHistory] = useState<LatLng[]>([]);
const [lastLocation, setLastLocation] = useState<LatLng | null>(null);

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }]
  }
];

// Toggle tracking mode
const toggleTracking = () => {
  if (!trackingActive) {
    // Start tracking
    setTrackingActive(true);
    setTotalDistance(0);
    setPathHistory(currentLocation ? [currentLocation] : []);
    setLastLocation(currentLocation);
  } else {
    // Stop tracking
    setTrackingActive(false);
  }
};
// Request location permissions when component mounts
useEffect(() => {
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const permissionGranted = status === 'granted';
      setLocationPermission(permissionGranted);
      
      if (permissionGranted) {
        getCurrentLocation();
      } else {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to show your position on the map."
        );
      }
    } catch (err: any) {
      console.error('Error requesting location permission:', err);
      Alert.alert('Error', err.message || 'Could not request location permission');
    }
  };
  
  requestLocationPermission();
}, []);

// Calculate distance between two coordinates in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180; // Convert to radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // in meters

  return distance;
};

// Set up location tracking
useEffect(() => {
  let locationSubscription: any = null;
  
  if (locationPermission) {
    const startLocationTracking = async () => {
      try {
        // Get location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 5, // Update every 5 meters
            timeInterval: 2000, // Or every 2 seconds
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            const newLocation = { latitude, longitude };
            setCurrentLocation(newLocation);
            
            // If tracking is active, update distance, speed and path
            if (trackingActive && lastLocation) {
              // Calculate distance between current and last location
              const segmentDistance = calculateDistance(
                lastLocation.latitude, 
                lastLocation.longitude, 
                latitude, 
                longitude
              );
              
              // Only update if we've moved a reasonable distance (avoid GPS jitter)
              if (segmentDistance > 2) {
                // Update total distance
                setTotalDistance(prevDistance => prevDistance + segmentDistance);
                
                // Update path history
                setPathHistory(prevPath => [...prevPath, newLocation]);
                
                // Calculate current speed (m/s) based on location.coords.speed
                // If speed isn't available from GPS, we'll calculate it
                if (location.coords.speed !== null && !isNaN(location.coords.speed)) {
                  setCurrentSpeed(location.coords.speed);
                } else {
                  // Calculate speed from distance and time (last location update)
                  if (lastLocation?.timestamp){
                    const timeChange = location.timestamp - lastLocation.timestamp;
                    if (timeChange > 0) {
                      const speed = segmentDistance / (timeChange / 1000);
                      setCurrentSpeed(speed);
                    }
                  }
                }
                
                // Update last location with timestamp
                setLastLocation({
                  ...newLocation,
                  timestamp: location.timestamp
                });
              }
            } else if (trackingActive) {
              // If this is the first point in tracking
              setLastLocation({
                ...newLocation,
                timestamp: location.timestamp
              });
              setPathHistory([newLocation]);
            }
          }
        );
      } catch (err: any) {
        console.error('Error watching position:', err);
      }
    };
    
    startLocationTracking();
  }
  
  // Clean up subscription when component unmounts
  return () => {
    if (locationSubscription) {
      locationSubscription.remove();
    }
  };
}, [locationPermission, trackingActive, lastLocation]);

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

const getCurrentLocation = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
    
    const { latitude, longitude } = location.coords;
    setCurrentLocation({ latitude, longitude });
    
    // Center map on current location
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
    
  } catch (err: any) {
    console.error('Error getting current location:', err);
    Alert.alert('Error', err.message || 'Could not get current location');
  }
};

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
        pathname: '../hike',
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
  <MapWebView />);
  // <View style={styles.container}>
  //   <MapView
  //     ref={mapRef}
  //     provider={PROVIDER_GOOGLE}
  //     style={StyleSheet.absoluteFillObject}
  //     region={region}
  //     //onRegionChangeComplete={setRegion}//if this is commented out everything works on ios
  //     onPress={onMapPress}
  //     customMapStyle={isDark ? darkMapStyle : []}
  //     showsUserLocation={locationPermission} // Show the blue dot for user location
  //     followsUserLocation={trackingActive} // Auto-follow user when tracking
  //   >
  //     {(routeCoords.length > 0 || points.length > 0) && (
  //       <Polyline
  //         coordinates={routeCoords.length > 0 ? routeCoords : points}
  //         strokeColor="blue"
  //         strokeWidth={4}
  //       />
  //     )}
  //     {points.map((point, index) => (
  //       <Marker key={index} coordinate={point} />
  //     ))}
  //     {/* Show path history when tracking */}
  //     {trackingActive && pathHistory.length > 1 && (
  //       <Polyline
  //         coordinates={pathHistory}
  //         strokeColor="#FF9800"
  //         strokeWidth={4}
  //       />
  //     )}
  //   </MapView>

  //   {/* Search Input */}
  //   <View style={styles.searchContainer} pointerEvents="auto">
  //     <GooglePlacesAutocomplete
  //       ref={searchRef}
  //       placeholder="Search"
  //       fetchDetails
  //       onPress={(data, details = null) => {
  //         const loc = details?.geometry?.location;
  //         if (loc) {
  //           const newRegion = {
  //             latitude: loc.lat,
  //             longitude: loc.lng,
  //             latitudeDelta: 0.01,
  //             longitudeDelta: 0.01,
  //           };
  //           setRegion(newRegion);
  //           mapRef.current?.animateToRegion(newRegion, 300);
  //         }
  //       }}
  //       query={{ key: GOOGLE_MAPS_API, language: 'en' }}
  //       enablePoweredByContainer={false}
  //       styles={{
  //         container: styles.searchBox, // affects outer container (dropdown positioning)
  //         textInputContainer: styles.textInputContainer, // 🔧 affects actual touch area!
  //         textInput: styles.searchInput,
  //       }}
  //       textInputProps={{
  //         placeholderTextColor: colors.text,
  //         style: [styles.searchInput, { color: colors.text }],
  //       }}
  //       renderRightButton={() => (
  //         <TouchableOpacity
  //           onPress={() => searchRef.current?.setAddressText('')}
  //           style={styles.clearIconContainer}
  //         >
  //           <Ionicons name="close-circle" size={20} color={isDark ? "#ccc" : "#888"} />
  //         </TouchableOpacity>
  //       )}
  //     />
  //   </View>
    
  //   {/* Tracking Stats Panel */}
  //   {trackingActive && (
  //     <View style={styles.statsPanel}>
  //       <View style={styles.statRow}>
  //         <Ionicons name="speedometer-outline" size={20} color={isDark ? "#fff" : "#333"} />
  //         <Text style={[styles.statText, { color: colors.text }]}>
  //           {(currentSpeed * 3.6).toFixed(1)} km/h
  //         </Text>
  //       </View>
  //       <View style={styles.statRow}>
  //         <Ionicons name="trail-sign-outline" size={20} color={isDark ? "#fff" : "#333"} />
  //         <Text style={[styles.statText, { color: colors.text }]}>
  //           {totalDistance < 1000 
  //             ? `${totalDistance.toFixed(0)} m` 
  //             : `${(totalDistance/1000).toFixed(2)} km`}
  //         </Text>
  //       </View>
  //     </View>
  //   )}

  //   {/* Current Location & Tracking Buttons */}
  //   <View style={styles.locationButtonsContainer}>
  //     <TouchableOpacity 
  //       style={[styles.myLocationButton, { marginBottom: 10 }]}
  //       onPress={getCurrentLocation}
  //     >
  //       <Ionicons 
  //         name="locate" 
  //         size={24} 
  //         color={isDark ? "#fff" : "#333"} 
  //       />
  //     </TouchableOpacity>
      
  //     <TouchableOpacity 
  //       style={[
  //         styles.myLocationButton, 
  //         trackingActive && styles.trackingActiveButton
  //       ]}
  //       onPress={toggleTracking}
  //     >
  //       <Ionicons 
  //         name={trackingActive ? "pause" : "play"} 
  //         size={24} 
  //         color={trackingActive ? "#fff" : (isDark ? "#fff" : "#333")} 
  //       />
  //     </TouchableOpacity>
  //   </View>

  //   {/* Zoom + Clear Controls */}
  //   <View style={styles.controlsContainer} pointerEvents="box-none">
  //     <View style={styles.zoomControls}>
  //       <TouchableOpacity onPress={() => zoom(true)} style={styles.zoomButton}>
  //         <Ionicons name="add" size={24} color={colors.text} />
  //       </TouchableOpacity>
  //       <TouchableOpacity onPress={() => zoom(false)} style={styles.zoomButton}>
  //         <Ionicons name="remove" size={24} color={colors.text} />
  //       </TouchableOpacity>
  //     </View>

  //     <TouchableOpacity
  //       onPress={() => {
  //         setPoints([]);
  //         setRouteCoords([]);
  //       }}
  //       style={styles.clearButton}
  //     >
  //       <Text style={{ color: 'white', fontSize: 12 }}>Clear</Text>
  //     </TouchableOpacity>
  //   </View>

  //   {/* Save Hike */}
  //   {points.length === 2 && (
  //     <TouchableOpacity onPress={createHike} style={styles.saveButton}>
  //       <Text style={{ color: 'white' }}>Create Hike</Text>
  //     </TouchableOpacity>
  //   )}
  // </View>
// );  
}

const getStyles = (colors: any, isDark: boolean) =>
StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    position: 'absolute',
    top: 120,  
    width: width - 20,
    alignSelf: 'center',
    zIndex: 9999,
    elevation: 20,
    pointerEvents: 'auto',
  },    
  searchBox: {
    width: width - 20, // explicitly match container
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    borderColor: isDark ? "#444" : "#ccc",
    borderWidth: 1,
    overflow: 'hidden',
  },    
  searchInput: {
    flex: 1,
    height: 41,
    borderRadius: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    fontSize: 16,
    color: colors.text,
  },
  textInputContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderColor: isDark ? "#444" : "#ccc",
    borderWidth: 1,
    paddingHorizontal: 0,
    marginBottom: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
    backgroundColor: colors.card,
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
    backgroundColor: isDark ? '#ff6b6b' : '#f44336',
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
  myLocationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderColor: isDark ? '#444' : '#ddd',
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  locationButtonsContainer: {
    position: 'absolute',
    right: 10,
    top: 180,
    alignItems: 'center',
  },
  trackingActiveButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  statsPanel: {
    position: 'absolute',
    top: 180,
    left: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderColor: isDark ? '#444' : '#ddd',
    borderWidth: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});

type LatLng = {
latitude: number;
longitude: number;
timestamp?: number;
};