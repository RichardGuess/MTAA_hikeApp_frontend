import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {collection,query,orderBy,onSnapshot,addDoc,updateDoc,serverTimestamp,doc} from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import auth from '@react-native-firebase/auth';
import { useThemeContext } from '../../../context/theme_context';

export default function ChatScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const { theme } = useThemeContext();
    const styles = getStyles(theme.colors);
    const user = auth().currentUser;

    useEffect(() => {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        return unsubscribe;
    }, [chatId]);

    const sendMessage = async () => {
        if (!input.trim() || !user) return;

        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            text: input.trim() || '[empty]',
            sender: user.uid || 'unknown',
            timestamp: serverTimestamp(),
        });

        await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: input.trim(),
            updatedAt: serverTimestamp(),
        });

        setInput('');
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding" keyboardVerticalOffset={100}>
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
                const isMine = item?.sender === user?.uid;
                const messageText = typeof item?.text === 'string' ? item.text : '[invalid message]';

                return (
                    <View style={[styles.message, isMine ? styles.myMessage : styles.theirMessage]}>
                    <Text style={styles.messageText}>{messageText}</Text>
                    </View>
                );
            }}
        />
        <View style={styles.inputContainer}>
            <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            placeholderTextColor={theme.colors.border}
            style={styles.input}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
    );
    }

    const getStyles = (colors: any) =>
    StyleSheet.create({
        container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 50,
        },
        message: {
        padding: 10,
        margin: 8,
        borderRadius: 8,
        maxWidth: '75%',
        },
        myMessage: {
        backgroundColor: colors.primary,
        alignSelf: 'flex-end',
        },
        theirMessage: {
        backgroundColor: colors.card,
        alignSelf: 'flex-start',
        },
        messageText: {
        color: colors.text,
        },
        inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        },
        input: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        marginRight: 10,
        color: colors.text,
        },
        sendButton: {
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        },
        sendButtonText: {
        color: 'white',
        },
    });
