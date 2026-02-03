---
phase: 05-algorithm-refinement
plan: 03
subsystem: audio
tags: [expo-av, zustand, ambient-audio, pothole-detection, difficulty-modes]

# Dependency graph
requires:
  - phase: 05-01
    provides: PotholeDetector with Z-threshold spike detection
  - phase: 05-02
    provides: AmbientAudioController with risk-reactive volume
provides:
  - Difficulty-aware audio feedback system
  - Pothole forgiveness on Easy/Experienced modes
  - Master mode ambient with spill silence
  - Integrated pothole-to-spill conversion for Master
affects: [ui-feedback, scoring, history-display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ref-based ambient lifecycle in React hooks"
    - "Store-driven pothole event propagation"
    - "Difficulty cascading: store -> pipeline -> trigger -> audio"

key-files:
  created: []
  modified:
    - "src/stores/useSensorStore.ts"
    - "src/audio/FeedbackTrigger.ts"
    - "src/hooks/useAudioFeedback.ts"
    - "src/hooks/useSensorPipeline.ts"

key-decisions:
  - "Pothole events pushed from SensorPipeline to store, consumed by useAudioFeedback"
  - "Master mode pothole-as-spill triggers evaluate(1.0, true) for dramatic sound"
  - "Pothole zPeak normalized by /10 for severity (0-1 range)"
  - "Ambient cleanup on difficulty change OR drive end"

patterns-established:
  - "Difficulty sync: trigger.setDifficulty() called on difficulty state change"
  - "Pothole clearing: setPothole(null) after processing to prevent re-trigger"
  - "Spill sound check: both 'spill' and 'spill-dramatic' trigger ambient.onSpill()"

# Metrics
duration: 8min
completed: 2026-02-03
---

# Phase 5 Plan 03: Difficulty Integration Summary

**Difficulty-aware audio system with pothole forgiveness on Easy/Experienced, pothole-as-spill on Master, and ambient soundscape that intensifies with risk and silences on spill**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-03
- **Completed:** 2026-02-03
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Pothole state flows from SensorPipeline through store to audio feedback
- Easy/Experienced modes play bump sound for potholes, marked as forgiven
- Master mode converts potholes to spills with dramatic splash and ambient silence
- Ambient audio lifecycle managed correctly across difficulty changes and drive sessions

## Task Commits

Each task was committed atomically:

1. **Task 1: Update useSensorStore with pothole state** - `0a790f8` (feat)
2. **Task 2: Update FeedbackTrigger for difficulty-specific sounds** - `6efe6cd` (feat)
3. **Task 3: Wire pothole detection and ambient into useAudioFeedback** - `3962e6b` (feat)

## Files Created/Modified
- `src/stores/useSensorStore.ts` - Added lastPothole state and setPothole action
- `src/audio/FeedbackTrigger.ts` - Added difficulty field, evaluatePothole(), spill-dramatic sound
- `src/hooks/useAudioFeedback.ts` - Integrated ambient controller and pothole handling
- `src/hooks/useSensorPipeline.ts` - Push pothole events to store when detected

## Decisions Made
- Pothole events flow store-to-hook rather than direct callback for React reactivity
- Pothole zPeak normalized by dividing by 10 (raw values up to ~10 m/s^2 become 0-1 severity)
- Master mode pothole triggers spill via evaluate(1.0, true) to respect cooldown logic
- Ambient cleanup happens on both difficulty change (non-Master) and drive end (isActive=false)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in useDriveDetection.ts (unrelated to this plan) - ignored as out of scope

## Next Phase Readiness
- Phase 5 Algorithm Refinement complete
- Full difficulty-aware audio system integrated:
  - Easy/Experienced: forgiving potholes with bump sound
  - Master: strict potholes, dramatic spills, ambient tension
- Ready for device testing and tuning

---
*Phase: 05-algorithm-refinement*
*Completed: 2026-02-03*
