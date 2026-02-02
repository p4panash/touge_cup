/**
 * DriveStateManager
 *
 * Pure state machine for drive detection.
 * Processes location updates and returns new state.
 *
 * State transitions:
 * - idle -> detecting: speed >= 15 km/h
 * - detecting -> idle: speed drops below threshold
 * - detecting -> driving: speed sustained for 5s
 * - driving -> stopping: speed < 3.6 km/h
 * - stopping -> driving: speed resumes
 * - stopping -> idle: stationary for 120s
 * - manual_driving: only manual stop works
 *
 * @see 02-CONTEXT.md for locked thresholds
 */

import { DriveState, LocationData } from './types';
import {
  SPEED_THRESHOLD_MS,
  START_DURATION_MS,
  STOP_DURATION_MS,
  STATIONARY_THRESHOLD_MS,
} from './constants';

/**
 * Result of processing a location update
 */
export interface StateTransitionResult {
  /** New state after processing */
  newState: DriveState;
  /** Did we just start a drive? */
  driveStarted: boolean;
  /** Did we just end a drive? */
  driveEnded: boolean;
}

/**
 * Process a location update and return new state
 *
 * This is a pure function - no side effects.
 * The caller is responsible for updating stores and triggering audio.
 *
 * @param currentState Current drive state
 * @param location GPS location data
 * @returns New state and transition flags
 */
export function processLocation(
  currentState: DriveState,
  location: LocationData
): StateTransitionResult {
  // Handle null speed (GPS not locked) - treat as 0
  const speed = location.speed ?? 0;
  const now = location.timestamp;

  let newState: DriveState = currentState;
  let driveStarted = false;
  let driveEnded = false;

  switch (currentState.type) {
    case 'idle':
      // Check if speed exceeds threshold to start detecting
      if (speed >= SPEED_THRESHOLD_MS) {
        newState = { type: 'detecting', speedAboveThresholdSince: now };
      }
      break;

    case 'detecting':
      if (speed < SPEED_THRESHOLD_MS) {
        // Speed dropped - back to idle
        newState = { type: 'idle' };
      } else if (now - currentState.speedAboveThresholdSince >= START_DURATION_MS) {
        // Sustained speed for 5 seconds - start driving
        newState = { type: 'driving', startTime: currentState.speedAboveThresholdSince };
        driveStarted = true;
      }
      // else: still detecting, no state change
      break;

    case 'driving':
      if (speed < STATIONARY_THRESHOLD_MS) {
        // Nearly stationary - start stop countdown
        newState = {
          type: 'stopping',
          stationarySince: now,
          driveStartTime: currentState.startTime,
        };
      }
      // else: still driving, no state change
      break;

    case 'stopping':
      if (speed >= STATIONARY_THRESHOLD_MS) {
        // Moving again - resume driving
        newState = { type: 'driving', startTime: currentState.driveStartTime };
      } else if (now - currentState.stationarySince >= STOP_DURATION_MS) {
        // Stationary for 120 seconds - end drive
        newState = { type: 'idle' };
        driveEnded = true;
      }
      // else: still stopping, no state change
      break;

    case 'manual_driving':
      // Manual mode ignores auto-stop logic
      // Only manual stop can end this state
      break;
  }

  return { newState, driveStarted, driveEnded };
}

/**
 * DriveStateManager singleton for managing state transitions
 */
export const DriveStateManager = {
  /**
   * Start a manual drive (user pressed start)
   * Only works from idle state
   */
  startManualDrive(currentState: DriveState): DriveState {
    if (currentState.type === 'idle') {
      return { type: 'manual_driving', startTime: Date.now() };
    }
    // If already driving, convert to manual
    if (currentState.type === 'driving') {
      return { type: 'manual_driving', startTime: currentState.startTime };
    }
    if (currentState.type === 'detecting') {
      return { type: 'manual_driving', startTime: Date.now() };
    }
    if (currentState.type === 'stopping') {
      return { type: 'manual_driving', startTime: currentState.driveStartTime };
    }
    // Already manual, no change
    return currentState;
  },

  /**
   * Stop a drive manually (user pressed stop)
   * Works from any driving state
   */
  stopManualDrive(currentState: DriveState): DriveState {
    if (
      currentState.type === 'driving' ||
      currentState.type === 'manual_driving' ||
      currentState.type === 'stopping'
    ) {
      return { type: 'idle' };
    }
    // Not driving, no change
    return currentState;
  },
};
