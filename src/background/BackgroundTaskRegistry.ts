/**
 * Background Task Registry
 *
 * CRITICAL: This file MUST be imported at the top of the app entry point (index.ts).
 * TaskManager.defineTask must run at module scope, before any React code,
 * because when the app starts in background mode, this is the only code that runs.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/task-manager/
 */

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '../drive/constants';
import { LocationData } from '../drive/types';

/** Callback type for location updates */
type LocationUpdateCallback = (locations: LocationData[]) => void;

/** Registered callback for location updates */
let locationCallback: LocationUpdateCallback | null = null;

/**
 * Register a callback to receive location updates.
 * Call this from your state manager/hook before starting location updates.
 */
export function setLocationCallback(callback: LocationUpdateCallback | null): void {
  locationCallback = callback;
}

/**
 * Convert expo-location LocationObject to our LocationData type
 */
function toLocationData(location: Location.LocationObject): LocationData {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    speed: location.coords.speed,
    timestamp: location.timestamp,
    accuracy: location.coords.accuracy,
  };
}

// Define the background task at module scope
// This runs even when the app starts headless (in background)
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundTask] Location error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };

    if (locations && locations.length > 0) {
      const locationData = locations.map(toLocationData);

      // Forward to registered callback
      if (locationCallback) {
        locationCallback(locationData);
      } else {
        // Log for debugging when no callback registered
        console.log('[BackgroundTask] Location received but no callback registered:', {
          count: locations.length,
          latest: locationData[locationData.length - 1],
        });
      }
    }
  }
});

// Export task name for reference
export { LOCATION_TASK_NAME };

console.log('[BackgroundTaskRegistry] Location task registered:', LOCATION_TASK_NAME);
