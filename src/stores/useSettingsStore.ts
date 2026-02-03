import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Settings store for user preferences
 *
 * Note: Difficulty is stored in useSensorStore, not here (to avoid duplication)
 */

interface SettingsState {
  /** Keep screen awake during active drives (default: true) */
  keepScreenAwake: boolean;
  /** Audio volume for feedback sounds (0-1, default: 1.0) - for future Phase 5 */
  audioVolume: number;
  /** Whether store has finished loading from AsyncStorage */
  _hasHydrated: boolean;
}

interface SettingsActions {
  /** Set keep screen awake preference */
  setKeepScreenAwake: (enabled: boolean) => void;
  /** Set audio volume (0-1) */
  setAudioVolume: (volume: number) => void;
}

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
  keepScreenAwake: true,
  audioVolume: 1.0,
  _hasHydrated: false,
};

/**
 * User settings store
 *
 * Usage:
 * ```typescript
 * // In component
 * const keepScreenAwake = useSettingsStore(s => s.keepScreenAwake);
 * const setKeepScreenAwake = useSettingsStore(s => s.setKeepScreenAwake);
 *
 * // Toggle keep awake
 * setKeepScreenAwake(!keepScreenAwake);
 * ```
 *
 * Settings persist to AsyncStorage via zustand persist middleware.
 */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,

      setKeepScreenAwake: (enabled: boolean) => {
        set({ keepScreenAwake: enabled });
      },

      setAudioVolume: (volume: number) => {
        // Clamp volume to 0-1 range
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ audioVolume: clampedVolume });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        keepScreenAwake: state.keepScreenAwake,
        audioVolume: state.audioVolume,
        // Don't persist _hasHydrated
      }),
      onRehydrateStorage: () => () => {
        // Called after rehydration completes - set hydration flag via setState
        useSettingsStore.setState({ _hasHydrated: true });
      },
    }
  )
);
