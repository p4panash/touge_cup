import { create } from 'zustand';
import { AudioState } from '../audio/types';

/**
 * Actions for audio store
 */
interface AudioActions {
  /** Mark audio engine as initialized */
  setInitialized: (initialized: boolean) => void;
  /** Set audio interruption state (phone call, nav prompt) */
  setInterrupted: (interrupted: boolean) => void;
  /** Set volume level (0-1) */
  setVolume: (volume: number) => void;
  /** Reset to initial state */
  reset: () => void;
}

type AudioStore = AudioState & AudioActions;

const initialState: AudioState = {
  isInitialized: false,
  isInterrupted: false,
  volume: 1.0,
};

/**
 * Zustand store for audio state
 *
 * Tracks audio engine state and provides actions for
 * initialization, interruption handling, and volume control.
 *
 * Usage:
 * ```typescript
 * // In component
 * const isInitialized = useAudioStore(state => state.isInitialized);
 * const isInterrupted = useAudioStore(state => state.isInterrupted);
 *
 * // From AudioEngine
 * useAudioStore.getState().setInitialized(true);
 * useAudioStore.getState().setInterrupted(true);
 * ```
 */
export const useAudioStore = create<AudioStore>((set) => ({
  ...initialState,

  setInitialized: (initialized: boolean) => {
    set({ isInitialized: initialized });
  },

  setInterrupted: (interrupted: boolean) => {
    set({ isInterrupted: interrupted });
  },

  setVolume: (volume: number) => {
    // Clamp volume to valid range
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ volume: clampedVolume });
  },

  reset: () => {
    set(initialState);
  },
}));
