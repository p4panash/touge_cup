/**
 * PermissionManager
 *
 * Handles the permission request flow for location services.
 * Must request foreground permission first, then background.
 */

import * as Location from 'expo-location';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Battery from 'expo-battery';
import { Platform, Linking } from 'react-native';
import { LocationPermissionStatus } from '../drive/types';

export const PermissionManager = {
  /**
   * Get current permission status
   */
  async getStatus(): Promise<LocationPermissionStatus> {
    const foreground = await Location.getForegroundPermissionsAsync();

    if (foreground.status !== 'granted') {
      if (foreground.status === 'denied') {
        return 'denied';
      }
      return 'undetermined';
    }

    const background = await Location.getBackgroundPermissionsAsync();

    if (background.status === 'granted') {
      return 'background_granted';
    }

    return 'foreground_only';
  },

  /**
   * Request location permissions (foreground first, then background)
   *
   * @returns Final permission status after requests
   */
  async requestPermissions(): Promise<LocationPermissionStatus> {
    // Step 1: Request foreground permission
    const foreground = await Location.requestForegroundPermissionsAsync();

    if (foreground.status !== 'granted') {
      console.log('[PermissionManager] Foreground permission denied');
      return foreground.status === 'denied' ? 'denied' : 'undetermined';
    }

    console.log('[PermissionManager] Foreground permission granted');

    // Step 2: Request background permission
    // On Android 11+, this opens system settings directly
    const background = await Location.requestBackgroundPermissionsAsync();

    if (background.status === 'granted') {
      console.log('[PermissionManager] Background permission granted');
      return 'background_granted';
    }

    console.log('[PermissionManager] Background permission not granted:', background.status);
    return 'foreground_only';
  },

  /**
   * Check if battery optimization is enabled (Android only)
   * Returns false on iOS
   */
  async isBatteryOptimized(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      return await Battery.isBatteryOptimizationEnabledAsync();
    } catch {
      // Not supported on this device
      return false;
    }
  },

  /**
   * Open battery optimization settings (Android only)
   * Users need to disable battery optimization for reliable background operation
   */
  async openBatterySettings(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
    } catch (error) {
      console.error('[PermissionManager] Failed to open battery settings:', error);
    }
  },

  /**
   * Open app settings (for when permission is permanently denied)
   */
  async openAppSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // On iOS, use Linking to open app settings
        await Linking.openSettings();
      } else {
        // On Android, use IntentLauncher
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: 'package:com.papanash.watercupcoach' }
        );
      }
    } catch (error) {
      console.error('[PermissionManager] Failed to open app settings:', error);
    }
  },
};
