import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { Spacing } from '@/theme/spacing';

/**
 * History list screen placeholder
 * Will show list of past drives with filtering/sorting in Plan 03
 */
export default function HistoryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="title" style={styles.title}>
        Drive History
      </ThemedText>
      <ThemedText variant="secondary" style={styles.subtitle}>
        History - Coming Soon
      </ThemedText>
      <ThemedText variant="secondary" style={styles.hint}>
        Your past drives with scores and stats will appear here.
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
