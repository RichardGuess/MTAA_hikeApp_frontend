import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
// import {collection,query,orderBy,onSnapshot,addDoc,updateDoc,serverTimestamp,doc} from 'firebase/firestore';
// import { db } from '../../../../firebaseConfig';
import auth from '@react-native-firebase/auth';
import { useThemeContext } from '../../../../context/theme_context';
import { LOCAL_IP } from '../../../../assets/constants';

export default function ChatScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    console.log('📨 Chat ID param:', chatId);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const { theme } = useThemeContext();
    const styles = getStyles(theme.colors);
    const user = auth().currentUser;

    useEffect(() => {
    const wsHost = LOCAL_IP.replace(/^http(s)?:\/\//, ''); // remove http:// or https://
    const ws = new WebSocket(`ws://${wsHost}/ws/chat/${chatId}`);

    ws.onopen = () => {
        console.log('✅ WebSocket connected');
    };

    ws.onmessage = (event) => {
        try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
            setMessages(data);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
        } catch (e) {
        console.error('Failed to parse message', e);
        }
    };

    ws.onerror = (err) => {
        ws.onerror = console.error;
    };

    ws.onclose = () => {
        console.log('🔌 WebSocket closed');
    };

    return () => {
        ws.close();
    };
    }, [chatId]);



    const sendMessage = async () => {
        if (!input.trim() || !user) return;

        try {
            await fetch(`${LOCAL_IP}/api/chat/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId,
                text: input.trim() || '[empty]',
                sender: user.uid || 'unknown',
            }),
            });

            setInput('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
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
