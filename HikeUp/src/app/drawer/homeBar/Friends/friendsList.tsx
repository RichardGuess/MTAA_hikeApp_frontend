import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert
} from "react-native";
import { useIsFocused } from '@react-navigation/native';
import auth from "@react-native-firebase/auth";
import { LOCAL_IP } from "../../../../assets/constants";
import { useThemeContext } from "../../../../context/theme_context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { showMessage } from "react-native-flash-message";

type Friend = {
  id: number;
  name: string;
  profile_picture?: string;
};

type Request = {
  user1_id: number;
  user2_id: number;
  status: string;
};

export default function FriendsListScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [localUserId, setLocalUserId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);

  let { fromHike, hikeId } = useLocalSearchParams() as {
    fromHike?: string,
    hikeId: string,
  };
  const [isFromHike, setIsFromHike] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (fromHike === 'true' && isFocused) {
      setIsFromHike(true);

      router.setParams({ fromHike: undefined });
    } else if (!isFocused) {
      setIsFromHike(false);
    }
  }, [fromHike, isFocused]);

  const { theme } = useThemeContext();
  const colors = theme.colors;
  const styles = getStyles(colors);

  const sendDataToServer = async (user_id:number) => {
    try {
      const user = auth().currentUser
      const firebaseToken = await user?.getIdToken();
      const userEmail = user?.email;
      const hike_id = parseInt(hikeId, 10)

      if (!firebaseToken) {
          throw new Error('User is not authenticated');
      }
  
      const data = {
          user_id,
          hike_id
      };

      const response = await fetch(`${LOCAL_IP}/api/friends/join-hike`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${firebaseToken}`,
          },
          body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Server responded with error:", text);
        if (response.status === 409){
          showMessage({ 
            message: 'user already joined the hike',
            type: 'warning' 
          });
        }
      }
    } catch (error) {
      console.error("Error updating hike:", error);
    }
  };
  
  const fetchAllData = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error("No authenticated user");
      const token = await currentUser.getIdToken(true);

      const userInfoRes = await fetch(`${LOCAL_IP}/api/users/search?email=${currentUser.email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = await userInfoRes.json();
      const userId = userInfo.body?.[0]?.id;
      if (!userId) throw new Error("Could not resolve user ID");
      setLocalUserId(userId);

      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${LOCAL_IP}/api/friends/list?user_id1=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${LOCAL_IP}/api/friends/requests?user_id1=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();
      const incoming = requestsData.filter((r: Request) => r.user2_id === userId && r.status === "pending");

      setFriends(friendsData);
      setRequests(incoming);
    } catch (err) {
      console.error("Failed to fetch friends/requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term || !localUserId) {
      setSearchResults([]);
      return;
    }

    try {
      const currentUser = auth().currentUser;
      const token = await currentUser?.getIdToken(true);

      const res = await fetch(
        `${LOCAL_IP}/api/users/smart-search?term=${encodeURIComponent(term)}&excludeId=${localUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) {
        const friendIds = new Set(friends.map((f) => f.id));
        const filtered = data.users.filter((u: Friend) => !friendIds.has(u.id));
        setSearchResults(filtered);
      } else {
        console.error('Search failed', data);
      }
    } catch (err) {
      console.error('Smart search error:', err);
    }
  };

  const sendFriendRequest = async (receiverId: number) => {
    if (!localUserId) return alert('Your user ID is unknown');
    try {
      const currentUser = auth().currentUser;
      const token = await currentUser?.getIdToken(true);

      const res = await fetch(
        `${LOCAL_IP}/api/friends/send-request?sender=${localUserId}&receiver=${receiverId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        alert('Friend request sent!');
        setSearchTerm('');
        setSearchResults([]);
      } else {
        alert('Failed to send friend request');
      }
    } catch (err) {
      console.error('Send request error:', err);
      alert('Error sending friend request');
    }
  };

  const resolveRequest = async (senderId: number, accept: boolean) => {
    if (!localUserId) return;
    try {
      const currentUser = auth().currentUser;
      const token = await currentUser?.getIdToken(true);

      const res = await fetch(
        `${LOCAL_IP}/api/friends/resolve-request?user_id1=${senderId}&user_id2=${localUserId}&accept=${accept ? 1 : 0}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        await fetchAllData();
      } else {
        alert('Failed to update request');
      }
    } catch (err) {
      console.error('Resolve request error:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  function handleAddToHike(item: Friend) {
    sendDataToServer(item.id);
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { marginBottom: 16 }]}
        placeholder="Search users..."
        placeholderTextColor={colors.text}
        value={searchTerm}
        onChangeText={handleSearch}
      />

      {searchResults.length > 0 && (
        <>
          <Text style={styles.title}>Search Results:</Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                {item.profile_picture ? (
                  <Image source={{ uri: item.profile_picture }} style={styles.profile_picture} />
                ) : (
                  <View style={styles.profile_picturePlaceholder} />
                )}
                <Text style={styles.text}>{item.name || `User ${item.id}`}</Text>
                <TouchableOpacity onPress={() => sendFriendRequest(item.id)}>
                  <Text style={[styles.text, { color: 'blue', marginLeft: 10 }]}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}

      {requests.length > 0 && (
        <>
          <Text style={[styles.title, { marginTop: 20 }]}>Your Requests:</Text>
          <FlatList
            data={requests}
            keyExtractor={(item) => item.user1_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                <Text style={styles.text}>Request from user {item.user1_id}</Text>
                <TouchableOpacity onPress={() => resolveRequest(item.user1_id, true)}>
                  <Text style={[styles.text, { color: 'green', marginLeft: 10 }]}>✔</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => resolveRequest(item.user1_id, false)}>
                  <Text style={[styles.text, { color: 'red', marginLeft: 10 }]}>✖</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}

      <Text style={[styles.title, { marginTop: 16 }]}>Your Friends:</Text>
      {friends.length === 0 ? (
        <Text style={styles.text}>You have no friends yet</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.friendItem, { flexDirection: 'row', alignItems: 'center' }]}>
              {item.profile_picture ? (
                <Image source={{ uri: item.profile_picture }} style={styles.profile_picture} />
              ) : (
                <View style={styles.profile_picturePlaceholder} />
              )}
              <Text style={styles.text}>{item.name || `User ${item.id}`}</Text>
              {isFromHike ? (
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => handleAddToHike(item)}>
                  <Text style={{ color: 'blue' }}>+ Add to hike</Text>
                </TouchableOpacity>
              </View>
              ) : (
                <View style={{display: 'none'}}></View>
              )
              }
            </View>
          )}
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 50,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    text: {
      fontSize: 16,
      color: colors.text,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 12,
      color: colors.text,
    },
    input: {
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      color: colors.text,
      backgroundColor: colors.card,
    },
    friendItem: {
      display: 'flex',
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profile_picture: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    profile_picturePlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: colors.border,
    },
  });
