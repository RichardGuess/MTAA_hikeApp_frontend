// app/hike/_layout.tsx
import { Stack } from "expo-router";

export default function HikeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="hikeScreen" options={{ title: 'hike' }} />
      <Stack.Screen name="map" options={{ title: 'map', presentation: 'card' }} />
    </Stack>  
    );
}