import auth from "@react-native-firebase/auth";
import { useEffect, useState } from "react";
import { router, Slot } from "expo-router";

export default function Layout() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        router.replace("/home");
      } else {
        router.replace("/auth");
      }
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) return null;

  return <Slot />;
}
