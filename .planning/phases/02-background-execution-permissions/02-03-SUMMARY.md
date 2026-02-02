---
phase: 02-background-execution-permissions
plan: 03
subsystem: background, drive-detection
tags: [expo-location, state-machine, background-audio, gps, drive-detection]

# Dependency graph
requires:
  - phase: 02-background-execution-permissions
    provides: BackgroundTaskRegistry, LocationManager, PermissionManager, useDriveStore
provides:
  - DriveStateManager pure state machine with processLocation()
  - useDriveDetection hook connecting GPS to state machine
  - Background audio playback (staysActiveInBackground)
  - Auto-start at 15 km/h, auto-stop after 120s stationary
  - Manual start/stop drive override
  - In-app debug log viewer for testing
affects: [03-drive-session-management, 04-ui-user-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure state machine (processLocation) with side effects in hooks"
    - "Sensors always on, audio gated by drive state"
    - "Process ALL locations in batch for accurate state detection"
    - "In-app debug logging via useDebugStore"

key-files:
  created:
    - src/drive/DriveStateManager.ts
    - src/hooks/useDriveDetection.ts
    - src/stores/useDebugStore.ts
  modified:
    - src/audio/AudioEngine.ts
    - src/hooks/useSensorPipeline.ts
    - src/hooks/useAudioFeedback.ts
    - src/background/LocationManager.ts
    - App.tsx

key-decisions:
  - "Sensors always on when app is open (no manual start needed)"
  - "Audio feedback only plays during active drive (isDriving check)"
  - "Process ALL locations in batch (not just last one) for accurate state detection"
  - "In-app debug log viewer for testing without Xcode"

patterns-established:
  - "Pure state machine: processLocation() returns new state, no side effects"
  - "Drive state gating: Audio only during isDriving, sensors always on"
  - "Batch location processing: All deferred locations processed sequentially"

# Metrics
duration: ~45min
completed: 2026-02-02
---

# Phase 2 Plan 3: Drive State Machine and App Integration Summary

**GPS-based drive detection with auto-start at 15 km/h, auto-stop after 120s stationary, background audio via staysActiveInBackground, and in-app debug logging**

## Performance

- **Duration:** ~45 min (including checkpoint verification and bug fixes)
- **Started:** 2026-02-02
- **Completed:** 2026-02-02
- **Tasks:** 4 (3 auto + 1 human-verify checkpoint)
- **Files modified:** 9

## Accomplishments

- DriveStateManager pure state machine with idle/detecting/driving/stopping/manual_driving states
- useDriveDetection hook connecting GPS location updates to state machine
- Background audio enabled with staysActiveInBackground: true
- Sensors always running, audio feedback gated by isDriving state
- Batch processing of deferred location updates for reliable state detection
- In-app debug log viewer for testing without Xcode console

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DriveStateManager state machine** - `1954154` (feat)
2. **Task 2: Create useDriveDetection hook and enable background audio** - `c4aa338` (feat)
3. **Task 3: Integrate drive detection into App** - `61ab0ab` (feat)
4. **Task 4: Human verification** - APPROVED

**Post-checkpoint improvements:**

5. **Refactor: Sensors always on, audio gated** - `faec0fb` (refactor)
6. **Fix: Improve drive detection reliability** - `7ae1b6a` (fix)
7. **Feature: Add in-app debug log viewer** - `3d0beaf` (feat)

## Files Created/Modified

**Created:**
- `src/drive/DriveStateManager.ts` - Pure state machine with processLocation() and manual start/stop
- `src/hooks/useDriveDetection.ts` - Hook connecting GPS to state machine, manages location lifecycle
- `src/stores/useDebugStore.ts` - In-app debug logging store

**Modified:**
- `src/audio/AudioEngine.ts` - Added staysActiveInBackground: true for background audio
- `src/hooks/useSensorPipeline.ts` - Auto-starts on mount (no manual trigger needed)
- `src/hooks/useAudioFeedback.ts` - Audio gated by isDriving state
- `src/background/LocationManager.ts` - Reduced deferred updates (30s -> 10s) for better detection
- `App.tsx` - Drive detection UI, debug log viewer, permission flow

## Decisions Made

1. **Sensors always on when app is open** - No manual start button needed; sensors run continuously for instant feedback when drive begins
2. **Audio gated by isDriving** - Prevents false audio triggers when stationary; audio only plays during active drives
3. **Process ALL locations in batch** - Deferred location updates come in batches; processing only the last one missed state transitions. Now all are processed sequentially.
4. **In-app debug log viewer** - Testing on physical device required seeing logs without Xcode attached; added scrollable log view in app

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Single location processing missed state transitions**
- **Found during:** Human verification testing
- **Issue:** Only processing last location in batch caused missed transitions when speed changed rapidly
- **Fix:** Process ALL locations in batch sequentially through state machine
- **Files modified:** src/hooks/useDriveDetection.ts
- **Verification:** State transitions reliably at 15 km/h threshold
- **Committed in:** 7ae1b6a

**2. [Rule 2 - Missing Critical] Sensors not starting without manual trigger**
- **Found during:** Human verification testing
- **Issue:** Users had to press "Start Sensors" before audio feedback worked
- **Fix:** Auto-start sensors on mount, gate audio by isDriving instead
- **Files modified:** src/hooks/useSensorPipeline.ts, src/hooks/useAudioFeedback.ts, App.tsx
- **Verification:** Audio feedback works immediately when drive detected
- **Committed in:** faec0fb

**3. [Rule 2 - Missing Critical] No way to see logs on device**
- **Found during:** Human verification testing
- **Issue:** Debugging drive detection on physical device impossible without Xcode
- **Fix:** Added in-app debug log viewer with useDebugStore
- **Files modified:** src/stores/useDebugStore.ts, src/hooks/useDriveDetection.ts, App.tsx
- **Verification:** Logs visible in scrollable panel within app
- **Committed in:** 3d0beaf

---

**Total deviations:** 3 auto-fixed (1 bug, 2 missing critical)
**Impact on plan:** All fixes necessary for usability during testing. No scope creep.

## Issues Encountered

- **Deferred location updates batching:** expo-location with deferredUpdatesInterval batches updates. Initial implementation only processed the last location, missing transitions. Solved by iterating through all locations.
- **Testing without Xcode:** Physical device testing required debug visibility. Added in-app log viewer.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 3:**
- Drive detection working (auto-start/stop + manual override)
- Background execution functional (audio continues with screen off)
- GPS location tracking operational
- Drive state available in useDriveStore for session persistence

**Phase 2 Complete:**
All 3 plans executed. Phase 2 success criteria met:
1. Auto-starts recording at 15 km/h for 5+ seconds
2. Auto-stops recording after 120+ seconds stationary
3. Manual start/stop override works
4. Background execution continues with screen off
5. Battery consumption to be monitored in extended use

---
*Phase: 02-background-execution-permissions*
*Completed: 2026-02-02*
