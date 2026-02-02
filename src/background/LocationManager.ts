/**
 * LocationManager
 *
 * Wrapper around expo-location for starting/stopping background location updates.
 * Handles the foreground service configuration for Android.
 */

import * as Location from 'expo-location';
import {
  LOCATION_TASK_NAME,
  LOCATION_UPDATE_INTERVAL_MS,
  FOREGROUND_SERVICE_CONFIG,
} from '../drive/constants';

export const LocationManager = {
  /**
   * Check if location updates are currently running
   */
  async isRunning(): Promise<boolean> {
    return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  },

  /**
   * Start background location updates
   *
   * Prerequisites:
   * - Background location permission granted
   * - setLocationCallback() called with handler
   *
   * @throws Error if permission not granted
   */
  async start(): Promise<void> {
    const isRunning = await this.isRunning();
    if (isRunning) {
      console.log('[LocationManager] Already running, skipping start');
      return;
    }

    console.log('[LocationManager] Starting location updates...');

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: LOCATION_UPDATE_INTERVAL_MS,
      distanceInterval: 0, // Update regardless of distance
      foregroundService: {
        ...FOREGROUND_SERVICE_CONFIG,
      },
      // Deferred updates for battery efficiency when driving steadily
      deferredUpdatesInterval: 5000,
      deferredUpdatesDistance: 10,
      // Continue updates even when app is in background
      pausesUpdatesAutomatically: false,
      // Android: Show notification even when system kills app
      showsBackgroundLocationIndicator: true,
    });

    console.log('[LocationManager] Location updates started');
  },

  /**
   * Stop background location updates
   */
  async stop(): Promise<void> {
    const isRunning = await this.isRunning();
    if (!isRunning) {
      console.log('[LocationManager] Not running, skipping stop');
      return;
    }

    console.log('[LocationManager] Stopping location updates...');
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('[LocationManager] Location updates stopped');
  },

  /**
   * Get current location (one-shot, for initial position)
   */
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch (error) {
      console.error('[LocationManager] Failed to get current location:', error);
      return null;
    }
  },
};
