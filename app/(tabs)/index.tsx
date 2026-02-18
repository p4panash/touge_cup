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
      {/* Tagline */}
      <View style={styles.header}>
        <ThemedText variant="secondary" style={styles.subtitle}>
          Smooth driving through sound
        </ThemedText>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
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
