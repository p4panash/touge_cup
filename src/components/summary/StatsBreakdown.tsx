import { View, StyleSheet, Text } from 'react-native';
import { ThemedText } from '../shared/ThemedText';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius } from '../../theme/spacing';
import type { Drive } from '../../db/schema/drives';

interface StatsBreakdownProps {
  drive: Drive;
}

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

function formatDistance(meters: number | null): string {
  if (meters === null) return '-- km';
  return `${(meters / 1000).toFixed(1)} km`;
}

function calculateAvgSpeed(distanceMeters: number | null, durationMs: number | null): string {
  if (distanceMeters === null || durationMs === null || durationMs === 0) return '-- km/h';
  const hours = durationMs / 1000 / 3600;
  const km = distanceMeters / 1000;
  return `${(km / hours).toFixed(1)} km/h`;
}

function getScoreColor(score: number | null, colors: ReturnType<typeof useTheme>['colors']): string {
  if (score === null) return colors.textSecondary;
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
}

function formatDifficulty(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

/**
 * Stats breakdown — drive summary with tofu delivery rating
 */
export function StatsBreakdown({ drive }: StatsBreakdownProps) {
  const { colors, isDark } = useTheme();
  const scoreColor = getScoreColor(drive.score, colors);
  const isPerfectDrive = drive.spillCount === 0;

  // Delivery verdict based on score
  const getVerdict = (score: number | null): { text: string; jp: string } => {
    if (score === null) return { text: 'Unknown', jp: '不明' };
    if (score >= 95) return { text: 'Legendary', jp: '伝説' };
    if (score >= 80) return { text: 'Excellent', jp: '優秀' };
    if (score >= 60) return { text: 'Good', jp: '良好' };
    if (score >= 40) return { text: 'Rough', jp: '荒い' };
    return { text: 'Spilled!', jp: '失敗' };
  };

  const verdict = getVerdict(drive.score);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Score section */}
      <View style={styles.scoreSection}>
        <Text style={[styles.verdictJP, { color: colors.textSecondary }]}>
          {verdict.jp}
        </Text>
        <ThemedText style={[styles.scoreValue, { color: scoreColor }]}>
          {drive.score !== null ? drive.score : '--'}
        </ThemedText>
        <ThemedText variant="secondary" style={styles.verdictText}>
          {verdict.text}
        </ThemedText>
        {isPerfectDrive && drive.score !== null && (
          <View style={[styles.perfectBadge, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.perfectText}>Perfect Delivery!</ThemedText>
          </View>
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatCard label="Spills" value={drive.spillCount?.toString() ?? '0'} colors={colors} />
        <StatCard label="Duration" value={formatDuration(drive.durationMs)} colors={colors} />
        <StatCard label="Distance" value={formatDistance(drive.distanceMeters)} colors={colors} />
        <StatCard label="Avg Speed" value={calculateAvgSpeed(drive.distanceMeters, drive.durationMs)} colors={colors} />
      </View>

      {/* Difficulty badge */}
      <View style={styles.difficultyRow}>
        <ThemedText variant="secondary" style={styles.difficultyLabel}>Difficulty</ThemedText>
        <View style={[styles.difficultyBadge, { borderColor: colors.primary }]}>
          <ThemedText style={[styles.difficultyText, { color: colors.primary }]}>
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
  colors: ReturnType<typeof useTheme>['colors'];
}

function StatCard({ label, value, colors }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.background }]}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText variant="secondary" style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    margin: Spacing.md,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  verdictJP: {
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: Spacing.xs,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  verdictText: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  perfectBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  perfectText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.5,
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
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  difficultyLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
