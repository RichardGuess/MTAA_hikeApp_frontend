import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Image, StyleSheet } from "react-native";
import auth from "@react-native-firebase/auth";
import { LOCAL_IP } from "../../../../assets/constants";
import { useThemeContext } from "../../../theme_context";

type Friend = {
  id: number;
  name: string;
  profile_picture?: string;
};

export default function FriendsListScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useThemeContext();
  const colors = theme.colors;
  const styles = getStyles(colors);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) throw new Error("No authenticated user");

        const token = await currentUser.getIdToken(true);

        // TODO: you may need to change this if you store UID in DB instead of numeric ID
        const userInfoRes = await fetch(`${LOCAL_IP}/api/users/search?email=${currentUser.email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userInfo = await userInfoRes.json();
        const userId = userInfo.body?.[0]?.id;
        if (!userId) throw new Error("Could not resolve user ID");

        const res = await fetch(`${LOCAL_IP}/api/friends/list?user_id1=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch friends");

        const data = await res.json();
        setFriends(data);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>You have no friends yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Friends:</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            {item.profile_picture ? (
              <Image source={{ uri: item.profile_picture }} style={styles.profile_picture} />
            ) : (
              <View style={styles.profile_picturePlaceholder} />
            )}
            <Text style={styles.text}>{item.name || `User ${item.id}`}</Text>
          </View>
        )}
      />
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
    friendItem: {
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
