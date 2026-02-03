import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { DebugLogger, LogTags } from '@/services/DebugLogger';

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
    DebugLogger.info(LogTags.KEEP_AWAKE, `Hook called: enabled=${enabled}, tag=${tag}`);

    if (enabled) {
      DebugLogger.info(LogTags.KEEP_AWAKE, `Activating keep-awake (tag=${tag})`);
      activateKeepAwakeAsync(tag)
        .then(() => {
          DebugLogger.info(LogTags.KEEP_AWAKE, `Activated successfully (tag=${tag})`);
        })
        .catch((error) => {
          DebugLogger.error(LogTags.KEEP_AWAKE, `Failed to activate: ${error}`);
        });
    } else {
      DebugLogger.info(LogTags.KEEP_AWAKE, `Deactivating keep-awake (tag=${tag})`);
      deactivateKeepAwake(tag);
    }

    return () => {
      DebugLogger.info(LogTags.KEEP_AWAKE, `Cleanup: deactivating (tag=${tag})`);
      deactivateKeepAwake(tag);
    };
  }, [enabled, tag]);
}
