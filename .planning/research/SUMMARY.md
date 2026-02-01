# Project Research Summary

**Project:** Touge Cup - Water Cup Driving Coach
**Domain:** Real-time sensor-based mobile app with audio feedback
**Researched:** 2026-02-01
**Confidence:** MEDIUM-HIGH

## Executive Summary

Touge Cup is a driving smoothness coach that uses smartphone sensors to provide real-time audio feedback, filling a unique market gap between track-focused apps (lap times) and insurance/fleet apps (safety monitoring). The product targets driving enthusiasts who want to improve their skills on public roads through immediate feedback, using the cultural metaphor of keeping water in a cup from Initial D.

The recommended approach uses React Native/Expo SDK 54 with critical native modules for low-latency audio (react-native-audio-api, <10ms latency) and high-frequency sensor sampling (expo-sensors at 50Hz). The core technical challenge is maintaining sub-100ms end-to-end latency from sensor event to audio playback while operating reliably in background mode. Success depends on jerk-based smoothness measurement (rate of G-force change) rather than simple acceleration thresholds, validated by academic research as superior for comfort assessment.

Key risks center on platform-specific sensor throttling (Android 12+ requires explicit permissions for high-rate sampling), background execution termination (iOS/Android aggressive battery optimization), and audio latency accumulation (Bluetooth adds 100-300ms). Mitigation requires early validation of actual sensor rates on target devices, proper background mode architecture with foreground services, and pre-loaded audio buffers with measurement-mode audio sessions. CarPlay/Android Auto integration should be deferred until core functionality is proven, with entitlement applications submitted early due to weeks-long approval timelines.

## Key Findings

### Recommended Stack

The stack prioritizes real-time performance and native module integration over cross-platform convenience. Expo SDK 54 provides the foundation with React Native 0.79+ and New Architecture enabled by default, allowing native modules through Continuous Native Generation without ejecting. This modern Expo approach is critical - traditional Expo Go cannot run the required native modules.

**Core technologies:**
- **Expo SDK 54 + React Native 0.79+**: Modern app framework with native module support via development builds
- **react-native-audio-api (v0.11.2)**: Software Mansion's Web Audio API implementation achieving <10ms latency, verified in production by Odisei Music
- **expo-sensors (~16.0.x)**: Native accelerometer/gyroscope access with 50Hz sampling support (requires HIGH_SAMPLING_RATE_SENSORS permission on Android 12+)
- **expo-sqlite + drizzle-orm**: Local relational database with type-safe ORM, useLiveQuery hook for reactive UI, built-in migrations
- **react-native-track-player (v4.1)**: Background audio session management, Now Playing controls, required for CarPlay/Android Auto integration
- **expo-location + expo-task-manager**: Background GPS monitoring for drive detection and route tracking

**Critical exclusions:**
- **expo-av**: Deprecated, being removed in SDK 55
- **expo-audio**: Not designed for low-latency real-time feedback, adds significant delay
- **Expo Go**: Cannot run native modules - must use Expo Development Client or EAS Build

### Expected Features

Research reveals a clear feature hierarchy distinguishing table stakes from competitive differentiators. Users expect basic functionality matching telemetry apps (drive recording, scoring, history) but the unique value proposition lies in audio-only feedback using the water cup metaphor.

**Must have (table stakes):**
- Real-time audio feedback within 100ms of driving events (core value proposition)
- Drive recording with auto-start/stop detection (standard in all telemetry apps)
- Numerical score per drive (0-100 scale for quantifying improvement)
- Event markers with timestamps (harsh brake, acceleration, cornering)
- Adjustable sensitivity/difficulty levels (different skill levels need different thresholds)
- Map view of drive route with event pins (visual context for where events occurred)
- Background operation with screen off (critical for in-car use)

