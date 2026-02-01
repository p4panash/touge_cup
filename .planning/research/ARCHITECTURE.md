# Architecture Research

**Domain:** Real-time sensor-to-audio feedback mobile app (driving coach)
**Researched:** 2026-02-01
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
+-----------------------------------------------------------------------+
|                        PRESENTATION LAYER                              |
+-----------------------------------------------------------------------+
|  +------------------+  +------------------+  +------------------+      |
|  | React Native UI  |  | CarPlay Scene    |  | Android Auto     |      |
|  | (Phone Display)  |  | (Vehicle Display)|  | (Vehicle Display)|      |
|  +--------+---------+  +--------+---------+  +--------+---------+      |
|           |                     |                     |                |
+-----------+---------------------+---------------------+----------------+
|                        STATE LAYER (Zustand)                           |
+-----------------------------------------------------------------------+
|  +------------------+  +------------------+  +------------------+      |
|  | DriveState       |  | SensorState      |  | AudioState       |      |
|  | (session/events) |  | (filtered data)  |  | (playback state) |      |
|  +--------+---------+  +--------+---------+  +--------+---------+      |
|           |                     |                     |                |
+-----------+---------------------+---------------------+----------------+
|                        PROCESSING LAYER                                |
+-----------------------------------------------------------------------+
|  +------------------+  +------------------+  +------------------+      |
|  | Sensor Pipeline  |  | Jerk Calculator  |  | Spill Risk       |      |
|  | (low-pass filter)|  | (delta G/dt)     |  | Normalizer (0-1) |      |
|  +--------+---------+  +--------+---------+  +--------+---------+      |
|           |                     |                     |                |
|           v                     v                     v                |
|  +------------------+  +------------------+  +------------------+      |
|  | Trip Detector    |  | Event Logger     |  | Audio Trigger    |      |
|  | (start/stop)     |  | (SQLite)         |  | (threshold check)|      |
|  +--------+---------+  +--------+---------+  +--------+---------+      |
|           |                     |                     |                |
+-----------+---------------------+---------------------+----------------+
|                        NATIVE BRIDGE LAYER                             |
+-----------------------------------------------------------------------+
|  +------------------+  +------------------+  +------------------+      |
|  | CoreMotion       |  | Audio Engine     |  | Background       |      |
|  | (iOS sensors)    |  | (react-native-   |  | Geolocation      |      |
|  | Android Sensors  |  |  audio-api)      |  | (transistorsoft) |      |
|  +------------------+  +------------------+  +------------------+      |
|                                                                        |
+-----------+---------------------+---------------------+----------------+
|                        DATA PERSISTENCE                                |
+-----------------------------------------------------------------------+
|  +------------------+  +------------------+  +------------------+      |
|  | Drive Sessions   |  | Event Log        |  | Settings         |      |
|  | (SQLite)         |  | (SQLite)         |  | (AsyncStorage)   |      |
|  +------------------+  +------------------+  +------------------+      |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Sensor Pipeline** | Sample, filter, transform raw sensor data at 50Hz | Native module with low-pass IIR filter (alpha ~0.1) |
| **Jerk Calculator** | Compute rate of G-force change from filtered acceleration | `jerk = (currentG - previousG) / deltaTime` |
| **Spill Risk Normalizer** | Convert jerk magnitude to 0-1 risk score | Sigmoid or threshold-based normalization |
| **Audio Trigger** | Fire audio cues when risk exceeds thresholds | AudioContext.play() with pre-loaded buffers |
| **Trip Detector** | Auto-detect drive start/stop using motion + location | react-native-background-geolocation motion API |
| **Event Logger** | Persist timestamped events with location | SQLite with time-series schema |
| **DriveState** | Track active drive session, cumulative scores | Zustand store with persistence |
| **CarPlay/Android Auto Scene** | Render simplified UI for vehicle displays | react-native-carplay template system |

## Recommended Project Structure

