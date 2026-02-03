import { StyleSheet, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../shared/ThemedText';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { DriveListItem } from '../../hooks/useDriveHistory';

interface RecentDriveProps {
  drive: DriveListItem | null;
}

/**
 * Recent drive card showing the most recent completed drive
 *
 * Displays drive summary stats and navigates to drive detail on tap.
 * Shows empty state when no drives available.
 */
export function RecentDrive({ drive }: RecentDriveProps) {
  const { colors } = useTheme();
  const router = useRouter();

  if (!drive) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ThemedText variant="secondary" style={styles.emptyText}>
          No drives yet
        </ThemedText>
        <ThemedText variant="secondary" style={styles.emptyHint}>
          Start your first drive to see your stats here
        </ThemedText>
      </View>
    );
  }

  const handlePress = () => {
    // Use modal summary route (not history tab) to avoid tab navigation confusion
    router.push(`/drive/summary/${drive.id}`);
  };

  // Format duration
  const durationMinutes = drive.durationMs ? Math.round(drive.durationMs / 60000) : 0;
  const durationText = durationMinutes > 0 ? `${durationMinutes} min` : '< 1 min';

  // Format date/time
  const startDate = drive.startTime instanceof Date ? drive.startTime : new Date(drive.startTime);
  const dateText = formatDate(startDate);
  const timeText = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText variant="subtitle" style={styles.title}>
          Last Drive
        </ThemedText>
        <ThemedText variant="secondary" style={styles.date}>
          {dateText} at {timeText}
        </ThemedText>
      </View>

      <View style={styles.statsRow}>
        <StatItem label="Score" value={drive.score ?? 0} highlight />
        <StatItem label="Spills" value={drive.spillCount ?? 0} />
        <StatItem label="Duration" value={durationText} />
      </View>
    </Pressable>
  );
}

interface StatItemProps {
  label: string;
  value: number | string;
  highlight?: boolean;
}

function StatItem({ label, value, highlight }: StatItemProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.statItem}>
      <ThemedText
        style={[
          styles.statValue,
          highlight && { color: colors.primary },
        ]}
      >
        {value}
      </ThemedText>
      <ThemedText variant="secondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);

  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  emptyHint: {
    textAlign: 'center',
    fontSize: 13,
  },
});
