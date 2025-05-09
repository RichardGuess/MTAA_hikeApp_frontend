// import { View, Text, StyleSheet, TextInput, GestureResponderEvent, TouchableOpacity } from 'react-native';
// import React, { useState, useEffect } from 'react';
// import { router, useLocalSearchParams } from 'expo-router';
// import { Hike } from '../types/hike';
// import FontAwesome from '@expo/vector-icons/FontAwesome';
// import { showMessage } from "react-native-flash-message";
// import { useHikeStore, formatCoordinates, parseCoordinates, LatLng } from '../store';

// type hikeSpecsProps = {
//     hike: Hike | null;
//     editable: boolean;
// };

// export default function HikeSpecs({ hike, editable }: hikeSpecsProps) {
//     const { hikes, addHike, setHikes, currentHike, updateHike, updateCurrentHikeField, setCurrentHike } = useHikeStore();
    
//     const [changable, setChangable] = useState(false);
//     const params = useLocalSearchParams();
//     const id = Number(params.id);
    
//     // Initialize currentHike if needed
//     useEffect(() => {
//         if (hike && hike.id && editable) {
//             // If we have a hike passed as prop, set it as currentHike
//             setCurrentHike(hike);
//         } else if (id && !currentHike) {
//             // If we have an ID but no currentHike, find it in the store
//             const existingHike = hikes.find(h => h.id === id);
//             if (existingHike) {
//                 setCurrentHike(existingHike);
//             }
//         }
//     }, [hike, id]);

//     // Local form state
//     const [name, setName] = useState(currentHike?.name || 'New Hike');
//     const [startPoint, setStartPoint] = useState('');
//     const [destPoint, setDestPoint] = useState('');
//     const [distance, setDistance] = useState('');
//     const [calories, setCalories] = useState('');

//     // Update local state when currentHike changes
//     useEffect(() => {
//         if (currentHike) {
//             setName(currentHike.name || 'New Hike');
            
//             // Format coordinates for display
//             if (typeof currentHike.start_point === 'object' && currentHike.start_point !== null) {
//                 setStartPoint(formatCoordinates(currentHike.start_point as unknown as LatLng));
//             } else {
//                 setStartPoint(currentHike.start_point?.toString() || '');
//             }
            
//             if (typeof currentHike.dest_point === 'object' && currentHike.dest_point !== null) {
//                 setDestPoint(formatCoordinates(currentHike.dest_point as unknown as LatLng));
//             } else {
//                 setDestPoint(currentHike.dest_point?.toString() || '');
//             }
            
//             setDistance(currentHike.distance?.toString() || '');
//             setCalories(currentHike.calories?.toString() || '');
//         }
//     }, [currentHike]);
    
//     const toggleChangable = () => {
//         setChangable(prev => !prev);
//     };
    
//     function handleCreateHikePress(event: GestureResponderEvent): void {
//         if (!name.trim()) {
//             showMessage({
//                 message: "Please enter a hike name",
//                 type: "warning",
//             });
//             return;
//         }
    
//         if (!startPoint) {
//             showMessage({
//                 message: "Please select a starting point",
//                 type: "warning",
//             });
//             return;
//         }
    
//         // Parse coordinates if they're strings
//         const startCoords = typeof currentHike?.start_point === 'object' 
//             ? currentHike.start_point 
//             : parseCoordinates(startPoint);
            
//         const destCoords = typeof currentHike?.dest_point === 'object' 
//             ? currentHike.dest_point 
//             : parseCoordinates(destPoint);
        
//         const parsedDistance = Number(distance);
//         const parsedCalories = Number(calories);
    
//         const updatedHike: Hike = {
//             id: currentHike?.id ?? Date.now(),
//             name: name.trim(),
//             nickname: currentHike?.nickname || null,
//             created_at: currentHike?.created_at ?? new Date(),
//             start_point: startCoords,
//             dest_point: destCoords,
//             distance: isNaN(parsedDistance) ? null : parsedDistance,
//             calories: isNaN(parsedCalories) ? null : parsedCalories,
//             geom: currentHike?.geom || null,
//             user_id: currentHike?.user_id ?? 1,
//         };
    
