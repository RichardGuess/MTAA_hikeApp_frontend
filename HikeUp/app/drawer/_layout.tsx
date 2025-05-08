import { createDrawerNavigator } from "@react-navigation/drawer";
import { withLayoutContext } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Text } from "react-native";

// Define the drawer navigator and connect it to expo-router
const { Navigator } = createDrawerNavigator();
const Drawer = withLayoutContext(Navigator);

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerTitleAlign: "center",
        drawerActiveTintColor: "tomato",
      }}
    >
    <Drawer.Screen
        name="map_redirect"
        options={{
          title: "Map",
        }}
      />
    <Drawer.Screen
        name="home_redirect"
        options={{
          title: "Hikes",
        }}
      />
    <Drawer.Screen
        name="friendsList_redirect"
        options={{
          title: "Friends",
        }}
      />
    <Drawer.Screen name="homeBar" options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="hike" options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="flashMessage" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
