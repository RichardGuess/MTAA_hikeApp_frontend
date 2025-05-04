// // app/_layout.tsx
// import { Tabs } from "expo-router";
// import { Ionicons } from '@expo/vector-icons'; // You can use other icon sets too

// export default function Layout() {
//   return (
//     <Tabs
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName: keyof typeof Ionicons.glyphMap = "home";

//           if (route.name === "index") {
//             iconName = focused ? "home" : "home-outline";
//           } else if (route.name === "settings") {
//             iconName = focused ? "settings" : "settings-outline";
//           }

//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: 'tomato',
//         tabBarInactiveTintColor: 'gray',
//         headerShown: false,
//       })}
//     />
//   );
// }

// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}