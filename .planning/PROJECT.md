# Water Cup Driving Coach

## What This Is

An audio-based driving smoothness coach inspired by Initial D's water cup technique. The app uses phone sensors to detect abrupt driving inputs and provides real-time audio feedback — water sloshing sounds when inputs get rough, escalating to a splash when you've "spilled." Built for driving enthusiasts who want touge-level precision.

## Core Value

Real-time audio feedback that trains smooth driving through muscle memory, without visual distraction.

## Requirements

### Validated

**v1.0 MVP (shipped 2026-02-03)**
- Accelerometer + gyroscope capture at 50Hz with gravity compensation — v1.0
- GPS for speed context, location, and drive detection — v1.0
- Low-pass filter (2Hz) removes road vibration noise — v1.0
- Jerk calculation per axis with RMS combination — v1.0
- Spill risk normalization (0-1) with rolling window smoothing — v1.0
- Three difficulty levels (Easy 0.5 G/s, Experienced 0.3 G/s, Master 0.15 G/s) — v1.0
- Pothole detection via Z-axis spikes with difficulty-aware forgiveness — v1.0
- Water slosh sounds (light/medium/heavy) and spill sounds — v1.0
- Master mode ambient audio with risk-reactive volume — v1.0
- Auto-start at 15 km/h, auto-stop after 120s stationary — v1.0
- Manual start/stop override — v1.0
- GPS breadcrumbs every 5 seconds — v1.0
- Event logging with timestamp, type, location, severity — v1.0
- Smoothness score (0-100) per drive — v1.0
- Spill and pothole counts tracked — v1.0
- 5 app screens (Home, Active Drive, Summary, History, Settings) — v1.0
- iOS and Android via React Native / Expo — v1.0
- Background execution with screen off — v1.0
- SQLite persistence for drives and events — v1.0

### Active

**v1.1 Vehicle Integration (planned)**
- [ ] CarPlay audio source registration and controls
- [ ] Android Auto audio source registration and controls
- [ ] Production audio assets (replace placeholders)
- [ ] Audio volume control in Settings (currently placeholder)

### Out of Scope

- OBD-II integration — deferred to V2, adds hardware dependency
- Cloud sync / social features — adds complexity, local-first better for offline car use
- Gamification beyond basic scoring — keep it focused on skill development
- Route planning / navigation — separate concern, many dedicated apps exist
- Visual CarPlay/Android Auto UI — audio-only for safety
- Pothole location mapping — requires crowdsourcing infrastructure
- Insurance integration — conflicts with enthusiast positioning
- Real-time visual display while driving — defeats audio-only safety premise

## Context

**Current state (v1.0 shipped):**
- 8,587 lines of TypeScript across 5 phases
- Tech stack: React Native, Expo, Drizzle ORM, expo-av, expo-location
- 116 commits over 3 days (Feb 1-3, 2026)
- All core functionality implemented and device-tested

**Known issues:**
- Audio assets are placeholders (copies of existing sounds)
- Audio volume control shows "Coming Soon" in Settings
- Android Maps requires Google Maps API key configuration
- 24 items require human verification (battery, road conditions, etc.)

**Inspiration:** Initial D's water cup training technique — Takumi's father placed a cup of water in the car to train smooth driving. Spill the water, you're driving too rough.

## Constraints

- **Platform**: React Native / Expo — cross-platform requirement
- **Audio latency**: Must be under 100ms from sensor input to sound
- **Background**: Must run efficiently in background for auto-start detection
- **Car integration**: CarPlay/Android Auto audio source only, no visual UI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phone sensors only for V1 | Reduce complexity, OBD-II adds hardware dependency | Good |
| Audio-only CarPlay/AA | Visual UI adds complexity and safety concerns | Good |
| Three difficulty levels | Provides progression path for skill development | Good |
| Pothole forgiveness by difficulty | Master level rewards reading the road | Good |
| 50Hz sensor sampling | Balance between accuracy and battery | Good |
| SQLite for persistence | Simple, reliable, no cloud dependency | Good |
| expo-av over react-native-audio-api | Better Expo compatibility, simpler API | Good |
| Zone-based audio triggers | Prevents audio spam, graduated feedback | Good |
| Pure state machine for drive detection | Testable, no side effects | Good |
| DeviceMotion.acceleration | Already gravity-compensated by OS | Good |
| 2Hz low-pass filter | Preserves driving dynamics, removes vibration | Good |
| Z-axis excluded from jerk magnitude | Vertical is road surface, not smoothness | Good |
| UUID primary keys | Enables future cross-device sync | Good |
| Zustand persist middleware | Clean settings/difficulty persistence | Good |

---
*Last updated: 2026-02-03 after v1.0 milestone*
