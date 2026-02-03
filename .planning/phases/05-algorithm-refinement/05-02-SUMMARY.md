---
phase: 05-algorithm-refinement
plan: 02
subsystem: audio
tags: [expo-av, ambient-audio, volume-interpolation, reactive-soundscape]

# Dependency graph
requires:
  - phase: 01-sensor-audio-foundation
    provides: AudioEngine singleton with expo-av integration
provides:
  - AmbientAudioController class for Master mode reactive ambient
  - New sound types (spill-dramatic, pothole-bump, ambient-tension)
  - PreloadedSoundName type for one-shot sound separation
  - Placeholder audio assets for testing
affects: [05-03, 05-04, useAudioFeedback integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Volume interpolation at 30fps for click-free transitions
    - Separate type (PreloadedSoundName) for one-shot vs ambient sounds
    - Spill triggers instant silence with delayed gradual rebuild

key-files:
  created:
    - src/audio/AmbientAudioController.ts
    - assets/audio/ambient-tension.m4a
    - assets/audio/spill-dramatic.m4a
    - assets/audio/pothole-bump.m4a
  modified:
    - src/audio/types.ts
    - src/audio/AudioEngine.ts
    - src/audio/FeedbackTrigger.ts

key-decisions:
  - "PreloadedSoundName type for one-shot sounds, SoundName includes ambient"
  - "MIN_VOLUME 0.15, MAX_VOLUME 0.7 - leaves headroom for spill sound"
  - "30fps (33ms interval) volume interpolation for smooth transitions"
  - "2500ms rebuild delay matches spill cooldown from Phase 1"

patterns-established:
  - "Volume interpolation: step toward target at VOLUME_RAMP_SPEED per frame"
  - "Ambient managed separately from one-shot sounds (different lifecycle)"
  - "Spill-triggered silence: instant via setVolumeAsync(0), gradual rebuild after delay"

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 5 Plan 2: Master Mode Ambient Audio Summary

**AmbientAudioController with real-time volume interpolation responding to risk level, instant spill silence, and gradual rebuild**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T11:06:16Z
- **Completed:** 2026-02-03T11:09:53Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Created AmbientAudioController class for Master mode reactive soundscape
- Extended audio type system with PreloadedSoundName for type-safe one-shot/ambient separation
- Added placeholder audio files for spill-dramatic, pothole-bump, and ambient-tension
- Implemented smooth 30fps volume interpolation to eliminate audio clicks

## Task Commits

Each task was committed atomically:

1. **Task 1: Update audio types and create placeholder audio files** - `d5f6d03` (feat)
2. **Task 2: Update AudioEngine with new sound assets** - `5853ed7` (feat)
3. **Task 3: Create AmbientAudioController class** - `2d6b5e2` (feat)

## Files Created/Modified
- `src/audio/AmbientAudioController.ts` - Reactive ambient sound controller with volume interpolation
- `src/audio/types.ts` - Added SoundName variants and PreloadedSoundName type
- `src/audio/AudioEngine.ts` - Registered new sounds, updated to use PreloadedSoundName
- `src/audio/FeedbackTrigger.ts` - Updated to use PreloadedSoundName for type safety
- `assets/audio/ambient-tension.m4a` - Placeholder looping ambient (copy of slosh-light)
- `assets/audio/spill-dramatic.m4a` - Placeholder heavy spill (copy of spill.m4a)
- `assets/audio/pothole-bump.m4a` - Placeholder road impact (copy of slosh-heavy)

## Decisions Made
- **PreloadedSoundName type separation:** Created dedicated type for one-shot sounds that AudioEngine preloads, keeping SoundName as union that includes ambient-tension for type coverage
- **Volume range 0.15-0.7:** MIN_VOLUME at 0.15 is audible baseline, MAX_VOLUME at 0.7 leaves headroom for spill sound to stand out
- **30fps interpolation:** 33ms interval provides smooth perceptual transitions; VOLUME_RAMP_SPEED 0.03 means ~1 second for full transition
- **2500ms rebuild delay:** Matches existing spill cooldown from Phase 1 decisions, creating consistent timing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Type compatibility for AudioEngine and FeedbackTrigger**
- **Found during:** Task 2 (AudioEngine update)
- **Issue:** After adding PreloadedSoundName, AudioEngine.play() and FeedbackTrigger.evaluate() still used SoundName which now included ambient-tension
- **Fix:** Updated both files to use PreloadedSoundName type for one-shot sound methods
- **Files modified:** src/audio/AudioEngine.ts, src/audio/FeedbackTrigger.ts
- **Verification:** TypeScript compiles without audio-related errors
- **Committed in:** 5853ed7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type system update was necessary for correct compilation. No scope creep.

## Issues Encountered
- ffmpeg not available for generating test audio - used existing audio files as placeholders. Real audio assets needed before release.
- Pre-existing TypeScript error in useDriveDetection.ts (unrelated to this plan, ignored)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- AmbientAudioController ready to be wired to useAudioFeedback in Plan 03
- spill-dramatic and pothole-bump sounds loadable via AudioEngine
- Placeholder audio files functional for testing; real assets needed for production quality

---
*Phase: 05-algorithm-refinement*
*Completed: 2026-02-03*
