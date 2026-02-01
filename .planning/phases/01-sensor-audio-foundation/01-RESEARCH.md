# Phase 1: Sensor & Audio Foundation - Research

**Researched:** 2026-02-01
**Domain:** Real-time sensor processing and low-latency audio feedback for mobile driving coach
**Confidence:** HIGH

## Summary

Phase 1 establishes the core real-time pipeline: sensor input to audio output within 100ms. This research covers three domains: (1) sensor acquisition and filtering using Expo DeviceMotion/Sensors, (2) jerk-based smoothness calculation with gravity compensation and low-pass filtering, and (3) low-latency audio playback using react-native-audio-api.

The standard approach uses **expo-sensors** for accelerometer/gyroscope data at 50Hz, **Expo DeviceMotion** for gravity-compensated acceleration, and **react-native-audio-api** (Software Mansion) for sub-10ms audio latency. The smoothness engine calculates jerk (rate of acceleration change) per axis, combines via RMS, and normalizes to a 0-1 spill risk value. A 500ms rolling window smooths transient spikes before triggering graduated audio feedback.

Key findings: (1) DeviceMotion provides `acceleration` with gravity already removed, simplifying the pipeline; (2) react-native-audio-api achieves <10ms latency when buffers are pre-loaded; (3) Android 12+ requires `HIGH_SAMPLING_RATE_SENSORS` permission for 50Hz sampling; (4) Audio session configuration with `duckOthers` enables music mixing without cutting off other apps.

**Primary recommendation:** Use DeviceMotion for gravity-compensated acceleration, pre-load all audio buffers at app start, and configure iOS audio session with `duckOthers` option for proper mixing behavior.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **expo-sensors** | ~16.0.x | Accelerometer, Gyroscope access | Native Expo module with `setUpdateInterval()` for 50Hz sampling. Bundled with Expo SDK 54. |
| **expo-sensors (DeviceMotion)** | ~16.0.x | Gravity-compensated acceleration + rotation | Provides `acceleration` (gravity removed) and `rotationRate` in single subscription. Eliminates manual gravity compensation. |
| **react-native-audio-api** | 0.11.2 | Low-latency audio playback | Software Mansion's Web Audio API implementation. <10ms latency proven in production (Odisei Music). Only RN solution capable of sub-100ms feedback. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zustand** | 5.x | Sensor state management | High-frequency updates (50Hz) without Redux overhead. Separate stores for sensor vs drive state. |
| **expo-asset** | ~11.0.x | Audio file loading | Required to get local file paths for `decodeAudioDataSource()`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DeviceMotion | Raw Accelerometer + manual gravity removal | More control but requires sensor fusion algorithm; DeviceMotion handles this natively |
| react-native-audio-api | expo-audio | expo-audio is designed for media playback, not low-latency feedback; no sub-100ms guarantee |
| react-native-audio-api | react-native-sound | Less maintained; react-native-audio-api has better API and active development |

**Installation:**
```bash
# Core Expo modules (already in Expo SDK 54)
npx expo install expo-sensors expo-asset

# Low-latency audio (requires development build)
npm install react-native-audio-api

# State management
npm install zustand

# After adding native module, rebuild
npx expo prebuild
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  sensors/
    DeviceMotionManager.ts     # Subscribe to DeviceMotion, manage lifecycle
    filters/
      LowPassFilter.ts         # IIR low-pass filter (1-2Hz cutoff)
    processors/
      JerkCalculator.ts        # dG/dt per axis
      SpillRiskNormalizer.ts   # Combined jerk to 0-1 risk
      RollingWindow.ts         # 500ms smoothing window

  audio/
    AudioEngine.ts             # AudioContext management, preloading
    SoundBank.ts               # Pre-loaded audio buffers
    FeedbackTrigger.ts         # Risk threshold to sound mapping
    AudioSessionConfig.ts      # iOS/Android session setup

  stores/
    useSensorStore.ts          # Current risk, filtered values (50Hz updates)
    useAudioStore.ts           # Playback state, cooldowns

  hooks/
    useSensorPipeline.ts       # Combines sensor -> filter -> jerk -> risk
    useAudioFeedback.ts        # Triggers audio based on risk thresholds
```

