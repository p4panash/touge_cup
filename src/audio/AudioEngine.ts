import { Audio, AVPlaybackSource, InterruptionModeIOS } from 'expo-av';
import { SoundName, SOUND_NAMES } from './types';

/** Delay before undocking after last sound finishes (ms) */
const UNDUCK_DELAY_MS = 500;

/**
 * Sound asset definitions for expo-av
 */
const SOUND_ASSETS: Record<SoundName, AVPlaybackSource> = {
  'slosh-light': require('../../assets/audio/slosh-light.m4a'),
  'slosh-medium': require('../../assets/audio/slosh-medium.m4a'),
  'slosh-heavy': require('../../assets/audio/slosh-heavy.m4a'),
  spill: require('../../assets/audio/spill.m4a'),
};

/**
 * Audio engine using expo-av
 *
 * expo-av is more battle-tested for simple sound effect playback.
 * Uses pre-loaded Sound objects for low latency.
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private sounds: Map<SoundName, Audio.Sound> = new Map();
  private _isInitialized: boolean = false;
  private _isInterrupted: boolean = false;
  private unduckTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isDucking: boolean = false;

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    // Configure audio mode - start with MixWithOthers, switch to DuckOthers when playing
    // staysActiveInBackground: true enables audio playback with screen off
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    // Pre-load all sounds
    for (const name of SOUND_NAMES) {
      const { sound } = await Audio.Sound.createAsync(
        SOUND_ASSETS[name],
        { shouldPlay: false, volume: 1.0 }
      );
      this.sounds.set(name, sound);
    }

    this._isInitialized = true;
  }

  async play(soundName: SoundName): Promise<void> {
    if (!this._isInitialized || this._isInterrupted) {
      return;
    }

    const sound = this.sounds.get(soundName);
    if (!sound) {
      return;
    }

    // Cancel any pending unduck
    if (this.unduckTimeoutId) {
      clearTimeout(this.unduckTimeoutId);
      this.unduckTimeoutId = null;
    }

    // Start ducking if not already
    if (!this.isDucking) {
      await this.startDucking();
    }

    // Rewind to start and play
    await sound.setPositionAsync(0);
    await sound.playAsync();

    // Schedule unduck after sound finishes
    this.scheduleUnduck();
  }

  private async startDucking(): Promise<void> {
    if (this.isDucking) return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    this.isDucking = true;
  }

  private async stopDucking(): Promise<void> {
    if (!this.isDucking) return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
    this.isDucking = false;
  }

  private scheduleUnduck(): void {
    // Cancel any existing timeout
    if (this.unduckTimeoutId) {
      clearTimeout(this.unduckTimeoutId);
    }

    // Schedule unduck after delay
    this.unduckTimeoutId = setTimeout(async () => {
      await this.stopDucking();
      this.unduckTimeoutId = null;
    }, UNDUCK_DELAY_MS);
  }

  async suspend(): Promise<void> {
    // Pause all sounds
    for (const sound of this.sounds.values()) {
      try {
        await sound.pauseAsync();
      } catch {
        // Ignore
      }
    }
  }

  async resume(): Promise<void> {
    // Nothing special needed for expo-av
  }

  setInterrupted(interrupted: boolean): void {
    this._isInterrupted = interrupted;
  }

  get isInterrupted(): boolean {
    return this._isInterrupted;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  getContextState(): string | undefined {
    return this._isInitialized ? 'running' : 'suspended';
  }

  /**
   * Cleanup - unload all sounds
   */
  async cleanup(): Promise<void> {
    for (const sound of this.sounds.values()) {
      try {
        await sound.unloadAsync();
      } catch {
        // Ignore
      }
    }
    this.sounds.clear();
    this._isInitialized = false;
  }
}

export const audioEngine = AudioEngine.getInstance();
