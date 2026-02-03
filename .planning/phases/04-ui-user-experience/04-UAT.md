---
status: diagnosed
phase: 04-ui-user-experience
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md]
started: 2026-02-03T07:15:00Z
updated: 2026-02-03T07:16:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Tab Navigation
expected: App has 3 tabs at the bottom (Home, History, Settings). Tapping each tab navigates to that screen. Active tab is highlighted.
result: issue
reported: "I feel like we could get rid of those funny emoji icons by now. No need to polish this later on, let's have it done now."
severity: minor

### 2. Dark Mode Support
expected: App follows system dark/light mode setting. Colors adapt automatically when switching device theme.
result: pass

### 3. Home Screen Layout
expected: Home screen shows a large circular Start button, difficulty selector (Easy/Experienced/Master), and recent drive card if drives exist.
result: issue
reported: "Yes, that's right. But we could also polish this one a bit too. The difficulty could be right below the Start Drive."
severity: minor

### 4. Start Drive Flow
expected: Tapping Start button navigates to Active Drive screen. Screen stays awake. Water cup animation appears.
result: issue
reported: "While everything you mentioned happens. This screen is a bit weird as the spills and streak counter is way on top; they are messing up with the activity bar up top"
severity: major

### 5. Water Cup Animation
expected: Water cup responds to phone tilt in real-time. Tilting phone makes water surface angle match device orientation.
result: pass

### 6. Spill Counter Display
expected: Active drive shows spill count. Count increments when harsh braking/acceleration/cornering. Color changes: green (0-2), yellow (3-5), red (6+).
result: pass

### 7. Streak Timer
expected: Active drive shows time since last spill. Resets when a spill occurs. Shows "Perfect!" if no spills yet.
result: pass

### 8. Stop Drive
expected: Tapping Stop button ends drive and navigates to Drive Summary screen.
result: pass

### 9. Drive Summary Map
expected: Summary shows map with route polyline. Polyline color indicates spill proximity (green=far, orange=near, red=at spill).
result: issue
reported: "Can't test that yet, but I will be back over it. One issue that I've noticed is that there is no back button for that screen."
severity: major

### 10. Spill Markers on Map
expected: Water drop markers appear on map where spills occurred. Tapping marker shows popup with severity and time.
result: pass

### 11. Stats Breakdown
expected: Summary shows score (0-100), spill count, duration, distance, average speed, and difficulty badge. Score color: green (>80), yellow (50-80), red (<50).
result: pass

### 12. History List
expected: History tab shows list of past drives with date, score, and difficulty. List scrolls smoothly.
result: pass

### 13. History Filtering
expected: History screen has difficulty filter. Selecting "Easy" shows only Easy drives. "All" shows all drives.
result: pass

### 14. History Sorting
expected: History can sort by date or score. Sorting options work in both ascending and descending order.
result: skipped
reason: Feature not implemented, user says it's not needed

### 15. History Detail Navigation
expected: Tapping a drive in History navigates to Drive Summary with map and stats for that drive.
result: issue
reported: "Yeah, this works. But I just figured out that we don't show a Drive Summary after we end a ride"
severity: major

### 16. Settings Sections
expected: Settings screen shows grouped sections: Driving (difficulty), Display (keep awake), Audio (placeholder), About.
result: pass

### 17. Keep Awake Toggle
expected: Settings has Keep Screen Awake toggle. When ON, active drive screen doesn't dim/sleep. When OFF, normal screen timeout applies.
result: issue
reported: "Yeah, when turned off it doesn't dim/sleep"
severity: major

### 18. Difficulty Selector in Settings
expected: Settings allows changing difficulty. Selecting difficulty here updates the home screen selector to match.
result: issue
reported: "no, the selection from settings doesn't update the one from home screen"
severity: major

## Summary

total: 18
passed: 10
issues: 7
pending: 0
skipped: 1

## Gaps

- truth: "Tab bar should use proper icons instead of emoji placeholders"
  status: failed
  reason: "User reported: I feel like we could get rid of those funny emoji icons by now. No need to polish this later on, let's have it done now."
  severity: minor
  test: 1
  root_cause: "TabIcon component in app/(tabs)/_layout.tsx renders emoji strings as Text elements. lucide-react-native not installed."
  artifacts:
    - path: "app/(tabs)/_layout.tsx"
      issue: "TabIcon component uses emoji strings instead of icon library"
  missing:
    - "Install lucide-react-native"
    - "Replace emoji TabIcon with proper icon components"
  debug_session: ".planning/debug/tab-emoji-icons.md"

