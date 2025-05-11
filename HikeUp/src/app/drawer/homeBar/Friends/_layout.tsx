import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { StyleSheet, Platform, View } from 'react-native';
import { useThemeContext } from '../../../../context/theme_context';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

export default function FriendsTabsLayout() {
  const { theme } = useThemeContext();
  const colors = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopTabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text,
          tabBarStyle: { backgroundColor: colors.card },
          tabBarIndicatorStyle: { backgroundColor: colors.primary },
        }}
      >
        <TopTabs.Screen name="chats_sse" options={{ title: "Chats" }} />
        <TopTabs.Screen name="groups" options={{ title: "Groups" }} />
        <TopTabs.Screen name="friendsList" options={{ title: "Friends" }} />
      </TopTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
  },
});