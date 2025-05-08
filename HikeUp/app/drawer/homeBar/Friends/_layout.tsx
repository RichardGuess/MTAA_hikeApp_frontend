import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

export default function FriendsTabsLayout() {
  return (
    <TopTabs
      screenOptions={{
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        tabBarIndicatorStyle: { backgroundColor: 'tomato' },
      }}
    >
      <TopTabs.Screen name="chats" options={{ title: "Chats" }} />
      <TopTabs.Screen name="groups" options={{ title: "Groups" }} />
      <TopTabs.Screen name="friendsList" options={{ title: "Friends" }} />
    </TopTabs>
  );
}