```
src/
+-- sensors/                    # Sensor data acquisition and processing
|   +-- SensorManager.ts        # Initialize and manage sensor streams
|   +-- filters/
|   |   +-- LowPassFilter.ts    # IIR low-pass implementation
|   |   +-- KalmanFilter.ts     # Optional: noise reduction
|   +-- processors/
|       +-- JerkCalculator.ts   # G-force rate of change
|       +-- SpillRisk.ts        # Risk normalization (0-1)
|
+-- audio/                      # Audio engine and feedback
|   +-- AudioEngine.ts          # AudioContext management
|   +-- SoundBank.ts            # Pre-loaded audio buffers
|   +-- triggers/
|       +-- SpillFeedback.ts    # Risk-based audio selection
|
+-- drive/                      # Drive session management
|   +-- TripDetector.ts         # Auto start/stop detection
|   +-- DriveSession.ts         # Session state and lifecycle
|   +-- EventRecorder.ts        # Log events with timestamps
|
+-- stores/                     # State management (Zustand)
|   +-- useDriveStore.ts        # Active drive state
|   +-- useSensorStore.ts       # Current sensor readings
|   +-- useSettingsStore.ts     # User preferences
|
+-- screens/                    # UI components
|   +-- DrivingScreen.tsx       # Active drive display
|   +-- HistoryScreen.tsx       # Past drives list
|   +-- DriveDetailScreen.tsx   # Single drive analysis
|
+-- carplay/                    # CarPlay/Android Auto integration
|   +-- CarPlayManager.ts       # Scene lifecycle
|   +-- templates/              # CarPlay template configurations
|
+-- database/                   # Data persistence
|   +-- schema.ts               # SQLite table definitions
|   +-- repositories/
|       +-- DriveRepository.ts  # Drive CRUD
|       +-- EventRepository.ts  # Event CRUD
|
+-- native/                     # Native module bridges (if needed)
    +-- ios/                    # CoreMotion optimizations
    +-- android/                # Android sensor optimizations
```

### Structure Rationale

- **sensors/:** Isolated pipeline makes it testable and swappable. Filter coefficients can be tuned independently.
- **audio/:** Separation from sensors enables pre-loading sounds on app launch; trigger logic stays clean.
- **drive/:** Session management is complex (auto-detect, pause, resume); deserves dedicated module.
- **stores/:** Zustand for high-frequency state updates without Redux boilerplate. Fast re-renders critical for 50Hz data.
- **carplay/:** CarPlay requires iOS Scene architecture; isolated module simplifies testing without device.

## Architectural Patterns

### Pattern 1: Pipeline Architecture for Sensor Data

**What:** Chain of transformation stages: Raw Data -> Filter -> Calculate -> Normalize -> Trigger
**When to use:** High-frequency data processing with clear transformation steps
**Trade-offs:** Clear separation (+), may add latency if stages are async (-); keep synchronous for <100ms requirement

**Example:**
```typescript
// Synchronous pipeline for minimum latency
class SensorPipeline {
  private lowPass: LowPassFilter;
  private jerkCalc: JerkCalculator;
  private riskNorm: SpillRiskNormalizer;

  process(rawAccel: Vector3): SpillRiskEvent {
    const filtered = this.lowPass.apply(rawAccel);
    const jerk = this.jerkCalc.compute(filtered);
    const risk = this.riskNorm.normalize(jerk);
    return { risk, timestamp: Date.now(), raw: rawAccel };
  }
}
```

### Pattern 2: Pre-loaded Audio Buffer Pool

**What:** Load all audio files into memory buffers on app start; trigger by index
**When to use:** Low-latency audio feedback where disk I/O would add delay
**Trade-offs:** Fast playback (+), higher memory usage (-); acceptable for short audio cues

**Example:**
```typescript
// Pre-load sounds into AudioBuffer pool
class SoundBank {
  private buffers: Map<string, AudioBuffer> = new Map();

  async preload(audioContext: AudioContext) {
    const sounds = ['gentle-warning', 'moderate-warning', 'spill-alert'];
    for (const name of sounds) {
      const response = await fetch(`sounds/${name}.wav`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set(name, audioBuffer);
    }
  }

  play(name: string, audioContext: AudioContext) {
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0); // Immediate playback
  }
}
```

### Pattern 3: Motion-Aware Background Execution

**What:** Use accelerometer to detect motion, only engage GPS when moving
**When to use:** Background location tracking that needs battery efficiency
**Trade-offs:** Excellent battery life (+), 4-minute stop detection delay typical (-)

