import { createContext, useContext } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface ThemeContextValue {
  themeStyle: StyleProp<ViewStyle>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeStyle(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeStyle must be used within ThemeProvider');
  return ctx;
}

export const ThemeStyleProvider = ThemeContext.Provider;
