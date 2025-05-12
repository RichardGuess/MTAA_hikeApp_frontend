import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  console.log("📡 Starting push notification registration");

  if (!Device.isDevice) {
    console.warn("⚠️ Must use physical device for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log(`🔐 Existing notification permission: ${existingStatus}`);

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log(`🔐 Permission requested, result: ${status}`);
  }

  if (finalStatus !== 'granted') {
    console.warn('⚠️ Push notification permissions not granted');
    return null;
  }

  try {
    console.log("🎯 Requesting Expo push token with projectId...");
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '1315bdf5-06c1-4142-a19f-499e1596b32d',
    });

    console.log("✅ Expo push token received:", tokenData.data);
    return tokenData.data;
  } catch (error: any) {
    console.error("❌ Error getting Expo push token", error?.message || error);
    return null;
  }
}
