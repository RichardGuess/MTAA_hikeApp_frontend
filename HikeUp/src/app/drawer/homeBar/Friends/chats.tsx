import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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
  const [friends, setFriends] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  const { theme } = useThemeContext();
  const styles = getStyles(theme.colors);
  const currentUser = auth().currentUser;
  const currentUserUid = currentUser?.uid;

  useEffect(() => {
    const fetchChatsAndFriends = async () => {
      if (!currentUser) return;

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
        setChats(chatData);
      } catch (e) {
        console.error('Error fetching chats:', e);
      }

      try {
        const token = await currentUser.getIdToken();
        const userRes = await fetch(`${LOCAL_IP}/api/users/search?email=${currentUser.email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userInfo = await userRes.json();
        const userId = userInfo.body?.[0]?.id;

        const friendsRes = await fetch(`${LOCAL_IP}/api/friends/list?user_id1=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await friendsRes.json();
        setFriends(data);
      } catch (err) {
        console.error('Error fetching friends:', err);
      }

      setLoading(false);
    };

    fetchChatsAndFriends();
  }, []);

  const getFirebaseUIDFromEmail = async (email: string): Promise<string | null> => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      return null;
    } catch (e) {
      console.error('Failed to find UID by email:', e);
      return null;
    }
  };

  const startChatWith = async (friendEmail: string) => {
    if (!friendEmail) {
      Alert.alert("Error", "This user does not have an email set.");
      return;
    }

    try {
      const userQuery = query(collection(db, 'users'), where('email', '==', friendEmail));
      const snapshot = await getDocs(userQuery);

      if (snapshot.empty) {
        Alert.alert("This user has not yet signed in via Firebase.");
        return;
      }

      const friendUid = snapshot.docs[0].id;

      const existing = chats.find(c =>
        Array.isArray(c.users) &&
        c.users.includes(currentUserUid) &&
        c.users.includes(friendUid)
      );

      if (existing) {
        setShowModal(false);
        router.push({ pathname: '../[chatId]', params: { chatId: existing.id } });
        return;
      }

      const newChat = await addDoc(collection(db, 'chats'), {
        users: [currentUserUid, friendUid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isGroup: false,
        lastMessage: ''
      });

      setShowModal(false);
      router.push({ pathname: '../[chatId]', params: { chatId: newChat.id } });
    } catch (err) {
      console.error('Failed to find UID by email:', err);
      Alert.alert('Failed to start chat');
    }
  };


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const safeChats = chats.filter((chat) => Array.isArray(chat.users));

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newChatButton} onPress={() => setShowModal(true)}>
        <Text style={styles.newChatText}>+ New Chat</Text>
      </TouchableOpacity>

      {safeChats.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.text}>No chats yet</Text>
        </View>
      ) : (
        <FlatList
          data={safeChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isGroup = item?.isGroup;
            const users = Array.isArray(item?.users) ? item.users : [];
            const lastMessage = typeof item?.lastMessage === 'string' ? item.lastMessage : '';
            const otherUser = users.find((uid: string) => uid !== currentUserUid) || 'Unknown';

            return (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() =>
                  router.push({ pathname: '../[chatId]', params: { chatId: item.id } })
                }
              >
                <Text style={styles.text}>
                  {isGroup ? item.name || 'Unnamed Group' : `DM with ${otherUser}`}
                </Text>
                <Text style={styles.lastMessage}>{lastMessage}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={showModal} animationType="slide">
        <View style={styles.container}>
          <Text style={[styles.text, { fontSize: 20, marginBottom: 16 }]}>Start Chat With:</Text>
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() => startChatWith(item.email)}
              >
                <Text style={styles.text}>{item.name || `User ${item.id}`}</Text>
              </TouchableOpacity>
            )}
          />
          <Pressable onPress={() => setShowModal(false)} style={{ marginTop: 20 }}>
            <Text style={{ color: 'red', fontSize: 16 }}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 50,
      paddingHorizontal: 16,
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
    newChatButton: {
      padding: 12,
      backgroundColor: colors.primary,
      borderRadius: 8,
      alignSelf: 'flex-end',
      marginBottom: 16,
    },
    newChatText: {
      color: 'white',
      fontWeight: 'bold',
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
