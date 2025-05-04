import { View, Text, StyleSheet, FlatList, Button, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import { useEffect, useState } from "react";
import { LOCAL_IP } from '../../assets/constants';
import HikeView from '../../components/hike-view'


export default function HomeScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [hikes, setHikes] = useState<any[]>([]);
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    };

    getToken();
  }, []);

  // Define Hike interface for better type safety
  interface Hike {
    id: string | number;
    name: string;
    nickname: string;
    created_at: string;
    // Add other properties as needed
  }

  const handleHikePress = (hike: Hike) => {
    // Navigate to hike details page or perform other actions
    router.push({
      pathname: '/hike',
      params: {
        id: hike.id.toString(),  // Pass id as string
        editable: 'false'
      }  
    });  
  };

  const handleDeletePress = () => {
    console.log('delete pressed');
  }
  const handleAddPress = () => {
    router.push({
      pathname: "/hike",
      params: {
        editable: "true"
      }
    });
  };
  const handleFilterPress = () => {
    console.log('filter pressed');
  }

  useEffect(() => {
    const getHikes = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) throw new Error("No authenticated user");

        const freshToken = await currentUser.getIdToken(true);

        const res = await fetch(`${LOCAL_IP}/api/hikes/from-user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${freshToken}`,
          },
        });
        console.log('fetching');
        if (!res.ok) {
          throw new Error("Failed to fetch hikes");
        }

        const data = await res.json();
        console.log("Hikes:", data);
        setHikes(data);
      } catch (error) {
        console.error("Error fetching hikes:", error);
      }
    };

    getHikes();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Hikes:</Text>
      {hikes.length === 0 ? (
        <Text style={styles.noHikesText}>No hikes. You should add some!</Text>
      ) : (
        <FlatList
          data={hikes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <HikeView hike={item} onPress={handleHikePress}/>
          )}
        />
      )}
      <View style={styles.custom}>
        <TouchableOpacity style={styles.button} onPress={handleDeletePress}>
          <Text style={{fontSize: 20}}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleAddPress}>
          <Text style={{fontSize: 20}}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleFilterPress}>
          <Text style={{fontSize: 20}}>Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: "#f2f2f2",

  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  custom: {
    display: 'flex',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    gap: 25
  },
  button: {
    backgroundColor: 'lightgrey',
    padding: 5,
    borderRadius: 8,
  },
  noHikesText: {
    fontSize: 16,
    color: "#666",
    marginTop: 20,
    textAlign: "center",
  },
  hikeItem: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});