//         const exists = hikes.find(h => h.id === updatedHike.id);
//         if (exists) {
//             // Update existing hike
//             updateHike(updatedHike);
//         } else {
//             // Add new hike
//             addHike(updatedHike);
//         }
    
//         showMessage({
//             message: exists ? "Hike updated successfully!" : "Hike created successfully!",
//             type: "success",
//         });
        
//         // Reset current hike after saving
//         setCurrentHike(null);
        
//         // Navigate back if needed
//         if (!exists) {
//             router.back();
//         }
//     }
    
//     // Navigate to map screen for location selection
//     const openLocationPicker = (field: 'start_point' | 'dest_point') => {
//         // Save current form data to currentHike before navigating
//         updateCurrentHikeField('name', name);
        
//         if (typeof currentHike?.start_point !== 'object') {
//             const parsedStart = parseCoordinates(startPoint);
//             if (parsedStart) {
//                 updateCurrentHikeField('start_point', parsedStart);
//             }
//         }
        
//         if (typeof currentHike?.dest_point !== 'object') {
//             const parsedDest = parseCoordinates(destPoint);
//             if (parsedDest) {
//                 updateCurrentHikeField('dest_point', parsedDest);
//             }
//         }
        
//         const distanceNum = Number(distance);
//         if (!isNaN(distanceNum)) {
//             updateCurrentHikeField('distance', distanceNum);
//         }
        
//         const caloriesNum = Number(calories);
//         if (!isNaN(caloriesNum)) {
//             updateCurrentHikeField('calories', caloriesNum);
//         }
        
//         // Get current location value for this field
//         const currentValue = field === 'start_point' 
//             ? (typeof currentHike?.start_point === 'object' 
//                 ? formatCoordinates(currentHike?.start_point as unknown as LatLng) 
//                 : startPoint) 
//             : (typeof currentHike?.dest_point === 'object' 
//                 ? formatCoordinates(currentHike?.dest_point as unknown as LatLng) 
//                 : destPoint);
        
//         router.push({
//             pathname: '/hike/map',
//             params: { 
//                 returnToHike: '/hike/hike',
//                 initialLocation: currentValue,
//                 fieldType: field,
//                 id: id ? id.toString() : currentHike?.id?.toString(),
//                 editable: 'true'
//             }
//         });
//     };

//     return (
//         <View style={styles.mainContainer}>
//             <View style={styles.topSection}>
//                 <TouchableOpacity onPress={toggleChangable} style={styles.gearButton}>
//                     <FontAwesome name="gear" size={24} color="black" />
//                 </TouchableOpacity>
//             </View>

//             <View style={styles.formSection}>
//                 <View style={styles.container}>
//                     <View style={styles.row}>
//                         <Text style={styles.label}>Name:</Text>
//                         {editable || changable ? (
//                             <TextInput
//                                 value={name}
//                                 onChangeText={setName}
//                                 style={styles.input}
//                             />
//                         ) : (
//                             <Text style={styles.staticValue}>{hike?.name}</Text>
//                         )}
//                     </View>
//                     <View style={styles.row}>
//                         {editable || changable ? (
//                             <View style={styles.emptyRow} />
//                         ) : (
//                             <>
//                                 <Text style={styles.label}>Created:</Text>
//                                 <Text style={styles.staticValue}>
//                                     {hike?.created_at ? new Date(hike.created_at).toLocaleDateString() : ""}
//                                 </Text>                        
//                             </>                
//                         )}
//                     </View>
//                     <View style={styles.row}>
//                         <Text style={styles.label}>Start:</Text>
//                         {editable || changable ? (
//                             <TouchableOpacity 
//                                 style={styles.locationInputContainer}
//                                 onPress={() => openLocationPicker('start_point')}
//                             >
//                                 <TextInput
//                                     value={startPoint}
//                                     editable={false}
//                                     style={styles.locationInput}
//                                     placeholder="Tap to set location"
//                                     placeholderTextColor={"black"}
//                                 />
//                                 <FontAwesome name="map-marker" size={20} color="#666" style={styles.mapIcon} />
//                             </TouchableOpacity>
//                         ) : (
//                             <Text style={styles.staticValue}>{hike?.start_point?.toString()}</Text>
//                         )}
//                     </View>
//                     <View style={styles.row}>
//                         <Text style={styles.label}>Destination:</Text>
//                         {editable || changable ? (
//                             <TouchableOpacity 
//                                 style={styles.locationInputContainer}
//                                 onPress={() => openLocationPicker('dest_point')}
//                             >
//                                 <TextInput
//                                     value={destPoint}
//                                     editable={false}
//                                     style={styles.locationInput}
//                                     placeholder="Tap to set location"
//                                     placeholderTextColor={"black"}

