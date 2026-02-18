import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { StartButton } from '@/components/home/StartButton';
import { DifficultySelector } from '@/components/home/DifficultySelector';
import { RecentDrive } from '@/components/home/RecentDrive';
import { useDriveDetection } from '@/hooks/useDriveDetection';
import { useDriveHistory } from '@/hooks/useDriveHistory';
import { Spacing } from '@/theme/spacing';

/**
 * Home screen — the garage
 *
 * Layout (top → bottom):
 *   Title group (subtitle)
 *   ↕ flexible space
 *   Drive group (start button + difficulty pills)
 *   ↕ some space
 *   Last Delivery card
 *   ↕ small space
 *   Tab bar (rendered by layout)
 */
export default function HomeScreen() {
  const router = useRouter();
  const { startManual, isDriving } = useDriveDetection();
  const { drives, loading } = useDriveHistory(1);

  const recentDrive = drives.length > 0 ? drives[0] : null;

  const handleStartDrive = () => {
    startManual();
    router.push('/drive/active');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Title group */}
      <View style={styles.titleGroup}>
        <ThemedText variant="secondary" style={styles.subtitle}>
          Smooth driving through sound
        </ThemedText>
      </View>

      {/* Flexible spacer pushes drive group toward center */}
      <View style={styles.spacer} />

      {/* Drive group: button + difficulty */}
      <View style={styles.driveGroup}>
        <StartButton onPress={handleStartDrive} disabled={isDriving} />
        <View style={styles.difficultyWrapper}>
          <DifficultySelector />
        </View>
      </View>

      {/* Last Delivery */}
      <View style={styles.recentContainer}>
        <RecentDrive drive={recentDrive} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  titleGroup: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  spacer: {
    flex: 1,
  },
  driveGroup: {
    alignItems: 'center',
  },
  difficultyWrapper: {
    marginTop: Spacing.sm,
  },
  recentContainer: {
    width: '100%',
    marginTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
});
