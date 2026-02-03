import { PreloadedSoundName } from './types';

/**
 * Callback for cooldown state changes
 */
type CooldownChangeCallback = (inCooldown: boolean) => void;

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
  private requiresRecovery = false; // Must see low risk before next spill
  private cooldownMs = 2500;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private onChangeCallback: CooldownChangeCallback | null = null;
  private onCooldownEndCallback: (() => void) | null = null;

  /**
   * Set callback for cooldown state changes
   */
  onChange(callback: CooldownChangeCallback): void {
    this.onChangeCallback = callback;
  }

  /**
   * Set callback for when cooldown ends (to reset zone tracking)
   */
  onCooldownEnd(callback: () => void): void {
    this.onCooldownEndCallback = callback;
  }

  /**
   * Check if spill can be triggered
   * Requires: not in cooldown AND recovered (saw low risk)
   */
  canTriggerSpill(): boolean {
    return !this.inCooldown && !this.requiresRecovery;
  }

  /**
   * Get current cooldown state
   */
  isInCooldown(): boolean {
    return this.inCooldown;
  }

  /**
   * Signal that risk has dropped low - recovery complete
   */
  signalRecovery(): void {
    this.requiresRecovery = false;
  }

  /**
   * Check if in recovery period (waiting for low risk)
   */
  isRecovering(): boolean {
    return this.requiresRecovery;
  }

  /**
   * Start cooldown period
   */
  startCooldown(): void {
    this.inCooldown = true;
    this.requiresRecovery = true;
    this.onChangeCallback?.(true);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.inCooldown = false;
      this.timeoutId = null;
      this.onChangeCallback?.(false);
      this.onCooldownEndCallback?.();
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
    const wasInCooldown = this.inCooldown;
    this.inCooldown = false;
    this.requiresRecovery = false;
    if (wasInCooldown) {
      this.onChangeCallback?.(false);
    }
  }
}

/**
 * Risk thresholds for sound selection
 */
const RISK_THRESHOLDS = {
  light: 0.3, // risk >= 0.3: slosh-light
  medium: 0.5, // risk >= 0.5: slosh-medium
  heavy: 0.7, // risk >= 0.7: slosh-heavy
  spill: 0.9, // risk >= 0.9: allow spill (smoothed risk must be high too)
} as const;

/**
 * Risk zones for threshold-crossing detection
 */
export type RiskZone = 'silent' | 'light' | 'medium' | 'heavy' | 'spill';

/**
 * Get the current risk zone based on risk value
 */
function getRiskZone(risk: number, isSpill: boolean): RiskZone {
  if (isSpill && risk >= RISK_THRESHOLDS.spill) return 'spill';
  if (risk >= RISK_THRESHOLDS.heavy) return 'heavy';
  if (risk >= RISK_THRESHOLDS.medium) return 'medium';
  if (risk >= RISK_THRESHOLDS.light) return 'light';
  return 'silent';
}

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
  private lastPlayedSound: PreloadedSoundName | null = null;
  private lastTriggerTime: number = 0;
  private currentZone: RiskZone = 'silent';

  /** Minimum time between sounds (prevents rapid-fire) */
  private readonly minSoundIntervalMs = 300;

  constructor() {
    // Reset zone tracking when cooldown ends so sounds can trigger again
    this.spillCooldown.onCooldownEnd(() => {
      this.currentZone = 'silent';
    });
  }

  /**
   * Set callback for cooldown state changes
   * Used for reactive UI updates
   */
  onCooldownChange(callback: (inCooldown: boolean) => void): void {
    this.spillCooldown.onChange(callback);
  }

  /**
   * Evaluate risk and determine which sound to play
   *
   * Uses threshold-crossing detection: sounds only play when
   * ENTERING a new risk zone, not continuously while in a zone.
   *
   * @param risk - Smoothed risk value (0-1)
   * @param isSpill - True if spill threshold exceeded
   * @returns Sound name to play, or null for silence
   */
  evaluate(risk: number, isSpill: boolean): PreloadedSoundName | null {
    const now = Date.now();
    const timeSinceLastSound = now - this.lastTriggerTime;

    // Check if risk dropped low enough to signal recovery
    if (risk < RISK_THRESHOLDS.light && this.spillCooldown.isRecovering()) {
      this.spillCooldown.signalRecovery();
    }

    // Determine current zone based on risk
    const newZone = getRiskZone(risk, isSpill);
    const previousZone = this.currentZone;

    // Silent zone always updates (no sound needed)
    if (newZone === 'silent') {
      this.currentZone = newZone;
      return null;
    }

    // Same zone = no transition
    if (newZone === previousZone) {
      return null;
    }

    // Minimum interval between any sounds
    if (timeSinceLastSound < this.minSoundIntervalMs) {
      return null;
    }

    // Handle spill zone
    if (newZone === 'spill') {
      if (this.spillCooldown.canTriggerSpill()) {
        this.currentZone = newZone;
        this.spillCooldown.startCooldown();
        this.lastPlayedSound = 'spill';
        this.lastTriggerTime = now;
        return 'spill';
      }
      // Spill blocked - treat as heavy zone instead
      if (previousZone === 'heavy') {
        return null;
      }
      this.currentZone = 'heavy';
      this.lastPlayedSound = 'slosh-heavy';
      this.lastTriggerTime = now;
      return 'slosh-heavy';
    }

    // Map zone to sound
    const zoneToSound: Record<RiskZone, PreloadedSoundName | null> = {
      silent: null,
      light: 'slosh-light',
      medium: 'slosh-medium',
      heavy: 'slosh-heavy',
      spill: 'spill',
    };

    const selectedSound = zoneToSound[newZone];
    if (selectedSound) {
      this.currentZone = newZone;
      this.lastPlayedSound = selectedSound;
      this.lastTriggerTime = now;
    }

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
  getLastPlayedSound(): PreloadedSoundName | null {
    return this.lastPlayedSound;
  }

  /**
   * Get current risk zone (for UI display)
   */
  getCurrentZone(): RiskZone {
    return this.currentZone;
  }

  /**
   * Reset trigger state (for new session)
   */
  reset(): void {
    this.spillCooldown.reset();
    this.lastPlayedSound = null;
    this.lastTriggerTime = 0;
    this.currentZone = 'silent';
  }
}
