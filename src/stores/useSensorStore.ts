import { create } from 'zustand';
import { FilteredSensorData } from '../sensors/types';

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
}

interface SensorActions {
  /** Update latest sensor data (called by DeviceMotionManager) */
  setLatestData: (data: FilteredSensorData) => void;
  /** Set sensor active state */
  setActive: (active: boolean) => void;
  /** Reset store to initial state */
  reset: () => void;
}

type SensorStore = SensorState & SensorActions;

const initialState: SensorState = {
  latestData: null,
  isActive: false,
};

/**
 * Sensor store for real-time motion data
 *
 * Usage:
 * ```typescript
 * // In component
 * const latestData = useSensorStore(state => state.latestData);
 * const isActive = useSensorStore(state => state.isActive);
 *
 * // From DeviceMotionManager callback
 * useSensorStore.getState().setLatestData(filteredData);
 * ```
 */
export const useSensorStore = create<SensorStore>((set) => ({
  ...initialState,

  setLatestData: (data: FilteredSensorData) => {
    set({ latestData: data });
  },

  setActive: (active: boolean) => {
    set({ isActive: active });
  },

  reset: () => {
    set(initialState);
  },
}));
