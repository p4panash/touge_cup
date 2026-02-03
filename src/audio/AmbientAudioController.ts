import { Audio } from 'expo-av';

/**
 * AmbientAudioController - Reactive ambient soundscape for Master mode
 *
 * Creates immersive "walking on eggshells" tension through:
 * - Continuous looping ambient sound
 * - Real-time volume control based on risk level
 * - Smooth volume interpolation (no clicking)
 * - Instant silence on spill with gradual rebuild
 *
 * Usage:
 * ```
 * const ambient = new AmbientAudioController();
 * await ambient.initialize();
 * await ambient.start();
 *
 * // During drive - update based on risk
 * ambient.setRiskLevel(0.5); // Interpolates to appropriate volume
 *
 * // On spill
 * await ambient.onSpill(); // Instant silence, then gradual rebuild
 *
 * // End of drive
 * await ambient.cleanup();
 * ```
 */

// Volume interpolation runs at ~30fps for smooth fades
const INTERPOLATION_INTERVAL_MS = 33;

// Volume change per frame (~1 second to full transition at 30fps)
const VOLUME_RAMP_SPEED = 0.03;

// Calm baseline - audible but unobtrusive
const MIN_VOLUME = 0.15;

// Tense maximum - leaves headroom for spill sound
const MAX_VOLUME = 0.7;

// Silence duration after spill before rebuilding (matches spill cooldown)
const REBUILD_DELAY_MS = 2500;

export class AmbientAudioController {
  private ambientSound: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private targetVolume: number = MIN_VOLUME;
  private currentVolume: number = 0;
  private interpolationInterval: ReturnType<typeof setInterval> | null = null;
  private rebuildTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized: boolean = false;

  /**
   * Load the ambient sound asset
   * Must be called before start()
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/ambient-tension.m4a'),
        {
          shouldPlay: false,
          isLooping: true,
          volume: 0,
        }
      );
      this.ambientSound = sound;
      this.isInitialized = true;
    } catch (error) {
      console.error('[AmbientAudioController] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Start ambient playback
   * Begins at minimum volume with interpolation active
   */
  async start(): Promise<void> {
    if (!this.isInitialized || this.isPlaying) {
      return;
    }

    if (!this.ambientSound) {
      return;
    }

    try {
      // Set initial volume and start playback
      this.currentVolume = MIN_VOLUME;
      this.targetVolume = MIN_VOLUME;
      await this.ambientSound.setVolumeAsync(MIN_VOLUME);
      await this.ambientSound.playAsync();

      // Start volume interpolation loop
      this.interpolationInterval = setInterval(() => {
        this.interpolateVolume();
      }, INTERPOLATION_INTERVAL_MS);

      this.isPlaying = true;
    } catch (error) {
      console.error('[AmbientAudioController] Failed to start:', error);
    }
  }

  /**
   * Set risk level to control ambient volume
   *
   * @param risk - Risk value (0-1)
   *   - risk 0: MIN_VOLUME (calm baseline)
   *   - risk >= 0.9: MAX_VOLUME (maximum tension)
   *   - Linear interpolation between
   *
   * Volume change is smoothed via interpolation interval
   */
  setRiskLevel(risk: number): void {
    // Map risk to volume range
    // risk 0 -> MIN_VOLUME
    // risk 0.9+ -> MAX_VOLUME
    const normalizedRisk = Math.min(risk / 0.9, 1);
    this.targetVolume = MIN_VOLUME + normalizedRisk * (MAX_VOLUME - MIN_VOLUME);
  }

  /**
   * Handle spill event
   * Instantly silences ambient and schedules gradual rebuild
   */
  async onSpill(): Promise<void> {
    if (!this.isPlaying || !this.ambientSound) {
      return;
    }

    // Clear any pending rebuild
    if (this.rebuildTimeout) {
      clearTimeout(this.rebuildTimeout);
      this.rebuildTimeout = null;
    }

    try {
      // Instant silence
      await this.ambientSound.setVolumeAsync(0);
      this.currentVolume = 0;
      this.targetVolume = 0;

      // Schedule gradual rebuild after cooldown
      this.rebuildTimeout = setTimeout(() => {
        this.rebuildFromSilence();
      }, REBUILD_DELAY_MS);
    } catch (error) {
      console.error('[AmbientAudioController] Failed to silence on spill:', error);
    }
  }

  /**
   * Begin gradual volume rebuild after spill cooldown
   * Interpolation will smoothly restore to MIN_VOLUME
   */
  private rebuildFromSilence(): void {
    this.rebuildTimeout = null;
    this.targetVolume = MIN_VOLUME;
    // interpolateVolume() will gradually increase currentVolume
  }

  /**
   * Smoothly interpolate current volume toward target
   * Called at ~30fps by interpolation interval
   */
  private async interpolateVolume(): Promise<void> {
    if (!this.ambientSound) {
      return;
    }

    const diff = this.targetVolume - this.currentVolume;

    // Skip if close enough (prevents micro-adjustments)
    if (Math.abs(diff) < 0.01) {
      return;
    }

    // Step toward target at ramp speed
    const step = Math.sign(diff) * Math.min(Math.abs(diff), VOLUME_RAMP_SPEED);
    this.currentVolume += step;

    try {
      await this.ambientSound.setVolumeAsync(this.currentVolume);
    } catch {
      // Sound might be unloaded, ignore errors
    }
  }

  /**
   * Stop ambient playback
   * Clears interpolation and rebuild timers
   */
  async stop(): Promise<void> {
    // Clear interpolation interval
    if (this.interpolationInterval) {
      clearInterval(this.interpolationInterval);
      this.interpolationInterval = null;
    }

    // Clear rebuild timeout
    if (this.rebuildTimeout) {
      clearTimeout(this.rebuildTimeout);
      this.rebuildTimeout = null;
    }

    // Stop sound playback
    if (this.ambientSound) {
      try {
        await this.ambientSound.stopAsync();
      } catch {
        // Ignore
      }
    }

    this.isPlaying = false;
  }

  /**
   * Clean up resources
   * Stops playback and unloads sound asset
   */
  async cleanup(): Promise<void> {
    await this.stop();

    if (this.ambientSound) {
      try {
        await this.ambientSound.unloadAsync();
      } catch {
        // Ignore
      }
      this.ambientSound = null;
    }

    this.isInitialized = false;
  }

  /**
   * Check if ambient is currently playing
   */
  get isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if controller has been initialized
   */
  get ready(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current volume level (for debugging/UI)
   */
  get volume(): number {
    return this.currentVolume;
  }
}
