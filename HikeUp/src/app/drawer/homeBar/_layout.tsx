import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { useThemeContext } from "../../../context/theme_context";
import { Dimensions } from "react-native";

export default function HomeTabsLayout() {
  const { theme } = useThemeContext();
  const colors = theme.colors;

  const { width, height } = Dimensions.get("window");
  const isTablet = Math.min(width, height) >= 600;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: colors.card,
          height: isTablet ? 70 : 60,
          paddingBottom: isTablet ? 10 : 5,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: {
          fontSize: isTablet ? 16 : 12,
          fontWeight: "600",
        },
        headerShown: false,
        tabBarIcon: ({ color, focused }) => {
          const size = isTablet ? 28 : 20;

          if (route.name === "home") {
            const iconName = focused ? "home" : "home-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === "Friends") {
            return (
              <FontAwesome5
                name="user-friends"
                size={size}
                color={color}
                solid={focused}
              />
            );
          } else if (route.name === "map") {
            return <Ionicons name="map" size={size} color={color} />;
          }

          return null;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="map" options={{ title: "Map" }} />
      <Tabs.Screen name="Friends" options={{ title: "Friends", tabBarLabel: "Friends" }}/>
      <Tabs.Screen name="chat/[chatId]" options={{tabBarItemStyle: {display: 'none'}}}/>

    </Tabs>
  );
}