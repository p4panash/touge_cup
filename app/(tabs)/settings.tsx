import { ScrollView, View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { SettingRow } from '@/components/settings/SettingRow';
import { SettingToggle } from '@/components/settings/SettingToggle';
import { DifficultySelector } from '@/components/home/DifficultySelector';
import { useSettingsStore } from '@/stores/useSettingsStore';
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
  const { colors } = useTheme();
  const keepScreenAwake = useSettingsStore((s) => s.keepScreenAwake);
  const setKeepScreenAwake = useSettingsStore((s) => s.setKeepScreenAwake);

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

        {/* Section: Display */}
        <View style={styles.section}>
          <ThemedText variant="secondary" style={styles.sectionHeader}>
            DISPLAY
          </ThemedText>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <SettingToggle
              label="Keep Screen Awake"
              description="Prevents screen from sleeping during active drives"
              value={keepScreenAwake}
              onValueChange={setKeepScreenAwake}
            />
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
              <ThemedText>Water Cup Coach</ThemedText>
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
});