**Should have (competitive differentiators):**
- **Jerk-based smoothness metric**: Measures rate of G-force change, not just magnitude - academic research validates this as superior comfort proxy (1 m/s³ optimal, 10 m/s³ maximum threshold)
- **Water slosh/splash audio feedback**: Unique sonic signature tied to Initial D culture, no visual distraction, enables muscle memory training
- **Pothole/road imperfection forgiveness**: Z-axis spike detection to distinguish driver error from road conditions - no competitor does this well
- **Progressive difficulty with skill gating**: Easy -> Experienced -> Master progression borrowed from iRacing license model
- **Enthusiast-focused positioning**: Not insurance, fleet, or teen monitoring - targets people who want to improve driving skill

**Defer (v2+):**
- OBD-II integration (optional enhancement requiring hardware dependency)
- Advanced analytics and trend graphs
- Route-specific scoring and same-route comparisons
- Export functionality
- Pothole crowdsourcing

**Anti-features to avoid:**
- Visual real-time display while driving (defeats audio-only safety premise)
- Leaderboards/social competition (incentivizes risky driving)
- Insurance integration (conflicts with enthusiast positioning, surveillance feel)
- Mandatory cloud sync (privacy concerns, local-first better for offline car use)
- Excessive gamification (enthusiasts want mastery, not Candy Crush)

### Architecture Approach

The architecture follows a synchronous pipeline pattern for sensor processing to minimize latency, with clear separation between high-frequency sensor state (50Hz updates) and low-frequency session state. The system architecture uses a layered approach: Presentation (React Native UI + CarPlay templates) -> State (Zustand stores by update frequency) -> Processing (sensor pipeline, jerk calculator, audio trigger) -> Native Bridge (CoreMotion, AudioContext, background geolocation) -> Data Persistence (SQLite).

**Major components:**
1. **Sensor Pipeline** — Synchronous chain of low-pass filtering, jerk calculation, and risk normalization operating at 50Hz with sub-100ms end-to-end latency requirement
2. **Audio Engine** — Pre-loaded buffer pool using AudioContext for immediate playback, no disk I/O during triggers to avoid latency
3. **Trip Detector** — Motion-aware background execution using accelerometer to wake GPS only when vehicle moving, achieving battery efficiency through 4-minute stationary timeout
4. **Event Logger** — Stores processed events (threshold crossings) with timestamps, not raw sensor data, to prevent database bloat (1 hour = 180K samples if unfiltered)
5. **State Management** — Zustand slices separated by update frequency: high-frequency sensor state (minimal subscribers) isolated from low-frequency drive session state (many subscribers)

**Critical patterns:**
- **Pipeline Architecture**: Synchronous transformation chain (Raw -> Filter -> Calculate -> Normalize -> Trigger) to maintain latency budget
- **Pre-loaded Audio Buffers**: All sounds loaded into memory at app launch, referenced by index for instant playback
- **Motion-Aware Background**: Accelerometer-triggered GPS activation, not continuous polling, for battery efficiency
- **Separate State Stores**: High-frequency sensor state isolated from low-frequency UI state to prevent unnecessary re-renders

### Critical Pitfalls

Research identified six critical pitfalls that could derail the project if not addressed during appropriate phases:

1. **Android Sensor Sampling Rate Throttling** — Setting 50Hz (20ms intervals) doesn't guarantee actual 50Hz on Android. OS throttles sensors differently by OEM, actual intervals can be 2-5x slower. Android 12+ requires explicit HIGH_SAMPLING_RATE_SENSORS permission for <200ms intervals. **Prevention:** Add permission to manifest, measure actual sampling rate at runtime using sensor event timestamps (not wall clock), calculate jerk using actual time deltas. Validate on Samsung/Pixel/OnePlus devices early.

2. **Background Sensor Access Termination** — Android 9+ restricts background apps from receiving continuous sensor events. Samsung/Xiaomi/Huawei have aggressive battery optimization killing foreground services. iOS suspends apps after ~10 seconds without proper background modes. **Prevention:** Register location + audio background modes (iOS), use foreground service with notification + partial wake lock (Android), prompt users to disable battery optimization, test on actual OEM devices not just Pixel.

3. **Audio Latency Destroying Feedback Loop** — Bluetooth adds 100-300ms encoding/transmission latency. iOS default audio session adds ~30ms for noise cancellation. expo-av has JS bridge overhead. **Prevention:** Use audio session "measurement" mode on iOS, warn users about Bluetooth latency and recommend wired/car speakers, preload all audio clips at app startup, use react-native-audio-api not expo-audio, test with Superpowered Latency Test app to measure actual device latency.