### Pattern 1: Synchronous Pipeline for Minimum Latency
**What:** Chain of transformation stages that execute synchronously on each sensor event
**When to use:** When end-to-end latency must be <100ms
**Example:**
```typescript
// Source: Architecture research + Web Audio API patterns
class SensorPipeline {
  private lowPass: LowPassFilter;
  private jerkCalc: JerkCalculator;
  private riskNorm: SpillRiskNormalizer;
  private rollingWindow: RollingWindow;

  process(accel: { x: number; y: number; z: number }, timestamp: number): number {
    // All synchronous - no async boundaries
    const filtered = this.lowPass.apply(accel);
    const jerk = this.jerkCalc.compute(filtered, timestamp);
    const instantRisk = this.riskNorm.normalize(jerk);
    const smoothedRisk = this.rollingWindow.add(instantRisk);
    return smoothedRisk;
  }
}
```

### Pattern 2: Pre-loaded Audio Buffer Pool
**What:** Load all audio files into AudioBuffer objects at app start, trigger by reference
**When to use:** Any real-time audio feedback where disk I/O would add latency
**Example:**
```typescript
// Source: react-native-audio-api documentation
import { AudioContext, decodeAudioData } from 'react-native-audio-api';
import { Asset } from 'expo-asset';

class SoundBank {
  private audioContext: AudioContext;
  private buffers: Map<string, AudioBuffer> = new Map();

  async preload() {
    this.audioContext = new AudioContext();

    const sounds = [
      { name: 'slosh-light', asset: require('@/assets/audio/slosh-light.mp3') },
      { name: 'slosh-medium', asset: require('@/assets/audio/slosh-medium.mp3') },
      { name: 'slosh-heavy', asset: require('@/assets/audio/slosh-heavy.mp3') },
      { name: 'spill', asset: require('@/assets/audio/spill.mp3') },
    ];

    for (const sound of sounds) {
      const asset = await Asset.fromModule(sound.asset).downloadAsync();
      if (!asset.localUri) throw new Error(`Failed to load ${sound.name}`);
      const buffer = await this.audioContext.decodeAudioDataSource(asset.localUri);
      this.buffers.set(sound.name, buffer);
    }
  }

  play(name: string) {
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(this.audioContext.currentTime); // Immediate playback
  }
}
```

### Pattern 3: Graduated Audio Intensity
**What:** Map continuous risk value to discrete sound intensity levels
**When to use:** When feedback should teach nuance (light jerk vs hard jerk)
**Example:**
```typescript
// Based on user decision: graduated intensity
function selectSound(risk: number, isSpill: boolean): string | null {
  if (isSpill) return 'spill';

  // Thresholds from requirements (Easy mode: 0.6 trigger)
  if (risk < 0.3) return null;           // Silence = smooth driving
  if (risk < 0.5) return 'slosh-light';  // Gentle slosh
  if (risk < 0.7) return 'slosh-medium'; // Moderate slosh
  return 'slosh-heavy';                   // Dramatic slosh
}
```

### Pattern 4: Cooldown State Machine
**What:** Prevent rapid-fire spills with state-based cooldown
**When to use:** After spill event to avoid punishing one bad moment repeatedly
**Example:**
```typescript
// Based on user decision: ~2-3 second cooldown after spill
class SpillCooldown {
  private inCooldown = false;
  private cooldownMs = 2500; // User decision: 2-3 seconds

  canTriggerSpill(): boolean {
    return !this.inCooldown;
  }

  startCooldown() {
    this.inCooldown = true;
    setTimeout(() => {
      this.inCooldown = false;
    }, this.cooldownMs);
  }
}
```

### Anti-Patterns to Avoid

