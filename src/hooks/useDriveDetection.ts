/**
 * useDriveDetection Hook
 *
 * Connects GPS location updates to the drive state machine.
 * Manages location service lifecycle and permission requests.
 */

import { useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { useDriveStore, isDriving } from '../stores/useDriveStore';
import { setLocationCallback } from '../background/BackgroundTaskRegistry';
import { LocationManager } from '../background/LocationManager';
import { PermissionManager } from '../background/PermissionManager';
import { processLocation, DriveStateManager } from '../drive/DriveStateManager';
import { LocationData } from '../drive/types';

/**
 * Hook for drive detection
 *
 * Responsibilities:
 * 1. Request permissions and start location updates
 * 2. Process location updates through state machine
 * 3. Update drive store with new state
 * 4. Handle manual start/stop
 *
 * Usage:
 * ```typescript
 * const { startManual, stopManual, requestPermissions } = useDriveDetection();
 * ```
 */
export function useDriveDetection() {
  const driveState = useDriveStore((s) => s.driveState);
  const setDriveState = useDriveStore((s) => s.setDriveState);
  const updateLocation = useDriveStore((s) => s.updateLocation);
  const setPermissionStatus = useDriveStore((s) => s.setPermissionStatus);
  const setLocationRunning = useDriveStore((s) => s.setLocationRunning);
  const setDriveStartTime = useDriveStore((s) => s.setDriveStartTime);

  // Track if we've configured audio for background
  const audioConfiguredRef = useRef(false);

  // Configure audio for background playback
  useEffect(() => {
    async function configureBackgroundAudio() {
      if (audioConfiguredRef.current) return;

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true, // KEY: Enable background audio
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        audioConfiguredRef.current = true;
        console.log('[useDriveDetection] Background audio configured');
      } catch (error) {
        console.error('[useDriveDetection] Failed to configure audio:', error);
      }
    }

    configureBackgroundAudio();
  }, []);

  // Handle location updates from background task
  const handleLocationUpdate = useCallback(
    (locations: LocationData[]) => {
      if (!locations || locations.length === 0) return;

      // Process ALL locations in batch to avoid missing state transitions
      for (const location of locations) {
        // Update store with location data
        updateLocation(location);

        // Get current state and process through state machine
        const currentState = useDriveStore.getState().driveState;
        const { newState, driveStarted, driveEnded } = processLocation(currentState, location);

        // Debug logging - shows speed in km/h and current state
        const speedKmh = ((location.speed ?? 0) * 3.6).toFixed(1);
        console.log(`[GPS] ${speedKmh} km/h | state: ${currentState.type} -> ${newState.type}`);

        // Update state if changed
        if (newState !== currentState) {
          setDriveState(newState);

          if (driveStarted) {
            const startTime = 'startTime' in newState ? newState.startTime : Date.now();
            setDriveStartTime(startTime);
            console.log('[useDriveDetection] Drive auto-started at speed:', speedKmh, 'km/h');
          }

          if (driveEnded) {
            setDriveStartTime(null);
            console.log('[useDriveDetection] Drive auto-stopped after 120s stationary');
          }
        }
      }
    },
    [updateLocation, setDriveState, setDriveStartTime]
  );

  // Register location callback on mount
  useEffect(() => {
    setLocationCallback(handleLocationUpdate);

    return () => {
      setLocationCallback(null);
    };
  }, [handleLocationUpdate]);

  // Request permissions and start location
  const requestPermissions = useCallback(async () => {
    const status = await PermissionManager.requestPermissions();
    setPermissionStatus(status);

    if (status === 'background_granted') {
      // Start location updates
      await LocationManager.start();
      setLocationRunning(true);
    }

    return status;
  }, [setPermissionStatus, setLocationRunning]);

  // Check initial permission status
  useEffect(() => {
    async function checkPermissions() {
      const status = await PermissionManager.getStatus();
      setPermissionStatus(status);

      // If already have background permission, start location
      if (status === 'background_granted') {
        const isRunning = await LocationManager.isRunning();
        if (!isRunning) {
          await LocationManager.start();
        }
        setLocationRunning(true);
      }
    }

    checkPermissions();
  }, [setPermissionStatus, setLocationRunning]);

  // Manual start
  const startManual = useCallback(() => {
    const currentState = useDriveStore.getState().driveState;
    const newState = DriveStateManager.startManualDrive(currentState);
    setDriveState(newState);

    if ('startTime' in newState) {
      setDriveStartTime(newState.startTime);
    }
    console.log('[useDriveDetection] Manual drive started');
  }, [setDriveState, setDriveStartTime]);

  // Manual stop
  const stopManual = useCallback(() => {
    const currentState = useDriveStore.getState().driveState;
    const wasDriving = isDriving(currentState);
    const newState = DriveStateManager.stopManualDrive(currentState);
    setDriveState(newState);

    if (wasDriving) {
      setDriveStartTime(null);
      console.log('[useDriveDetection] Manual drive stopped');
    }
  }, [setDriveState, setDriveStartTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't stop location on unmount - we want it to continue in background
      // Only stop explicitly via stopManual
    };
  }, []);

  return {
    driveState,
    requestPermissions,
    startManual,
    stopManual,
    isDriving: isDriving(driveState),
  };
}
