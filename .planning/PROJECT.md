# Water Cup Driving Coach

## What This Is

An audio-based driving smoothness coach inspired by Initial D's water cup technique. The app uses phone sensors to detect abrupt driving inputs and provides real-time audio feedback — water sloshing sounds when inputs get rough, escalating to a splash when you've "spilled." Built for driving enthusiasts who want touge-level precision.

## Core Value

Real-time audio feedback that trains smooth driving through muscle memory, without visual distraction.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Sensor Processing**
- [ ] Accelerometer capture for lateral/longitudinal G-forces at 50Hz
- [ ] Gyroscope capture for yaw rate
- [ ] GPS for speed context and location
- [ ] Low-pass filter (1-2Hz cutoff) to remove road vibration
- [ ] Gravity compensation to isolate movement from phone tilt

**Smoothness Engine**
- [ ] Jerk calculation per axis (ΔG / Δt)
- [ ] Combined jerk via RMS (√(jerkLat² + jerkLong²))
- [ ] Spill risk normalization (0-1) based on combined jerk vs threshold
- [ ] Rolling window (~500ms) for smoothing
- [ ] Three difficulty levels with distinct thresholds

**Pothole Detection**
- [ ] Z-axis spike detection (<300ms duration)
- [ ] Rear wheel follow-up spike detection
- [ ] Difficulty-aware forgiveness (Easy/Experienced forgive, Master counts)

**Audio Feedback**
- [ ] Water slosh sounds triggered by rising risk
- [ ] Splash sounds triggered on spill
- [ ] Difficulty-specific audio behavior (ambient hum for Master)
- [ ] Sub-100ms latency from input to sound
- [ ] Proper ducking/mixing with other audio sources

**Drive Detection & Recording**
- [ ] Auto-start when speed > 15 km/h for 5+ seconds
- [ ] Auto-stop when speed < 5 km/h for 60+ seconds
- [ ] Manual start/stop override
- [ ] GPS breadcrumbs every 5 seconds
- [ ] Event logging with timestamps and locations
- [ ] Smoothness scoring (0-100)

**App Screens**
- [ ] Home screen with start button, difficulty selector, recent drives
- [ ] Active drive screen with minimal UI, spill count, streak display
- [ ] Drive summary with map, event markers, score breakdown
- [ ] History list with filtering and sorting
- [ ] Settings for difficulty, volume, auto-start, calibration

**Platform Integration**
- [ ] iOS and Android via React Native / Expo
- [ ] CarPlay audio source registration
- [ ] Android Auto audio source registration
- [ ] Background execution for drive detection
- [ ] Battery-efficient background operation

**Data Persistence**
- [ ] SQLite for drive history
- [ ] Drive model with route, events, scores
- [ ] Event model with type, location, severity, forgiven flag

### Out of Scope

- OBD-II integration — deferred to V2
- Cloud sync / social features — adds complexity without core value
- Gamification beyond basic scoring — keep it focused
- Route planning / navigation — separate concern
- Visual CarPlay/Android Auto UI — audio-only for V1
- Pothole location mapping and warnings — V2 feature

## Context

**Inspiration:** Initial D's water cup training technique — Takumi's father placed a cup of water in the car to train smooth driving. Spill the water, you're driving too rough.

**Technical environment:**
- React Native / Expo for cross-platform
- Phone sensors (accelerometer, gyroscope, GPS) for V1
- OBD-II planned for V2 with tiered data source approach

**Key libraries identified:**
- `expo-sensors` or `react-native-sensors` for accelerometer/gyroscope
- `expo-location` for GPS and background location
- `expo-av` or `react-native-sound` for low-latency audio
- `react-native-carplay` for CarPlay integration
- `react-native-android-auto` for Android Auto
- SQLite or WatermelonDB for persistence

**Difficulty levels defined:**

| Level | Jerk Threshold | Spill Trigger | Pothole Handling |
|-------|---------------|---------------|------------------|
| Easy | 0.5 G/s | risk > 0.8 | Forgiven |
| Experienced | 0.3 G/s | risk > 0.6 | Forgiven |
| Master | 0.15 G/s | risk > 0.4 | Counts as spill |

## Constraints

- **Platform**: React Native / Expo — cross-platform requirement
- **Audio latency**: Must be under 100ms from sensor input to sound
- **Background**: Must run efficiently in background for auto-start detection
- **Car integration**: CarPlay/Android Auto audio source only, no visual UI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phone sensors only for V1 | Reduce complexity, OBD-II adds hardware dependency | — Pending |
| Audio-only CarPlay/AA | Visual UI adds complexity and safety concerns | — Pending |
| Three difficulty levels | Provides progression path for skill development | — Pending |
| Pothole forgiveness by difficulty | Master level rewards reading the road | — Pending |
| 50Hz sensor sampling | Balance between accuracy and battery | — Pending |
| SQLite for persistence | Simple, reliable, no cloud dependency | — Pending |

---
*Last updated: 2026-02-01 after initialization*
