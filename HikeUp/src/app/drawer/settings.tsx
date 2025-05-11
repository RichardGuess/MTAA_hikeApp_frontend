import { View, Text, Switch, StyleSheet, Platform, Button } from "react-native";
import { useThemeContext } from "../../context/theme_context";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from 'react';
import { router } from "expo-router";

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useThemeContext();
  const { colors } = useTheme();

  const [_, forceRender] = useState(false);

  useEffect(() => {
    forceRender(x => !x);
  }, [isDark]);

  return (
    <View key={isDark ? "dark" : "light"} style={[styles.outer, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: "#ccc", true: "#2196F3" }}
          thumbColor={Platform.OS === "android" ? (isDark ? "#fff" : "#f4f3f4") : undefined}
        />
        <Button title="Edit Profile" onPress={() => router.push("./settings_screens/edit_profile")} />
        <Button title="Manage Permissions" onPress={() => router.push("./settings_screens/permissions")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    outer: {
      flex: 1,
    },
    inner: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
    },
    label: {
      fontSize: 18,
    },
  });