import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { SettingRow } from '@/components/settings/SettingRow';
import { DifficultySelector } from '@/components/home/DifficultySelector';
import { Spacing } from '@/theme/spacing';
import { useTheme } from '@/hooks/useTheme';

/**
 * Settings screen
 *
 * Sections:
 * - Driving: Difficulty selector (connected to useSensorStore)
 * - Display: Keep Screen Awake toggle (connected to useSettingsStore)
 * - Audio: Volume slider placeholder (for Phase 5)
 * - About: App version info
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Section: Driving */}
        <View style={styles.section}>
          <ThemedText variant="secondary" style={styles.sectionHeader}>
            DRIVING
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <View style={styles.difficultyContainer}>
              <DifficultySelector />
            </View>
          </View>
        </View>


        {/* Section: Audio (placeholder for Phase 5) */}
        <View style={styles.section}>
          <ThemedText variant="secondary" style={styles.sectionHeader}>
            AUDIO
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <SettingRow label="Sound Effects" description="Audio feedback sounds coming in Phase 5">
              <ThemedText variant="secondary">Coming Soon</ThemedText>
            </SettingRow>
          </View>
        </View>

        {/* Section: Developer */}
        <View style={styles.section}>
          <ThemedText variant="secondary" style={styles.sectionHeader}>
            DEVELOPER
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <Pressable
              onPress={() => router.push('/settings/logs')}
              style={({ pressed }) => [
                styles.linkRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText>Debug Logs</ThemedText>
              <ChevronRight size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Section: About */}
        <View style={styles.section}>
          <ThemedText variant="secondary" style={styles.sectionHeader}>
            ABOUT
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <SettingRow label="Version">
              <ThemedText>1.0.0</ThemedText>
            </SettingRow>
            <SettingRow label="App Name" style={{ borderBottomWidth: 0 }}>
              <ThemedText>Tofu Coach</ThemedText>
            </SettingRow>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionContent: {
    marginHorizontal: Spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  difficultyContainer: {
    paddingVertical: Spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
});