//                                 />
//                                 <FontAwesome name="map-marker" size={20} color="#666" style={styles.mapIcon} />
//                             </TouchableOpacity>
//                         ) : (
//                             <Text style={styles.staticValue}>{hike?.dest_point?.toString()}</Text>
//                         )}
//                     </View>
//                     <View style={styles.row}>
//                         <Text style={styles.label}>Distance:</Text>
//                         {editable || changable ? (
//                             <TextInput
//                                 value={distance}
//                                 onChangeText={setDistance}
//                                 style={styles.input}
//                                 keyboardType="numeric"
//                             />
//                         ) : (
//                             <Text style={styles.staticValue}>{hike?.distance}</Text>
//                         )}
//                     </View>
//                     <View style={styles.row}>
//                         <Text style={styles.label}>Calories:</Text>
//                         {editable || changable ? (
//                             <TextInput
//                                 value={calories}
//                                 onChangeText={setCalories}
//                                 style={styles.input}
//                                 keyboardType="numeric"
//                             />
//                         ) : (
//                             <Text style={styles.staticValue}>{hike?.calories}</Text>
//                         )}
//                     </View>
//                 </View>
//             </View>
            
//             <View style={styles.bottomSection}>
//                 {editable || changable ? (
//                     <TouchableOpacity style={styles.button} onPress={handleCreateHikePress}>
//                         <Text style={styles.buttonText}>{changable ? "Update Hike" : "Create Hike"}</Text>
//                     </TouchableOpacity>
//                 ) : (
//                     <View style={{ height: 50 }} />
//                 )}
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     mainContainer: {
//         flex: 1,
//         flexDirection: 'column',
//     },
//     topSection: {
//         paddingTop: 70,
//         alignItems: 'flex-end',
//         paddingRight: 20,
//         marginBottom: 10,
//     },
//     formSection: {
//         flex: 1,
//     },
//     bottomSection: {
//         padding: 20,
//         alignItems: 'center',
//     },
//     emptyRow: {
//         height: 30, // Match height of the Created row
//     },
//     gearButton: {
//         marginBottom: 10,
//     },
//     button: {
//         backgroundColor: 'lightgrey',
//         borderRadius: 8,
//         paddingVertical: 10,
//         paddingHorizontal: 20,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     buttonText: {
//         color: '#666',
//         fontSize: 16,
//         textAlign: 'center',
//     },
//     container: {
//         justifyContent: 'center',
//         margin: 10,
//         paddingLeft: 30,
//         padding: 10,
//         backgroundColor: 'lightgray',
//         borderRadius: 25, 
//     },
//     row: {
//         flexDirection: 'row',
//         justifyContent: 'space-between', 
//         marginVertical: 8,
//     },
//     label: {
//         fontWeight: 'bold',
//         fontSize: 16,
//         flex: 1,
//     },
//     value: {
//         fontSize: 16,
//         textAlign: 'left', 
//         flex: 1, 
//         marginLeft: -50,
//     },
//     input: {
//         fontSize: 16,
//         paddingVertical: 5,
//         paddingHorizontal: 10,
//         flex: 1,
//         borderBottomWidth: 1,
//         borderColor: 'gray',
//     },
//     locationInputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         flex: 1,
//         borderBottomWidth: 1,
//         borderColor: 'gray',
//         paddingRight: 10,
//     },
//     locationInput: {
//         fontSize: 16,
//         paddingVertical: 5,
//         paddingHorizontal: 10,
//         flex: 1,
//     },
//     staticValue: {
//         fontSize: 16,
//         flex: 2,
//         textAlign: 'right',
//         color: '#333',
//     },
//     mapIcon: {
//         marginRight: 5,
//     }
// });

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { showMessage } from 'react-native-flash-message';
import { useHikeStore, formatCoordinates, parseCoordinates, LatLng } from '../context/store';
import { Hike } from '../types/hike';

export default function HikeEdit({ hike }: { hike: Hike | null }) {
    const { hikes, addHike, setHikes, currentHike, updateHike, updateCurrentHikeField, setCurrentHike } = useHikeStore();
    const params = useLocalSearchParams();
    const id = Number(params.id);
    const [name, setName] = useState('');
    const [startPoint, setStartPoint] = useState('');
    const [destPoint, setDestPoint] = useState('');
    const [distance, setDistance] = useState('');
    const [calories, setCalories] = useState('');

    useEffect(() => {
        if (hike && hike.id) {
            setCurrentHike(hike);
        } else if (id && !currentHike) {
            const existingHike = hikes.find(h => h.id === id);
            if (existingHike) setCurrentHike(existingHike);
        }
    }, [hike, id]);

    useEffect(() => {
        if (currentHike) {
            setName(currentHike.name || '');
            setStartPoint(formatCoordinates(currentHike.start_point as LatLng));
            setDestPoint(formatCoordinates(currentHike.dest_point as LatLng));
            setDistance(currentHike.distance?.toString() || '');
            setCalories(currentHike.calories?.toString() || '');
        }
    }, [currentHike]);

    function handleSave(event: GestureResponderEvent) {
        if (!name.trim()) {
            showMessage({ message: 'Please enter a name', type: 'warning' });
            return;
        }

        const startCoords = parseCoordinates(startPoint);
        const destCoords = parseCoordinates(destPoint);

        const updated: Hike = {
            id: currentHike?.id ?? Date.now(),
            name,
            nickname: currentHike?.nickname ?? null,
            created_at: currentHike?.created_at ?? new Date(),
            start_point: startCoords,
            dest_point: destCoords,
            distance: Number(distance) || null,
            calories: Number(calories) || null,
            geom: currentHike?.geom ?? null,
            user_id: currentHike?.user_id ?? 1,
        };

        const exists = hikes.find(h => h.id === updated.id);
        exists ? updateHike(updated) : addHike(updated);
        showMessage({ message: exists ? 'Hike updated' : 'Hike created', type: 'success' });
        setCurrentHike(null);
        router.back();
    }

    const openLocationPicker = (field: 'start_point' | 'dest_point') => {
        updateCurrentHikeField('name', name);
        router.push({
            pathname: '../app/drawer/hike/map',
            params: {
                returnToHike: '/hike/hike',
                initialLocation: field === 'start_point' ? startPoint : destPoint,
                fieldType: field,
                id: id?.toString(),
                editable: 'true',
            },
        });
    };

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

            <Text>Distance:</Text>
            <TextInput value={distance} onChangeText={setDistance} style={styles.input} keyboardType="numeric" />

            <Text>Calories:</Text>
            <TextInput value={calories} onChangeText={setCalories} style={styles.input} keyboardType="numeric" />

            <TouchableOpacity onPress={handleSave} style={styles.button}>
                <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    input: { borderWidth: 1, padding: 8, marginBottom: 12 },
    button: { backgroundColor: 'black', padding: 12, borderRadius: 6 },
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
});