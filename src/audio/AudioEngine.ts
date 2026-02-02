import { AudioContext, AudioManager } from 'react-native-audio-api';
import { SoundBank } from './SoundBank';
import { SoundName } from './types';

/**
 * Audio engine for low-latency feedback playback
 *
 * Manages AudioContext lifecycle, pre-loads all sounds,
 * and provides instant playback with iOS audio ducking.
 *
 * Key features:
 * - Pre-loaded AudioBuffers for <10ms playback latency
 * - iOS audio session configured for ducking (mixWithOthers + duckOthers)
 * - Audio interruption handling (phone calls, nav prompts)
 * - Background suspend/resume support
 *
 * @see 01-RESEARCH.md "Audio Engine with Ducking Configuration"
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audioContext: AudioContext | null = null;
  private soundBank: SoundBank;
  private _isInitialized: boolean = false;
  private _isInterrupted: boolean = false;
  private activeSourceCount: number = 0;
  private deactivateTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.soundBank = new SoundBank();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initialize audio engine
   *
   * 1. Configures iOS audio session with ducking
   * 2. Enables interruption observation
   * 3. Creates AudioContext
   * 4. Pre-loads all sound effects
   *
   * Must be called before any playback.
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    // Configure iOS audio session for ducking
    // 'playback' category with 'duckOthers' reduces other audio volume during our sounds
    // We'll deactivate the session after sounds finish to restore other audio
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: ['mixWithOthers', 'duckOthers'],
    });

    // Enable interruption observation (phone calls, nav prompts)
    // react-native-audio-api handles the callbacks internally
    AudioManager.observeAudioInterruptions(true);

    // Create AudioContext
    this.audioContext = new AudioContext();

    // Pre-load all sound effects
    await this.soundBank.preload(this.audioContext);

    this._isInitialized = true;
  }

  /**
   * Play a sound immediately
   *
   * Uses pre-loaded buffer for instant playback.
   * Activates audio session (ducking other audio) and deactivates
   * after all sounds finish to restore other audio volume.
   *
   * @param soundName - Name of sound to play
   */
  play(soundName: SoundName): void {
    if (!this.audioContext) {
      console.warn('AudioEngine not initialized');
      return;
    }

    if (this._isInterrupted) {
      // Don't play during phone calls, etc.
      return;
    }

    const buffer = this.soundBank.get(soundName);
    if (!buffer) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    // Cancel any pending deactivation since we're playing a new sound
    if (this.deactivateTimeoutId) {
      clearTimeout(this.deactivateTimeoutId);
      this.deactivateTimeoutId = null;
    }

    // Activate audio session (triggers ducking)
    if (this.activeSourceCount === 0) {
      AudioManager.setAudioSessionActivity(true);
    }
    this.activeSourceCount++;

    // Create buffer source, connect to output, play immediately
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(this.audioContext.currentTime);

    // Use setTimeout with buffer duration instead of onEnded (more reliable)
    const durationMs = buffer.duration * 1000;
    setTimeout(() => {
      this.activeSourceCount--;
      if (this.activeSourceCount === 0) {
        // Delay deactivation slightly to avoid rapid on/off
        this.deactivateTimeoutId = setTimeout(() => {
          AudioManager.setAudioSessionActivity(false);
          this.deactivateTimeoutId = null;
        }, 100);
      }
    }, durationMs);
  }

  /**
   * Suspend audio context (for background)
   */
  async suspend(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
    }
  }

  /**
   * Resume audio context (from background)
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Set interrupted state
   *
   * Called when audio session is interrupted (phone call, etc.)
   * Prevents playback during interruption.
   */
  setInterrupted(interrupted: boolean): void {
    this._isInterrupted = interrupted;
  }

  /**
   * Check if audio is currently interrupted
   */
  get isInterrupted(): boolean {
    return this._isInterrupted;
  }

  /**
   * Check if audio engine is initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Get audio context state
   */
  getContextState(): AudioContextState | undefined {
    return this.audioContext?.state;
  }
}

// Export singleton instance for convenience
export const audioEngine = AudioEngine.getInstance();
