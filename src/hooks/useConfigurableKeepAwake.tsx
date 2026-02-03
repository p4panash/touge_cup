import React, { useEffect } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { DebugLogger, LogTags } from '@/services/DebugLogger';

/**
 * Internal component that activates keep-awake while mounted.
 * Automatically deactivates when unmounted.
 */
function KeepAwakeActive({ tag }: { tag: string }) {
  useKeepAwake(tag);

  useEffect(() => {
    DebugLogger.info(LogTags.KEEP_AWAKE, `Activated (tag=${tag})`);
    return () => {
      DebugLogger.info(LogTags.KEEP_AWAKE, `Deactivated on unmount (tag=${tag})`);
    };
  }, [tag]);

  return null;
}

/**
 * Component that conditionally keeps the screen awake.
 *
 * When enabled=true: keeps screen awake
 * When enabled=false: allows normal screen dimming/sleep
 *
 * Usage:
 * ```tsx
 * <KeepAwakeWhenEnabled enabled={keepScreenAwake} tag="ActiveDrive" />
 * ```
 */
export function KeepAwakeWhenEnabled({
  enabled,
  tag = 'ActiveDrive',
}: {
  enabled: boolean;
  tag?: string;
}) {
  useEffect(() => {
    DebugLogger.info(LogTags.KEEP_AWAKE, `Component: enabled=${enabled}, tag=${tag}`);
  }, [enabled, tag]);

  if (!enabled) {
    return null;
  }

  return <KeepAwakeActive tag={tag} />;
}

/**
 * Hook version for backward compatibility.
 * Note: This is less reliable than the component version.
 * Prefer using <KeepAwakeWhenEnabled /> component.
 *
 * @deprecated Use KeepAwakeWhenEnabled component instead
 */
export function useConfigurableKeepAwake(enabled: boolean, tag = 'ActiveDrive') {
  useEffect(() => {
    DebugLogger.info(LogTags.KEEP_AWAKE, `Hook (deprecated): enabled=${enabled}, tag=${tag}`);
  }, [enabled, tag]);

  // This hook can't actually toggle keep-awake properly due to React hook rules.
  // The component version is the correct approach.
}
