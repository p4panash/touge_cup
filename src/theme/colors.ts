/**
 * Tofu Coach — JDM-inspired color palette
 *
 * Warm tones inspired by mountain passes at night,
 * the glow of taillights, and Fujiwara Tofu Shop aesthetics.
 */
export const Colors = {
  light: {
    background: '#faf8f5',
    surface: '#f0ece6',
    text: '#2c2416',
    textSecondary: '#8a7e6b',
    primary: '#d4583a',       // warm touge red — taillights on mountain roads
    primaryMuted: '#e8a490',  // softer red for backgrounds
    danger: '#c93030',
    success: '#4a9e6b',       // mountain green
    warning: '#d4943a',       // amber headlights
    border: '#ddd5c8',
    accent: '#6b8f71',        // forest accent
  },
  dark: {
    background: '#000000',    // true black — OLED friendly
    surface: '#1a1a1a',
    text: '#f0ece6',
    textSecondary: '#777777',
    primary: '#e06b4f',       // warm touge red — brighter in dark
    primaryMuted: '#3a1a14',  // muted red for dark backgrounds
    danger: '#e04040',
    success: '#5ab87d',       // mountain green
    warning: '#e0a84f',       // amber headlights
    border: '#2a2a2a',
    accent: '#7dab83',        // forest accent
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