- **Processing sensors on JS thread with useState:** 50Hz updates cause constant re-renders, JS thread blocks, latency spikes to 200ms+. Use Zustand with minimal subscribers.
- **Loading audio files on trigger:** File I/O adds 50-200ms latency. Pre-load all audio at app launch.
- **Async boundaries in sensor pipeline:** Each await adds potential latency. Keep filter -> jerk -> risk synchronous.
- **Single store for all state:** Mixing 50Hz sensor state with rarely-changing settings causes unnecessary re-renders.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gravity compensation | Manual sensor fusion with quaternions | `DeviceMotion.acceleration` | Already gravity-compensated by OS. Handles phone orientation changes automatically. |
| Low-latency audio | Custom native module | react-native-audio-api | Proven <10ms latency, Web Audio API compatible, actively maintained by Software Mansion |
| Audio buffer decoding | Manual file reading + decoding | `audioContext.decodeAudioDataSource()` | Handles mp3/wav/aac decoding, returns ready AudioBuffer |
| Audio session configuration | Manual AVAudioSession code | `AudioManager.setAudioSessionOptions()` | Provides all iOS options including duckOthers |
| Rolling window smoothing | Array manipulation each frame | Circular buffer with running sum | O(1) updates instead of O(n) recalculation |

**Key insight:** The OS and libraries handle complex sensor fusion and audio routing better than custom code. Focus on the unique logic (jerk thresholds, audio mapping) rather than low-level infrastructure.

## Common Pitfalls

### Pitfall 1: Android Sensor Throttling
**What goes wrong:** Setting 20ms (50Hz) update interval doesn't guarantee 50Hz on Android. Actual rates can be 2-5x slower.
**Why it happens:** Android OS manages sensors for battery. Different OEMs (Samsung vs Pixel) throttle differently. Android 12+ has 200ms default limit.
**How to avoid:**
1. Add permission to app.json:
```json
{
  "expo": {
    "android": {
      "permissions": ["android.permission.HIGH_SAMPLING_RATE_SENSORS"]
    }
  }
}
```
2. Use timestamps from sensor events, not assumed intervals
3. Calculate jerk using actual deltaTime: `jerk = (currentG - previousG) / actualDeltaSeconds`

**Warning signs:** Smoothness scores differ between iOS and Android; jerk values unusually smooth on Android

### Pitfall 2: Audio Latency from Bluetooth
**What goes wrong:** Audio feedback plays 200-500ms after driving event. Feedback feels disconnected.
**Why it happens:** Bluetooth encoding/transmission adds 100-300ms latency beyond wired audio path.
**How to avoid:**
1. User decision: Accept Bluetooth latency, don't warn or compensate
2. Ensure wired/speaker path is optimal (pre-loaded buffers, no disk I/O)
3. Test with car Bluetooth during development, not just wired

**Warning signs:** Users report feedback "feeling delayed" when using Bluetooth

### Pitfall 3: Music Cutoff Instead of Ducking
**What goes wrong:** App's feedback sounds cut off Spotify/podcasts completely instead of briefly ducking.
**Why it happens:** Wrong iOS audio session category or missing `duckOthers` option.
**How to avoid:**
```typescript
import { AudioManager } from 'react-native-audio-api';

AudioManager.setAudioSessionOptions({
  iosCategory: 'playback',
  iosMode: 'default',
  iosOptions: ['mixWithOthers', 'duckOthers'],
});
```
**Warning signs:** Other apps' audio stops completely when feedback plays

### Pitfall 4: Settling Period False Positives
**What goes wrong:** App triggers slosh sounds immediately at startup when phone hasn't stabilized in mount.
**Why it happens:** Initial sensor readings are noisy as phone settles into position.
**How to avoid:**
1. Implement 1-2 second settling period (user decision) before enabling feedback
2. Use settling period to establish baseline sensor noise floor
3. Optionally show "Calibrating..." indicator during settling

**Warning signs:** Immediate audio feedback when starting drive before car moves

