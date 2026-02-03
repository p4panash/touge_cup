import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ThemedView } from '@/components/shared/ThemedView';
import { WaterCup } from '@/components/drive/WaterCup';
import { SpillCounter } from '@/components/drive/SpillCounter';
import { StreakTimer } from '@/components/drive/StreakTimer';
import { StopButton } from '@/components/drive/StopButton';
import { useDriveDetection } from '@/hooks/useDriveDetection';
import { useDriveStore } from '@/stores/useDriveStore';
import { useSensorStore } from '@/stores/useSensorStore';
import { useConfigurableKeepAwake } from '@/hooks/useConfigurableKeepAwake';
import { Spacing } from '@/theme/spacing';

/**
 * Active drive screen
 *
 * Displays real-time driving feedback:
 * - Water cup with accelerometer-driven animation
 * - Spill counter showing current spill count
 * - Streak timer showing time since last spill
 * - Stop button to end drive manually
 *
 * Screen stays awake during active drive per CONTEXT.md decision.
 */
export default function ActiveDriveScreen() {
  const router = useRouter();
  const { stopManual, isDriving } = useDriveDetection();
  const driveStartTime = useDriveStore((s) => s.driveStartTime);
  const isSpill = useSensorStore((s) => s.isSpill);
  const risk = useSensorStore((s) => s.risk);

  // Track spill count and streak timer
  const [spillCount, setSpillCount] = useState(0);
  const [lastSpillTime, setLastSpillTime] = useState<number | null>(null);
  const [fillLevel, setFillLevel] = useState(1);

  // Keep screen awake during drive (will be connected to settings later)
  useConfigurableKeepAwake(true);

  // Track spills
  useEffect(() => {
    if (isSpill) {
      setSpillCount((prev) => prev + 1);
      setLastSpillTime(Date.now());
      // Reduce fill level on spill (min 0.1)
      setFillLevel((prev) => Math.max(0.1, prev - 0.1));
    }
  }, [isSpill]);

  // Reset state when drive starts
  useEffect(() => {
    if (isDriving && driveStartTime) {
      // Reset on new drive
      setSpillCount(0);
      setLastSpillTime(null);
      setFillLevel(1);
    }
  }, [isDriving, driveStartTime]);

  // Handle stop button press
  const handleStop = useCallback(() => {
    stopManual();
    router.replace('/');
  }, [stopManual, router]);

  // Determine streak timer start (drive start if no spills, last spill time if spills)
  const streakStartTime = lastSpillTime ?? driveStartTime;
  const hasSpills = spillCount > 0;

  return (
    <ThemedView style={styles.container}>
      {/* Top stats row */}
      <View style={styles.statsRow}>
        <SpillCounter count={spillCount} />
        <StreakTimer startTime={streakStartTime} hasSpills={hasSpills} />
      </View>

      {/* Center: Water cup (dominant visual) */}
      <View style={styles.cupContainer}>
        <WaterCup fillLevel={fillLevel} />
      </View>

      {/* Bottom: Stop button */}
      <View style={styles.stopContainer}>
        <StopButton onPress={handleStop} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  cupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopContainer: {
    paddingHorizontal: Spacing.md,
  },
});
