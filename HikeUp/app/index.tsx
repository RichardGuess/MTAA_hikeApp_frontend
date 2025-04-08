import { useState } from "react";
import { View, Text, Button, TextInput, StyleSheet, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    const url = isSignUp
      ? "http://localhost:5423/api/auth/signup"
      : "http://localhost:5423/api/auth/login";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      // store token here
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
        console.log("Token saved:", data.token);
      }

      Alert.alert(
        "Success",
        isSignUp
          ? `Account created for ${data.email}`
          : `Welcome back, ${data.email}`
      );
    } catch (error: any) {
      console.error("Auth error:", error);
      Alert.alert("Auth failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? "Sign Up" : "Login"}</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title={isSignUp ? "Create Account" : "Log in"} onPress={handleAuth} />

      <Button
        title={
          isSignUp
            ? "Already have an account? Log in"
            : "Don't have an account? Sign up"
        }
        onPress={() => setIsSignUp(!isSignUp)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
  },
});
