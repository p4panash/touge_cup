import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/shared/ThemedView';
import { WaterCup } from '@/components/drive/WaterCup';
import { SpillCounter } from '@/components/drive/SpillCounter';
import { StreakTimer } from '@/components/drive/StreakTimer';
import { StopButton } from '@/components/drive/StopButton';
import { useDriveDetection } from '@/hooks/useDriveDetection';
import { useDriveStore } from '@/stores/useDriveStore';
import { useSensorStore } from '@/stores/useSensorStore';
import { DriveRecorder } from '@/services/DriveRecorder';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useConfigurableKeepAwake } from '@/hooks/useConfigurableKeepAwake';
import { Spacing } from '@/theme/spacing';
import { DebugLogger, LogTags } from '@/services/DebugLogger';

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
  const insets = useSafeAreaInsets();
  const { stopManual, isDriving } = useDriveDetection();
  const driveStartTime = useDriveStore((s) => s.driveStartTime);
  const isSpill = useSensorStore((s) => s.isSpill);
  const risk = useSensorStore((s) => s.risk);

  // Track spill count and streak timer
  const [spillCount, setSpillCount] = useState(0);
  const [lastSpillTime, setLastSpillTime] = useState<number | null>(null);
  const [fillLevel, setFillLevel] = useState(1);

  // Keep screen awake during drive based on user preference
  // Wait for hydration to avoid race condition with AsyncStorage load
  const hasHydrated = useSettingsStore((s) => s._hasHydrated);
  const keepAwakeEnabled = useSettingsStore((s) => s.keepScreenAwake);
  const effectiveKeepAwake = hasHydrated && keepAwakeEnabled;

  // Log the values for debugging
  useEffect(() => {
    DebugLogger.info(
      LogTags.KEEP_AWAKE,
      `ActiveDrive: hasHydrated=${hasHydrated}, keepAwakeEnabled=${keepAwakeEnabled}, effective=${effectiveKeepAwake}`
    );
  }, [hasHydrated, keepAwakeEnabled, effectiveKeepAwake]);

  // Only activate keep-awake after settings load; default to OFF until then
  useConfigurableKeepAwake(effectiveKeepAwake);

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

  // Handle stop button press - navigate to summary screen
  const handleStop = useCallback(() => {
    // Capture drive ID before stopping (stopManual ends the drive and clears it)
    const driveId = DriveRecorder.getCurrentDriveId();

    stopManual();

    // Navigate to summary if we have a drive ID, otherwise home
    if (driveId) {
      router.replace(`/drive/summary/${driveId}`);
    } else {
      router.replace('/');
    }
  }, [stopManual, router]);

  // Determine streak timer start (drive start if no spills, last spill time if spills)
  const streakStartTime = lastSpillTime ?? driveStartTime;
  const hasSpills = spillCount > 0;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
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
    // paddingTop is now dynamic based on safe area insets (see inline style)
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
