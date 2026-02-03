import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FilteredSensorData, PotholeEvent } from '../sensors/types';

/**
 * Difficulty level for spill risk thresholds
 */
export type DifficultyLevel = 'easy' | 'experienced' | 'master';

/**
 * Zustand store for high-frequency sensor state
 *
 * This store receives updates at 50Hz from DeviceMotionManager.
 * Keep state minimal to avoid performance issues with frequent updates.
 *
 * Subscribers should use selectors to minimize re-renders:
 * - useSensorStore(state => state.latestData)
 * - useSensorStore(state => state.isActive)
 */

interface SensorState {
  /** Most recent filtered sensor data (updated at 50Hz) */
  latestData: FilteredSensorData | null;
  /** Whether sensor subscription is active */
  isActive: boolean;
  /** Smoothed spill risk (0-1) */
  risk: number;
  /** True when spill threshold exceeded */
  isSpill: boolean;
  /** Current jerk magnitude for debugging/display */
  jerkMagnitude: number;
  /** True during startup calibration period */
  isSettling: boolean;
  /** Current difficulty level */
  difficulty: DifficultyLevel;
  /** Most recent pothole event for UI display (transient, not persisted) */
  lastPothole: PotholeEvent | null;
}

interface SensorActions {
  /** Update latest sensor data (called by DeviceMotionManager) */
  setLatestData: (data: FilteredSensorData) => void;
  /** Set sensor active state */
  setActive: (active: boolean) => void;
  /** Update risk values from pipeline */
  updateRisk: (risk: number, isSpill: boolean, jerkMagnitude: number) => void;
  /** Set settling state */
  setSettling: (isSettling: boolean) => void;
  /** Set difficulty level */
  setDifficulty: (difficulty: DifficultyLevel) => void;
  /** Set most recent pothole event */
  setPothole: (pothole: PotholeEvent | null) => void;
  /** Reset store to initial state */
  reset: () => void;
  /** Reset only sensor state (preserves difficulty for persistence) */
  resetSensorState: () => void;
}

type SensorStore = SensorState & SensorActions;

const initialState: SensorState = {
  latestData: null,
  isActive: false,
  risk: 0,
  isSpill: false,
  jerkMagnitude: 0,
  isSettling: false,
  difficulty: 'easy',
  lastPothole: null,
};

/**
 * Settling period duration in milliseconds
 * Prevents false positives when phone is being mounted
 *
 * @see 01-CONTEXT.md: "Brief settling period at startup (1-2 seconds)"
 */
export const SETTLING_PERIOD_MS = 1500;

/**
 * Sensor store for real-time motion data
 *
 * Usage:
 * ```typescript
 * // In component
 * const latestData = useSensorStore(state => state.latestData);
 * const risk = useSensorStore(state => state.risk);
 * const isSettling = useSensorStore(state => state.isSettling);
 *
 * // From DeviceMotionManager callback
 * useSensorStore.getState().setLatestData(filteredData);
 *
 * // From SensorPipeline
 * useSensorStore.getState().updateRisk(risk, isSpill, jerkMagnitude);
 * ```
 */
export const useSensorStore = create<SensorStore>()(
  persist(
    (set) => ({
      ...initialState,

      setLatestData: (data: FilteredSensorData) => {
        set({ latestData: data });
      },

      setActive: (active: boolean) => {
        set({ isActive: active });
      },

      updateRisk: (risk: number, isSpill: boolean, jerkMagnitude: number) => {
        set({ risk, isSpill, jerkMagnitude });
      },

      setSettling: (isSettling: boolean) => {
        set({ isSettling });
      },

      setDifficulty: (difficulty: DifficultyLevel) => {
        set({ difficulty });
      },

      setPothole: (pothole: PotholeEvent | null) => {
        set({ lastPothole: pothole });
      },

      reset: () => {
        set(initialState);
      },

      resetSensorState: () => {
        // Reset only sensor-related state, preserve difficulty for persistence
        set({
          latestData: null,
          isActive: false,
          risk: 0,
          isSpill: false,
          jerkMagnitude: 0,
          isSettling: false,
          lastPothole: null,
        });
      },
    }),
    {
      name: 'sensor-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist difficulty, not high-frequency sensor data
      partialize: (state) => ({ difficulty: state.difficulty }),
    }
  )
);
