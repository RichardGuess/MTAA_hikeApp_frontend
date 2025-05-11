import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useThemeContext } from '../../../../context/theme_context';
import { router } from 'expo-router';
import { LOCAL_IP } from '../../../../assets/constants';

export default function ChatsScreen() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  const { theme } = useThemeContext();
  const styles = getStyles(theme.colors);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const currentUserUid = currentUser?.uid;

  useEffect(() => {
    const unregister = auth().onAuthStateChanged((user) => {
      console.log('Auth state changed:', user?.uid || 'no user');
      setCurrentUser(user);
      setAuthLoaded(true);
    });
    return () => unregister();
  }, []);

  useEffect(() => {
    if (!authLoaded) return;
    if (authLoaded && currentUser === null) {
      console.warn('No user logged in — redirecting to login.');
      router.replace('../../../auth');
    }
  }, [authLoaded, currentUser]);

  useEffect(() => {
    if (!authLoaded || !currentUser) return;

    const fetchChatsAndFriends = async () => {
      try {
        const token = await currentUser.getIdToken();

        const response = await fetch(`${LOCAL_IP}/api/chat/list/${currentUser.uid}`);
        const data = await response.json();
        setChats(data);

        const userRes = await fetch(`${LOCAL_IP}/api/users/search?email=${currentUser.email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userInfo = await userRes.json();
        const userId = userInfo.body?.[0]?.id;

        const friendsRes = await fetch(`${LOCAL_IP}/api/friends/list?user_id1=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const friendsdata = await friendsRes.json();
        setFriends(friendsdata);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    console.log('Current user UID:', currentUser?.uid);
    fetchChatsAndFriends();
  }, [authLoaded, currentUser]);

  const startChatWith = async (friendEmail: string) => {
    if (!friendEmail || !currentUserUid) {
      Alert.alert('Error', 'Invalid user data');
      return;
    }

    try {
      const uidRes = await fetch(`${LOCAL_IP}/api/chat/firebase-uid?email=${friendEmail}`);
      const { uid: friendUid } = await uidRes.json();

      const chatRes = await fetch(`${LOCAL_IP}/api/chat/start-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUid: currentUserUid, friendUid }),
      });

      const { chatId } = await chatRes.json();
      setShowModal(false);
      router.push(`../chat/${chatId}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
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
                onPress={() => router.push(`../chat/${item.id}`)}
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
