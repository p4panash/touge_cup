---
status: investigating
trigger: "Diagnose root cause for UI issue: Active drive stats (spill counter, streak timer) overlap with the device status bar"
created: 2026-02-03T00:00:00Z
updated: 2026-02-03T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: Container padding is insufficient to account for status bar safe area
test: Examined active.tsx and ThemedView - confirmed issue
expecting: Found that statsRow uses only paddingTop: Spacing.lg (24px) but doesn't account for safe area
next_action: Confirmed root cause, ready to document

## Symptoms

expected: Stats positioned below safe area / status bar with proper padding
actual: Spill counter and streak timer overlap with device status bar at top
errors: Visual overlap, stats positioned "way on top"
reproduction: View active drive screen on device
started: Recent (likely from layout changes)

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-02-03T00:00:00Z
  checked: /Users/papanash/touge_cup/app/drive/active.tsx
  found: Container has paddingTop=Spacing.lg (24px). statsRow has no top margin or padding. ThemedView doesn't use SafeAreaView.
  implication: Stats row positioned directly at paddingTop=24px from safe area start, overlapping status bar on devices with notches/safe areas

- timestamp: 2026-02-03T00:00:00Z
  checked: /Users/papanash/touge_cup/src/components/shared/ThemedView.tsx
  found: ThemedView is a plain View, not SafeAreaView. No safe area handling.
  implication: Active drive screen's container doesn't protect against status bar overlap

- timestamp: 2026-02-03T00:00:00Z
  checked: /Users/papanash/touge_cup/src/theme/spacing.ts
  found: Spacing.lg = 24px
  implication: Only 24px padding at top is insufficient for devices with notches/safe areas (typically 44px+ needed)

## Resolution

root_cause: Active drive screen is presented as full-screen modal (no header). The container in active.tsx only uses paddingTop=Spacing.lg (24px), which doesn't account for the device's safe area insets (status bar height, notches). ThemedView is a plain View, not a SafeAreaView. The statsRow sits directly at the container's top padding, causing it to overlap the status bar. The fix requires using useSafeAreaInsets hook to get the actual top safe area value and apply it to the container's paddingTop.

Affected files:
- /Users/papanash/touge_cup/app/drive/active.tsx (main issue - container needs safe area padding)
- /Users/papanash/touge_cup/src/components/shared/ThemedView.tsx (could be enhanced but not required)

Root mechanism: Modal presentation + missing safe area insets = stats positioned at fixed 24px from visual top instead of safe area top.

fix: (pending - goal:find_root_cause_only, fix step skipped)
verification: (skipped)
files_changed: []
