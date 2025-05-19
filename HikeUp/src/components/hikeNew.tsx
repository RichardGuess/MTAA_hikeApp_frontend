import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, GestureResponderEvent, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { showMessage } from 'react-native-flash-message';
import { useHikeStore, formatCoordinates, parseCoordinates, LatLng } from '../context/store';
import { Hike } from '../types/hike';
import { GOOGLE_MAPS_API, LOCAL_IP, DIRECTIONS_API } from '../assets/constants';
import auth from "@react-native-firebase/auth";
import { Directions } from 'react-native-gesture-handler';
import { designName } from 'expo-device';


export default function HikeNew() {
    const { addHike, updateCurrentHikeField, setCurrentHike, currentHike, initNewHike } = useHikeStore();

    const [name, setName] = useState('');
    const [startPoint, setStartPoint] = useState('');
    const [destPoint, setDestPoint] = useState('');
    const [distance, setDistance] = useState('');
    const [calories, setCalories] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    interface RouteInfo {
        distance: string;
        duration: string;
        polyline: string;
}

const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

    useEffect(() => {
        if (!currentHike) {
            initNewHike();
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (currentHike) {
                if (currentHike.name) setName(currentHike.name);
                if (currentHike.start_point) setStartPoint(formatCoordinates(currentHike.start_point as LatLng || String));
                if (currentHike.dest_point) setDestPoint(formatCoordinates(currentHike.dest_point as LatLng || String));
                if (currentHike.distance) setDistance(currentHike.distance.toString());
                if (currentHike.calories) setCalories(currentHike.calories.toString());
            }
        }, [currentHike])
    );

    const sendDataToServer = async () => {
        try {
            const user = auth().currentUser
            const firebaseToken = await user?.getIdToken();
            const userEmail = user?.email;
            
    
            if (!firebaseToken) {
                throw new Error('User is not authenticated');
            }
    
            const startCoords = parseCoordinates(startPoint);
            const destCoords = parseCoordinates(destPoint);
    
            const hikeData = {
                name,
                userEmail,
                start_point: startPoint,
                dest_point: destPoint,
                distance: Number(distance) || null,
                calories: Number(calories) || null,
                geom: routeInfo ? routeInfo.polyline : null,
            };
    
            const response = await fetch(`${LOCAL_IP}/api/hikes/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${firebaseToken}`,
                },
                body: JSON.stringify(hikeData),
            });
    
            if (!response.ok) {
                const text = await response.text();
                console.error("Server responded with error:", text);
                throw new Error(`Failed to update hike: ${response.status}`);
            }
    
            const result = await response.json();
            console.log("Successfully sent hike to server:", result);
        } catch (error) {
            console.error("Error updating hike:", error);
        }
    };

    const geocodeAddress = async (address: string) => {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API}`
        );
        const data = await response.json();
        if (data.status === 'OK' && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return { latitude: lat, longitude: lng };
        } else {
            return null;
        }
    };
    
    const calculateWalkingPath = async () => {
        if (!startPoint || !destPoint) {
            showMessage({ 
                message: 'Please set both start and destination points',
                type: 'warning' 
            });
            return;
        }
    
        setIsCalculating(true);
        try {
            const startCoords = await geocodeAddress(startPoint);
            const destCoords = await geocodeAddress(destPoint);
    
            if (!startCoords || !destCoords) {
                showMessage({
                    message: "Error",
                    description: "Could not convert address to coordinates.",
                    type: "danger",
                    icon: "danger",
                });
                setIsCalculating(false);
                return;
            }
    
            const origin = `${startCoords.longitude}, ${startCoords.latitude}`;
            const destination = `${destCoords.longitude}, ${destCoords.latitude}`;
            console.log(origin,destination)
            const url = `https://api.openrouteservice.org/v2/directions/foot-hiking?api_key=${DIRECTIONS_API}&start=${origin}&end=${destination}`;
            const response = await fetch(url);
            const json = await response.json();
            console.log(response,json)
            if (response.ok && json.features && json.features.length > 0) {
                const feature = json.features[0];
                const coordinates = feature.geometry.coordinates; // [lon, lat] array of points
            
                const summary = feature.properties.summary;
                const distanceInMeters = summary.distance;
                const durationInSeconds = summary.duration;
            
                const distanceInKm = (distanceInMeters / 1000).toFixed(2);
                const durationInMin = Math.round(durationInSeconds / 60);
            
                setDistance(distanceInKm);
                const estimatedCalories = Math.round(parseFloat(distanceInKm) * 65);
                setCalories(estimatedCalories.toString());
            
                setRouteInfo({ 
                    distance: `${distanceInKm} km`, 
                    duration: `${durationInMin} min`, 
                    polyline: coordinates 
                });
            
                showMessage({ message: "Route calculated", type: "success", icon: "success" });
            } else {
                showMessage({ message: "Could not calculate route", type: "danger", icon: "danger" });
            }
        } catch (error) {
            console.error('Error calculating route:', error);
            showMessage({ message: "Error calculating route", type: "danger", icon: "danger" });
        } finally {
            setIsCalculating(false);
        }
    };

    function handleSave(event: GestureResponderEvent) {
        if (!name.trim()) {
            showMessage({ message: 'Please enter a name', type: 'warning' });
            return;
        }

        const startCoords = parseCoordinates(startPoint);
        const destCoords = parseCoordinates(destPoint);

        const newHike: Hike = {
            id: Date.now(),
            name,
            nickname: null,
            created_at: new Date(),
            start_point: startCoords,
            dest_point: destCoords,
            distance: Number(distance) || null,
            calories: Number(calories) || null,
            geom: routeInfo ? routeInfo.polyline : null, // Store the polyline for the route if available
            user_id: 1,
        };

        addHike(newHike);
        showMessage({ message: 'Hike created', type: 'success' });
        setCurrentHike(null);
        sendDataToServer();
        router.replace('/drawer/homeBar/home');
    }

    const openLocationPicker = (field: 'start_point' | 'dest_point') => {
        updateCurrentHikeField('name', name); // So it's preserved when coming back
        router.push({
            pathname: '/drawer/hike/map',
            params: {
                returnToHike: '/drawer/hike/hikeNew',
                initialLocation: field === 'start_point' ? startPoint : destPoint,
                fieldType: field,
                editable: 'true',
            },
        });
    };

    function handleExit() {
        setCurrentHike(null); // clear store
        setName('');
        setStartPoint('');
        setDestPoint('');
        setDistance('');
        setCalories('');
        setRouteInfo(null);
        router.replace('/drawer/homeBar/home');
    }

    return (
        <View style={styles.container}>
            <Text>Name:</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} />

            <Text>Start Point:</Text>
            <TouchableOpacity style={styles.locationRow} onPress={() => openLocationPicker('start_point')}>
                <TextInput
                    value={startPoint}
                    editable={false}
                    placeholder="Tap to set location"
                    placeholderTextColor="#999"
                    style={styles.locationInput}
                />
                <FontAwesome name="map-marker" size={20} color="#666" style={styles.mapIcon} />
            </TouchableOpacity>

            <Text>Destination Point:</Text>
            <TouchableOpacity style={styles.locationRow} onPress={() => openLocationPicker('dest_point')}>
                <TextInput
                    value={destPoint}
                    editable={false}
                    placeholder="Tap to set location"
                    placeholderTextColor="#999"
                    style={styles.locationInput}
                />
                <FontAwesome name="map-marker" size={20} color="#666" style={styles.mapIcon} />
            </TouchableOpacity>

            {startPoint && destPoint && (
                <TouchableOpacity 
                    onPress={calculateWalkingPath} 
                    style={[styles.button, { backgroundColor: '#4285F4', marginBottom: 16 }]}
                    disabled={isCalculating}
                >
                    {isCalculating ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>Calculate Walking Route</Text>
                    )}
                </TouchableOpacity>
            )}

            {routeInfo && (
                <View style={styles.routeInfo}>
                    <Text style={styles.routeInfoText}>Walking distance: {routeInfo.distance}</Text>
                    <Text style={styles.routeInfoText}>Estimated time: {routeInfo.duration}</Text>
                </View>
            )}

            <Text>Distance (km):</Text>
            <TextInput 
                value={distance} 
                editable={false}
                onChangeText={setDistance} 
                style={styles.input} 
                keyboardType="numeric" 
            />

            <Text>Calories:</Text>
            <TextInput 
                value={calories} 
                editable={false}
                onChangeText={setCalories} 
                style={styles.input} 
                keyboardType="numeric" 
            />

            <TouchableOpacity onPress={handleSave} style={styles.button}>
                <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExit} style={styles.button}>
                <Text style={styles.buttonText}>Discard</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    input: { borderWidth: 1, padding: 8, marginBottom: 12 },
    button: { backgroundColor: 'black', padding: 12, borderRadius: 6, marginBottom: 12 },
    buttonText: { color: 'white', textAlign: 'center' },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        padding: 8,
        marginBottom: 12,
    },
    locationInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    mapIcon: {
        marginLeft: 8,
    },
    routeInfo: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 6,
        marginBottom: 16,
    },
    routeInfoText: {
        fontSize: 14,
        marginBottom: 4,
    }
});