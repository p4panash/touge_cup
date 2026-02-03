---
status: diagnosed
trigger: "Difficulty selector in Settings doesn't sync with home screen selector"
severity: major
created: 2026-02-03T00:00:00Z
updated: 2026-02-03T00:00:00Z
mode: diagnose-only
---

## Current Focus
hypothesis: CONFIRMED - Difficulty state is reset when sensor pipeline stops (on app unmount/background), losing user selection
test: Traced resetStore() call in useSensorPipeline.ts stop() function
expecting: Found that resetStore() resets difficulty to 'easy' initial state
next_action: Root cause confirmed, generating report

## Symptoms
expected: Changing difficulty in Settings should immediately update home screen selector
actual: Settings difficulty selector change does not sync to home screen
errors: None reported - UI works but state doesn't synchronize
reproduction: 1. Open home screen 2. Note difficulty selection 3. Go to Settings 4. Change difficulty 5. Return to home - old selection still shows
started: Unknown if ever worked

## Eliminated

## Evidence
- timestamp: 2026-02-03T00:00:00Z
  checked: DifficultySelector.tsx
  found: Component reads from useSensorStore (line 19-20), same store in both screens
  implication: Both home and settings use the same store, state SHOULD be shared

- timestamp: 2026-02-03T00:00:01Z
  checked: app/(tabs)/index.tsx (home screen)
  found: Uses DifficultySelector component (line 53)
  implication: Home screen displays selector using useSensorStore

- timestamp: 2026-02-03T00:00:02Z
  checked: app/(tabs)/settings.tsx
  found: Also uses DifficultySelector component (line 35)
  implication: Settings screen displays same selector component

- timestamp: 2026-02-03T00:00:03Z
  checked: useSensorStore.ts
  found: Store is NOT persisted (no AsyncStorage or persistence middleware)
  implication: Store resets to initial state ('easy') on app restart or component unmount

- timestamp: 2026-02-03T00:00:04Z
  checked: Reset behavior in useSensorStore
  found: reset() method resets to initialState which has difficulty: 'easy' (line 61)
  implication: If reset() is called, difficulty reverts to 'easy' regardless of user selection

- timestamp: 2026-02-03T00:00:05Z
  checked: useSensorPipeline.ts hook
  found: stop() function calls resetStore() (line 114)
  implication: When sensor pipeline stops, entire store resets, losing difficulty setting

- timestamp: 2026-02-03T00:00:06Z
  checked: SensorProvider in app/_layout.tsx
  found: useSensorPipeline() is called at root layout level (line 107)
  implication: Hook auto-starts on app load (line 119) and auto-stops on unmount (line 121). When navigating between tabs or screens, sensor may temporarily stop/restart

- timestamp: 2026-02-03T00:00:07Z
  checked: Stop function behavior
  found: stop() resets store completely: setActive, setSettling, and ALL sensor state including difficulty (line 114)
  implication: Difficulty selection is LOST when sensor pipeline stops, not persisted

## Resolution
root_cause: resetStore() in useSensorPipeline.ts stop() function (line 114) resets entire useSensorStore to initial state, including difficulty field which defaults to 'easy'. This overwrites user-selected difficulty whenever the sensor pipeline stops. The difficulty selection is lost because the store is NOT persisted—only kept in memory. Both DifficultySelector instances (home & settings) share the same useSensorStore but it gets reset to defaults.

EXACT SEQUENCE:
1. User sets difficulty to 'master' in home/settings screen
2. User navigates away or app goes background
3. SensorProvider unmount triggers useSensorPipeline cleanup
4. stop() calls resetStore() which executes: set(initialState)
5. initialState has difficulty: 'easy'
6. User returns to see difficulty reset to 'easy'

fix: Remove difficulty from resetStore() call. Difficulty should NOT be reset when sensor pipeline stops/starts. Separate concerns: sensor state (risk, data, settling) should reset, but user settings (difficulty) should persist.

SOLUTION: In useSensorPipeline.ts stop() function, instead of calling resetStore() which resets everything, selectively reset only sensor-specific state while preserving difficulty.

Alternatively: Use Zustand persist middleware to persist difficulty to AsyncStorage.

files_changed:
  - src/hooks/useSensorPipeline.ts (separate sensor reset from difficulty setting)