4. **Confusing Potholes with Bad Driving** — Pothole vibrations and harsh braking both produce accelerometer spikes. Simple threshold detection has 20-30% false negative rates. Different vehicles have different suspension characteristics. **Prevention:** Use frequency analysis (potholes have different vibration signature), combine accelerometer with gyroscope, apply Kalman or complementary filter, use time-domain features (potholes are sharp spikes, braking is sustained), allow user-reported false positives for algorithm improvement.

5. **CarPlay/Android Auto App Rejection** — CarPlay requires entitlement approval before submission (weeks), not after. Audio app must fit narrow category definition. MediaBrowserService callbacks must be complete. **Prevention:** Apply for CarPlay entitlement early in Phase 0, read full CarPlay App Programming Guide, implement complete MediaBrowserService with onGetRoot() and onLoadChildren(), never include text like "pick up your phone", test all flows without touching phone.

6. **iOS Motion Sensor Permission Rejection** — Apple rejects generic NSMotionUsageDescription strings. Requesting all permissions at launch appears suspicious. **Prevention:** Write specific usage string explaining battery-saving rationale, request motion permission only when user first starts drive session (not at launch), explain in onboarding why motion + location both needed.

## Implications for Roadmap

Based on research dependencies and risk mitigation, the roadmap should follow this phase structure:

### Phase 1: Sensor & Audio Foundation
**Rationale:** These are the core differentiators and highest-risk components. Audio latency and sensor sampling must be validated early before building dependent features. Architecture research shows this is the "build first" component - everything else depends on it.

**Delivers:**
- Accelerometer/gyroscope sampling at validated 50Hz on target Android/iOS devices
- Low-pass filtering pipeline for noise reduction
- Jerk calculation engine using actual timestamp deltas
- Pre-loaded audio buffer system with <100ms end-to-end latency
- Manual drive start/stop controls
- Basic risk threshold detection and audio trigger

**Addresses Features:**
- Real-time audio feedback (table stakes)
- Jerk-based smoothness (differentiator)
- Water slosh/splash audio (differentiator)

**Avoids Pitfalls:**
- Android sensor throttling (validate actual Hz on 3+ devices)
- Audio latency (measure with test app, target <100ms total)

**Dependencies:** None - this is foundational

### Phase 2: Background Execution & Permissions
**Rationale:** Background modes must be architected early as they affect all subsequent features. Trip detection depends on background capability. CarPlay/Android Auto won't work without proper background audio sessions. Permissions flow determines user onboarding experience.

**Delivers:**
- iOS background modes (location + audio) configuration
- Android foreground service with notification
- Auto-start/stop trip detection using motion awareness
- Proper permission request flow (motion in context, not at launch)
- Battery optimization prompt for OEM devices

**Uses Stack:**
- expo-location with background location updates
- expo-task-manager for background coordination
- react-native-track-player for background audio session

**Addresses Features:**
- Background operation (table stakes)
- Auto-start/stop detection (table stakes)

**Avoids Pitfalls:**
- Background sensor termination (test 30-min background run on Samsung)
- iOS motion permission rejection (context-based permission request)
- Battery drain (motion-aware GPS, not continuous polling)

**Dependencies:** Phase 1 (needs working sensor pipeline to test background)

### Phase 3: Drive Session Management
**Rationale:** With sensors and background working, can now build persistent session tracking. Architecture research shows this is "build second" - requires working sensor pipeline but enables end-to-end flow.

**Delivers:**
- SQLite schema with Drizzle ORM (drives, sensor_events tables)
- Event recording with timestamps and location context
- Drive session state management (active session tracking)
- Basic score calculation (0-100 scale based on event count/severity)
- Drive history persistence

**Uses Stack:**
- expo-sqlite + drizzle-orm for type-safe database
- expo-location for GPS breadcrumbs during drive

**Implements Architecture:**
- Event Logger component
- DriveSession lifecycle management
- Repository pattern for database access

