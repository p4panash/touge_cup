import { useEffect, useRef, useState } from 'react';
import { useSensorStore } from '../stores/useSensorStore';
import { useAudioStore } from '../stores/useAudioStore';
import { audioEngine } from '../audio/AudioEngine';
import { FeedbackTrigger, RiskZone } from '../audio/FeedbackTrigger';

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

  // Sensor store selectors
  const risk = useSensorStore((state) => state.risk);
  const isSpill = useSensorStore((state) => state.isSpill);
  const isSettling = useSensorStore((state) => state.isSettling);
  const isActive = useSensorStore((state) => state.isActive);

  // Audio store selectors
  const isAudioInterrupted = useAudioStore((state) => state.isInterrupted);

  // Trigger audio on risk changes
  useEffect(() => {
    // Don't trigger if:
    // - Sensors not active
    // - In settling period
    // - Audio interrupted (phone call)
    if (!isActive || isSettling || isAudioInterrupted) {
      return;
    }

    // Evaluate risk and get sound to play
    const sound = triggerRef.current.evaluate(risk, isSpill);

    // Update current zone for UI
    setCurrentZone(triggerRef.current.getCurrentZone());

    // Play if sound was selected
    if (sound) {
      audioEngine.play(sound);
    }
  }, [risk, isSpill, isActive, isSettling, isAudioInterrupted]);

  // Reset trigger when pipeline restarts
  useEffect(() => {
    if (!isActive) {
      triggerRef.current.reset();
      setCurrentZone('silent');
    }
  }, [isActive]);

  // Set up cooldown state callback for reactive updates
  useEffect(() => {
    triggerRef.current.onCooldownChange((inCooldown) => {
      setIsSpillOnCooldown(inCooldown);
    });
  }, []);

  return {
    /** Current last played sound (for debugging) */
    lastPlayedSound: triggerRef.current.getLastPlayedSound(),
    /** Whether spill is on cooldown (reactive) */
    isSpillOnCooldown,
    /** Current risk zone (for UI display) */
    currentZone,
  };
}
