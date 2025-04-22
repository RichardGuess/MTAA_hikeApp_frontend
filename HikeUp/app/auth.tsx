import { useState } from "react";
import { View, Text, Button, TextInput, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import auth from '@react-native-firebase/auth';

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    const LOCAL_IP = "http://192.168.1.58:5433"; // dont forget to change this 

    try {
      let userCredential;

      if (isSignUp) {
        userCredential = await auth().createUserWithEmailAndPassword(email, password);
      } else {
        userCredential = await auth().signInWithEmailAndPassword(email, password);
      }

      const idToken = await userCredential.user.getIdToken();

      //Send the token to your backend
      const res = await fetch(`${LOCAL_IP}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          // Only needed for signup
          ...(isSignUp && {
            name: "Firebase Test",
            role: "user",
            nickname: "firebase_user",
            profile_picture: "http://localhost:5433/uploads/default-profile.jpg",
            surname: "Test",
            birth_date: "2000-01-01",
            region: "test-region",
            email: email,
            password: password,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) 
        throw new Error(data.error || "Something went wrong");

      await AsyncStorage.setItem("token", idToken);

      Alert.alert("Success", isSignUp ? `Account created for ${email}` : `Welcome back, ${email}`);
      router.replace("/home");
    } catch (error: any) {
      console.error("Auth error:", error);
      Alert.alert("Auth failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? "Sign Up" : "Login"}</Text>

      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={styles.input} />

      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      <Button title={isSignUp ? "Create Account" : "Log in"} onPress={handleAuth} />

      <Button title="Test Internet" onPress={() => {
  fetch("https://m.youtube.com")
    .then(() => alert("Network OK"))
    .catch(() => alert("Network issue"));
}} />

      <View style={{ marginTop: 12 }}>
        <Button
          title={isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          onPress={() => setIsSignUp(!isSignUp)}
        />
      </View>
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