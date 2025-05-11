import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { StyleSheet, Platform, View, Dimensions } from 'react-native';
import { useThemeContext } from '../../../../context/theme_context';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

export default function FriendsTabsLayout() {
  const { theme } = useThemeContext();
  const colors = theme.colors;

  const { width, height } = Dimensions.get('window');
  const isTablet = Math.min(width, height) >= 600;
  const styles = getStyles(isTablet);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopTabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text,
          tabBarStyle: {
            backgroundColor: colors.card,
            height: isTablet ? 60 : 48, // taller on tablet
          },
          tabBarLabelStyle: {
            fontSize: isTablet ? 18 : 14, // larger text
            fontWeight: '600',
          },
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
            height: isTablet ? 4 : 2, // thicker on tablet
          },
        }}
      >
        <TopTabs.Screen name="chats_sse" options={{ title: "Chats" }} />
        <TopTabs.Screen name="groups" options={{ title: "Groups" }} />
        <TopTabs.Screen name="friendsList" options={{ title: "Friends" }} />
      </TopTabs>
    </View>
  );
}

const getStyles = (isTablet: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? (isTablet ? 70 : 50) : (isTablet ? 80 : 60),
    },
  });
