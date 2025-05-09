import * as React from 'react';
import { View, Text, StyleSheet } from "react-native";
import { useThemeContext } from '../../../theme_context';

export default function ChatsScreen() {
  const { theme } = useThemeContext();
  const styles = getStyles(theme.colors);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>All Direct Messages</Text>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    text: {
      color: colors.text,
      fontSize: 16,
    },
  });
