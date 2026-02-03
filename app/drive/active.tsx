import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { Spacing } from '@/theme/spacing';

/**
 * Active drive screen placeholder
 * Will show water cup animation, spill counter, and stop button in Plan 02
 */
export default function ActiveDriveScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="title" style={styles.title}>
        Active Drive
      </ThemedText>
      <ThemedText variant="secondary" style={styles.subtitle}>
        Active Drive - Coming Soon
      </ThemedText>
      <ThemedText variant="secondary" style={styles.hint}>
        The water cup animation and real-time feedback will appear here.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  hint: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
