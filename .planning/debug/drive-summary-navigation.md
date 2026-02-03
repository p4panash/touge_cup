---
status: resolved
trigger: "Diagnose root cause for UI issue: No Drive Summary shown after ending a ride"
created: 2026-02-03T10:37:00Z
updated: 2026-02-03T10:42:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Stop button navigates to home instead of Drive Summary
test: Examined active.tsx handleStop function
expecting: Found router.replace('/') instead of navigation to summary screen
next_action: Root cause identified, returning diagnosis

## Symptoms

expected: After tapping Stop button to end a ride, app navigates to Drive Summary screen showing ride stats
actual: Stop button ends the ride but doesn't navigate to Drive Summary screen
errors: None reported
reproduction: End a ride by tapping the Stop button
started: Unknown when it started, but currently not working

## Eliminated

(none needed - root cause found immediately)

## Evidence

- timestamp: 2026-02-03T10:37:00Z
  checked: Found App.tsx routing structure
  found: App.tsx shows debug screen, not navigation routing
  implication: Navigation is via Expo Router in /app directory

- timestamp: 2026-02-03T10:39:00Z
  checked: Explored /app directory structure
  found: /app/drive/active.tsx is the active drive screen, /app/drive/summary/[id].tsx is the summary screen
  implication: Navigation infrastructure exists but may not be used

- timestamp: 2026-02-03T10:41:00Z
  checked: Examined /app/drive/active.tsx handleStop function (lines 64-67)
  found: "const handleStop = useCallback(() => { stopManual(); router.replace('/'); }, [stopManual, router]);"
  implication: CRITICAL - Navigates to home ('/') instead of summary screen after stopping

- timestamp: 2026-02-03T10:42:00Z
  checked: Checked DriveRecorder.endDrive() return value
  found: endDrive() should provide the drive ID needed for summary navigation
  implication: Drive ID exists in DB but never used to navigate to summary

## Resolution

root_cause: In /app/drive/active.tsx handleStop function (lines 64-67), after calling stopManual() which records the drive to database, the navigation immediately goes to home route ('/') via router.replace('/') instead of navigating to the newly created drive summary screen at /app/drive/summary/[id].tsx. The DriveRecorder.endDrive() call returns a drive ID (which is stored in the database) but this ID is never captured and used for navigation to the summary screen.

fix: After endDrive() completes and returns the drive ID, navigate to the summary screen using router.push(`/drive/summary/${driveId}`) instead of router.replace('/').

Suggested implementation:
1. Modify handleStop to wait for stopManual() completion
2. Capture the drive ID returned by DriveRecorder.endDrive()
3. Navigate to /drive/summary/[id] with the captured drive ID instead of going home

files_changed: []
