import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Settings store for user preferences
 *
 * Note: Difficulty is stored in useSensorStore, not here (to avoid duplication)
 *
 * TODO: Keep Screen Awake toggle removed - background location/audio services
 * keep screen awake regardless. Revisit when we add "auto-detect drives" toggle.
 */

interface SettingsState {
  /** Audio volume for feedback sounds (0-1, default: 1.0) - for Phase 5 */
  audioVolume: number;
}

interface SettingsActions {
  /** Set audio volume (0-1) */
  setAudioVolume: (volume: number) => void;
}

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
  audioVolume: 1.0,
};

/**
 * User settings store
 *
 * Usage:
 * ```typescript
 * const audioVolume = useSettingsStore(s => s.audioVolume);
 * const setAudioVolume = useSettingsStore(s => s.setAudioVolume);
 * ```
 *
 * Settings persist to AsyncStorage via zustand persist middleware.
 */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,

      setAudioVolume: (volume: number) => {
        // Clamp volume to 0-1 range
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ audioVolume: clampedVolume });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
