import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { StartButton } from '@/components/home/StartButton';
import { DifficultySelector } from '@/components/home/DifficultySelector';
import { RecentDrive } from '@/components/home/RecentDrive';
import { useDriveDetection } from '@/hooks/useDriveDetection';
import { useDriveHistory } from '@/hooks/useDriveHistory';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/theme/spacing';

/**
 * Home screen — the garage
 *
 * Clean, minimal layout with tofu delivery aesthetic.
 * Japanese text accents for Initial D flavor.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { startManual, isDriving } = useDriveDetection();
  const { drives, loading } = useDriveHistory(1);

  const recentDrive = drives.length > 0 ? drives[0] : null;

  const handleStartDrive = () => {
    startManual();
    router.push('/drive/active');
  };

  return (
    <ThemedView style={styles.container}>
      {/* App Title */}
      <View style={styles.header}>
        <Text style={[styles.titleJP, { color: colors.textSecondary }]}>
          豆腐コーチ
        </Text>
        <ThemedText variant="title" style={styles.title}>
          Tofu Coach
        </ThemedText>
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
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  titleJP: {
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyWrapper: {
    marginTop: Spacing.lg,
  },
  recentContainer: {
    width: '100%',
    paddingBottom: Spacing.lg,
  },
});
