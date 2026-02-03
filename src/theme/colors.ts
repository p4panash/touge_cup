/**
 * Light and dark mode color definitions
 * Used by useTheme hook to provide system-adaptive colors
 */
export const Colors = {
  light: {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#1a1a1a',
    textSecondary: '#666666',
    primary: '#00d4ff',
    danger: '#ff4444',
    success: '#00ff00',
    warning: '#ffaa00',
    border: '#e0e0e0',
  },
  dark: {
    background: '#1a1a2e',
    surface: '#2a2a4e',
    text: '#ffffff',
    textSecondary: '#888888',
    primary: '#00d4ff',
    danger: '#ff4444',
    success: '#00ff00',
    warning: '#ffaa00',
    border: '#3a3a5e',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
