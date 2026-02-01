import { AudioContext, AudioBuffer } from 'react-native-audio-api';
import { Asset } from 'expo-asset';
import { SoundName, SOUND_NAMES } from './types';

/**
 * Sound asset definitions
 *
 * Maps sound names to their asset modules.
 * Using require() for Metro bundler compatibility.
 */
const SOUND_ASSETS: Record<SoundName, number> = {
  'slosh-light': require('../../assets/audio/slosh-light.m4a'),
  'slosh-medium': require('../../assets/audio/slosh-medium.m4a'),
  'slosh-heavy': require('../../assets/audio/slosh-heavy.m4a'),
  spill: require('../../assets/audio/spill.m4a'),
};

/**
 * Pre-loaded audio buffer pool
 *
 * Loads all audio files into memory at app start for instant playback.
 * This eliminates disk I/O latency (50-200ms) from the feedback path.
 *
 * @see 01-RESEARCH.md "Pattern 2: Pre-loaded Audio Buffer Pool"
 */
export class SoundBank {
  private buffers: Map<SoundName, AudioBuffer> = new Map();
  private audioContext: AudioContext | null = null;

  /**
   * Preload all sound effects into AudioBuffer objects
   *
   * Must be called after AudioContext is created.
   * Downloads assets if needed, then decodes to AudioBuffer.
   *
   * @param audioContext - Active AudioContext for decoding
   * @throws Error if any sound fails to load
   */
  async preload(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;

    const loadPromises = SOUND_NAMES.map(async (name) => {
      try {
        // Get asset module and download if needed
        const assetModule = SOUND_ASSETS[name];
        const asset = await Asset.fromModule(assetModule).downloadAsync();

        if (!asset.localUri) {
          throw new Error(`Failed to download asset: ${name}`);
        }

        // Decode audio file to AudioBuffer
        const buffer = await audioContext.decodeAudioData(asset.localUri);
        this.buffers.set(name, buffer);
      } catch (error) {
        console.error(`Failed to load sound: ${name}`, error);
        throw error;
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Get pre-loaded AudioBuffer by name
   *
   * @param name - Sound name
   * @returns AudioBuffer or undefined if not loaded
   */
  get(name: SoundName): AudioBuffer | undefined {
    return this.buffers.get(name);
  }

  /**
   * Check if all sounds are loaded
   */
  isLoaded(): boolean {
    return this.buffers.size === SOUND_NAMES.length;
  }

  /**
   * Get count of loaded sounds
   */
  getLoadedCount(): number {
    return this.buffers.size;
  }
}
