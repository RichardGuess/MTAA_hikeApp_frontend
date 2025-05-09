import React, { createContext, useContext, useState, useMemo } from "react";
import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";

type ThemeContextType = {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: DefaultTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const value = useMemo(
    () => ({
      isDark,
      theme: isDark ? DarkTheme : DefaultTheme,
      toggleTheme,
    }),
    [isDark]
  );

  console.log("Current theme:", isDark ? "dark" : "light");

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => useContext(ThemeContext);
