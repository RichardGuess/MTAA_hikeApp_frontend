import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";

import { LOCAL_IP } from "../../../assets/constants";
import HikeEdit from '../../../components/hikeNew'
import HikeDetail from "../../../components/hikeDetail";

import { Hike } from "../../../types/hike";
import { showMessage } from "react-native-flash-message";

type Mode = 'add' | 'view';


export default function HikeScreen() {
  const { id, mode: urlMode } = useLocalSearchParams<{ id?: string; mode: Mode }>();
  const [data, setData] = useState<Hike | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (urlMode === 'add' || urlMode === 'view') {
      setMode(urlMode);
    } else {
      setMode('view'); 
    }
  }, [urlMode]);

  // Fetch hike detail when `id` changes, retry once if fetch failed
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;

    const tryFetch = async () => {
      if (!id) return;

      await fetchData();

      // Retry if data is still null after 1000ms
      if (!data) {
        retryTimeout = setTimeout(() => {
          console.log("Retrying fetchData...");
          fetchData();
        }, 1000);
      }
    };

    tryFetch();

    return () => clearTimeout(retryTimeout);
  }, [id]);

  const getOfflineHikes = async () => {
    try {
      const value = await AsyncStorage.getItem(`hike-${id}`);
      if (value) {
        const parsed = JSON.parse(value);
        parsed.created_at = new Date(parsed.created_at);
        setData(parsed);
      } else {
        console.warn("No hike found for ID", id);
      }
    } catch (error) {
      console.error("Failed to load hike from AsyncStorage:", error);
    }
  };
  const fetchData = async () => {
    try {
      const firebaseToken = await auth().currentUser?.getIdToken();
      const response = await fetch(
        `${LOCAL_IP}/api/hikes/from-user-detail?hikeId=${id}`,
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
      setData(result);
      console.log("fetched data", result);
    } catch (error) {
      await getOfflineHikes();
      console.error("Error fetching data:", error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      { (mode === "add")?(
        <HikeEdit />
      ) : (mode === 'view') ? (
        <HikeDetail hike={data} editable={canEdit} />
      ) : (
        <Text>Loading hike details...</Text>
      )}
    </View>
  );
}