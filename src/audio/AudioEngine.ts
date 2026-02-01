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
    // This allows our sounds to play alongside music,
    // briefly reducing music volume instead of cutting it off
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
   * Fire-and-forget pattern for minimum latency.
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

    // Create buffer source, connect to output, play immediately
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(this.audioContext.currentTime);

    // Fire-and-forget: source auto-disconnects when done
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
