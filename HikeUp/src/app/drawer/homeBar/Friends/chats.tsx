import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../../../firebaseConfig';
import auth from '@react-native-firebase/auth';
import { useThemeContext } from '../../../../context/theme_context';
import { router } from 'expo-router';
import { getApps } from 'firebase/app';
import { getAuth as getWebAuth, signInWithCustomToken } from 'firebase/auth';
import { LOCAL_IP } from '../../../../assets/constants';

export default function ChatsScreen() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useThemeContext();
  const styles = getStyles(theme.colors);

  useEffect(() => {
    const fetchChats = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('No current user');
        setLoading(false);
        return;
      }

      console.log('Fetching chats for UID:', currentUser.uid);

      try {
        const firebaseApp = getApps()[0];
        const webAuth = getWebAuth(firebaseApp);

        if (!webAuth.currentUser) {
          const tokenResponse = await fetch(`${LOCAL_IP}/api/auth/custom-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await currentUser.getIdToken()}`,
            },
          });

          const { customToken } = await tokenResponse.json();
          await signInWithCustomToken(webAuth, customToken);
        }

        const q = query(
          collection(db, 'chats'),
          where('users', 'array-contains', currentUser.uid),
          orderBy('updatedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const chatData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('Fetched chats:', chatData);
        setChats(chatData);
      } catch (e) {
        console.error('Error fetching chats:', e);
      }

      setLoading(false);
    };

    fetchChats();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const currentUserUid = auth().currentUser?.uid;
  const safeChats = chats.filter((chat) => Array.isArray(chat.users));

  if (safeChats.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>No chats yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={safeChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isGroup = item?.isGroup;
          const name = item?.name;
          const users = Array.isArray(item?.users) ? item.users : [];
          const lastMessage = typeof item?.lastMessage === 'string' ? item.lastMessage : '';
          const otherUser =
            currentUserUid && users.length > 0
              ? users.find((uid: string) => uid !== currentUserUid) || 'Unknown'
              : 'Unknown User';

          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() =>
                router.push({
                  pathname: '../[chatId]',
                  params: { chatId: item.id },
                })
              }
            >
              <Text style={styles.text}>
                {isGroup ? name || 'Unnamed Group' : `DM with ${otherUser}`}
              </Text>
              <Text style={styles.lastMessage}>{lastMessage}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 50,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    text: {
      fontSize: 16,
      color: colors.text,
    },
    chatItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    lastMessage: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.6,
    },
  });
