import { create } from 'zustand';

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
 * Note: Settings persist in memory only. Could add AsyncStorage persistence
 * via zustand persist middleware in future.
 */
export const useSettingsStore = create<SettingsStore>((set) => ({
  ...initialState,

  setKeepScreenAwake: (enabled: boolean) => {
    set({ keepScreenAwake: enabled });
  },

  setAudioVolume: (volume: number) => {
    // Clamp volume to 0-1 range
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ audioVolume: clampedVolume });
  },
}));
