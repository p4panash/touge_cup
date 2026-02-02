# Requirements: Water Cup Driving Coach

**Defined:** 2026-02-01
**Core Value:** Real-time audio feedback that trains smooth driving through muscle memory, without visual distraction.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Sensor Processing

- [ ] **SENS-01**: Accelerometer captures lateral and longitudinal G-forces at 50Hz sampling rate
- [ ] **SENS-02**: Gyroscope captures yaw rate for rotation detection
- [ ] **SENS-03**: GPS provides speed context and location during drives
- [ ] **SENS-04**: Low-pass filter (1-2Hz cutoff) removes road vibration from sensor data
- [ ] **SENS-05**: Gravity compensation isolates movement from phone tilt/orientation

### Smoothness Engine

- [ ] **SMTH-01**: Jerk calculation per axis (dG / dt) measures rate of G-force change
- [ ] **SMTH-02**: Combined jerk computed via RMS (sqrt(jerkLat^2 + jerkLong^2))
- [ ] **SMTH-03**: Spill risk normalization produces 0-1 value based on jerk vs threshold
- [ ] **SMTH-04**: Rolling window (~500ms) smooths transient spikes
- [ ] **SMTH-05**: Three difficulty levels with distinct thresholds (Easy: 0.5 G/s, Experienced: 0.3 G/s, Master: 0.15 G/s)

### Pothole Detection

- [ ] **POTH-01**: Z-axis spike detection identifies potholes (<300ms duration spikes)
- [ ] **POTH-02**: Difficulty-aware forgiveness (Easy/Experienced forgive potholes, Master counts as spills)

### Audio Feedback

- [ ] **AUDI-01**: Water slosh sounds play when spill risk exceeds threshold (Easy: 0.6, Experienced: 0.4, Master: 0.25)
- [ ] **AUDI-02**: Splash sound plays on spill event
- [ ] **AUDI-03**: Difficulty-specific audio behavior (Master has ambient hum, dramatic splash + streak broken)
- [ ] **AUDI-04**: Audio feedback latency under 100ms from sensor input to sound
- [ ] **AUDI-05**: Audio ducks and mixes properly with other audio sources (music, podcasts)

### Drive Detection & Recording

- [ ] **DRIV-01**: Auto-start when GPS speed > 15 km/h for 5+ seconds
- [ ] **DRIV-02**: Auto-stop when GPS speed < 5 km/h for 60+ seconds
- [ ] **DRIV-03**: Manual start/stop override always available
- [x] **DRIV-04**: GPS breadcrumbs recorded every 5 seconds during drive
- [x] **DRIV-05**: Events logged with timestamp, type, location, and severity

### Scoring & Metrics

- [x] **SCOR-01**: Smoothness score (0-100) calculated for each drive
- [x] **SCOR-02**: Spill count tracked per drive
- [x] **SCOR-03**: Pothole count tracked per drive
- [x] **SCOR-04**: Event severity tracked (how far over threshold)

### App Screens

- [ ] **SCRN-01**: Home screen displays start button, difficulty selector, and recent drives summary
- [ ] **SCRN-02**: Active drive screen shows minimal UI with spill count and current streak
- [ ] **SCRN-03**: Drive summary screen displays post-drive stats, map with event markers, and score breakdown
- [ ] **SCRN-04**: History screen lists past drives with filtering by difficulty and sorting by score/date
- [ ] **SCRN-05**: Settings screen provides difficulty selection, audio volume, auto-start toggle, and sensor calibration

### Platform & Infrastructure

- [ ] **PLAT-01**: App runs on iOS via React Native / Expo
- [ ] **PLAT-02**: App runs on Android via React Native / Expo
- [ ] **PLAT-03**: Background execution allows drive detection and recording with screen off
- [x] **PLAT-04**: SQLite database stores drive history and events locally
- [ ] **PLAT-05**: Battery-efficient background operation (<10% for 1-hour drive)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Vehicle Integration

- **VINT-01**: CarPlay audio source registration and controls
- **VINT-02**: Android Auto audio source registration and controls

### Enhanced Scoring

- **ESCR-01**: Per-segment scoring breaks down drive into segments with individual scores

### OBD-II Integration

- **OBDI-01**: Bluetooth LE connection to OBD-II adapter
- **OBDI-02**: Vehicle speed from OBD replaces/supplements GPS
- **OBDI-03**: Throttle position monitoring for throttle smoothness
- **OBDI-04**: Tiered data source approach (OBD -> phone sensors fallback)

### Analytics

- **ANLY-01**: Trend graphs showing improvement over time
- **ANLY-02**: Route-specific scoring and same-route comparisons
- **ANLY-03**: Export functionality for drive data

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Cloud sync / social features | Adds complexity, privacy concerns, local-first better for offline car use |
| Leaderboards / competition | Incentivizes risky driving, conflicts with skill development focus |
| Gamification beyond basic scoring | Enthusiasts want mastery, not Candy Crush mechanics |
| Route planning / navigation | Separate concern, many dedicated apps exist |
| Visual CarPlay/Android Auto UI | Audio-only by design to avoid driver distraction |
| Pothole location mapping | V2+ feature, requires crowdsourcing infrastructure |
| Insurance integration | Conflicts with enthusiast positioning, feels like surveillance |
| Mandatory cloud requirements | Privacy concerns, app must work fully offline |
| Real-time visual display while driving | Defeats audio-only safety premise |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SENS-01 | Phase 1 | Pending |
| SENS-02 | Phase 1 | Pending |
| SENS-03 | Phase 2 | Pending |
| SENS-04 | Phase 1 | Pending |
| SENS-05 | Phase 1 | Pending |
| SMTH-01 | Phase 1 | Pending |
| SMTH-02 | Phase 1 | Pending |
| SMTH-03 | Phase 1 | Pending |
| SMTH-04 | Phase 1 | Pending |
| SMTH-05 | Phase 5 | Pending |
| POTH-01 | Phase 5 | Pending |
| POTH-02 | Phase 5 | Pending |
| AUDI-01 | Phase 1 | Pending |
| AUDI-02 | Phase 1 | Pending |
| AUDI-03 | Phase 5 | Pending |
| AUDI-04 | Phase 1 | Pending |
| AUDI-05 | Phase 1 | Pending |
| DRIV-01 | Phase 2 | Pending |
| DRIV-02 | Phase 2 | Pending |
| DRIV-03 | Phase 2 | Pending |
| DRIV-04 | Phase 3 | Pending |
| DRIV-05 | Phase 3 | Pending |
| SCOR-01 | Phase 3 | Pending |
| SCOR-02 | Phase 3 | Pending |
| SCOR-03 | Phase 3 | Pending |
| SCOR-04 | Phase 3 | Pending |
| SCRN-01 | Phase 4 | Pending |
| SCRN-02 | Phase 4 | Pending |
| SCRN-03 | Phase 4 | Pending |
| SCRN-04 | Phase 4 | Pending |
| SCRN-05 | Phase 4 | Pending |
| PLAT-01 | Phase 4 | Pending |
| PLAT-02 | Phase 4 | Pending |
| PLAT-03 | Phase 2 | Pending |
| PLAT-04 | Phase 3 | Pending |
| PLAT-05 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after roadmap creation*
