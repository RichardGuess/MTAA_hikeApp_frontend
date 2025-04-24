import { useState, useEffect } from "react";
import { View, Text, Button, TextInput, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import auth from "@react-native-firebase/auth";
import { 
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
  GoogleSigninButton
 } from '@react-native-google-signin/google-signin';
import { IdTokenResult } from "firebase/auth";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const LOCAL_IP = "http://192.168.1.58:5433";

  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: "938836830099-phicg0fvs8kkrssaipq9cp65cgtp9spg.apps.googleusercontent.com",
      webClientId: "938836830099-7tuc5uqomldvvna2fsot7g458c6mvduc.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }, []);


  const handleGoogleAuth = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  
      const userInfo = (await GoogleSignin.getCurrentUser()) ?? await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens(); // This gives you idToken
      const idToken = tokens.idToken;
  
      if (!idToken) throw new Error("No ID token returned from Google");
  
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
  
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
  
      //Check if user already exists in Firebase Auth
      const methods = await auth().fetchSignInMethodsForEmail(firebaseUser.email!);
  
      if (methods.length === 0) {
        //New user — create entry in your backend if needed
        const res = await fetch(`${LOCAL_IP}/api/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: firebaseUser.displayName || "Google User",
            role: "user",
            nickname: firebaseUser.displayName?.split(" ")[0]?.toLowerCase() || "google_user",
            profile_picture: firebaseUser.photoURL || "http://localhost:5433/uploads/default-profile.jpg",
            surname: firebaseUser.displayName?.split(" ")[1] || "User",
            birth_date: "2000-01-01",
            region: "google-region",
            email: firebaseUser.email,
          }),
        });
  
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong with backend");
      }
  
      await AsyncStorage.setItem("token", token);
      Alert.alert("Success", `Signed in as ${firebaseUser.email}`);
      router.replace("/home");
  
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      Alert.alert("Auth failed", error.message || "Unknown error");
    }
  };

  const handleAuth = async () => {
    try {
      let userCredential;
  
      if (isSignUp) {
        userCredential = await auth().createUserWithEmailAndPassword(email.trim(), password);
      } else {
        userCredential = await auth().signInWithEmailAndPassword(email.trim(), password);
      }
  
      const idToken = await userCredential.user.getIdToken();
  
      if (isSignUp) {
        const res = await fetch(`${LOCAL_IP}/api/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
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
        });
  
        const data = await res.json();
  
        if (!res.ok) throw new Error(data.error || "Something went wrong");
      }
  
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
      <Text style={styles.title}>{isSignUp ? "Sign Up" : "Sign In"}</Text>

      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      <Button title={isSignUp ? "Create Account" : "Log in"} onPress={handleAuth} />

      <View style={{ marginVertical: 12, alignItems: "center"}}>
        <GoogleSigninButton size={GoogleSigninButton.Size.Standard} color={GoogleSigninButton.Color.Light} onPress={handleGoogleAuth} />
      </View>

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
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "bold",
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