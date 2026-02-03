import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { Spacing } from '@/theme/spacing';

/**
 * Home screen placeholder
 * Will be replaced with hero start button and recent drives in Plan 02
 */
export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="title" style={styles.title}>
        Water Cup Coach
      </ThemedText>
      <ThemedText variant="secondary" style={styles.subtitle}>
        Home Screen - Coming Soon
      </ThemedText>
      <ThemedText variant="secondary" style={styles.hint}>
        The hero start button and recent drives will appear here.
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