**Implementation:** react-native-background-geolocation handles this natively with configurable `stationaryRadius` and `stopTimeout` parameters.

### Pattern 4: Zustand Slices for High-Frequency Updates

**What:** Separate stores by update frequency to prevent unnecessary re-renders
**When to use:** When some state updates at 50Hz (sensors) and some rarely (settings)
**Trade-offs:** Optimal re-render performance (+), more stores to manage (-)

**Example:**
```typescript
// Sensor store - updates at 50Hz, minimal subscribers
const useSensorStore = create<SensorState>((set) => ({
  currentRisk: 0,
  filteredAccel: { x: 0, y: 0, z: 0 },
  updateSensor: (risk, accel) => set({ currentRisk: risk, filteredAccel: accel }),
}));

// Drive store - updates rarely, many subscribers
const useDriveStore = create<DriveState>((set) => ({
  isActive: false,
  sessionId: null,
  startTime: null,
  eventCount: 0,
  // ... drive session management
}));
```

## Data Flow

### Request Flow: Sensor Sample to Audio Trigger

```
[Sensor Event @ 50Hz]
    |
    v
[Native Sensor Manager] --> [Timestamp + Raw Vector3]
    |
    v
[Low-Pass Filter] --> [Smoothed Vector3] (removes road vibration)
    |
    v
[Jerk Calculator] --> [Jerk Magnitude (m/s^3)]
    |
    v
[Spill Risk Normalizer] --> [Risk Score 0-1]
    |
    v
[Threshold Check]
    |
    +-- risk < 0.3 --> [No audio]
    |
    +-- risk 0.3-0.6 --> [Gentle warning sound]
    |
    +-- risk 0.6-0.8 --> [Moderate warning sound]
    |
    +-- risk > 0.8 --> [Spill alert sound]
    |
    v
[Audio Engine] --> [Pre-loaded buffer playback]
    |
    v
[Event Logger] --> [SQLite: {timestamp, location, risk, audioPlayed}]
```

### State Management Flow

```
[Sensor Pipeline]
    | (50Hz updates)
    v
[useSensorStore] <-- Minimal subscribers (just the risk meter UI)
    |
    | (threshold crossed)
    v
[useDriveStore.addEvent()] <-- Session event count, cumulative score
    |
    v
[SQLite via EventRepository] <-- Persistent storage
```

### Background Execution Flow (iOS)

