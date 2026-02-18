import { StyleSheet, View } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../shared/ThemedText';
import { Spacing } from '../../theme/spacing';

interface StreakTimerProps {
  /** Timestamp when drive started or last spill occurred */
  startTime: number | null;
  /** Whether the drive has any spills */
  hasSpills: boolean;
}

/**
 * Streak timer display
 *
 * Shows time since last spill (or since drive start if no spills).
 * Displays "Perfect!" if no spills have occurred during the drive.
 * Updates every second for real-time feedback.
 */
export function StreakTimer({ startTime, hasSpills }: StreakTimerProps) {
  const { colors } = useTheme();
  const [elapsed, setElapsed] = useState(0);

  const calculateElapsed = useCallback(() => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  }, [startTime]);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    // Set initial value
    setElapsed(calculateElapsed());

    // Update every second
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, calculateElapsed]);

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show "Perfect!" label if no spills
  const isPerfect = !hasSpills && startTime !== null;
  const streakLabel = isPerfect ? 'Perfect!' : 'Streak';

  return (
    <View style={styles.container}>
      <ThemedText
        style={[
          styles.time,
          { color: isPerfect ? colors.success : colors.text },
        ]}
      >
        {formatTime(elapsed)}
      </ThemedText>
      <ThemedText
        variant="secondary"
        style={[
          styles.label,
          isPerfect && { color: colors.success },
        ]}
      >
        {streakLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  time: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 13,
    marginTop: Spacing.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
