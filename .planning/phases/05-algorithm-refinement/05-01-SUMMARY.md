---
phase: 05-algorithm-refinement
plan: 01
subsystem: sensors
tags: [accelerometer, z-axis, pothole-detection, signal-processing]

# Dependency graph
requires:
  - phase: 01-sensor-audio-foundation
    provides: SensorPipeline, LowPassFilter, JerkCalculator
provides:
  - PotholeDetector class with Z-axis spike detection
  - PotholeEvent interface for downstream processing
  - zAccelFiltered field in PipelineResult
  - Duration-based pothole vs speed bump classification
affects: [05-02-master-audio, 05-03-difficulty-feedback, future-route-markers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Z-axis independent analysis (separate from X/Y jerk magnitude)"
    - "Hysteresis-based spike detection (0.5 factor prevents premature termination)"
    - "Temporal clustering for rough road segments (7s window)"

key-files:
  created:
    - src/sensors/processors/PotholeDetector.ts
  modified:
    - src/sensors/SensorPipeline.ts
    - src/sensors/types.ts

key-decisions:
  - "Z_THRESHOLD 3.9 m/s^2 (0.4g) per PMC research for significant road impacts"
  - "MAX_POTHOLE_DURATION_MS 200ms distinguishes potholes from speed bumps"
  - "CLUSTER_WINDOW_MS 7000ms (middle of 5-10s range per CONTEXT.md)"
  - "HYSTERESIS_FACTOR 0.5 prevents noise from prematurely ending spike tracking"

patterns-established:
  - "Z-axis analyzed independently from X/Y jerk magnitude"
  - "Spike tracking with peak capture during event"
  - "Temporal clustering to group consecutive events"

# Metrics
duration: 8min
completed: 2026-02-03
---

# Phase 05 Plan 01: Pothole Detection Summary

**Z-axis spike detection with 3.9 m/s^2 threshold, duration filtering (<200ms), and 7-second clustering for rough road segments**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-03T11:00:00Z
- **Completed:** 2026-02-03T11:08:06Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created PotholeDetector class that identifies road imperfections via Z-axis acceleration spikes
- Implemented duration filtering to distinguish potholes (<200ms) from speed bumps (>200ms)
- Added clustering logic to group consecutive potholes within 7 seconds as single rough road event
- Integrated pothole detection into SensorPipeline with minimal overhead

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PotholeDetector class** - `a106e15` (feat)
2. **Task 2: Update sensor types with pothole-related fields** - `7076e0d` (chore)
3. **Task 3: Integrate PotholeDetector into SensorPipeline** - `6a41538` (feat)

## Files Created/Modified

- `src/sensors/processors/PotholeDetector.ts` - Z-axis spike detection with threshold, duration, and clustering logic
- `src/sensors/types.ts` - Re-exports PotholeEvent for centralized type access
- `src/sensors/SensorPipeline.ts` - Extended PipelineResult with zAccelFiltered and pothole fields

## Decisions Made

- **Z_THRESHOLD = 3.9 m/s^2**: Based on PMC Road Surface Monitoring Review (0.4g threshold for significant impacts)
- **MAX_POTHOLE_DURATION_MS = 200**: Short spikes are sudden impacts; longer events (speed bumps) can be anticipated and handled smoothly
- **CLUSTER_WINDOW_MS = 7000**: Middle of 5-10s range from CONTEXT.md; groups consecutive potholes as rough road
- **HYSTERESIS_FACTOR = 0.5**: Spike must drop to 50% of threshold to end; prevents noise from prematurely terminating detection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - existing codebase patterns (JerkCalculator) provided clear reference for implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Pothole events now available in PipelineResult for downstream processing
- Ready for Plan 05-02 (Master mode audio) to consume pothole events
- Ready for Plan 05-03 (difficulty-aware feedback) to apply forgiveness logic

---
*Phase: 05-algorithm-refinement*
*Completed: 2026-02-03*