### Pitfall 5: Phone Call Interruption Handling
**What goes wrong:** Feedback sounds play during phone calls, annoying users.
**Why it happens:** Not observing audio session interruptions.
**How to avoid:**
```typescript
import { AudioManager } from 'react-native-audio-api';

// Enable interruption observation
AudioManager.observeAudioInterruptions(true);

// In your feedback logic
function shouldPlayFeedback(): boolean {
  // Check if audio session is active (not interrupted by call)
  // react-native-audio-api handles this via interruption callbacks
  return !isAudioInterrupted;
}
```
**Warning signs:** Users hear slosh sounds during phone calls

## Code Examples

### Complete Sensor Pipeline Setup
```typescript
// Source: Expo DeviceMotion documentation + research patterns
import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors';

class SensorManager {
  private subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;
  private pipeline: SensorPipeline;
  private onRiskUpdate: (risk: number) => void;

  constructor(onRiskUpdate: (risk: number) => void) {
    this.pipeline = new SensorPipeline();
    this.onRiskUpdate = onRiskUpdate;
  }

  async start() {
    // Request 50Hz (20ms intervals)
    DeviceMotion.setUpdateInterval(20);

    this.subscription = DeviceMotion.addListener((data: DeviceMotionMeasurement) => {
      // data.acceleration is already gravity-compensated!
      if (!data.acceleration) return;

      const risk = this.pipeline.process(
        data.acceleration,  // { x, y, z } in m/s^2, gravity removed
        data.timestamp      // seconds since epoch
      );

      this.onRiskUpdate(risk);
    });
  }

  stop() {
    this.subscription?.remove();
    this.subscription = null;
  }
}
```

### Low-Pass IIR Filter Implementation
```typescript
// Source: Android sensor filtering patterns + Kircher Electronics
// Single-pole IIR low-pass filter
class LowPassFilter {
  private alpha: number;
  private previous: { x: number; y: number; z: number } | null = null;

  constructor(cutoffHz: number = 2, sampleHz: number = 50) {
    // Calculate alpha for desired cutoff frequency
    // alpha = dt / (rc + dt) where rc = 1/(2*pi*fc)
    const dt = 1 / sampleHz;
    const rc = 1 / (2 * Math.PI * cutoffHz);
    this.alpha = dt / (rc + dt);
  }

  apply(current: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    if (!this.previous) {
      this.previous = { ...current };
      return current;
    }

    // IIR filter: output = alpha * input + (1-alpha) * previous_output
    const filtered = {
      x: this.alpha * current.x + (1 - this.alpha) * this.previous.x,
      y: this.alpha * current.y + (1 - this.alpha) * this.previous.y,
      z: this.alpha * current.z + (1 - this.alpha) * this.previous.z,
    };

    this.previous = filtered;
    return filtered;
  }

  reset() {
    this.previous = null;
  }
}
```

### Jerk Calculator with Actual Delta Time
```typescript
// Source: Jerk calculation research + Android sensor best practices
class JerkCalculator {
  private previousAccel: { x: number; y: number; z: number } | null = null;
  private previousTimestamp: number | null = null;

  compute(
    accel: { x: number; y: number; z: number },
    timestamp: number
  ): { x: number; y: number; z: number; magnitude: number } {
    if (!this.previousAccel || !this.previousTimestamp) {
      this.previousAccel = { ...accel };
      this.previousTimestamp = timestamp;
      return { x: 0, y: 0, z: 0, magnitude: 0 };
    }

    // Use actual time delta, not assumed interval
    const dt = timestamp - this.previousTimestamp;
    if (dt <= 0) return { x: 0, y: 0, z: 0, magnitude: 0 };

    // Jerk = dA/dt (rate of acceleration change)
    const jerk = {
      x: (accel.x - this.previousAccel.x) / dt,
      y: (accel.y - this.previousAccel.y) / dt,
      z: (accel.z - this.previousAccel.z) / dt,
      magnitude: 0,
    };

    // RMS of lateral (x) and longitudinal (y) jerk
    // z-axis (vertical) excluded for driving smoothness
    jerk.magnitude = Math.sqrt(jerk.x * jerk.x + jerk.y * jerk.y);

    this.previousAccel = { ...accel };
    this.previousTimestamp = timestamp;

    return jerk;
  }

  reset() {
    this.previousAccel = null;
    this.previousTimestamp = null;
  }
}
```

