import { useState, useEffect } from "react";
import { View, Text, Button, TextInput, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import auth from "@react-native-firebase/auth";
import NetInfo from '@react-native-community/netinfo';
import { LOCAL_IP } from "../assets/constants";
import { registerForPushNotificationsAsync } from "../utils/pushnotifications";
import { getApp } from '@react-native-firebase/app';

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

  const getNetworkInfo = async () => {
    const info = await NetInfo.fetch();
    
    // Log the full details object to see its structure
    console.log("Network details:", JSON.stringify(info));
    console.log("Network connection type:", info.type);
    
    // Try to access the IP address (may not exist in type definitions)
    console.log("IP address (if available):", 
      // @ts-ignore - Bypass TypeScript checking for this property
      info.details?.ipAddress || 'Not found in details');
      
    // Log the raw details object
    console.log("Raw details object:", info.details);
  };

  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: "938836830099-phicg0fvs8kkrssaipq9cp65cgtp9spg.apps.googleusercontent.com",
      webClientId: "938836830099-7tuc5uqomldvvna2fsot7g458c6mvduc.apps.googleusercontent.com",
      offlineAccess: true,
      openIdRealm: 'your-realm', // This forces use of webview

    });
  }, []);


  const handleGoogleAuth = async () => {
    try {
      console.log("Checking Play Services");
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  
      // clear any stale session to avoid stale token issues
      console.log("Signing out old session");
      await GoogleSignin.signOut();
  
      console.log("Signing in");
      const user = await GoogleSignin.signIn(); // always sign in fresh
      console.log("Google user:", user);
      if (!user) throw new Error("Google sign-in failed");
      const tokens = await GoogleSignin.getTokens();
      console.log("Tokens:", tokens);
      const idToken = tokens.idToken;
  
      if (!idToken) throw new Error("No ID token returned from Google");
  
      console.log("Creating Firebase credential");
      const firebaseApp = getApp();

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth(firebaseApp).signInWithCredential(googleCredential);
      console.log("Firebase user credential:", userCredential);

      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      console.log("Firebase ID token:", token);
  

      const pushToken = await registerForPushNotificationsAsync();
      console.log("Expo Push Token:", pushToken);

      await fetch(`${LOCAL_IP}/api/users/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: firebaseUser.email,
          token: pushToken,
        }),
      });



      // check if user already exists in Firebase Auth
      console.log("Checking sign-in methods for:", firebaseUser.email);
      const methods = await auth().fetchSignInMethodsForEmail(firebaseUser.email!);
      console.log("Sign-in methods:", methods);
  
      if (methods.length === 0) {
        // send data to your backend to create user
        await fetch(`${LOCAL_IP}/api/auth/signup`, {
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
            region: "unknown",
            email: firebaseUser.email,
          }),
        });
      }
  
      // store token for future requests
      // await AsyncStorage.setItem("token", token);
      console.log("Login successful, navigating to /home");
      await AsyncStorage.setItem("token", token);
      router.replace("./drawer/homeBar/home");
  
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      Alert.alert("Google Sign-in failed", error.message || "Unknown error");
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


      const pushToken = await registerForPushNotificationsAsync();
      console.log("Expo Push Token:", pushToken);

      if (pushToken) {
        await fetch(`${LOCAL_IP}/api/users/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: userCredential.user.uid,
            token: pushToken,
          }),
        });
      }


  
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
  
      // await AsyncStorage.setItem("token", idToken);
      Alert.alert("Success", isSignUp ? `Account created for ${email}` : `Welcome back, ${email}`);
      await AsyncStorage.setItem("token", idToken);
      router.replace("./drawer/homeBar/home");
  
    } catch (error: any) {
      console.error("Auth error:", error);
      Alert.alert("Auth failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? "Sign Up" : "Sign In"}</Text>

      <TextInput placeholder="Email" placeholderTextColor={'#333'} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={styles.input} />
      <TextInput placeholder="Password" placeholderTextColor={'#333'} value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      <Button title={isSignUp ? "Create Account" : "Log in"} onPress={handleAuth} />

      <View style={{ marginVertical: 12, alignItems: "center"}}>
        <GoogleSigninButton size={GoogleSigninButton.Size.Standard} color={GoogleSigninButton.Color.Light} onPress={handleGoogleAuth} />
      </View>

        <Button
          title={isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          onPress={() => setIsSignUp(!isSignUp)}
        />
        <Button title="network test" onPress={getNetworkInfo}/>
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