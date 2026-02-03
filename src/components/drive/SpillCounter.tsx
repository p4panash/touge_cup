import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../shared/ThemedText';
import { Spacing } from '../../theme/spacing';

interface SpillCounterProps {
  count: number;
}

/**
 * Spill counter display
 *
 * Shows the current number of spills during the active drive.
 * Large number display for at-a-glance visibility while driving.
 */
export function SpillCounter({ count }: SpillCounterProps) {
  const { colors } = useTheme();

  // Color changes based on spill count for visual feedback
  const countColor = count === 0
    ? colors.success
    : count < 3
      ? colors.warning
      : colors.danger;

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.count, { color: countColor }]}>
        {count}
      </ThemedText>
      <ThemedText variant="secondary" style={styles.label}>
        Spills
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
});
