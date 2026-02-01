import { SoundName } from './types';

/**
 * Spill cooldown manager
 *
 * Prevents rapid-fire spill sounds after one bad moment.
 * Uses 2500ms cooldown (middle of 2-3s range per CONTEXT.md).
 *
 * @see 01-RESEARCH.md "Pattern 4: Cooldown State Machine"
 */
class SpillCooldown {
  private inCooldown = false;
  private cooldownMs = 2500;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Check if spill can be triggered
   */
  canTriggerSpill(): boolean {
    return !this.inCooldown;
  }

  /**
   * Start cooldown period
   */
  startCooldown(): void {
    this.inCooldown = true;

    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.inCooldown = false;
      this.timeoutId = null;
    }, this.cooldownMs);
  }

  /**
   * Reset cooldown state
   */
  reset(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.inCooldown = false;
  }
}

/**
 * Risk thresholds for sound selection
 */
const RISK_THRESHOLDS = {
  light: 0.3, // risk >= 0.3: slosh-light
  medium: 0.5, // risk >= 0.5: slosh-medium
  heavy: 0.7, // risk >= 0.7: slosh-heavy
} as const;

/**
 * Feedback trigger that maps risk values to sounds
 *
 * Maps continuous risk (0-1) to discrete sounds:
 * - risk < 0.3: null (silence = smooth driving)
 * - risk 0.3-0.5: slosh-light
 * - risk 0.5-0.7: slosh-medium
 * - risk >= 0.7: slosh-heavy
 * - isSpill: spill (overrides risk-based selection)
 *
 * Includes 2.5s spill cooldown and rapid-repeat prevention.
 *
 * @see 01-RESEARCH.md "Pattern 3: Graduated Audio Intensity"
 */
export class FeedbackTrigger {
  private spillCooldown = new SpillCooldown();
  private lastPlayedSound: SoundName | null = null;
  private lastTriggerTime: number = 0;

  /** Minimum time between same sound (prevents rapid repeats) */
  private readonly minRepeatIntervalMs = 200;

  /**
   * Evaluate risk and determine which sound to play
   *
   * @param risk - Smoothed risk value (0-1)
   * @param isSpill - True if spill threshold exceeded
   * @returns Sound name to play, or null for silence
   */
  evaluate(risk: number, isSpill: boolean): SoundName | null {
    const now = Date.now();

    // Handle spill (overrides risk-based selection)
    if (isSpill) {
      if (this.spillCooldown.canTriggerSpill()) {
        this.spillCooldown.startCooldown();
        this.lastPlayedSound = 'spill';
        this.lastTriggerTime = now;
        return 'spill';
      }
      // In cooldown, fall through to risk-based selection
    }

    // Determine sound based on risk thresholds
    let selectedSound: SoundName | null = null;

    if (risk >= RISK_THRESHOLDS.heavy) {
      selectedSound = 'slosh-heavy';
    } else if (risk >= RISK_THRESHOLDS.medium) {
      selectedSound = 'slosh-medium';
    } else if (risk >= RISK_THRESHOLDS.light) {
      selectedSound = 'slosh-light';
    }

    // Silence below threshold (smooth driving)
    if (selectedSound === null) {
      this.lastPlayedSound = null;
      return null;
    }

    // Prevent rapid repeats of same sound
    if (
      selectedSound === this.lastPlayedSound &&
      now - this.lastTriggerTime < this.minRepeatIntervalMs
    ) {
      return null;
    }

    this.lastPlayedSound = selectedSound;
    this.lastTriggerTime = now;
    return selectedSound;
  }

  /**
   * Get current spill cooldown status
   */
  isSpillOnCooldown(): boolean {
    return !this.spillCooldown.canTriggerSpill();
  }

  /**
   * Get last played sound (for debugging)
   */
  getLastPlayedSound(): SoundName | null {
    return this.lastPlayedSound;
  }

  /**
   * Reset trigger state (for new session)
   */
  reset(): void {
    this.spillCooldown.reset();
    this.lastPlayedSound = null;
    this.lastTriggerTime = 0;
  }
}