### Spill Risk Normalizer
```typescript
// Source: Requirements + jerk threshold research
// Comfort threshold: ~1 m/s^3 optimal, ~10 m/s^3 maximum
class SpillRiskNormalizer {
  private thresholds = {
    easy: { slosh: 5.0, spill: 10.0 },       // Forgiving
    experienced: { slosh: 3.0, spill: 7.0 }, // Moderate
    master: { slosh: 1.5, spill: 4.0 },      // Strict
  };
  private difficulty: 'easy' | 'experienced' | 'master' = 'easy';

  setDifficulty(difficulty: 'easy' | 'experienced' | 'master') {
    this.difficulty = difficulty;
  }

  normalize(jerkMagnitude: number): { risk: number; isSpill: boolean } {
    const { slosh, spill } = this.thresholds[this.difficulty];

    // Below slosh threshold = 0 risk (silence)
    if (jerkMagnitude < slosh) {
      return { risk: 0, isSpill: false };
    }

    // Above spill threshold = spill event
    if (jerkMagnitude >= spill) {
      return { risk: 1.0, isSpill: true };
    }

    // Linear interpolation between slosh and spill
    const risk = (jerkMagnitude - slosh) / (spill - slosh);
    return { risk, isSpill: false };
  }
}
```

### Rolling Window Smoother
```typescript
// Source: Common signal processing pattern
class RollingWindow {
  private windowMs: number;
  private samples: { value: number; timestamp: number }[] = [];

  constructor(windowMs: number = 500) {
    this.windowMs = windowMs;
  }

  add(value: number, timestamp: number = Date.now()): number {
    // Add new sample
    this.samples.push({ value, timestamp });

    // Remove samples outside window
    const cutoff = timestamp - this.windowMs;
    this.samples = this.samples.filter(s => s.timestamp >= cutoff);

    // Return average of window
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((acc, s) => acc + s.value, 0);
    return sum / this.samples.length;
  }

  reset() {
    this.samples = [];
  }
}
```

