---
phase: 01-sensor-audio-foundation
plan: 02
subsystem: smoothness-engine
tags: [jerk-calculation, risk-normalization, rolling-window, sensor-pipeline, zustand]

# Dependency graph
requires: [01-01]
provides:
  - Jerk calculation from acceleration deltas
  - Risk normalization with 3 difficulty levels
  - 500ms rolling window for temporal smoothing
  - Complete synchronous sensor pipeline
affects: [01-03, audio-feedback, drive-session]

# Tech tracking
tech-stack:
  added: []
  patterns: [jerk-based-smoothness, linear-risk-interpolation, rolling-window-smoothing]

key-files:
  created:
    - src/sensors/processors/JerkCalculator.ts
    - src/sensors/processors/SpillRiskNormalizer.ts
    - src/sensors/processors/RollingWindow.ts
    - src/sensors/SensorPipeline.ts
  modified:
    - src/stores/useSensorStore.ts

key-decisions:
  - "Used actual timestamp deltas for jerk calculation (not assumed 20ms) - critical for Android variable intervals"
  - "Excluded z-axis from jerk magnitude - vertical motion is road surface, not driving smoothness"
  - "1500ms settling period (middle of 1-2s range) - prevents false positives during phone mounting"
  - "Linear interpolation between slosh and spill thresholds - provides graduated feedback"

patterns-established:
  - "Synchronous pipeline: all processing happens in listener callback, no async boundaries"
  - "Jerk magnitude as RMS of lateral (x) and longitudinal (y) components"
  - "Three difficulty levels with distinct threshold pairs (slosh/spill)"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 01 Plan 02: Smoothness Engine Summary

Jerk-based smoothness detection with 3 difficulty levels, 500ms rolling window, and synchronous pipeline integration.

## What Was Built

### JerkCalculator
Computes rate of acceleration change (dA/dt) per axis using actual timestamp deltas. Key design decisions:
- Uses real time deltas from sensor timestamps, not assumed 20ms intervals
- Critical for Android where sensor intervals vary significantly by OEM
- Returns per-axis jerk (x, y, z) plus combined magnitude
- Magnitude uses RMS of lateral (x) and longitudinal (y) only
- Z-axis excluded from magnitude (vertical = road surface vibration, not driving smoothness)

### SpillRiskNormalizer
Converts jerk magnitude to 0-1 risk value with configurable difficulty:

| Difficulty | Slosh Threshold | Spill Threshold |
|------------|-----------------|-----------------|
| Easy       | 5.0 m/s^3       | 10.0 m/s^3      |
| Experienced| 3.0 m/s^3       | 7.0 m/s^3       |
| Master     | 1.5 m/s^3       | 4.0 m/s^3       |

- Below slosh: risk = 0 (silence = smooth driving)
- Above spill: risk = 1.0, isSpill = true
- Between: linear interpolation for graduated feedback

### RollingWindow
Temporal smoothing to prevent transient spikes from triggering feedback:
- 500ms default window (per SMTH-04 requirement)
- Simple array storage (25 samples at 50Hz is trivial)
- Returns rolling average of samples within window

### SensorPipeline
Complete synchronous processing chain:
1. Low-pass filter (removes vibration noise)
2. Jerk calculator (rate of acceleration change)
3. Risk normalizer (jerk to 0-1 with difficulty)
4. Rolling window (temporal smoothing)

All processing is synchronous - no async boundaries for minimum latency.

### Store Updates
Added to useSensorStore:
- `risk: number` - smoothed spill risk (0-1)
- `isSpill: boolean` - spill threshold exceeded
- `jerkMagnitude: number` - for debugging/display
- `isSettling: boolean` - true during startup calibration
- `difficulty: DifficultyLevel` - current difficulty level
- `SETTLING_PERIOD_MS = 1500` - exported constant

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Actual timestamp deltas | Android sensor intervals vary 2-5x from requested rate |
| Z-axis excluded from magnitude | Vertical motion is road surface, not driving behavior |
| 1500ms settling period | Middle of 1-2s range from CONTEXT.md |
| RMS for magnitude | Better than max() for smooth combined metric |

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Change |
|------|--------|
| src/sensors/processors/JerkCalculator.ts | Created - jerk computation |
| src/sensors/processors/SpillRiskNormalizer.ts | Created - risk normalization |
| src/sensors/processors/RollingWindow.ts | Created - temporal smoothing |
| src/sensors/SensorPipeline.ts | Created - complete pipeline |
| src/stores/useSensorStore.ts | Modified - added risk state |

## Commits

| Hash | Message |
|------|---------|
| 10e3cd1 | feat(01-02): implement jerk calculation and risk normalization |
| c495f12 | feat(01-02): create SensorPipeline and integrate with store |

## Next Phase Readiness

Ready for Plan 03 (Audio Feedback). The pipeline outputs:
- `risk: number` (0-1) for graduated audio intensity
- `isSpill: boolean` for spill sound trigger
- `jerk: JerkResult` for debugging/display

Integration point: Call `pipeline.process(accel, timestamp)` in DeviceMotionManager callback, then `store.updateRisk(risk, isSpill, jerk.magnitude)`.

---
*Plan 01-02 completed: 2026-02-01*
