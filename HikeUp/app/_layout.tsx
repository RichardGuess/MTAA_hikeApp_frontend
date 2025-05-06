import { Stack } from "expo-router";
import FlashMessage from "react-native-flash-message";

export default function RootLayout() {
  return (
  <>
    <FlashMessage position="top" />
    <Stack screenOptions={{headerShown: false}}/>
  </>
  );
}