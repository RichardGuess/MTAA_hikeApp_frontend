import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";

import { LOCAL_IP } from "../assets/constants";
import HikeSpecs from "../components/hike-detail";

export default function HikeDetail() {
  const { id, editable } = useLocalSearchParams<{ id?: string; editable?: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<any>(null); // You can improve type here if needed
  const [canEdit, setCanEdit] = useState<boolean>(false);

  // Convert editable string param to boolean
  useEffect(() => {
    if (editable !== undefined) {
      setCanEdit(editable === "true");
    }
  }, [editable]);

  
  // Get token from AsyncStorage (optional, you're using Firebase token below anyway)
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    };
    getToken();
  }, []);

  // Fetch hike detail when `id` changes
  useEffect(() => {
    if (id) {
      fetchData();
    }else{
      console.log(data,canEdit);
    }
  }, [id]);

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
      console.error("Error fetching data:", error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {(data && canEdit === false) || (!data && canEdit === true) ? (
        <HikeSpecs hike={data} editable={canEdit} />
      ) : (
        <Text>Loading hike details...</Text>
      )}
    </View>
  );
}