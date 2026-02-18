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
 * Clean, minimal layout with engine start/stop aesthetic.
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
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <ThemedText variant="secondary" style={styles.subtitle}>
          Smooth driving through sound
        </ThemedText>
        <StartButton onPress={handleStartDrive} disabled={isDriving} />
        <View style={styles.difficultyWrapper}>
          <DifficultySelector />
        </View>
      </View>

      {/* Recent Drive */}
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
    paddingTop: Spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyWrapper: {
    marginTop: Spacing.sm,
  },
  recentContainer: {
    width: '100%',
    marginTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
});