**Addresses Features:**
- Drive recording (table stakes)
- Score per drive (table stakes)
- Event markers (table stakes)

**Dependencies:** Phase 1 (sensor pipeline), Phase 2 (background execution)

### Phase 4: UI & User Experience
**Rationale:** UI comes after core functionality is proven. Architecture research categorizes this as "build third" - needs working drive sessions to have content to display.

**Delivers:**
- Active driving screen with minimal UI (audio-focused)
- Drive history list with scores
- Drive detail screen with event timeline
- Map visualization with route polyline and event pins
- Settings screen (difficulty, volume, sound previews)
- Onboarding flow with permission explanations

**Uses Stack:**
- react-native-reanimated for smooth animations
- date-fns for duration/timestamp formatting
- Native map component for route display

**Addresses Features:**
- Map view (table stakes)
- Adjustable sensitivity (table stakes)
- Settings persistence (table stakes)

**Dependencies:** Phase 3 (needs drive data to display)

### Phase 5: Algorithm Refinement
**Rationale:** Pothole forgiveness is complex and requires real-world driving data to tune. Progressive difficulty needs user testing data. This should come after MVP is in users' hands.

**Delivers:**
- Z-axis spike detection for pothole identification
- Frequency analysis to distinguish road imperfections from driver input
- Progressive difficulty levels (Easy -> Experienced -> Master) with different thresholds
- User calibration flow for phone position/vehicle type
- False positive reporting mechanism

**Addresses Features:**
- Pothole forgiveness (differentiator)
- Progressive difficulty (differentiator)

**Avoids Pitfalls:**
- Pothole vs driving confusion (test on known bumpy roads, verify <10% false positive rate)

**Dependencies:** Phase 4 (needs users and real-world data)

### Phase 6: Vehicle Integration (Optional/Future)
**Rationale:** CarPlay/Android Auto adds polish but requires weeks for entitlement approval and complex integration. Defer until core product is validated. Architecture research labels this "build last."

**Delivers:**
- CarPlay NowPlaying template with react-native-carplay
- Android Auto MediaBrowserService implementation
- Simplified in-car controls (start/stop, difficulty)
- Integration with react-native-track-player for media controls

**Uses Stack:**
- @g4rb4g3/react-native-carplay (fork with Android Auto support)
- react-native-track-player (already integrated in Phase 2)

**Addresses Features:**
- CarPlay/Android Auto audio source (differentiator)

**Avoids Pitfalls:**
- CarPlay rejection (apply for entitlement in Phase 0, build in Phase 6)
- Android Auto MediaBrowserService incomplete (implement all required callbacks)

**Dependencies:** Phase 2 (background audio session), Phase 4 (UI proven)

### Phase Ordering Rationale

This order follows the "build first/second/third/last" recommendations from architecture research:

1. **Foundation first** - Sensors and audio are the highest-risk components with unique technical constraints. Validating latency and sampling rates early prevents costly architecture changes later.

2. **Background second** - Background modes affect all features and must be stable before building on top. Trip detection is a key user experience element that depends on background capability.

3. **Session management third** - Database schema is easier to change early. Getting the session lifecycle right enables meaningful testing of the complete flow.

4. **UI fourth** - Interface design is easier to iterate with working backend. Users can test core functionality before polish.

5. **Algorithm refinement fifth** - Pothole detection requires real-world data. Progressive difficulty needs user feedback. Don't optimize prematurely.

6. **Vehicle integration last** - CarPlay/Android Auto requires entitlement approval (apply early) but implementation should wait until core product is proven. This is polish, not core value.

**Dependency chain:**
- Phase 1 has no dependencies (foundation)
- Phase 2 depends on Phase 1 (needs sensors to test background)
- Phase 3 depends on Phases 1-2 (needs both to record sessions)
- Phase 4 depends on Phase 3 (needs data to display)
- Phase 5 depends on Phase 4 (needs users for algorithm tuning)
- Phase 6 depends on Phase 2 + 4 (needs background audio + proven UI)

### Research Flags

**Phases needing deeper research during planning:**

