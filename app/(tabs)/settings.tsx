import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { Spacing } from '@/theme/spacing';

/**
 * Settings screen placeholder
 * Will include difficulty selector, keep-awake toggle, about info in Plan 04
 */
export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="title" style={styles.title}>
        Settings
      </ThemedText>
      <ThemedText variant="secondary" style={styles.subtitle}>
        Settings - Coming Soon
      </ThemedText>
      <ThemedText variant="secondary" style={styles.hint}>
        Difficulty level, screen settings, and app info will appear here.
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
