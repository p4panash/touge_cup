import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { Spacing } from '@/theme/spacing';

/**
 * Drive summary screen placeholder
 * Shows after drive ends with route map, score, and stats
 */
export default function DriveSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="title" style={styles.title}>
        Drive Complete!
      </ThemedText>
      <ThemedText variant="secondary" style={styles.subtitle}>
        Drive ID: {id}
      </ThemedText>
      <ThemedText variant="secondary" style={styles.hint}>
        Route map with color-coded smoothness and full stats breakdown will appear here.
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
