import { View, Text, StyleSheet, TextInput, GestureResponderEvent, TouchableOpacity, Animated, Easing } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Hike } from '../types/hike';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import auth from "@react-native-firebase/auth";
import { LOCAL_IP } from '../assets/constants';

type hikeSpecsProps = {
    hike: Hike | null;
    editable: boolean;
};

export default function HikeSpecs({ hike, editable }: hikeSpecsProps) {
    const [name, setName] = useState(hike?.name || 'new hike');
    const [startPoint, setStartPoint] = useState(hike?.start_point?.toString() || '');
    const [destPoint, setDestPoint] = useState(hike?.dest_point?.toString() || '');
    const [distance, setDistance] = useState(hike?.distance?.toString() || '');
    const [calories, setCalories] = useState(hike?.calories?.toString() || '');
    const [editableState, setEditableState] = useState(editable || false);


    const [fadeAnim] = useState(new Animated.Value(0));

    const params = useLocalSearchParams();
    const id = Number(params.id);

    useEffect(() => {
        // Reset all states when the hike changes (based on its ID)
        setName(hike?.name || 'new hike');
        setStartPoint(hike?.start_point?.toString() || '');
        setDestPoint(hike?.dest_point?.toString() || '');
        setDistance(hike?.distance?.toString() || '');
        setCalories(hike?.calories?.toString() || '');
    }, [hike, id]);  // Dependency on `hike` or `id` ensures reset when either changes

    
    const sendDataToServer = async () => {
        try{
            const firebaseToken = await auth().currentUser?.getIdToken();
            const updatedHike = {
                name,
                start_point: Number(startPoint),
                dest_point: Number(destPoint),
                distance: Number(distance),
                calories: Number(calories),
            };
            const response = await fetch(
              `${LOCAL_IP}/api/hikes/update?hikeId=${id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${firebaseToken}`,
                },
                body: JSON.stringify(updatedHike),
              }
            );


            if (!response.ok) {
                const text = await response.text(); // log raw text (could be HTML)
                console.error("Server responded with error HTML:", text);
                throw new Error(`Failed to update hike: ${response.status}`);
            }

            const result = await response.json();
            console.log("updated the hike", result);
        }catch (error) {
            console.error("Error updating hike:", error);
        }
    }

    function handleHikeUpdatePress() {
        sendDataToServer();
    }

    //fade out animation for created at:
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: editableState ? 0 : 1, 
            duration: 300, 
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    }, [editableState]);

    return (
        <View style={{ flex:1, justifyContent: 'space-between' }}>
            <View style={{ justifyContent: 'flex-start'}}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <TouchableOpacity onPress={() => router.replace('/drawer/homeBar/home')}>
                        <Ionicons name="chevron-back-circle" size={52} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=> setEditableState(prev => !prev)}style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
                        <FontAwesome name="gear" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.container}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name:</Text>
                        {editableState ? (
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                style={styles.input}
                            />
                        ) : (
                            <Text style={styles.value}>{hike?.name}</Text>
                        )}
                    </View>
                    <View style={styles.row}>
                        <Animated.Text style={[styles.label, { opacity: fadeAnim }]}>Created:</Animated.Text>
                        <Animated.View style={{ opacity: fadeAnim }}>
                            <Text style={styles.value}>
                                {hike?.created_at ? new Date(hike.created_at).toLocaleDateString() : ""}
                            </Text>
                        </Animated.View>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Start:</Text>
                        {editableState ? (
                            <TextInput
                                value={startPoint}
                                onChangeText={setStartPoint}
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        ) : (
                            <Text style={styles.value}>{hike?.start_point ? hike.start_point.toString() : ''}</Text>
                        )}
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Destination:</Text>
                        {editableState ? (
                            <TextInput
                                value={destPoint}
                                onChangeText={setDestPoint}
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        ) : (
                            <Text style={styles.value}>{hike?.dest_point ? hike.dest_point.toString() : ''}</Text>
                        )}
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Distance:</Text>
                        {editableState ? (
                            <TextInput
                                value={distance}
                                onChangeText={setDistance}
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        ) : (
                            <Text style={styles.value}>{hike?.distance}</Text>
                        )}
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Calories:</Text>
                        {editableState ? (
                            <TextInput
                                value={calories}
                                onChangeText={setCalories}
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        ) : (
                            <Text style={styles.value}>{hike?.calories}</Text>
                        )}
                    </View>
                </View>
            </View>
            <View style={{justifyContent: 'flex-end'}}>
                <View style={styles.buttonContainer}>
                    {editableState ? (
                    <TouchableOpacity style={styles.button} onPress={handleHikeUpdatePress}>
                        <Text style={styles.buttonText}>Update hike</Text>
                    </TouchableOpacity>
                    ) : (
                    <View style={{ display: 'none' }} />
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        paddingBottom: 20,
        alignSelf: 'center',
      },
      
      button: {
        backgroundColor: 'lightgrey',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      
      buttonText: {
        color: '666',
        fontSize: 16,
        textAlign: 'center',
      },
    container: {
        display: 'flex',
        justifyContent: 'center',
        margin: 10,
        paddingLeft: 30,
        padding: 10,
        backgroundColor: 'lightgray',
        borderRadius: 25, 
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between', 
        marginVertical: 8,
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
        flex: 1,
    },
    value: {
        fontSize: 16,
        height: 30, 
        textAlign: 'left', 
        flex: 1, 
        marginLeft: 0,
    },
    input: {
        fontSize: 16,
        padding: 5,
        height: 30,
        width: '50%', 
        borderBottomWidth: 1,
        borderColor: 'gray',
    },
});