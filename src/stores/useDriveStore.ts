/**
 * Drive Store
 *
 * Zustand store for drive detection state.
 * Manages the drive state machine and GPS-related state.
 *
 * Note: This store is updated less frequently than useSensorStore (once per second vs 50Hz).
 */

import { create } from 'zustand';
import { DriveState, LocationData, LocationPermissionStatus } from '../drive/types';

interface DriveStoreState {
  /** Current drive state machine state */
  driveState: DriveState;

  /** Latest GPS location */
  lastLocation: LocationData | null;

  /** Current speed in m/s (from GPS) */
  currentSpeed: number;

  /** Is GPS signal available */
  hasGpsSignal: boolean;

  /** Location permission status */
  permissionStatus: LocationPermissionStatus;

  /** Is location service currently running */
  isLocationRunning: boolean;

  /** Drive start timestamp (null if not driving) */
  driveStartTime: number | null;
}

interface DriveStoreActions {
  /** Update drive state from state machine */
  setDriveState: (state: DriveState) => void;

  /** Update location data */
  updateLocation: (location: LocationData) => void;

  /** Set GPS signal status */
  setGpsSignal: (hasSignal: boolean) => void;

  /** Set permission status */
  setPermissionStatus: (status: LocationPermissionStatus) => void;

  /** Set location running status */
  setLocationRunning: (running: boolean) => void;

  /** Set drive start time */
  setDriveStartTime: (time: number | null) => void;

  /** Reset to initial state */
  reset: () => void;
}

type DriveStore = DriveStoreState & DriveStoreActions;

const initialState: DriveStoreState = {
  driveState: { type: 'idle' },
  lastLocation: null,
  currentSpeed: 0,
  hasGpsSignal: false,
  permissionStatus: 'undetermined',
  isLocationRunning: false,
  driveStartTime: null,
};

/**
 * Drive store for GPS and drive detection state
 *
 * Usage:
 * ```typescript
 * const driveState = useDriveStore(state => state.driveState);
 * const currentSpeed = useDriveStore(state => state.currentSpeed);
 * const isDriving = driveState.type === 'driving' || driveState.type === 'manual_driving';
 * ```
 */
export const useDriveStore = create<DriveStore>((set) => ({
  ...initialState,

  setDriveState: (driveState: DriveState) => {
    set({ driveState });
  },

  updateLocation: (location: LocationData) => {
    set({
      lastLocation: location,
      currentSpeed: location.speed ?? 0,
      hasGpsSignal: true,
    });
  },

  setGpsSignal: (hasGpsSignal: boolean) => {
    set({ hasGpsSignal });
  },

  setPermissionStatus: (permissionStatus: LocationPermissionStatus) => {
    set({ permissionStatus });
  },

  setLocationRunning: (isLocationRunning: boolean) => {
    set({ isLocationRunning });
  },

  setDriveStartTime: (driveStartTime: number | null) => {
    set({ driveStartTime });
  },

  reset: () => {
    set(initialState);
  },
}));

/**
 * Helper to check if currently in an active drive
 */
export function isDriving(state: DriveState): boolean {
  return state.type === 'driving' || state.type === 'manual_driving' || state.type === 'stopping';
}
