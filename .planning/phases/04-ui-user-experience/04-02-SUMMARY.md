---
phase: 04-ui-user-experience
plan: 02
subsystem: ui
tags: [home-screen, active-drive, water-cup, accelerometer, reanimated, segmented-control]

# Dependency graph
requires:
  - phase: 04-ui-user-experience
    plan: 01
    provides: Navigation infrastructure, theme system, placeholder screens
provides:
  - Home screen with hero start button and navigation flow
  - Active drive screen with accelerometer-driven water cup
  - Difficulty selector connected to useSensorStore
  - Recent drive card with navigation to history
  - Spill counter and streak timer displays
  - Configurable keep-awake hook
affects: [04-03-drive-summary, 04-04-settings, 04-05-polish]

# Tech tracking
tech-stack:
  added: [react-native-reanimated]
  patterns: [useAnimatedSensor-accelerometer, configurable-keep-awake, component-composition]

key-files:
  created:
    - src/components/home/StartButton.tsx
    - src/components/home/DifficultySelector.tsx
    - src/components/home/RecentDrive.tsx
    - src/components/drive/WaterCup.tsx
    - src/components/drive/SpillCounter.tsx
    - src/components/drive/StreakTimer.tsx
    - src/components/drive/StopButton.tsx
    - src/hooks/useConfigurableKeepAwake.ts
  modified:
    - app/(tabs)/index.tsx
    - app/drive/active.tsx
    - package.json

key-decisions:
  - "useAnimatedSensor for 60fps water animation - runs entirely on UI thread"
  - "Fill level decreases by 0.1 per spill (minimum 0.1 to keep visual appeal)"
  - "Streak timer shows time since last spill, or since drive start if no spills"
  - "Keep-awake always enabled for now, will connect to settings later"

patterns-established:
  - "Drive component composition: Stats row + Cup + Controls layout"
  - "Spill tracking via isSpill store subscription with useEffect"
  - "Color-coded feedback: green for perfect, yellow for moderate, red for many spills"

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 4 Plan 02: Home & Active Drive Screens Summary

**Hero start button home screen with accelerometer-driven water cup visualization on active drive**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-03T00:08:45Z
- **Completed:** 2026-02-03T00:11:47Z
- **Tasks:** 2
- **Files created:** 8
- **Files modified:** 3

## Accomplishments

- Built home screen with hero start button, difficulty selector, and recent drive card
- Created accelerometer-driven water cup animation using react-native-reanimated
- Implemented spill counter with color-coded feedback (green/yellow/red)
- Added streak timer showing time since last spill
- Configured keep-awake to prevent screen sleep during drives
- Connected all screens to existing drive detection and sensor stores

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Home screen components** - `8adeca8` (feat)
2. **Task 2: Build Active drive screen with water cup animation** - `e600316` (feat)

## Files Created/Modified

**Created:**
- `src/components/home/StartButton.tsx` - Large circular hero button with primary color
- `src/components/home/DifficultySelector.tsx` - Native segmented control (Easy/Experienced/Master)
- `src/components/home/RecentDrive.tsx` - Most recent drive card with stats
- `src/components/drive/WaterCup.tsx` - Accelerometer-driven water animation (useAnimatedSensor)
- `src/components/drive/SpillCounter.tsx` - Spill count display with color feedback
- `src/components/drive/StreakTimer.tsx` - Time since last spill with "Perfect!" state
- `src/components/drive/StopButton.tsx` - Danger-colored stop button
- `src/hooks/useConfigurableKeepAwake.ts` - Keep-awake hook with cleanup

**Modified:**
- `app/(tabs)/index.tsx` - Home screen with all components integrated
- `app/drive/active.tsx` - Active drive with water cup and controls
- `package.json` - Added react-native-reanimated

## Decisions Made

1. **useAnimatedSensor for water animation** - Runs on UI thread for guaranteed 60fps, no JS bridge bottleneck (per RESEARCH.md Pattern 2)
2. **Fill level reduction 0.1 per spill** - Minimum 0.1 to maintain visual appeal (never empty cup)
3. **Streak timer dual-purpose** - Shows time since last spill, or time since drive start if perfect run
4. **Keep-awake always on** - Hardcoded for now; will connect to settings store in Plan 04

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added react-native-reanimated dependency**
- **Found during:** Task 2
- **Issue:** react-native-reanimated not installed despite being listed in RESEARCH.md standard stack
- **Fix:** Installed via npm with --legacy-peer-deps due to React version conflict
- **Files modified:** package.json, package-lock.json
- **Commit:** e600316

## Issues Encountered

- React version conflict when installing reanimated (react@19.1.0 vs react-dom peer expecting 19.2.4)
- Resolved with --legacy-peer-deps flag

## User Setup Required

None - all dependencies install automatically.

## Next Phase Readiness

- Home screen complete with full navigation flow to active drive
- Active drive screen shows real-time accelerometer feedback
- Ready for Plan 03: Drive summary screen with route map
- useConfigurableKeepAwake ready for settings integration in Plan 04

---
*Phase: 04-ui-user-experience*
*Completed: 2026-02-03*
