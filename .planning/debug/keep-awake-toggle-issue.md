---
status: investigating
trigger: "Keep Awake toggle doesn't work - screen stays awake even when toggle is OFF"
created: 2026-02-03T00:00:00Z
updated: 2026-02-03T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus
hypothesis: Settings are NOT persisted - store resets on app restart, always defaults to true
test: Confirmed settings store has no AsyncStorage or persistent middleware
expecting: User toggled OFF but setting reverts to true on next app load
next_action: This explains why screen "stays awake" - setting never persists as OFF

## Symptoms
expected: When toggle is OFF, screen should dim and sleep
actual: Screen stays awake even when toggle is turned OFF
errors: None reported
reproduction: Turn off Keep Awake toggle in Settings, screen remains awake
started: User reports toggle doesn't work when disabled

## Eliminated
- hypothesis: Hook dependency array issue - ELIMINATED
  evidence: Correct dependency array [enabled, tag] on line 34 of useConfigurableKeepAwake.ts

## Evidence
- timestamp: 2026-02-03
  checked: useSettingsStore.ts (line 43-44)
  found: "Note: Settings persist in memory only. Could add AsyncStorage persistence via zustand persist middleware in future."
  implication: Settings are NOT persisted to device storage - they're in-memory only

- timestamp: 2026-02-03
  checked: useSettingsStore.ts initialState (line 25-28)
  found: "keepScreenAwake: true" as default
  implication: Every app restart defaults to true, losing user's OFF preference

- timestamp: 2026-02-03
  checked: Hook logic (useConfigurableKeepAwake.ts line 22-34)
  found: When enabled=false, correctly calls deactivateKeepAwake(tag)
  implication: Hook implementation is correct

- timestamp: 2026-02-03
  checked: Store connection (active.tsx line 40-41)
  found: Correctly subscribes to keepScreenAwake and passes to hook
  implication: State propagation to hook is correct

## Resolution
root_cause: Settings store lacks persistence. User preferences (including Keep Screen Awake) are lost on app restart because they're only stored in-memory via Zustand without AsyncStorage middleware.
fix: Add zustand persist middleware with AsyncStorage to persist settings across app sessions
verification:
files_changed: []
