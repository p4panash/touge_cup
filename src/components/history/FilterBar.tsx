import { View, StyleSheet, Pressable } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { ThemedText } from '../shared/ThemedText';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../theme/spacing';

export type SortOption = 'date' | 'score';
export type DifficultyFilter = 'all' | 'easy' | 'experienced' | 'master';

interface FilterBarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  difficultyFilter: DifficultyFilter;
  onDifficultyChange: (filter: DifficultyFilter) => void;
}

const DIFFICULTY_OPTIONS: DifficultyFilter[] = ['all', 'easy', 'experienced', 'master'];
const DIFFICULTY_LABELS = ['All', 'Easy', 'Exp', 'Master'];

const SORT_OPTIONS: SortOption[] = ['date', 'score'];
const SORT_LABELS = ['Date', 'Score'];

/**
 * Filter bar for drive history list
 * Provides difficulty filter and sort order controls
 */
export function FilterBar({
  sortBy,
  onSortChange,
  difficultyFilter,
  onDifficultyChange,
}: FilterBarProps) {
  const { colors, isDark } = useTheme();

  const difficultyIndex = DIFFICULTY_OPTIONS.indexOf(difficultyFilter);
  const sortIndex = SORT_OPTIONS.indexOf(sortBy);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.row}>
        {/* Difficulty Filter */}
        <View style={styles.filterSection}>
          <ThemedText variant="secondary" style={styles.label}>
            Difficulty
          </ThemedText>
          <SegmentedControl
            values={DIFFICULTY_LABELS}
            selectedIndex={difficultyIndex >= 0 ? difficultyIndex : 0}
            onChange={(event) => {
              const index = event.nativeEvent.selectedSegmentIndex;
              onDifficultyChange(DIFFICULTY_OPTIONS[index]);
            }}
            appearance={isDark ? 'dark' : 'light'}
            style={styles.segmentedControl}
          />
        </View>

        {/* Sort Control */}
        <View style={styles.sortSection}>
          <ThemedText variant="secondary" style={styles.label}>
            Sort by
          </ThemedText>
          <View style={styles.sortButtons}>
            {SORT_OPTIONS.map((option, index) => (
              <Pressable
                key={option}
                onPress={() => onSortChange(option)}
                style={[
                  styles.sortButton,
                  index === 0 && styles.sortButtonFirst,
                  index === SORT_OPTIONS.length - 1 && styles.sortButtonLast,
                  {
                    backgroundColor:
                      sortBy === option ? colors.primary : colors.surface,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.sortButtonText,
                    sortBy === option && styles.sortButtonTextActive,
                  ]}
                >
                  {SORT_LABELS[index]}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  filterSection: {
    flex: 1,
  },
  sortSection: {
    marginLeft: Spacing.md,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  segmentedControl: {
    height: 32,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  sortButtonFirst: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  sortButtonLast: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
});
