import { StyleSheet, View } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '../../hooks/useTheme';
import { useSensorStore, DifficultyLevel } from '../../stores/useSensorStore';
import { ThemedText } from '../shared/ThemedText';
import { Spacing } from '../../theme/spacing';

const DIFFICULTIES: DifficultyLevel[] = ['easy', 'experienced', 'master'];
const LABELS = ['Easy', 'Experienced', 'Master'];

/**
 * Segmented control for selecting difficulty level
 *
 * Connects to useSensorStore for persisted difficulty selection.
 * Uses native segmented control on iOS, faithful recreation on Android.
 */
export function DifficultySelector() {
  const { colors, isDark } = useTheme();
  const difficulty = useSensorStore((s) => s.difficulty);
  const setDifficulty = useSensorStore((s) => s.setDifficulty);

  const selectedIndex = DIFFICULTIES.indexOf(difficulty);

  return (
    <View style={styles.container}>
      <ThemedText variant="secondary" style={styles.label}>
        Difficulty
      </ThemedText>
      <SegmentedControl
        values={LABELS}
        selectedIndex={selectedIndex >= 0 ? selectedIndex : 0}
        onChange={(event) => {
          const index = event.nativeEvent.selectedSegmentIndex;
          setDifficulty(DIFFICULTIES[index]);
        }}
        appearance={isDark ? 'dark' : 'light'}
        style={styles.control}
        activeFontStyle={styles.activeFont}
        fontStyle={styles.inactiveFont}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  label: {
    marginBottom: Spacing.sm,
    fontSize: 14,
  },
  control: {
    width: 280,
    height: 36,
  },
  activeFont: {
    fontWeight: '600',
  },
  inactiveFont: {
    fontWeight: '400',
  },
});
