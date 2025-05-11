import { View, Text, Button, Alert, StyleSheet, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useTheme } from "@react-navigation/native";

export default function PermissionsScreen() {
  const { colors } = useTheme();
  const [locationStatus, setLocationStatus] = useState<string>("checking...");

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationStatus(status);
  };

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(status);
    if (status !== "granted") {
      Alert.alert("Permission denied", "We need location access for the map.");
    }
  };

  const openAppSettings = async () => {
    const canOpen = await Linking.canOpenURL("app-settings:");
    if (canOpen) {
      Linking.openURL("app-settings:");
    } else {
      Alert.alert("Cannot open settings", "Please open them manually.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text, fontSize: 18, marginBottom: 12 }}>
        Location permission: {locationStatus}
      </Text>

      <View style={styles.spacing}>
        <Button title="Request Location Permission" onPress={requestPermission} />
      </View>

      <View style={styles.spacing}>
        <Button title="Revoke Access (Open App Settings)" onPress={openAppSettings} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  spacing: {
    marginVertical: 10,
  },
});
