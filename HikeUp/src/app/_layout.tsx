// app/_layout.tsx
import { Stack } from "expo-router";
import { ThemeProvider } from "./theme_context";
import FlashMessage from "react-native-flash-message";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <FlashMessage position="top" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