- **Phase 1 (Sensor Foundation)**: HIGH - Must research actual sensor sampling behavior on target Android devices (Samsung, OnePlus, Pixel). Need to investigate specific low-pass filter coefficients and Kalman filter implementation for noise reduction. Audio latency measurement methodology needs detailed research.

- **Phase 2 (Background Execution)**: HIGH - OEM-specific battery optimization behaviors not fully documented. Samsung/Xiaomi/Huawei require device-specific testing. iOS background location best practices need deep dive into UIBackgroundModes configuration.

- **Phase 5 (Algorithm Refinement)**: MEDIUM - Pothole detection may require signal processing or ML expertise. Time-domain vs frequency-domain feature extraction needs research. May need academic papers on vibration signature analysis.

**Phases with standard patterns (skip research-phase):**

- **Phase 3 (Session Management)**: Standard CRUD operations with SQLite. Drizzle ORM documentation is comprehensive. No unique domain challenges.

- **Phase 4 (UI/UX)**: Standard React Native patterns. Map integration well-documented. No novel UI patterns required.

- **Phase 6 (Vehicle Integration)**: CarPlay and Android Auto have comprehensive official documentation. Implementation is well-understood (just strict requirements).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommended technologies verified via official docs and production usage. react-native-audio-api latency claims validated by Odisei Music case study. Expo SDK 54 capabilities confirmed via changelog and official docs. |
| Features | MEDIUM | Feature expectations cross-verified with multiple competitor apps (RaceChrono, Samsara, DriveSafe Pro, DriveQuant). Jerk-based metric validated by academic research. Enthusiast positioning inferred from market gap analysis. |
| Architecture | MEDIUM | Pipeline pattern and pre-loaded buffers are established patterns for low-latency systems. react-native-background-geolocation motion-aware approach documented by Transistorsoft. Zustand slice pattern based on React best practices. Some tuning will be needed. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls verified across multiple sources. Android sensor throttling documented in react-native-sensors GitHub issues and Expo docs. Background termination covered by dontkillmyapp.com and official Android docs. Audio latency researched via Superpowered and Android official docs. |

**Overall confidence:** MEDIUM-HIGH

The stack is well-validated with high confidence. Architecture patterns are sound but will require tuning during implementation. Pitfalls are well-researched with clear prevention strategies. The main uncertainty is in algorithm refinement (pothole detection, jerk thresholds) which requires real-world data collection and tuning - this is expected and should be deferred to Phase 5 after MVP validation.

### Gaps to Address

Gaps identified where research was inconclusive or needs validation during implementation:

- **Exact low-pass filter coefficient (alpha value)**: Research indicates alpha ~0.1 for accelerometer smoothing, but optimal value depends on device sensor noise and vehicle type. **Handle during Phase 1:** Start with alpha=0.1, implement tunable coefficient, measure signal-to-noise ratio on target devices, adjust based on empirical testing.

- **Jerk threshold values for difficulty levels**: Academic research provides comfort thresholds (1 m/s³ optimal, 10 m/s³ max) but mapping these to Easy/Experienced/Master difficulty needs user testing. **Handle during Phase 5:** Start with research thresholds, collect user feedback on "too sensitive" vs "too lenient", adjust thresholds based on 90th percentile user tolerance.

- **Bluetooth latency mitigation**: Research confirms Bluetooth adds 100-300ms but strategies for user education vs technical compensation unclear. **Handle during Phase 1:** Measure latency on common Bluetooth devices (AirPods, car systems), determine if temporal offset adjustment is viable, or if user warning is sufficient approach.

- **CarPlay entitlement approval timeline**: Sources indicate "weeks" but no specific SLA from Apple. **Handle during Phase 0:** Submit CarPlay entitlement request immediately after project kickoff, track approval timeline, plan Phase 6 scheduling based on actual approval date.

- **Battery consumption targets**: Research suggests <1% per 24hrs for background geolocation but no benchmarks for combined sensors + audio + GPS. **Handle during Phase 2:** Establish baseline battery measurement (1-hour drive test), target <10% battery consumption for 1-hour drive, measure on multiple devices, optimize if above target.

