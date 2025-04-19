import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";


export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🏕️ Welcome to HikeUp Home!</Text>
      <Text style={styles.subtext}>You successfully logged in 🎉</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f2f2f2",
  },
  text: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
  },
  subtext: {
    fontSize: 16,
    color: "#666",
  },
});
