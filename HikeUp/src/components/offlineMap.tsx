import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import MapView, { UrlTile, Marker, Polyline, MapPressEvent } from 'react-native-maps';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { DIRECTIONS_API } from '../assets/constants'
import { useHikeStore } from '../context/store';
const TILE_FOLDER = FileSystem.documentDirectory + 'tiles/';
import * as Location from 'expo-location';

const OfflineMap = () => {
  const currentRoute = useHikeStore((state) => state.currentHikePolyline);
  const [isOffline, setIsOffline] = useState(false);
  const [start, setStart] = useState<{ latitude: number; longitude: number } | null>(null);
  const [end, setEnd] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 48.30818,
    longitude: 17.24193,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
  
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }
  
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

  return (
    <MapView
      style={{ flex: 1 }}
      onPress={handleMapPress}
      region={initialRegion}
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

      {start && <Marker coordinate={start} title="Start" />}
      {end && <Marker coordinate={end} title="End" />}

      {routeCoords.length > 0 && (
        <Polyline
          coordinates={routeCoords}
          strokeWidth={4}
          strokeColor="blue"
        />
      )}
    </MapView>
  );
};

export default OfflineMap;