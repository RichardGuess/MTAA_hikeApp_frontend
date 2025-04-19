import { useEffect } from "react";
import { router } from "expo-router";
import { View, Text } from "react-native";

// timeout workaround, lebo bez toho react sa znazil naloadovat vsetko instantly a expo nebolo ready, tak bol error
export default function Index() {
  useEffect(() => {
    setTimeout(() => {
      router.replace("/auth");
    }, 0);
  }, []);

  return (
    <View>
      <Text>Redirecting...</Text>
    </View>
  );
}
