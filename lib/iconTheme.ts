import { useMemo } from 'react';
import { useColorScheme } from 'nativewind';

export function useIconColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return useMemo(
    () => ({
      foreground: isDark ? '#F0EBE1' : '#241E18',
      muted: isDark ? '#B4AA96' : '#807869',
      primary: isDark ? '#D4B26A' : '#B48C3C',
      primaryForeground: isDark ? '#1E1910' : '#FFFFFF',
      success: isDark ? '#8CB86A' : '#6A9A48',
      destructive: isDark ? '#DC5050' : '#C83232',
      destructiveForeground: isDark ? '#1E1910' : '#FFFFFF',
    }),
    [isDark]
  );
}

export function useSwitchColors() {
  const iconColors = useIconColors();
  return useMemo(
    () => ({
      trackColor: { false: iconColors.muted, true: iconColors.primary },
      thumbColor: iconColors.primaryForeground,
    }),
    [iconColors]
  );
}
