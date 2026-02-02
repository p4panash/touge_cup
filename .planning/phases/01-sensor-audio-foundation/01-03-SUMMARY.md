---
phase: 01-sensor-audio-foundation
plan: 03
subsystem: audio-feedback
tags: [audio-engine, expo-av, feedback-trigger, sensor-pipeline, device-verification]

# Dependency graph
requires: [01-01, 01-02]
provides:
  - Audio engine with pre-loaded buffers via expo-av
  - Risk-to-sound feedback trigger with cooldowns
  - Complete sensor-to-audio pipeline integration
  - Device-verified audio feedback system
affects: [02-01, drive-session, ui-screens]

# Tech tracking
tech-stack:
  added: [expo-av]
  removed: [react-native-audio-api]
  patterns: [zone-based-audio-trigger, expo-av-preloading, spill-cooldown]

key-files:
  created:
    - src/audio/types.ts
    - src/audio/AudioEngine.ts
    - src/audio/SoundBank.ts
    - src/audio/FeedbackTrigger.ts
    - src/stores/useAudioStore.ts
    - src/hooks/useSensorPipeline.ts
    - src/hooks/useAudioFeedback.ts
    - assets/audio/slosh-light.mp3
    - assets/audio/slosh-medium.mp3
    - assets/audio/slosh-heavy.mp3
    - assets/audio/spill.mp3
  modified:
    - App.tsx

key-decisions:
  - "Switched from react-native-audio-api to expo-av - better Expo compatibility and simpler API"
  - "Zone-based audio trigger (0-0.3, 0.3-0.5, 0.5-0.7, 0.7+) for graduated feedback"
  - "2500ms spill cooldown (middle of 2-3s range) prevents rapid-fire spills"
  - "Relative paths for audio imports - works with Metro bundler"
  - "Zone resets after cooldown expires - allows new feedback cycle"

patterns-established:
  - "expo-av Audio.Sound for low-latency playback with preloading"
  - "Zone-based trigger: track current zone, only play on zone transitions"
  - "Reactive lastPlayedSound for UI feedback display"

# Metrics
duration: ~30min (includes device verification)
completed: 2026-02-02
---

# Phase 01 Plan 03: Audio Feedback Summary

Complete audio feedback system with pre-loaded sounds, graduated risk-to-sound mapping, and verified device playback.

## What Was Built

### Audio Engine (expo-av)
Initially implemented with react-native-audio-api, but switched to expo-av for better Expo compatibility:
- `AudioEngine.initialize()` - preloads all sounds on app start
- `AudioEngine.play(soundName)` - instant playback from pre-loaded buffers
- Uses `Audio.Sound` with `shouldPlay: false` for preloading
- iOS audio mode configured for mixing with other audio

### SoundBank
Pre-loads 4 audio files for instant playback:
- slosh-light.mp3 - gentle water movement (risk 0.3-0.5)
- slosh-medium.mp3 - moderate slosh (risk 0.5-0.7)
- slosh-heavy.mp3 - dramatic slosh (risk 0.7+)
- spill.mp3 - splash sound on spill event

### FeedbackTrigger
Zone-based sound selection with cooldowns:

| Risk Zone | Sound | Behavior |
|-----------|-------|----------|
| 0 - 0.3 | none | Silence = smooth driving |
| 0.3 - 0.5 | slosh-light | Gentle warning |
| 0.5 - 0.7 | slosh-medium | Moderate warning |
| 0.7 - 1.0 | slosh-heavy | Strong warning |
| isSpill | spill | Overrides zone, triggers cooldown |

- 2500ms spill cooldown prevents rapid-fire spills
- Zone tracking prevents repeated plays within same zone
- Zone resets after cooldown expires

### Pipeline Hooks
- `useSensorPipeline()` - manages sensor subscription lifecycle, settling period
- `useAudioFeedback()` - subscribes to risk changes, triggers audio via FeedbackTrigger

### App Integration
- Audio engine initializes before main content renders
- Debug UI shows: Start/Stop, settling status, current risk, last played sound
- Full pipeline: DeviceMotion → Filter → Jerk → Risk → Audio

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| expo-av over react-native-audio-api | Better Expo integration, simpler API, no native rebuild issues |
| Zone-based triggers | Prevents audio spam, only plays on meaningful threshold crossings |
| 2500ms cooldown | Middle of 2-3s range per CONTEXT.md, balances feedback vs annoyance |
| Relative audio paths | Metro bundler resolves correctly, no path issues |

## Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
| react-native-audio-api | expo-av | Native module issues with Expo, expo-av simpler |
| AudioContext buffer management | Audio.Sound preloading | expo-av pattern, equally low-latency |

## Device Verification Results

Tested on physical device:
- Sensor data streaming at ~50Hz
- Audio plays within perceptible 100ms of movement
- Graduated sounds play at correct risk thresholds
- Spill cooldown working (2.5s between spills)
- Background music ducks appropriately on iOS

## Files Changed

| File | Change |
|------|--------|
| src/audio/types.ts | Created - SoundName, AudioState types |
| src/audio/AudioEngine.ts | Created - expo-av engine with preloading |
| src/audio/SoundBank.ts | Created - sound preloading map |
| src/audio/FeedbackTrigger.ts | Created - risk-to-sound mapping |
| src/stores/useAudioStore.ts | Created - audio state management |
| src/hooks/useSensorPipeline.ts | Created - sensor lifecycle hook |
| src/hooks/useAudioFeedback.ts | Created - audio trigger hook |
| assets/audio/*.mp3 | Created - 4 audio files |
| App.tsx | Modified - full pipeline integration |

## Commits

| Hash | Message |
|------|---------|
| 2586f5d | feat(01-03): implement audio engine with preloading and ducking |
| 8f3897e | feat(01-03): implement feedback trigger and full pipeline integration |
| a15ac7a | fix(01-03): use relative paths for audio asset imports |
| 08b1904 | fix(01-03): reliable audio playback and zone-based UI |
| 059c61c | fix(01-03): reset zone after cooldown, reactive lastPlayedSound |
| 4a4e917 | refactor(01-03): switch audio engine from react-native-audio-api to expo-av |

## Phase 1 Complete

All Phase 1 success criteria met:
1. ✅ Accelerometer data streams at 50Hz (via DeviceMotion)
2. ✅ Water slosh sounds play on rough inputs
3. ✅ Splash sound plays on spill
4. ✅ Audio feedback within 100ms (verified on device)
5. ✅ Audio mixes with background music (iOS ducking)

Ready for Phase 2: Background Execution & Permissions

---
*Plan 01-03 completed: 2026-02-02*
