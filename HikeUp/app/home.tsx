import { View, Text, StyleSheet, FlatList } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import { useEffect, useState } from "react";

export default function HomeScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [hikes, setHikes] = useState<any[]>([]);

  // const LOCAL_IP = "http://147.175.162.57:5433";
  const LOCAL_IP = "http://192.168.1.58:5433";
  //const LOCAL_IP = "http://172.20.10.2:5433";


  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    };

    getToken();
  }, []);

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
            <View style={styles.hikeItem}>
              <Text>Name: {item.name}</Text>
              <Text>Nickname: {item.nickname}</Text>
              <Text>Created At: {new Date(item.created_at).toLocaleString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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