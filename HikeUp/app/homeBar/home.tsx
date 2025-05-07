import { View, Text, StyleSheet, FlatList, Button, TouchableOpacity, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import { useEffect, useRef, useState, useCallback } from "react";
import { LOCAL_IP } from '../../assets/constants';
import HikeView from '../../components/hike-view';
import NetInfo from '@react-native-community/netinfo';
import { showMessage } from "react-native-flash-message";
import { Hike } from '../../types/hike'

export default function HomeScreen() {
  const [hikes, setHikes] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);  // Track network status
  const wasOffline = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);  // Track delete mode

  // Function to get hikes from AsyncStorage when offline
  const getOfflineHikes = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const hikeKeys = keys.filter((key) => key.startsWith("hike-"));
      const hikeData = await AsyncStorage.multiGet(hikeKeys);
      const loadedHikes = hikeData
        .map(([_, value]) => {
          try {
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean); // remove nulls

      setHikes(loadedHikes);
      console.log("Loaded hikes from AsyncStorage:", loadedHikes);
    } catch (error) {
      console.error("Failed to load hikes from AsyncStorage:", error);
    }
  };

  // Function to get hikes from the backend
  const getHikes = async () => {
    try {
      setRefreshing(true);
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

      console.log('Fetching hikes...');
      if (!res.ok) {
        throw new Error("Failed to fetch hikes");
      }

      const data = await res.json();
      console.log("Hikes:", data);
      setHikes(data);
    } catch (error) {
      console.error("Error fetching hikes:", error);
      setIsOnline(false); 
      await getOfflineHikes();  // fallback to offline data
      showMessage({
        message: "You're offline",
        description: "Loaded hikes from local storage.",
        type: "warning", // 'success', 'info', 'danger', etc.
        icon: "warning",
      });
    } finally {
      setRefreshing(false); // hide spinner
    }
  };

  //Fetching hike details
  const fetchHikeDetails = async (HikeId : number | string) => {
    try {
      const firebaseToken = await auth().currentUser?.getIdToken();
      const response = await fetch(
        `${LOCAL_IP}/api/hikes/from-user-detail?hikeId=${HikeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseToken}`,
          },
        }
      );
      const result = await response.json();
      result.created_at = new Date(result.created_at);
      console.log("fetched data", result);
      return result;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    // Initial check on mount
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected ?? false;  // Default to false if null
      setIsOnline(isConnected);  // Set the network status
      if (state.isConnected) {
        getHikes(); // initial fetch
      } else { 
        getOfflineHikes();  // load from AsyncStorage if offline
      }
      wasOffline.current = !state.isConnected;
    });

    // Listener for network status changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;  // Default to false if null
      setIsOnline(isConnected);  // Update the network status
      if (state.isConnected && wasOffline.current) {
        getHikes(); // fetch when coming back online
      }
      wasOffline.current = !state.isConnected;
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      getHikes();
    }, [])
  );

  const handleHikePress = (hike: Hike) => {
    if (deleteMode) {
      Alert.alert(
        "Delete Hike",
        `Are you sure you want to delete \"${hike.name}\"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const token = await auth().currentUser?.getIdToken();
                const res = await fetch(`${LOCAL_IP}/api/hikes/delete?hike_id=${hike.id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Deletion failed");

                showMessage({
                  message: "Hike deleted",
                  type: "success",
                });

                await getHikes();
                setDeleteMode(false);
              } catch (err) {
                console.error("Delete error:", err);
                showMessage({
                  message: "Error deleting hike",
                  type: "danger",
                });
              }
            }
          }
        ]
      );
    } else {
      router.push({
        pathname: '/hike',
        params: {
          id: hike.id.toString(),
          editable: 'false'
        }  
      });
    }
  };

  const handleDeletePress = () => {
    setDeleteMode(prev => !prev);
    showMessage({
      message: deleteMode ? "Exited delete mode" : "Tap a hike to delete it",
      type: "info",
    });
  };

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
  };

  const handleDownloadPress = async (hike: Hike) => {
    try {
      const detailedHike = await fetchHikeDetails(hike.id);
      await AsyncStorage.setItem(
        `hike-${hike.id}`,
        JSON.stringify(detailedHike)
      );
      console.log(`Hike ${hike.id} saved to AsyncStorage.`);
      showMessage({
        message: "Downloaded",
        description: "Hike saved for offline use.",
        type: "success",
        icon: "success",
      });
    } catch (error) {
      console.error("Error saving hike to AsyncStorage:", error);
      showMessage({
        message: "Error",
        description: "Could not download hike details.",
        type: "danger",
        icon: "danger",
      });
    }
  };

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
            <HikeView 
              hike={item} 
              onPress={handleHikePress} 
              onDownload={handleDownloadPress} 
              isOnline={isOnline}
            />
          )}
          refreshing={refreshing}
          onRefresh={getHikes}
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
