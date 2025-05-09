import 'react-native-get-random-values';
import auth from "@react-native-firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from 'react';

export default function Index() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        router.replace("./drawer/homeBar/home");
      } else {
        router.replace("./auth");
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) return null;
  return null;
}