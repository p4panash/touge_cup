import { useColorScheme } from 'react-native';
import { Colors, type ThemeColors } from '../theme/colors';

/**
 * Hook for accessing theme colors based on system dark/light mode
 *
 * Usage:
 * const { colors, isDark } = useTheme();
 * <View style={{ backgroundColor: colors.background }} />
 */
export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const colorScheme = useColorScheme() ?? 'light';
  return {
    colors: Colors[colorScheme],
    isDark: colorScheme === 'dark',
  };
}
