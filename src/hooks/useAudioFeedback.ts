import { useEffect, useRef, useState } from 'react';
import { useSensorStore } from '../stores/useSensorStore';
import { useAudioStore } from '../stores/useAudioStore';
import { useDriveStore, isDriving } from '../stores/useDriveStore';
import { audioEngine } from '../audio/AudioEngine';
import { FeedbackTrigger, RiskZone } from '../audio/FeedbackTrigger';
import { DriveRecorder } from '../services/DriveRecorder';

/**
 * React hook that triggers audio based on risk values
 *
 * Subscribes to sensor store risk changes and triggers
 * appropriate sounds through AudioEngine.
 *
 * Respects:
 * - isSettling: No feedback during calibration period
 * - isInterrupted: No feedback during phone calls
 * - Threshold crossings: Only trigger on meaningful changes
 *
 * Uses FeedbackTrigger for:
 * - Risk-to-sound mapping
 * - Spill cooldown management
 * - Rapid-repeat prevention
 */
export function useAudioFeedback() {
  const triggerRef = useRef<FeedbackTrigger>(new FeedbackTrigger());
  const [isSpillOnCooldown, setIsSpillOnCooldown] = useState(false);
  const [currentZone, setCurrentZone] = useState<RiskZone>('silent');
  const [lastPlayedSound, setLastPlayedSound] = useState<string | null>(null);

  // Sensor store selectors
  const risk = useSensorStore((state) => state.risk);
  const isSpill = useSensorStore((state) => state.isSpill);
  const isSettling = useSensorStore((state) => state.isSettling);
  const isActive = useSensorStore((state) => state.isActive);

  // Drive store selectors - audio only plays during active drive
  const driveState = useDriveStore((state) => state.driveState);
  const isCurrentlyDriving = isDriving(driveState);

  // Audio store selectors
  const isAudioInterrupted = useAudioStore((state) => state.isInterrupted);

  // Trigger audio on risk changes
  useEffect(() => {
    // Don't trigger if:
    // - Sensors not active
    // - In settling period
    // - Audio interrupted (phone call)
    // - Not in an active drive
    if (!isActive || isSettling || isAudioInterrupted || !isCurrentlyDriving) {
      return;
    }

    // Evaluate risk and get sound to play
    const sound = triggerRef.current.evaluate(risk, isSpill);

    // Update current zone for UI
    setCurrentZone(triggerRef.current.getCurrentZone());

    // Play if sound was selected
    if (sound) {
      audioEngine.play(sound);
      setLastPlayedSound(sound);

      // Log spill event to database
      if (sound === 'spill') {
        const lastLocation = useDriveStore.getState().lastLocation;
        DriveRecorder.logSpill({
          timestamp: Date.now(),
          location: lastLocation,
          severity: risk,
        }).catch(err => console.error('[AudioFeedback] Failed to log spill:', err));
      }
    }
  }, [risk, isSpill, isActive, isSettling, isAudioInterrupted, isCurrentlyDriving]);

  // Reset trigger when pipeline restarts
  useEffect(() => {
    if (!isActive) {
      triggerRef.current.reset();
      setCurrentZone('silent');
      setLastPlayedSound(null);
    }
  }, [isActive]);

  // Set up cooldown state callback for reactive updates
  useEffect(() => {
    triggerRef.current.onCooldownChange((inCooldown) => {
      setIsSpillOnCooldown(inCooldown);
    });
  }, []);

  return {
    /** Current last played sound (reactive) */
    lastPlayedSound,
    /** Whether spill is on cooldown (reactive) */
    isSpillOnCooldown,
    /** Current risk zone (for UI display) */
    currentZone,
    /** Whether in recovery period (needs low risk before next spill) */
    isRecovering: triggerRef.current.isSpillOnCooldown() && !isSpillOnCooldown,
  };
}
