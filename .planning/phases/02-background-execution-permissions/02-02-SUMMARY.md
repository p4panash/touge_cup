---
phase: 02-background-execution-permissions
plan: 02
subsystem: background
tags: [expo-location, expo-task-manager, zustand, gps, permissions]

# Dependency graph
requires:
  - phase: 02-01
    provides: Drive types (DriveState, LocationData, LocationPermissionStatus) and constants
provides:
  - BackgroundTaskRegistry with module-scope task definition
  - LocationManager for start/stop GPS tracking
  - PermissionManager for foreground+background permission flow
  - useDriveStore for drive state management
affects: [02-03, phase-03-drive-detection-state-machine]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Module-scope TaskManager.defineTask for background execution
    - Callback registration pattern for bridging background task to React state
    - Foreground-then-background permission request sequence

key-files:
  created:
    - src/background/BackgroundTaskRegistry.ts
    - src/background/LocationManager.ts
    - src/background/PermissionManager.ts
    - src/stores/useDriveStore.ts
  modified:
    - index.ts

key-decisions:
  - "BackgroundTaskRegistry imported first in index.ts - ensures task defined before React"
  - "Callback pattern for location updates - decouples background task from state management"
  - "Foreground service with deferred updates - balances accuracy vs battery"

patterns-established:
  - "Module-scope task registration: TaskManager.defineTask must run before app mounts"
  - "Manager pattern: LocationManager/PermissionManager as objects with async methods"
  - "Dual permission flow: requestForegroundPermissions then requestBackgroundPermissions"

# Metrics
duration: 2min
completed: 2026-02-02
---

# Phase 2 Plan 2: Background Task Infrastructure Summary

**Background location task registered at module scope with LocationManager, PermissionManager, and useDriveStore for GPS-based drive detection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-02T15:58:56Z
- **Completed:** 2026-02-02T16:00:56Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Background location task defined at module scope, imported first in entry point
- LocationManager provides start/stop/isRunning for background GPS updates
- PermissionManager handles foreground-then-background permission flow
- useDriveStore created for drive state machine and GPS state

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BackgroundTaskRegistry and update entry point** - `81d8f21` (feat)
2. **Task 2: Create LocationManager and PermissionManager** - `bb502f0` (feat)
3. **Task 3: Create useDriveStore** - `6261c6b` (feat)

## Files Created/Modified
- `src/background/BackgroundTaskRegistry.ts` - Module-scope task definition, callback registration
- `src/background/LocationManager.ts` - Start/stop background location updates
- `src/background/PermissionManager.ts` - Permission request flow, battery settings
- `src/stores/useDriveStore.ts` - Zustand store for drive state and GPS data
- `index.ts` - Import BackgroundTaskRegistry first

## Decisions Made
- TaskManager.defineTask callback made async (TypeScript requires Promise return type)
- Used Linking.openSettings() for iOS app settings instead of IntentLauncher (iOS-compatible)
- Package name hardcoded in PermissionManager.openAppSettings() for Android intent

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TaskManager callback must be async**
- **Found during:** Task 1 (BackgroundTaskRegistry creation)
- **Issue:** TypeScript error - TaskManagerTaskExecutor expects Promise return type
- **Fix:** Added async keyword to defineTask callback
- **Files modified:** src/background/BackgroundTaskRegistry.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 81d8f21 (Task 1 commit)

**2. [Rule 1 - Bug] iOS app settings uses Linking, not IntentLauncher**
- **Found during:** Task 2 (PermissionManager creation)
- **Issue:** IntentLauncher.ActivityAction doesn't work for iOS settings
- **Fix:** Used Linking.openSettings() for iOS, IntentLauncher for Android
- **Files modified:** src/background/PermissionManager.ts
- **Verification:** Code follows platform-specific patterns
- **Committed in:** bb502f0 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correct TypeScript and cross-platform operation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Background task infrastructure complete
- Ready for Plan 03: Drive state machine and useDriveSession hook
- LocationManager.start() can be called after permissions granted
- setLocationCallback() will wire state machine to background updates

---
*Phase: 02-background-execution-permissions*
*Completed: 2026-02-02*
