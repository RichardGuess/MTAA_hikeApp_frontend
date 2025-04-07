import { useState } from "react";
import { View, Text, Button, TextInput, StyleSheet, Alert } from "react-native";
import { getApp } from "@react-native-firebase/app";
import auth from "@react-native-firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);  // To toggle between login and signup forms

  const handleAuth = async () => {
    try {
      let userCredential;
      
      if (isSignUp) {
        // Create user with email and password
        userCredential = await auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("Account created:", user.email);
        Alert.alert("Success", `Account created for ${user.email}`);
      } else {
        // Sign in with email and password
        userCredential = await auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("Logged in as:", user.email);
        Alert.alert("Success", `Welcome back, ${user.email}`);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Authentication failed", error.message);
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
        title={isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
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