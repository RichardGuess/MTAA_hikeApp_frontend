import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem  } from "@react-navigation/drawer";
import { withLayoutContext } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useThemeContext } from '../../context/theme_context';
import { ThemeProvider } from '@react-navigation/native';
import { router } from 'expo-router';
import auth from '@react-native-firebase/auth';

// Define the drawer navigator and connect it to expo-router
const { Navigator } = createDrawerNavigator();
const Drawer = withLayoutContext(Navigator);

export default function DrawerLayout() {
    const { isDark, theme } = useThemeContext();
    const iconColor = isDark ? '#fff' : '#000';
    
    return (
        <ThemeProvider value={theme}>
            <Drawer
            screenOptions={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerStyle: {
                backgroundColor: 'transparent',
                elevation: 0,
                },
                headerTintColor: iconColor,
            }}
            drawerContent={(props) => (
                <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
                    <DrawerItemList {...props} />
                    <View style={{ marginTop: 'auto' }}>
                        <DrawerItem
                            label="Logout"
                            onPress={async () => {
                                try {
                                    await auth().signOut();
                                    router.replace('/auth');
                                } catch (e) {
                                    console.error('logout failed:', e);
                                }
                            }}
                        />
                    </View>
                </DrawerContentScrollView>
            )}
            >
            <Drawer.Screen
                name="home_redirect"
                options={{
                title: "Hikes",
                }}
            />
            <Drawer.Screen
                name="map_redirect"
                options={{
                title: "Map",
                }}
            />
            <Drawer.Screen
                name="friendsList_redirect"
                options={{
                title: "Friends",
                }}
            />
            <Drawer.Screen
                name="settings"
                options={{
                title: "Settings",
                }}
            />
            <Drawer.Screen name="homeBar" options={{ drawerItemStyle: { display: 'none' } }} />
            <Drawer.Screen name="hike" options={{ drawerItemStyle: { display: 'none' } }} />
            <Drawer.Screen name="flashMessage" options={{ drawerItemStyle: { display: 'none' } }} />
            <Drawer.Screen name="logout" options={{ drawerItemStyle: { display: 'none' } }} />
            <Drawer.Screen name="settings_screens" options={{ drawerItemStyle: { display: 'none' } }} />
            </Drawer>
        </ThemeProvider>
    );
}
