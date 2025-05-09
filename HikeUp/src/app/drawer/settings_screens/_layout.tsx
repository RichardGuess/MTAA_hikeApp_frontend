import { Stack } from "expo-router";
import { useThemeContext } from "../../../context/theme_context";
import { ThemeProvider } from "@react-navigation/native";

export default function SettingsScreensLayout() {
  const { theme } = useThemeContext();

  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTransparent: false,
          headerTitle: "Settings",
          headerStyle: {
            backgroundColor: theme.colors.card,
          },
          headerTintColor: theme.colors.text,
        }}
      />
    </ThemeProvider>
  );
}
