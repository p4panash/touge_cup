import { View, StyleSheet, type ViewStyle } from 'react-native';
import { ThemedText } from '../shared/ThemedText';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../theme/spacing';

interface SettingRowProps {
  /** Setting label displayed on left */
  label: string;
  /** Optional description text below label */
  description?: string;
  /** Right side content (switch, selector, etc.) */
  children: React.ReactNode;
  /** Optional style override */
  style?: ViewStyle;
}

/**
 * Generic row component for settings
 * Displays label on left with optional description, children on right
 */
export function SettingRow({ label, description, children, style }: SettingRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }, style]}>
      <View style={styles.labelContainer}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {description && (
          <ThemedText variant="secondary" style={styles.description}>
            {description}
          </ThemedText>
        )}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  label: {
    fontSize: 16,
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flexShrink: 0,
  },
});
