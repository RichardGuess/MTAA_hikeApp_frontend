// import auth from "@react-native-firebase/auth";
// import { useEffect, useState } from "react";
// import { router, Slot } from "expo-router";

// export default function HomeScreen() {
//   const [initializing, setInitializing] = useState(true);

//   useEffect(() => {
//     const unsubscribe = auth().onAuthStateChanged(async (user) => {
//       if (user) {
//         router.replace("/home");
//       } else {
//         router.replace("/auth");
//       }
//       if (initializing) setInitializing(false);
//     });

//     return unsubscribe;
//   }, []);

//   if (initializing) return null;

//   return <Slot />;
// }

import { useEffect, useState } from "react";
import auth from "@react-native-firebase/auth";
import { router } from "expo-router";

export default function Index() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        router.replace("/home");
      } else {
        router.replace("/auth");
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) return null;
  return null;
}