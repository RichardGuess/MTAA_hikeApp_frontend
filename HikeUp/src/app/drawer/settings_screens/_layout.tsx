import { Stack } from "expo-router";
import { useThemeContext } from "../../../context/theme_context";
import { ThemeProvider } from "@react-navigation/native";
import { View } from "react-native";

export default function SettingsScreensLayout() {
  const { theme } = useThemeContext();

  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTransparent: false,
          headerTitle: "Settings",
          headerTitleAlign: "center", // centers the title
          headerLeft: () => (
            <View style={{ paddingLeft: 16 }}>
              {/* Add your custom left header component here */}
            </View>
          ),
          headerStyle: {
            backgroundColor: theme.colors.card,
          },
          headerTintColor: theme.colors.text,
        }}
      />
    </ThemeProvider>
  );
}
