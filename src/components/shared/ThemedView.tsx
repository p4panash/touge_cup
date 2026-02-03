import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ThemedViewProps extends ViewProps {
  /** Use surface color instead of background (for cards, containers) */
  surface?: boolean;
}

/**
 * View component with automatic dark mode support
 * Uses background color by default, surface color with surface prop
 */
export function ThemedView({ style, surface, ...props }: ThemedViewProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: surface ? colors.surface : colors.background },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
