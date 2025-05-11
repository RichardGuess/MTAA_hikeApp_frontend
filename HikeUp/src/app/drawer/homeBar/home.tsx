import { View, Text, StyleSheet, FlatList, Button, TouchableOpacity, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import { useEffect, useRef, useState, useCallback } from "react";
import { LOCAL_IP } from '../../../assets/constants';
import HikeView from '../../../components/hike-view';
import NetInfo from '@react-native-community/netinfo';
import { showMessage, hideMessage } from "react-native-flash-message";
import { Hike } from '../../../types/hike'
import { useThemeContext } from "../../../context/theme_context"; 
import { isTablet } from '../../../utils/responsive';
import { Dimensions } from 'react-native';

export default function HomeScreen() {
  const [hikes, setHikes] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);  // Track network status
  const wasOffline = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);  // Track delete mode
  const { theme } = useThemeContext();
  const colors = theme.colors;
  const { width, height } = Dimensions.get('window');
  const isTablet = Math.min(width, height) >= 600;
  const styles = getStyles(colors, isTablet);

  useEffect(() => {
    console.log(isTablet ? '🟦 Tablet detected' : '🟩 Phone detected');
  }, []);
  

  console.log("Theme colors:", colors);

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
        pathname: '../hike/hikeScreen',
        params: {
          id: hike.id.toString(),
          editable: 'false',
          mode: "view"
        }  
      });
    }
  };

  const handleDeletePress = () => {
    if (!deleteMode) {
      showMessage({
        message: "You can tap a hike to delete it",
        titleStyle: {textAlign: 'center'},
        type: "info",
        autoHide: false, // stays visible
        hideOnPress: false
      });
    } else {
      hideMessage();
    }
  
    setDeleteMode(prev => !prev);
  };

  const handleAddPress = () => {
    router.push({
      pathname: '../hike/hikeScreen',
      params: {
        editable: "true",
        mode: "add"
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
      <View style={{ flex: 1, width: '100%' }}>
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
      </View>

      <View style={isTablet ? styles.tabletButtonContainer : styles.custom}>
        <TouchableOpacity 
          style={isTablet ? styles.tabletButton : styles.button}
          onPress={handleDeletePress}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={isTablet ? styles.tabletButton : styles.button}
          onPress={handleAddPress}
        >
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={isTablet ? styles.tabletButton : styles.button}
          onPress={handleFilterPress}
        >
          <Text style={styles.buttonText}>Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


}

const getStyles = (colors: any, isTablet: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'stretch',
      paddingTop: isTablet ? 60 : 100,
      paddingHorizontal: isTablet ? 32 : 16,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.text,
    },
    noHikesText: {
      fontSize: 16,
      color: colors.text,
      marginTop: 20,
      textAlign: 'center',
    },
    hikeItem: {
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    // mobile button container (top or inline)
    custom: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      marginBottom: 10,
      gap: 25,
    },
    // tablet button container at bottom of screen
    tabletButtonContainer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 40,
      paddingHorizontal: 20,
    },
    // shared mobile button
    button: {
      backgroundColor: colors.primary,
      padding: 5,
      borderRadius: 8,
    },
    // larger tablet button
    tabletButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 22,
      borderRadius: 10,
    },
    buttonText: {
      color: 'white',
      fontSize: isTablet ? 20 : 16,
      fontWeight: '600',
    },
  });
