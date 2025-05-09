import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import auth from '@react-native-firebase/auth';

export default function LogoutScreen() {
  useEffect(() => {
    const logout = async () => {
      try {
        await auth().signOut(); // firebase logout
        router.replace('/auth'); // redirect to login screen
      } catch (error) {
        console.error('logout error:', error);
      }
    };

    logout();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
