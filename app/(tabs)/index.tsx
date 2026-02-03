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
 * Home screen - primary entry point for users
 *
 * Displays:
 * - App title
 * - Hero start button (dominant primary action)
 * - Difficulty selector (Easy | Experienced | Master)
 * - Most recent completed drive card
 */
export default function HomeScreen() {
  const router = useRouter();
  const { startManual, isDriving } = useDriveDetection();
  const { drives, loading } = useDriveHistory(1);

  const recentDrive = drives.length > 0 ? drives[0] : null;

  const handleStartDrive = () => {
    // Start the drive state machine
    startManual();
    // Navigate to active drive screen
    router.push('/drive/active');
  };

  return (
    <ThemedView style={styles.container}>
      {/* App Title */}
      <View style={styles.header}>
        <ThemedText variant="title" style={styles.title}>
          Water Cup Coach
        </ThemedText>
        <ThemedText variant="secondary" style={styles.subtitle}>
          Train smooth driving with audio feedback
        </ThemedText>
      </View>

      {/* Hero Start Button */}
      <View style={styles.buttonContainer}>
        <StartButton onPress={handleStartDrive} disabled={isDriving} />
      </View>

      {/* Difficulty Selector */}
      <DifficultySelector />

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
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentContainer: {
    width: '100%',
    paddingBottom: Spacing.lg,
  },
});