### Audio Engine with Ducking Configuration
```typescript
// Source: react-native-audio-api documentation
import { AudioContext, AudioManager, decodeAudioData } from 'react-native-audio-api';
import { Asset } from 'expo-asset';

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Configure iOS audio session for ducking
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: ['mixWithOthers', 'duckOthers'],
    });

    // Enable interruption handling (phone calls, nav prompts)
    AudioManager.observeAudioInterruptions(true);

    // Create audio context
    this.audioContext = new AudioContext();

    // Preload all sound effects
    await this.preloadSounds();

    this.initialized = true;
  }

  private async preloadSounds() {
    const sounds = [
      { name: 'slosh-light', asset: require('@/assets/audio/slosh-light.mp3') },
      { name: 'slosh-medium', asset: require('@/assets/audio/slosh-medium.mp3') },
      { name: 'slosh-heavy', asset: require('@/assets/audio/slosh-heavy.mp3') },
      { name: 'spill', asset: require('@/assets/audio/spill.mp3') },
    ];

    for (const sound of sounds) {
      const asset = await Asset.fromModule(sound.asset).downloadAsync();
      if (!asset.localUri) {
        console.error(`Failed to download asset: ${sound.name}`);
        continue;
      }

      const buffer = await this.audioContext!.decodeAudioDataSource(asset.localUri);
      this.buffers.set(sound.name, buffer);
    }
  }

  play(soundName: string) {
    if (!this.audioContext) return;

    const buffer = this.buffers.get(soundName);
    if (!buffer) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(this.audioContext.currentTime);
  }

  async suspend() {
    await this.audioContext?.suspend();
  }

  async resume() {
    await this.audioContext?.resume();
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-av for audio | react-native-audio-api | 2025 | expo-av deprecated (removed SDK 55); react-native-audio-api provides <10ms latency |
| Manual gravity removal via complementary filter | DeviceMotion.acceleration | Always available | OS handles sensor fusion; gravity already removed from acceleration |
| Redux for high-frequency state | Zustand with slices | 2024-2025 | Less overhead for 50Hz updates; better re-render control |
| Assumed sensor intervals | Actual timestamp deltas | Best practice | Android throttling makes assumed intervals unreliable |

**Deprecated/outdated:**
- **expo-av**: Being removed in SDK 55. Use expo-audio for media or react-native-audio-api for low-latency.
- **Manual sensor fusion**: DeviceMotion provides gravity-compensated data natively. No need for quaternion math.

## Open Questions

1. **Per-axis sensitivity tuning**
   - What we know: User decision allows Claude's discretion on tuning acceleration vs braking vs cornering
   - What's unclear: Exact multipliers for lateral (cornering) vs longitudinal (accel/brake) jerk
   - Recommendation: Start with equal weighting (1.0x), tune based on real driving tests. Typical physics suggests cornering may need 0.8x multiplier since lateral forces feel more dramatic.

2. **Exact sound effect files**
   - What we know: Stylized/game-like, graduated intensity, dramatic spill
   - What's unclear: Specific audio files to use
   - Recommendation: Source from royalty-free game SFX libraries (freesound.org, Zapsplat). Target 0.5-1s duration for slosh, 1-2s for spill.

3. **Android OEM sensor behavior**
   - What we know: Samsung/Pixel/OnePlus may behave differently
   - What's unclear: Specific throttling behavior per OEM
   - Recommendation: Test on at least one Samsung device during Phase 1. Log actual sample rates to validate 50Hz.

## Sources

### Primary (HIGH confidence)
- [Expo Accelerometer Documentation](https://docs.expo.dev/versions/latest/sdk/accelerometer/) - setUpdateInterval, permissions, data format
- [Expo Gyroscope Documentation](https://docs.expo.dev/versions/latest/sdk/gyroscope/) - rotation data format, platform notes
- [Expo DeviceMotion Documentation](https://docs.expo.dev/versions/latest/sdk/devicemotion/) - acceleration (gravity removed), rotationRate
- [React Native Audio API Documentation](https://docs.swmansion.com/react-native-audio-api/) - AudioContext, BufferSource, decoding, AudioManager
- [React Native Audio API - Let's Make Noise Guide](https://docs.swmansion.com/react-native-audio-api/docs/guides/lets-make-some-noise/) - Complete playback example
- [React Native Audio API - Decoding](https://docs.swmansion.com/react-native-audio-api/docs/utils/decoding/) - decodeAudioDataSource, supported formats
- [React Native Audio API - AudioManager](https://docs.swmansion.com/react-native-audio-api/docs/system/audio-manager/) - iOS session options, ducking

### Secondary (MEDIUM confidence)
- [Android Motion Sensors](https://developer.android.com/develop/sensors-and-location/sensors/sensors_motion) - Linear acceleration sensor, gravity compensation
- [Android Sensor Throttling](https://github.com/expo/expo/issues/8041) - iOS latency issues, Android sampling behavior
- [Kircher Electronics - Low Pass Filter](http://kircherelectronics.com/index.php/2017/12/28/android-acceleration-sensors-low-pass-filter/) - IIR filter implementation for Android
- [Apple Handling Audio Interruptions](https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions) - Phone call handling
- [Jerk-based Activity Recognition](https://ieeexplore.ieee.org/document/6121760/) - Jerk as robust feature for motion detection
- [Comfort-related Jerk Values](https://www.researchgate.net/publication/326546961) - 1 m/s^3 optimal, 10 m/s^3 max thresholds

### Tertiary (LOW confidence - needs validation)
- Per-OEM Android sensor behavior varies significantly - must test on real devices
- Bluetooth audio latency ranges (100-300ms) are estimates - actual car systems vary

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - expo-sensors and react-native-audio-api are well-documented with production use
- Architecture: HIGH - Patterns based on official documentation and proven approaches
- Pitfalls: MEDIUM - Android OEM behavior needs validation on real devices
- Code examples: HIGH - Based on official documentation with minor adaptations

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable libraries, minimal churn expected)
