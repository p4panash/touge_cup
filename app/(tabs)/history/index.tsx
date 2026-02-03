import { useState, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { DriveListItem } from '@/components/history/DriveListItem';
import { FilterBar, SortOption, DifficultyFilter } from '@/components/history/FilterBar';
import { useDriveHistory } from '@/hooks/useDriveHistory';
import { Spacing } from '@/theme/spacing';
import type { DriveListItem as DriveListItemType } from '@/hooks/useDriveHistory';

const ITEM_HEIGHT = 80 + Spacing.xs * 2; // height + vertical margin

/**
 * History list screen
 * Shows past drives with filtering by difficulty and sorting by date or score
 */
export default function HistoryScreen() {
  const { drives, loading, refresh } = useDriveHistory(100);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');

  // Filter and sort drives
  const filteredDrives = useMemo(() => {
    let result = drives;

    // Filter by difficulty if not 'all'
    if (difficultyFilter !== 'all') {
      result = result.filter((d) => d.difficulty === difficultyFilter);
    }

    // Sort by date (descending) or score (descending)
    return [...result].sort((a, b) => {
      if (sortBy === 'score') {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      const aTime = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime).getTime();
      const bTime = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime).getTime();
      return bTime - aTime;
    });
  }, [drives, sortBy, difficultyFilter]);

  // Memoized renderItem to prevent re-creating function on each render
  const renderItem = useCallback(
    ({ item }: { item: DriveListItemType }) => <DriveListItem drive={item} />,
    []
  );

  // Memoized keyExtractor
  const keyExtractor = useCallback((item: DriveListItemType) => item.id, []);

  // Fixed item layout for performance
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Empty state component
  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyIcon}>🚗</ThemedText>
        <ThemedText variant="secondary" style={styles.emptyText}>
          No drives yet. Start your first drive!
        </ThemedText>
      </View>
    ),
    []
  );

  return (
    <ThemedView style={styles.container}>
      <FilterBar
        sortBy={sortBy}
        onSortChange={setSortBy}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
      />
      <FlatList
        data={filteredDrives}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        onRefresh={refresh}
        refreshing={loading}
        windowSize={5}
        maxToRenderPerBatch={10}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={filteredDrives.length === 0 && styles.emptyList}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
});