- **Android Auto beta stability**: @g4rb4g3/react-native-carplay fork claims Android Auto support but marked as beta. **Handle during Phase 6:** Test on actual Android Auto head units early in phase, allocate contingency time for debugging, consider iOS-first release if Android Auto unstable.

## Sources

### Primary (HIGH confidence)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) - New Architecture, expo-background-task, feature verification
- [Expo Sensors Documentation](https://docs.expo.dev/versions/latest/sdk/accelerometer/) - Sensor API, HIGH_SAMPLING_RATE_SENSORS permission requirement
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/) - Background location configuration, startLocationUpdatesAsync
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) - Database API, version ~16.0.10
- [React Native Audio API Docs](https://docs.swmansion.com/react-native-audio-api/) - <10ms latency verification, Web Audio API implementation
- [React Native Track Player Docs](https://rntp.dev/) - Background playback, media controls, v4.1 features
- [Drizzle ORM - Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite) - Type-safe ORM, useLiveQuery hook, migration tooling
- [Apple Core Motion Documentation](https://developer.apple.com/documentation/coremotion/) - iOS sensor stack
- [Android Sensor Stack](https://source.android.com/docs/core/interaction/sensors/sensor-stack) - Android sensor architecture
- [CarPlay App Programming Guide](https://developer.apple.com/carplay/documentation/CarPlay-App-Programming-Guide.pdf) - Official CarPlay requirements
- [Android Auto Media Apps](https://developer.android.com/training/cars/media) - MediaBrowserService implementation

### Secondary (MEDIUM confidence)
- [Jerk for Aggressive Driver Identification](https://www.sciencedirect.com/science/article/abs/pii/S0001457517301409) - Academic validation of jerk metric
- [Comfort-related jerk thresholds](https://www.researchgate.net/figure/Comfort---related-acceleration-and-jerk-value-ranges-for-common-maneuvers_tbl1_326546961) - 1 m/s³ optimal, 10 m/s³ max
- [DriveQuant SDK Docs](https://docs.drivequant.com/) - Trip detection patterns, event scoring methodology
- [Sentiance Driving Insights](https://docs.sentiance.com/sentiance-insights/overview-of-sentiance-insights/driving-insights/driving-events-and-scores) - Event definitions, score calculation
- [GreenRoad In-Vehicle Feedback](https://greenroad.com/solutions/in-vehicle-feedback-2/) - Real-time coaching approach
- [Transistorsoft Background Geolocation](https://www.transistorsoft.com/shop/products/react-native-background-geolocation) - Motion-aware GPS, battery optimization
- [react-native-sensors Issue #163](https://github.com/react-native-sensors/react-native-sensors/issues/163) - Android sensor throttling documentation
- [Don't Kill My App](https://dontkillmyapp.com/) - OEM battery optimization behaviors
- [MDPI Pothole Detection Study](https://www.mdpi.com/1424-8220/20/19/5564) - Sensor-based pothole detection algorithms
- [Kalman Filter for GPS/Accelerometer](https://maddevs.io/blog/reduce-gps-data-error-on-android-with-kalman-filter-and-accelerometer/) - Noise reduction techniques
- [Superpowered Audio Latency Primer](https://superpowered.com/android-audio-low-latency-primer) - Android audio latency measurement
- [Low-Pass Filter for Android Sensors](http://kircherelectronics.com/index.php/2017/12/28/android-acceleration-sensors-low-pass-filter/) - IIR filter implementation

### Tertiary (LOW confidence - needs validation)
- [Haptic Feedback in Cars Review](https://www.frontiersin.org/journals/ict/articles/10.3389/fict.2018.00005/full) - Audio vs haptic effectiveness (academic, needs empirical validation for this use case)
- [@g4rb4g3/react-native-carplay npm](https://www.npmjs.com/package/@g4rb4g3/react-native-carplay) - Android Auto beta status (fork, less proven than main library)
- iRacing license progression model - Referenced for difficulty progression pattern but not officially documented

---
*Research completed: 2026-02-01*
*Ready for roadmap: yes*