```
[App enters background]
    |
    v
[react-native-background-geolocation starts]
    |
    +-- Accelerometer sampling (low power)
    |
    +-- Motion detected? --> [Engage GPS, start sensor pipeline]
    |
    +-- Stationary for 4 min? --> [Disable GPS, power-save mode]
    |
    v
[Drive ends] --> [Session saved to SQLite]
    |
    v
[App terminated] --> [stopOnTerminate: false keeps tracking]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user (MVP) | Local SQLite only, no sync. All processing on-device. |
| Multi-device sync | Add sync layer: CloudKit/Firebase for drive history. Keep sensor processing local. |
| Fleet/enterprise | Add server-side analytics. Batch upload completed drives. Never stream raw sensor data. |

### Scaling Priorities

1. **First bottleneck: Memory** - Audio buffers + sensor history can accumulate. Cap in-memory event buffer at 1000 samples, flush to SQLite.
2. **Second bottleneck: Battery** - Aggressive GPS usage drains battery. Motion-aware background execution is critical.
3. **Third bottleneck: Storage** - Long drives at 50Hz = ~180K samples/hour. Archive old drives, delete raw sensor data after processing.

## Anti-Patterns

### Anti-Pattern 1: Processing Sensors on JS Thread

**What people do:** Handle sensor events directly in React component with `useState`
**Why it's wrong:** 50Hz updates cause constant re-renders, JS thread blocks, latency spikes to 200ms+
**Do this instead:** Process in native module or worklet, only update JS state when thresholds crossed or at reduced frequency (e.g., 10Hz for UI)

### Anti-Pattern 2: Loading Audio Files on Trigger

**What people do:** `await Audio.load('sound.mp3')` when threshold crossed
**Why it's wrong:** File I/O adds 50-200ms latency, breaking sub-100ms requirement
**Do this instead:** Pre-load all audio into memory buffers on app launch. Trigger by buffer reference.

### Anti-Pattern 3: Continuous GPS in Background

**What people do:** Keep GPS active 24/7 for "always-on" tracking
**Why it's wrong:** Drains battery in hours, Apple may reject app, users will uninstall
**Do this instead:** Use motion detection to wake GPS only when vehicle is moving. 4-minute stationary timeout is acceptable.

### Anti-Pattern 4: Storing Raw Sensor Data Long-Term

**What people do:** Save every 50Hz sample to SQLite for "detailed analysis later"
**Why it's wrong:** 1 hour drive = 180K rows per sensor. Database bloat, slow queries.
**Do this instead:** Store processed events (threshold crossings) with timestamps. Aggregate statistics per drive. Discard raw data after session ends.

### Anti-Pattern 5: Redux for High-Frequency Sensor State

**What people do:** Dispatch Redux action for every sensor sample
**Why it's wrong:** Redux middleware chain adds latency; DevTools can't handle 50Hz; overkill for ephemeral state
**Do this instead:** Zustand with no middleware for sensor state. Redux only if you need time-travel debugging for drive session logic.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| CarPlay | react-native-carplay templates | Requires Scene architecture (iOS 13+). Audio category entitlement needed. |
| Android Auto | @g4rb4g3/react-native-carplay fork | Same API as CarPlay. Requires New Architecture (TurboModules). |
| GPS/Location | react-native-background-geolocation | License required for release builds. Motion-detection built in. |
| Crash/Analytics | Optional: Firebase/Sentry | Don't log sensor data to analytics - too much volume. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Sensor Pipeline -> Audio Engine | Direct function call | Must be synchronous for latency. No async boundaries. |
| Sensor Pipeline -> State Store | Zustand set() | Batched updates at reduced frequency for UI. |
| Drive Session -> SQLite | Repository pattern | Async writes OK since not latency-critical. |
| React Native -> CarPlay Scene | Event emitter | Scenes share memory; use native events for cross-scene communication. |

## Build Order Implications

Based on the architecture, recommended build order for phases:

1. **Foundation (Build First)**
   - Sensor Pipeline (filters, jerk calculation)
   - Audio Engine with pre-loaded buffers
   - Basic state management (Zustand stores)
   - Reason: These are core loop components. Everything else depends on them.

2. **Drive Management (Build Second)**
   - Trip detection (start/stop)
   - Event logging to SQLite
   - Drive session state
   - Reason: Requires working sensor pipeline. Enables testing end-to-end flow.

3. **UI/UX (Build Third)**
   - Phone UI screens
   - Drive history views
   - Settings
   - Reason: Needs working drive sessions to have content to display.

4. **Vehicle Integration (Build Last)**
   - CarPlay integration
   - Android Auto integration
   - Reason: Requires Apple entitlement approval (weeks). Core app must work first.

## Sources

### High Confidence (Official Documentation)
- [Apple Core Motion Documentation](https://developer.apple.com/documentation/coremotion/)
- [React Native Audio API Documentation](https://docs.swmansion.com/react-native-audio-api/docs/)
- [Android Sensor Stack](https://source.android.com/docs/core/interaction/sensors/sensor-stack)

### Medium Confidence (Verified with Multiple Sources)
- [react-native-background-geolocation Architecture](https://www.transistorsoft.com/shop/products/react-native-background-geolocation)
- [Zustand vs Redux for State Management](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns)
- [Low-Pass Filter for Android Sensors](http://kircherelectronics.com/index.php/2017/12/28/android-acceleration-sensors-low-pass-filter/)
- [Jerk-based Feature Extraction for Activity Recognition](https://ieeexplore.ieee.org/document/6121760/)
- [DriveQuant Automatic Trip Detection](https://blog.drivequant.com/automatic-trip-detection-smartphone-telematics-tech)

### Low Confidence (Needs Validation During Implementation)
- Exact alpha value for low-pass filter may need tuning based on device/vehicle
- 4-minute stop detection delay from DriveQuant may differ in react-native-background-geolocation
- CarPlay entitlement approval timeline varies

---
*Architecture research for: Water Cup Driving Coach*
*Researched: 2026-02-01*
