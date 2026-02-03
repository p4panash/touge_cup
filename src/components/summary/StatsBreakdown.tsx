import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../shared/ThemedText';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius } from '../../theme/spacing';
import type { Drive } from '../../db/schema/drives';

interface StatsBreakdownProps {
  drive: Drive;
}

/**
 * Format duration from milliseconds to HH:MM:SS or MM:SS
 */
function formatDuration(ms: number | null): string {
  if (ms === null) return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format distance from meters to km with one decimal
 */
function formatDistance(meters: number | null): string {
  if (meters === null) return '-- km';
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Calculate average speed in km/h from distance (m) and duration (ms)
 */
function calculateAvgSpeed(distanceMeters: number | null, durationMs: number | null): string {
  if (distanceMeters === null || durationMs === null || durationMs === 0) {
    return '-- km/h';
  }
  const hours = durationMs / 1000 / 3600;
  const km = distanceMeters / 1000;
  return `${(km / hours).toFixed(1)} km/h`;
}

/**
 * Get score color based on value
 * >80 = green, 50-80 = yellow, <50 = red
 */
function getScoreColor(score: number | null): string {
  if (score === null) return '#888888';
  if (score >= 80) return '#00ff00'; // green - excellent
  if (score >= 50) return '#ffcc00'; // yellow - good
  return '#ff4444'; // red - needs improvement
}

/**
 * Format difficulty label with proper capitalization
 */
function formatDifficulty(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

/**
 * Stats breakdown component for drive summary
 * Shows score, spills, duration, distance, avg speed, difficulty
 */
export function StatsBreakdown({ drive }: StatsBreakdownProps) {
  const { colors } = useTheme();
  const scoreColor = getScoreColor(drive.score);
  const isPerfectDrive = drive.spillCount === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Score - large and prominent */}
      <View style={styles.scoreSection}>
        <ThemedText variant="secondary" style={styles.scoreLabel}>
          Score
        </ThemedText>
        <ThemedText style={[styles.scoreValue, { color: scoreColor }]}>
          {drive.score !== null ? drive.score : '--'}
        </ThemedText>
        {isPerfectDrive && drive.score !== null && (
          <View style={[styles.perfectBadge, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.perfectText}>Perfect Drive!</ThemedText>
          </View>
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatCard
          label="Spills"
          value={drive.spillCount?.toString() ?? '0'}
          icon="💧"
          colors={colors}
        />
        <StatCard
          label="Duration"
          value={formatDuration(drive.durationMs)}
          icon="⏱️"
          colors={colors}
        />
        <StatCard
          label="Distance"
          value={formatDistance(drive.distanceMeters)}
          icon="📍"
          colors={colors}
        />
        <StatCard
          label="Avg Speed"
          value={calculateAvgSpeed(drive.distanceMeters, drive.durationMs)}
          icon="🚗"
          colors={colors}
        />
      </View>

      {/* Difficulty badge */}
      <View style={styles.difficultyRow}>
        <ThemedText variant="secondary">Difficulty:</ThemedText>
        <View style={[styles.difficultyBadge, { borderColor: colors.primary }]}>
          <ThemedText style={{ color: colors.primary }}>
            {formatDifficulty(drive.difficulty)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  colors: ReturnType<typeof useTheme>['colors'];
}

function StatCard({ label, value, icon, colors }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.background }]}>
      <ThemedText style={styles.statIcon}>{icon}</ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText variant="secondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    margin: Spacing.md,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scoreLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  perfectBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  perfectText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
