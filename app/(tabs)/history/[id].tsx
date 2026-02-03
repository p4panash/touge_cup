import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { Spacing } from '@/theme/spacing';

/**
 * Drive detail screen accessed from history list
 * Shows same content as drive summary - can redirect or render inline
 */
export default function DriveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="title" style={styles.title}>
        Drive Details
      </ThemedText>
      <ThemedText variant="secondary" style={styles.subtitle}>
        Drive ID: {id}
      </ThemedText>
      <ThemedText variant="secondary" style={styles.hint}>
        Route map and detailed stats will appear here.
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
