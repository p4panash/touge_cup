import { useEffect, useRef, useState } from 'react';
import { useSensorStore } from '../stores/useSensorStore';
import { useAudioStore } from '../stores/useAudioStore';
import { useDriveStore, isDriving } from '../stores/useDriveStore';
import { audioEngine } from '../audio/AudioEngine';
import { FeedbackTrigger, RiskZone } from '../audio/FeedbackTrigger';
import { AmbientAudioController } from '../audio/AmbientAudioController';
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
 * - Difficulty-aware pothole handling
 *
 * Master mode adds:
 * - Ambient audio that intensifies with risk
 * - Dramatic spill sound with ambient silence
 * - Potholes count as spills (no forgiveness)
 */
export function useAudioFeedback() {
  const triggerRef = useRef<FeedbackTrigger>(new FeedbackTrigger());
  const ambientControllerRef = useRef<AmbientAudioController | null>(null);
  const [isSpillOnCooldown, setIsSpillOnCooldown] = useState(false);
  const [currentZone, setCurrentZone] = useState<RiskZone>('silent');
  const [lastPlayedSound, setLastPlayedSound] = useState<string | null>(null);

  // Sensor store selectors
  const risk = useSensorStore((state) => state.risk);
  const isSpill = useSensorStore((state) => state.isSpill);
  const isSettling = useSensorStore((state) => state.isSettling);
  const isActive = useSensorStore((state) => state.isActive);
  const difficulty = useSensorStore((state) => state.difficulty);
  const lastPothole = useSensorStore((state) => state.lastPothole);

  // Drive store selectors - audio only plays during active drive
  const driveState = useDriveStore((state) => state.driveState);
  const isCurrentlyDriving = isDriving(driveState);

  // Audio store selectors
  const isAudioInterrupted = useAudioStore((state) => state.isInterrupted);

  // Sync difficulty to trigger
  useEffect(() => {
    triggerRef.current.setDifficulty(difficulty);
  }, [difficulty]);

  // Manage ambient audio based on difficulty and drive state
  useEffect(() => {
    if (difficulty === 'master' && isCurrentlyDriving) {
      // Initialize and start ambient for Master mode
      if (!ambientControllerRef.current) {
        ambientControllerRef.current = new AmbientAudioController();
        ambientControllerRef.current.initialize().then(() => {
          ambientControllerRef.current?.start();
        }).catch(err => {
          console.error('[AudioFeedback] Failed to initialize ambient:', err);
        });
      }
    } else {
      // Cleanup ambient for non-Master modes or when not driving
      if (ambientControllerRef.current) {
        ambientControllerRef.current.cleanup();
        ambientControllerRef.current = null;
      }
    }

    return () => {
      // Cleanup on unmount
      ambientControllerRef.current?.cleanup();
    };
  }, [difficulty, isCurrentlyDriving]);

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

    // Update ambient volume in Master mode
    if (ambientControllerRef.current) {
      ambientControllerRef.current.setRiskLevel(risk);
    }

    // Evaluate risk and get sound to play
    const sound = triggerRef.current.evaluate(risk, isSpill);

    // Update current zone for UI
    setCurrentZone(triggerRef.current.getCurrentZone());

    // Play if sound was selected
    if (sound) {
      audioEngine.play(sound);
      setLastPlayedSound(sound);

      // Handle spill in Master mode - trigger ambient silence
      if ((sound === 'spill' || sound === 'spill-dramatic') && ambientControllerRef.current) {
        ambientControllerRef.current.onSpill();
      }

      // Log spill event to database
      if (sound === 'spill' || sound === 'spill-dramatic') {
        const lastLocation = useDriveStore.getState().lastLocation;
        DriveRecorder.logSpill({
          timestamp: Date.now(),
          location: lastLocation,
          severity: risk,
        }).catch(err => console.error('[AudioFeedback] Failed to log spill:', err));
      }
    }
  }, [risk, isSpill, isActive, isSettling, isAudioInterrupted, isCurrentlyDriving]);

  // Handle pothole events
  useEffect(() => {
    if (!lastPothole || !isCurrentlyDriving || isSettling || isAudioInterrupted) {
      return;
    }

    const result = triggerRef.current.evaluatePothole(lastPothole);

    // Play pothole sound if any (Easy/Experienced modes)
    if (result.sound) {
      audioEngine.play(result.sound);
      setLastPlayedSound(result.sound);
    }

    // Log pothole to database
    const lastLocation = useDriveStore.getState().lastLocation;
    DriveRecorder.logPothole({
      timestamp: lastPothole.timestamp,
      location: lastLocation,
      severity: lastPothole.zPeak / 10, // Normalize to 0-1 range
      forgiven: result.forgiven,
    }).catch(err => console.error('[AudioFeedback] Failed to log pothole:', err));

    // If Master mode and pothole counts as spill, trigger spill sound
    if (result.countAsSpill) {
      const spillSound = triggerRef.current.evaluate(1.0, true);
      if (spillSound) {
        audioEngine.play(spillSound);
        setLastPlayedSound(spillSound);
        // Also trigger ambient silence
        ambientControllerRef.current?.onSpill();

        // Log the spill (pothole-caused)
        DriveRecorder.logSpill({
          timestamp: Date.now(),
          location: lastLocation,
          severity: 1.0, // Pothole-triggered spill is max severity
        }).catch(err => console.error('[AudioFeedback] Failed to log pothole-spill:', err));
      }
    }

    // Clear the pothole event after processing
    useSensorStore.getState().setPothole(null);
  }, [lastPothole, isCurrentlyDriving, isSettling, isAudioInterrupted]);

  // Reset trigger when pipeline restarts
  useEffect(() => {
    if (!isActive) {
      triggerRef.current.reset();
      setCurrentZone('silent');
      setLastPlayedSound(null);
      // Also stop ambient when drive ends
      ambientControllerRef.current?.stop();
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
