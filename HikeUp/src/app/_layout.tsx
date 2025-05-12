import { Stack } from "expo-router";
import { ThemeProvider } from "../context/theme_context";
import FlashMessage from "react-native-flash-message";
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <FlashMessage position="top" />
      <View style={styles.fullScreen}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: '100%',       // Ensure full width
    alignSelf: 'stretch', // Enforce stretching in parent flex
  },
});
