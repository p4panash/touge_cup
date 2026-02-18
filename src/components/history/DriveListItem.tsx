import { useRef } from 'react';
import { Pressable, View, StyleSheet, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { ThemedText } from '../shared/ThemedText';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius } from '../../theme/spacing';
import type { DriveListItem as DriveListItemType } from '../../hooks/useDriveHistory';

interface DriveListItemProps {
  drive: DriveListItemType;
  onDelete?: (driveId: string) => void;
}

/**
 * Single drive row in history list
 * Fixed 80px height for FlatList optimization
 * Tappable to navigate to drive summary
 * Swipeable left to reveal delete action
 */
export function DriveListItem({ drive, onDelete }: DriveListItemProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);

  const handlePress = () => {
    router.push(`/drive/summary/${drive.id}`);
  };

  const handleDelete = () => {
    // Close the swipeable first
    swipeableRef.current?.close();

    // Show confirmation dialog
    Alert.alert(
      'Delete Drive',
      `Delete this delivery from ${formatDriveDate(drive.startTime)}? This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(drive.id),
        },
      ]
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <Animated.View style={[styles.deleteContainer, { transform: [{ translateX }] }]}>
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <ThemedText style={styles.deleteText}>Delete</ThemedText>
        </Pressable>
      </Animated.View>
    );
  };

  const scoreColor = getScoreColor(drive.score ?? 0);
  const difficultyColor = getDifficultyColor(drive.difficulty);
  const formattedDate = formatDriveDate(drive.startTime);
  const formattedDuration = formatDuration(drive.durationMs ?? 0);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
      overshootRight={false}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          { backgroundColor: colors.surface },
          pressed && { opacity: 0.8 },
        ]}
      >
        {/* Left: Date and Duration */}
        <View style={styles.leftSection}>
          <ThemedText style={styles.date}>{formattedDate}</ThemedText>
          <ThemedText variant="secondary" style={styles.duration}>
            {formattedDuration}
          </ThemedText>
        </View>

        {/* Center: Spill count and Difficulty badge */}
        <View style={styles.centerSection}>
          <View style={styles.spillContainer}>
            <ThemedText style={styles.spillIcon}>💧</ThemedText>
            <ThemedText style={styles.spillCount}>{drive.spillCount ?? 0}</ThemedText>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
            <ThemedText style={styles.difficultyText}>
              {formatDifficulty(drive.difficulty)}
            </ThemedText>
          </View>
        </View>

        {/* Right: Score */}
        <View style={styles.rightSection}>
          <ThemedText style={[styles.score, { color: scoreColor }]}>
            {drive.score ?? 0}
          </ThemedText>
          <ThemedText variant="secondary" style={styles.scoreLabel}>
            score
          </ThemedText>
        </View>
      </Pressable>
    </Swipeable>
  );
}

/**
 * Format date relative to today
 * "Today 2:30 PM", "Yesterday 9:15 AM", or "Feb 3 2:30 PM"
 */
function formatDriveDate(date: Date): string {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const driveDate = date instanceof Date ? date : new Date(date);
  const driveDateStr = driveDate.toDateString();

  const time = driveDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (driveDateStr === today) return `Today ${time}`;
  if (driveDateStr === yesterday) return `Yesterday ${time}`;
  return driveDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`;
}

/**
 * Format duration in milliseconds to readable string
 */
function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Get color based on score (green for high, red for low)
 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#00ff00'; // success green
  if (score >= 60) return '#ffff00'; // yellow
  if (score >= 40) return '#ffaa00'; // orange
  return '#ff4444'; // red
}

/**
 * Get badge color for difficulty level
 */
function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'rgba(0, 255, 0, 0.3)'; // green
    case 'experienced':
      return 'rgba(255, 170, 0, 0.3)'; // yellow/orange
    case 'master':
      return 'rgba(255, 68, 68, 0.3)'; // red
    default:
      return 'rgba(128, 128, 128, 0.3)';
  }
}

/**
 * Format difficulty for display
 */
function formatDifficulty(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'experienced':
      return 'Exp';
    case 'master':
      return 'Master';
    default:
      return difficulty;
  }
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  leftSection: {
    flex: 1,
  },
  date: {
    fontSize: 15,
    fontWeight: '500',
  },
  duration: {
    fontSize: 13,
    marginTop: 2,
  },
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  spillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spillIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  spillCount: {
    fontSize: 15,
    fontWeight: '600',
  },
  difficultyBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 11,
    marginTop: -2,
  },
  deleteContainer: {
    width: 80,
    marginVertical: Spacing.xs,
    marginRight: Spacing.md,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
