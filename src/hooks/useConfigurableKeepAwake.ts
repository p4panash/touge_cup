import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

/**
 * Configurable keep-awake hook
 *
 * Prevents screen from sleeping when enabled.
 * Uses tag parameter to allow multiple independent keep-awake sources.
 * Automatically cleans up on unmount.
 *
 * Usage:
 * ```typescript
 * // Keep screen awake during active drive
 * useConfigurableKeepAwake(true);
 *
 * // Later: connect to settings store
 * const keepAwake = useSettingsStore(s => s.keepScreenAwake);
 * useConfigurableKeepAwake(keepAwake);
 * ```
 */
export function useConfigurableKeepAwake(enabled: boolean, tag = 'ActiveDrive') {
  useEffect(() => {
    if (enabled) {
      activateKeepAwakeAsync(tag).catch((error) => {
        console.warn('[KeepAwake] Failed to activate:', error);
      });
    } else {
      deactivateKeepAwake(tag);
    }

    return () => {
      deactivateKeepAwake(tag);
    };
  }, [enabled, tag]);
}
