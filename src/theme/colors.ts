/**
 * Tofu Coach — Racing-inspired color palette
 *
 * Clean reds for racing heritage, warm neutrals for the
 * tofu delivery aesthetic. High contrast, especially in dark mode.
 */
export const Colors = {
  light: {
    background: '#faf8f5',
    surface: '#f0ece6',
    text: '#1a1a1a',
    textSecondary: '#8a7e6b',
    primary: '#cc2936',       // racing red — high contrast, unmistakable
    primaryMuted: '#e8a0a0',  // softer red for backgrounds
    danger: '#c41e2a',
    success: '#4a9e6b',       // clean green
    warning: '#d4943a',       // amber
    border: '#ddd5c8',
    accent: '#6b8f71',        // forest accent
  },
  dark: {
    background: '#000000',    // true black — OLED friendly
    surface: '#1a1a1a',
    text: '#f0ece6',
    textSecondary: '#777777',
    primary: '#e63946',       // bright racing red — pops on black
    primaryMuted: '#3a1418',  // muted red for dark backgrounds
    danger: '#e63946',
    success: '#5ab87d',       // clean green
    warning: '#e0a84f',       // amber
    border: '#2a2a2a',
    accent: '#7dab83',        // forest accent
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
