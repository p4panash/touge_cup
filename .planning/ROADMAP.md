# Roadmap: Water Cup Driving Coach

## Overview

This roadmap delivers a driving smoothness coach that uses smartphone sensors to provide real-time audio feedback, training drivers through the Initial D water cup metaphor. The journey progresses from validating core sensor and audio latency (highest risk), through background execution and session management, to UI polish and algorithm refinement. Each phase delivers a coherent capability that can be tested independently before building the next layer.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Sensor & Audio Foundation** - Validate core differentiators: 50Hz sensor sampling and sub-100ms audio latency
- [ ] **Phase 2: Background Execution & Permissions** - Enable drive detection and recording with screen off
- [ ] **Phase 3: Drive Session Management** - Persist drives, events, and scores to local database
- [ ] **Phase 4: UI & User Experience** - Build all app screens and cross-platform deployment
- [ ] **Phase 5: Algorithm Refinement** - Implement difficulty progression and pothole forgiveness

## Phase Details

### Phase 1: Sensor & Audio Foundation
**Goal**: User receives audio feedback within 100ms of driving inputs, using jerk-based smoothness detection
**Depends on**: Nothing (first phase)
**Requirements**: SENS-01, SENS-02, SENS-04, SENS-05, SMTH-01, SMTH-02, SMTH-03, SMTH-04, AUDI-01, AUDI-02, AUDI-04, AUDI-05
**Success Criteria** (what must be TRUE):
  1. Accelerometer and gyroscope data streams at validated 50Hz on both iOS and Android test devices
  2. Water slosh sounds play when user accelerates, brakes, or corners abruptly
  3. Splash sound plays when user exceeds spill threshold
  4. Audio feedback occurs within 100ms of sensor input (measured with test app)
  5. Audio plays correctly alongside music or podcasts without cutting them off
**Plans**: TBD

Plans:
- [ ] 01-01: Sensor pipeline (accelerometer, gyroscope, filtering, gravity compensation)
- [ ] 01-02: Smoothness engine (jerk calculation, risk normalization, rolling window)
- [ ] 01-03: Audio feedback system (pre-loaded buffers, triggers, latency validation)

### Phase 2: Background Execution & Permissions
**Goal**: App detects drives automatically and continues recording with screen off or app backgrounded
**Depends on**: Phase 1
**Requirements**: SENS-03, DRIV-01, DRIV-02, DRIV-03, PLAT-03, PLAT-05
**Success Criteria** (what must be TRUE):
  1. App auto-starts recording when user drives above 15 km/h for 5+ seconds
  2. App auto-stops recording when user is stationary for 60+ seconds
  3. User can manually start and stop drives at any time, overriding auto-detection
  4. Drive detection and audio feedback continue working with screen off for 30+ minutes
  5. Battery consumption is under 10% for a 1-hour drive
**Plans**: TBD

Plans:
- [ ] 02-01: GPS integration and speed monitoring
- [ ] 02-02: Background modes and foreground service implementation
- [ ] 02-03: Auto-start/stop logic and permission flow

### Phase 3: Drive Session Management
**Goal**: Drives are persisted with route data, events, and scores that survive app restarts
**Depends on**: Phase 2
**Requirements**: DRIV-04, DRIV-05, SCOR-01, SCOR-02, SCOR-03, SCOR-04, PLAT-04
**Success Criteria** (what must be TRUE):
  1. Completed drives appear in a list after app restart
  2. Each drive has a smoothness score from 0-100
  3. Each drive shows spill count and pothole count
  4. GPS breadcrumbs are recorded every 5 seconds during drives
  5. Events are logged with timestamp, type, location, and severity
**Plans**: TBD

Plans:
- [ ] 03-01: SQLite schema and Drizzle ORM setup
- [ ] 03-02: Drive session lifecycle and event logging
- [ ] 03-03: Score calculation engine

### Phase 4: UI & User Experience
**Goal**: User can navigate all app screens and the app runs on both iOS and Android
**Depends on**: Phase 3
**Requirements**: SCRN-01, SCRN-02, SCRN-03, SCRN-04, SCRN-05, PLAT-01, PLAT-02
**Success Criteria** (what must be TRUE):
  1. Home screen displays start button, difficulty selector, and recent drives
  2. Active drive screen shows minimal UI with spill count and current streak
  3. Drive summary screen displays map with route polyline and event markers
  4. History screen lists past drives with filtering by difficulty and sorting options
  5. Settings screen allows difficulty selection, volume adjustment, and sensor calibration
**Plans**: TBD

Plans:
- [ ] 04-01: Home and active drive screens
- [ ] 04-02: Drive summary and history screens
- [ ] 04-03: Settings screen and onboarding flow

### Phase 5: Algorithm Refinement
**Goal**: Smoothness detection adapts to user skill level and forgives road imperfections
**Depends on**: Phase 4
**Requirements**: SMTH-05, AUDI-03, POTH-01, POTH-02
**Success Criteria** (what must be TRUE):
  1. Easy mode has looser thresholds (0.5 G/s) than Master mode (0.15 G/s)
  2. Potholes are detected via Z-axis spikes and marked separately from driver errors
  3. Easy and Experienced modes forgive potholes; Master mode counts them as spills
  4. Master mode plays ambient hum and dramatic splash sounds with streak-broken feedback
**Plans**: TBD

Plans:
- [ ] 05-01: Difficulty level system with distinct thresholds
- [ ] 05-02: Pothole detection and forgiveness logic

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Sensor & Audio Foundation | 0/3 | Not started | - |
| 2. Background Execution & Permissions | 0/3 | Not started | - |
| 3. Drive Session Management | 0/3 | Not started | - |
| 4. UI & User Experience | 0/3 | Not started | - |
| 5. Algorithm Refinement | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-01*
*Total plans: 14 (estimated, refined during planning)*
*Total v1 requirements: 36 mapped*
