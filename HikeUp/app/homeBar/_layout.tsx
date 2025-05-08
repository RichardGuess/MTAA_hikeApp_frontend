import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";

export default function HomeTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === "home") {
            const iconName = focused ? "home" : "home-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === "Friends") {
            return <FontAwesome5 name="user-friends" size={size} color={color} solid={focused} />;
          } else if (route.name === "map") {
            return <Ionicons name="map" size={size} color={color} />;
          }

          return null;
        },
        headerShown: true,
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="map" options={{ title: "Map" }} />
      <Tabs.Screen name="Friends" options={{ title: "Friends",tabBarLabel: "Friends" }} />
    </Tabs>
  );
}