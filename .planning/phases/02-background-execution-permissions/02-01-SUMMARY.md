---
phase: 02-background-execution-permissions
plan: 01
subsystem: infra
tags: [expo-location, expo-task-manager, background-location, gps, permissions]

# Dependency graph
requires:
  - phase: 01-sensor-audio-foundation
    provides: expo-av audio engine for feedback sounds
provides:
  - expo-location, expo-task-manager, expo-battery, expo-intent-launcher packages
  - iOS UIBackgroundModes for location and audio
  - Android background location permissions
  - DriveState discriminated union type
  - LocationData, DriveEvent types
  - Speed/timing constants for drive detection
affects:
  - 02-02 (location permission request flow)
  - 02-03 (drive detection state machine implementation)
  - 03-storage-history (drive event persistence)

# Tech tracking
tech-stack:
  added: [expo-location@19.0.8, expo-task-manager@14.0.9, expo-battery@10.0.8, expo-intent-launcher@13.0.8]
  patterns: [discriminated union for state machine, const assertions for config]

key-files:
  created:
    - src/drive/types.ts
    - src/drive/constants.ts
  modified:
    - package.json
    - app.json

key-decisions:
  - "DriveState as discriminated union - enables exhaustive type checking in state machine"
  - "Speed threshold 15 km/h (4.17 m/s) - high enough to avoid false positives from walking"
  - "Stop duration 120s - long enough to handle traffic lights and brief stops"

patterns-established:
  - "Discriminated union for state machines: type field with state-specific properties"
  - "Constants file with JSDoc comments referencing context docs"

# Metrics
duration: 2min
completed: 2026-02-02
---

# Phase 2 Plan 1: Infrastructure Setup Summary

**expo-location/task-manager packages installed with iOS UIBackgroundModes and Android background permissions, DriveState discriminated union and detection constants**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-02T15:53:54Z
- **Completed:** 2026-02-02T15:55:54Z
- **Tasks:** 2
- **Files modified:** 4 (+ 1 deleted)

## Accomplishments
- Installed 4 background execution packages (expo-location, expo-task-manager, expo-battery, expo-intent-launcher)
- Configured iOS UIBackgroundModes for location and audio
- Added Android permissions for background location and foreground service
- Created DriveState discriminated union with all state machine states
- Created LocationData, DriveEvent, LocationPermissionStatus types
- Created speed/timing constants for drive detection

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages and configure app.json** - `7f5f0e7` (chore)
2. **Task 2: Create drive detection types and constants** - `8f95ec6` (feat)

## Files Created/Modified
- `package.json` - Added 4 new dependencies
- `app.json` - iOS UIBackgroundModes, Android permissions, expo-location plugin config
- `src/drive/types.ts` - DriveState, LocationData, DriveEvent, LocationPermissionStatus
- `src/drive/constants.ts` - Speed thresholds, timing constants, task name, foreground service config

## Decisions Made
- DriveState as discriminated union - enables exhaustive switch statements and type narrowing
- Speed threshold 15 km/h (4.17 m/s) - matches CONTEXT.md locked decision
- Stationary threshold 3.6 km/h (1.0 m/s) - conservative to avoid false stop detection
- Stop duration 120s - matches CONTEXT.md locked decision

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed stale SoundBank.ts**
- **Found during:** Task 2 (TypeScript verification)
- **Issue:** src/audio/SoundBank.ts still imported react-native-audio-api which was removed in 01-03 migration to expo-av
- **Fix:** Deleted src/audio/SoundBank.ts (unused after migration, AudioEngine.ts is the active implementation)
- **Files modified:** src/audio/SoundBank.ts (deleted)
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 8f95ec6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for TypeScript compilation. No scope creep.

## Issues Encountered
None - packages installed cleanly, all verification passed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Package infrastructure ready for 02-02 (location permission request flow)
- Types ready for 02-03 (drive detection state machine)
- expo-task-manager ready for background location tracking

---
*Phase: 02-background-execution-permissions*
*Plan: 01*
*Completed: 2026-02-02*