- truth: "Difficulty selector should be positioned right below the Start Drive button"
  status: failed
  reason: "User reported: Yes, that's right. But we could also polish this one a bit too. The difficulty could be right below the Start Drive."
  severity: minor
  test: 3
  root_cause: "Start button container uses flex: 1 with justifyContent: 'center', expanding to fill vertical space and pushing DifficultySelector far below."
  artifacts:
    - path: "app/(tabs)/index.tsx"
      issue: "buttonContainer flex: 1 expands and separates button from difficulty selector"
  missing:
    - "Remove flex: 1 from buttonContainer"
    - "Keep button and difficulty selector as cohesive unit"
  debug_session: ".planning/debug/home-difficulty-positioning.md"

- truth: "Active drive screen stats should not overlap with status bar"
  status: failed
  reason: "User reported: While everything you mentioned happens. This screen is a bit weird as the spills and streak counter is way on top; they are messing up with the activity bar up top"
  severity: major
  test: 4
  root_cause: "Active drive screen uses fixed paddingTop: 24px without safe area insets. Full-screen modal presentation requires manual safe area handling."
  artifacts:
    - path: "app/drive/active.tsx"
      issue: "Container uses paddingTop: Spacing.lg (24px) without useSafeAreaInsets"
  missing:
    - "Import useSafeAreaInsets from react-native-safe-area-context"
    - "Apply top inset to container padding"
  debug_session: ".planning/debug/ui-overlap-status-bar.md"

- truth: "Drive Summary screen should have a back button for navigation"
  status: failed
  reason: "User reported: Can't test that yet, but I will be back over it. One issue that I've noticed is that there is no back button for that screen."
  severity: major
  test: 9
  root_cause: "Drive Summary screen is never actively navigated-to from Active Drive, so Stack doesn't show automatic back button. Missing explicit header configuration."
  artifacts:
    - path: "app/drive/summary/[id].tsx"
      issue: "Screen missing header configuration for back button"
    - path: "app/drive/_layout.tsx"
      issue: "Drive summary stack screen missing explicit back button options"
  missing:
    - "Add headerBackTitle and back button configuration to Drive Summary screen"
    - "Ensure back button navigates to home (not back to active drive)"
  debug_session: ".planning/debug/drive-summary-navigation.md"

- truth: "After ending a drive, user should be navigated to Drive Summary screen"
  status: failed
  reason: "User reported: Yeah, this works. But I just figured out that we don't show a Drive Summary after we end a ride"
  severity: major
  test: 15
  root_cause: "Stop button handler calls router.replace('/') navigating directly to home, bypassing Drive Summary. Drive ID not captured for navigation."
  artifacts:
    - path: "app/drive/active.tsx"
      issue: "handleStop() navigates to '/' instead of '/drive/summary/[id]'"
  missing:
    - "Capture drive ID before stopping"
    - "Navigate to /drive/summary/{driveId} instead of /"
  debug_session: ".planning/debug/drive-summary-navigation.md"

- truth: "Keep Awake toggle should control screen sleep behavior - OFF should allow normal timeout"
  status: failed
  reason: "User reported: Yeah, when turned off it doesn't dim/sleep"
  severity: major
  test: 17
  root_cause: "Settings store lacks persistence - keepScreenAwake resets to true (default) on app restart. No AsyncStorage middleware configured."
  artifacts:
    - path: "src/stores/useSettingsStore.ts"
      issue: "Store lacks persist middleware, settings reset on restart"
  missing:
    - "Add Zustand persist middleware with AsyncStorage"
  debug_session: ".planning/debug/keep-awake-toggle-issue.md"

- truth: "Difficulty selector in Settings should sync with home screen selector"
  status: failed
  reason: "User reported: no, the selection from settings doesn't update the one from home screen"
  severity: major
  test: 18
  root_cause: "useSensorPipeline() calls resetStore() on unmount, which resets difficulty to 'easy'. Difficulty is user setting but stored in sensor store without persistence."
  artifacts:
    - path: "src/hooks/useSensorPipeline.ts"
      issue: "stop() calls resetStore() which wipes difficulty selection"
    - path: "src/stores/useSensorStore.ts"
      issue: "Store lacks persistence, initialState resets difficulty to 'easy'"
  missing:
    - "Selectively reset only sensor state, not difficulty"
    - "Or add persist middleware to preserve difficulty across resets"
  debug_session: ".planning/debug/difficulty-selector-sync.md"
