import { useEffect, useRef } from 'react';
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
  // Track if we're currently activated to avoid race conditions
  const isActivatedRef = useRef(false);
  // Track the current enabled value to handle async race conditions
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    DebugLogger.info(LogTags.KEEP_AWAKE, `Hook effect: enabled=${enabled}, tag=${tag}`);

    if (enabled) {
      DebugLogger.info(LogTags.KEEP_AWAKE, `Activating keep-awake (tag=${tag})`);
      activateKeepAwakeAsync(tag)
        .then(() => {
          // Only mark as activated if we still want it enabled
          if (enabledRef.current) {
            isActivatedRef.current = true;
            DebugLogger.info(LogTags.KEEP_AWAKE, `Activated successfully (tag=${tag})`);
          } else {
            // User disabled while we were activating - immediately deactivate
            DebugLogger.info(LogTags.KEEP_AWAKE, `Activation completed but disabled - deactivating (tag=${tag})`);
            deactivateKeepAwake(tag);
          }
        })
        .catch((error) => {
          DebugLogger.error(LogTags.KEEP_AWAKE, `Failed to activate: ${error}`);
        });
    } else {
      // Always deactivate when disabled, regardless of our tracked state
      // Call deactivate multiple times to be sure (with and without tag)
      DebugLogger.info(LogTags.KEEP_AWAKE, `Deactivating keep-awake (tag=${tag}), wasActivated=${isActivatedRef.current}`);
      deactivateKeepAwake(tag);
      // Also try deactivating without tag in case something activated globally
      deactivateKeepAwake();
      isActivatedRef.current = false;
    }

    return () => {
      DebugLogger.info(LogTags.KEEP_AWAKE, `Cleanup: deactivating (tag=${tag})`);
      deactivateKeepAwake(tag);
      isActivatedRef.current = false;
    };
  }, [enabled, tag]);
}
