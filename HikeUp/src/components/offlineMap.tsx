import React, { useEffect, useState, useRef } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { UrlTile, Marker, Polyline, MapPressEvent } from 'react-native-maps';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { DIRECTIONS_API } from '../assets/constants';
import { useHikeStore } from '../context/store';
import * as Location from 'expo-location';

const TILE_FOLDER = FileSystem.documentDirectory + 'tiles/';

const OfflineMap = () => {
  const currentRoute = useHikeStore((state) => state.currentHikePolyline);
  const [isOffline, setIsOffline] = useState(false);
  const [start, setStart] = useState<{ latitude: number; longitude: number } | null>(null);
  const [end, setEnd] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 48.30818,
    longitude: 17.24193,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // New state variables for tracking
  const [isTracking, setIsTracking] = useState(false);
  const [trackingPath, setTrackingPath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
  
      if (status !== 'granted') {
        setLocationPermission(false);
        console.warn('Permission to access location was denied');
        return;
      }
      setLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Track online/offline state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);
  
  useEffect(() => {
    const hasRoute = currentRoute?.coordinates?.length > 0;
    const routePoint = hasRoute ? currentRoute.coordinates[0] : null;

    let latitude: number;
    let longitude: number;

    if (routePoint) {
      [longitude, latitude] = routePoint; // [lon, lat]
    } else if (userLocation) {
      latitude = userLocation.latitude;
      longitude = userLocation.longitude;
    } else {
      //users default region here
      latitude = 48.30818;
      longitude = 17.24193;
    }

    setInitialRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    if (hasRoute) {
      setRouteCoords(
        currentRoute.coordinates.map(([lon, lat]) => ({
          latitude: lat,
          longitude: lon,
        }))
      );
    }
  }, [currentRoute.coordinates, userLocation]);
  
  // Fetch route when both start and end are set
  useEffect(() => {
    if (!start || !end) return;

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/foot-hiking?DIRECTIONS_API=${DIRECTIONS_API}&start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/geo+json',
              Authorization: DIRECTIONS_API,
            },
          }
        );

        const data = await response.json();
        const coords = data.features[0].geometry.coordinates.map(
          ([lon, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lon,
          })
        );
        setRouteCoords(coords);
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    fetchRoute();
  }, [start, end]);

  // Handle map press: set start then end
  const handleMapPress = (e: MapPressEvent) => {
    // Only allow map press interactions when not tracking
    if (isTracking) return;
    
    const coord = e.nativeEvent.coordinate;
    if (!start) {
      setStart(coord);
      setEnd(null);        // Reset route
      setRouteCoords([]);
    } else if (!end) {
      setEnd(coord);
    } else {
      // Restart selection
      setStart(coord);
      setEnd(null);
      setRouteCoords([]);
    }
  };

  // Start tracking user location
  const startTracking = async () => {
    if (isTracking) return;
    
    // Reset tracking data
    setTrackingPath([]);
    setElapsedTime(0);
    setStartTime(new Date());
    
    // If we have current location, use it as first point
    if (userLocation) {
      setTrackingPath([userLocation]);
    }
    
    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    // Subscribe to location updates
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5, // Update every 5 meters
        timeInterval: 3000   // Maximum update frequency: 3 seconds
      },
      (location) => {
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        
        setUserLocation(newLocation);
        setTrackingPath(prevPath => [...prevPath, newLocation]);
      }
    );
    
    setIsTracking(true);
  };

  // Stop tracking user location
  const stopTracking = () => {
    if (!isTracking) return;
    
    // Stop location tracking
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsTracking(false);
    
    // Here you could save the tracking data to your store or API
    // For example: saveTrackingData(trackingPath, elapsedTime);
  };
  
  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        onPress={handleMapPress}
        region={initialRegion}
        showsUserLocation={locationPermission}
      >
        <UrlTile
          urlTemplate={
            isOffline
              ? `${FileSystem.documentDirectory}tiles/{z}_{x}_{y}.png`
              : 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
          maximumZ={19}
          flipY={false}
        />

        {/* Planned route */}
        {start && <Marker coordinate={start} title="Start" />}
        {end && <Marker coordinate={end} title="End" />}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}
        
        {/* User tracking path */}
        {trackingPath.length > 1 && (
          <Polyline
            coordinates={trackingPath}
            strokeWidth={4}
            strokeColor="red"
          />
        )}
      </MapView>
      
      {/* Tracking interface */}
      <View style={styles.trackerContainer}>
        <Text style={styles.timeText}>
          {formatTime(elapsedTime)}
        </Text>
        <TouchableOpacity 
          style={[
            styles.trackButton, 
            isTracking ? styles.stopButton : styles.startButton
          ]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
        
        {trackingPath.length > 0 && (
          <Text style={styles.distanceText}>
            Distance: {calculateDistance(trackingPath).toFixed(2)} km
          </Text>
        )}
      </View>
    </View>
  );
};

// Calculate distance of the path in kilometers
const calculateDistance = (path: { latitude: number; longitude: number }[]): number => {
  if (path.length < 2) return 0;
  
  let distance = 0;
  for (let i = 1; i < path.length; i++) {
    distance += getDistanceBetweenPoints(path[i-1], path[i]);
  }
  
  return distance;
};

// Calculate distance between two coordinates using Haversine formula
const getDistanceBetweenPoints = (
  p1: { latitude: number; longitude: number },
  p2: { latitude: number; longitude: number }
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(p2.latitude - p1.latitude);
  const dLon = deg2rad(p2.longitude - p1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(p1.latitude)) * Math.cos(deg2rad(p2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  trackerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 10,
    margin: 15,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  distanceText: {
    fontSize: 16,
    marginTop: 10,
  },
  trackButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OfflineMap;