import { View, Text, StyleSheet, TextInput, GestureResponderEvent, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Hike } from '../types/hike';

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

    const params = useLocalSearchParams();
    const id = Number(params.id);

    

    function handleCreateHikePress(event: GestureResponderEvent): void {
        throw new Error('Function not implemented.');
    }

    return (
        <View style={{ flex:1, justifyContent: 'space-between', paddingTop: 100}}>
            {/* EDIT button */}
            <TouchableOpacity onPress={()=> (!editable)}style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007AFF' }}>EDIT</Text>
            </TouchableOpacity>

            <View style={styles.container}>
                <View style={styles.row}>
                    <Text style={styles.label}>Name:</Text>
                    {editable ? (
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
                    {editable ? (
                        <View style={{ flex: 1 }} />
                    ) : (
                        <>
                            <Text style={styles.label}>Created:</Text>
                            <Text style={styles.value}>
                                {hike?.created_at ? new Date(hike.created_at).toLocaleDateString() : ""}
                            </Text>                        
                        </>                
                    )}
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Start:</Text>
                    {editable ? (
                        <TextInput
                            value={startPoint}
                            onChangeText={setStartPoint}
                            style={styles.input}
                            keyboardType="numeric"
                        />
                    ) : (
                        <Text style={styles.value}>{hike?.start_point}</Text>
                    )}
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Destination:</Text>
                    {editable ? (
                        <TextInput
                            value={destPoint}
                            onChangeText={setDestPoint}
                            style={styles.input}
                            keyboardType="numeric"
                        />
                    ) : (
                        <Text style={styles.value}>{hike?.dest_point}</Text>
                    )}
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Distance:</Text>
                    {editable ? (
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
                    {editable ? (
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
            <View style={styles.buttonContainer}>
                {editable ? (
                <TouchableOpacity style={styles.button} onPress={handleCreateHikePress}>
                    <Text style={styles.buttonText}>create hike</Text>
                </TouchableOpacity>
                ) : (
                <View style={{ flex: 1 }} />
                )}
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
        textAlign: 'left', 
        flex: 1, 
        marginLeft: -50,
    },
    input: {
        fontSize: 16,
        padding: 5,
        width: '50%', 
        borderBottomWidth: 1,
        borderColor: 'gray',
    },
});