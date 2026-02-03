# Phase 5: Algorithm Refinement - Research

**Researched:** 2026-02-03
**Domain:** Adaptive jerk thresholds, pothole detection, difficulty-aware audio feedback
**Confidence:** HIGH

## Summary

Phase 5 enhances the smoothness detection system with three key capabilities: (1) difficulty-specific jerk thresholds that scale from Easy (forgiving) to Master (strict), (2) pothole detection using Z-axis spike analysis to distinguish road imperfections from driver errors, and (3) Master mode's reactive ambient soundscape that intensifies as jerk approaches the spill threshold.

Research confirms the existing jerk-based approach is sound. The roadmap guidance of 0.5 G/s (Easy) to 0.15 G/s (Master) translates to approximately 5.0 m/s^3 to 1.5 m/s^3 in the current system's units. The existing `SpillRiskNormalizer` already has difficulty thresholds (easy: 5.0/10.0, experienced: 3.0/7.0, master: 1.5/4.0 m/s^3 for slosh/spill), which align well with comfort research showing optimal comfort at 0.3-0.9 m/s^3 and maximum acceptable at ~10 m/s^3. Pothole detection requires analyzing Z-axis independently from the existing X/Y jerk calculation, using established algorithms (Z-THRESH, Z-DIFF) with thresholds around 0.4g (3.9 m/s^2) and duration filtering (<200ms for potholes vs longer for speed bumps).

For Master mode audio, expo-av supports real-time volume control via `setVolumeAsync()`, enabling looping ambient sounds with dynamic volume tied to jerk proximity. The reactive ambient requires interpolating volume smoothly (using setInterval or requestAnimationFrame) since expo-av has no native volume ramping.

**Primary recommendation:** Add a `PotholeDetector` class that monitors Z-axis acceleration spikes independently from the existing jerk pipeline, and create an `AmbientAudioController` for Master mode that manages a looping ambient sound with volume proportional to current risk.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **expo-av** | ~15.0.x | Audio playback with volume control | Already used; supports `setVolumeAsync()` for real-time volume, `setIsLoopingAsync()` for ambient |
| **expo-sensors** | ~16.0.x | DeviceMotion for Z-axis data | Already subscribed; Z-axis jerk data available in JerkCalculator output |
| **zustand** | 5.x | State management | Already used; add pothole events and ambient state to existing stores |

### Supporting (No New Dependencies)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **AsyncStorage** | via zustand persist | Difficulty persistence | Already persisting difficulty in useSensorStore |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-av for ambient | react-native-audio-api | More complex API; expo-av already works and supports looping + volume control |
| Manual volume interpolation | expo-audio-hooks | Third-party dependency; manual implementation is simpler for our linear ramp |

**Installation:**
```bash
# No new packages required - all capabilities exist in current stack
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  sensors/
    processors/
      PotholeDetector.ts       # NEW: Z-axis spike detection
      SpillRiskNormalizer.ts   # UPDATE: thresholds already correct
    SensorPipeline.ts          # UPDATE: expose Z-axis jerk to pothole detector

  audio/
    AmbientAudioController.ts  # NEW: Master mode reactive ambient
    AudioEngine.ts             # UPDATE: add ambient sound support
    FeedbackTrigger.ts         # UPDATE: difficulty-aware spill handling
    types.ts                   # UPDATE: add ambient sound names

  stores/
    useSensorStore.ts          # UPDATE: add pothole state
```

### Pattern 1: Independent Z-Axis Analysis for Pothole Detection

**What:** Analyze Z-axis acceleration independently from X/Y jerk magnitude. Potholes cause Z-axis spikes while normal driving jerk occurs in X/Y.

**When to use:** Whenever processing sensor data during active drive.

**Example:**
```typescript
// Source: Research algorithms Z-THRESH, Z-DIFF
interface PotholeEvent {
  timestamp: number;
  zPeak: number;       // Peak Z-axis deviation
  duration: number;    // Duration of spike in ms
  forgiven: boolean;   // True for Easy/Experienced modes
}

class PotholeDetector {
  // Z-THRESH: Threshold for significant Z spike (0.4g = 3.9 m/s^2)
  private readonly Z_THRESHOLD = 3.9; // m/s^2

  // Duration threshold: <200ms = pothole, longer = speed bump (deliberate)
  private readonly MAX_POTHOLE_DURATION_MS = 200;

  // Clustering window: consecutive potholes within this merge
  private readonly CLUSTER_WINDOW_MS = 7000; // 5-10s per CONTEXT.md

  private spikeStartTime: number | null = null;
  private spikeStartZ: number = 0;
  private lastPotholeTime: number = 0;
  private inRoughRoad: boolean = false;

  /**
   * Process Z-axis jerk value
   * @param zJerk - Z-axis jerk in m/s^3
   * @param timestamp - Current timestamp in ms
   */
  detect(zAccel: number, timestamp: number): PotholeEvent | null {
    const zDeviation = Math.abs(zAccel); // Deviation from gravity-compensated 0

    // Start tracking spike
    if (zDeviation > this.Z_THRESHOLD && !this.spikeStartTime) {
      this.spikeStartTime = timestamp;
      this.spikeStartZ = zDeviation;
      return null;
    }

    // End of spike
    if (this.spikeStartTime && zDeviation <= this.Z_THRESHOLD * 0.5) {
      const duration = timestamp - this.spikeStartTime;
      const peakZ = Math.max(this.spikeStartZ, zDeviation);

      this.spikeStartTime = null;
      this.spikeStartZ = 0;

      // Too long = speed bump (not forgiven)
      if (duration > this.MAX_POTHOLE_DURATION_MS) {
        return null; // Speed bump - counts as driver skill
      }

      // Check clustering
      const isCluster = (timestamp - this.lastPotholeTime) < this.CLUSTER_WINDOW_MS;
      if (isCluster && this.inRoughRoad) {
        return null; // Already in rough road segment
      }

      this.lastPotholeTime = timestamp;
      this.inRoughRoad = isCluster;

      return {
        timestamp,
        zPeak: peakZ,
        duration,
        forgiven: false, // Set by caller based on difficulty
      };
    }

    return null;
  }

  reset() {
    this.spikeStartTime = null;
    this.spikeStartZ = 0;
    this.lastPotholeTime = 0;
    this.inRoughRoad = false;
  }
}
```

### Pattern 2: Reactive Ambient Volume Control

**What:** Looping ambient sound with volume that scales linearly with risk proximity to threshold.

**When to use:** Master mode only, during active drive.

**Example:**
```typescript
// Source: expo-av documentation + research
class AmbientAudioController {
  private ambientSound: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private targetVolume: number = 0;
  private currentVolume: number = 0;
  private interpolationInterval: ReturnType<typeof setInterval> | null = null;

  // Volume interpolation rate (30fps for smooth fades)
  private readonly INTERPOLATION_INTERVAL_MS = 33;
  private readonly VOLUME_RAMP_SPEED = 0.05; // Per frame

  // Volume curve parameters
  private readonly MIN_VOLUME = 0.1;   // Calm baseline
  private readonly MAX_VOLUME = 0.8;   // Tense maximum (leave room for spill)

  async initialize() {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/audio/ambient-tension.m4a'),
      { shouldPlay: false, isLooping: true, volume: 0 }
    );
    this.ambientSound = sound;
  }

  async start() {
    if (!this.ambientSound || this.isPlaying) return;

    await this.ambientSound.setVolumeAsync(this.MIN_VOLUME);
    await this.ambientSound.playAsync();
    this.isPlaying = true;
    this.currentVolume = this.MIN_VOLUME;

    // Start volume interpolation loop
    this.interpolationInterval = setInterval(() => {
      this.interpolateVolume();
    }, this.INTERPOLATION_INTERVAL_MS);
  }

  /**
   * Update target volume based on risk proximity
   * @param risk - Current risk value (0-1)
   */
  setRiskLevel(risk: number) {
    // Map risk to volume: 0 = MIN_VOLUME, 0.9 = MAX_VOLUME
    this.targetVolume = this.MIN_VOLUME +
      (this.MAX_VOLUME - this.MIN_VOLUME) * Math.min(risk / 0.9, 1);
  }

  /**
   * Trigger silence after spill (Master mode punishment)
   */
  async onSpill() {
    this.targetVolume = 0;
    // Instant silence - no fade
    if (this.ambientSound) {
      await this.ambientSound.setVolumeAsync(0);
      this.currentVolume = 0;
    }
  }

  /**
   * Gradually rebuild after spill silence
   */
  rebuildFromSilence() {
    this.targetVolume = this.MIN_VOLUME;
  }

  private async interpolateVolume() {
    if (!this.ambientSound) return;

    const diff = this.targetVolume - this.currentVolume;
    if (Math.abs(diff) < 0.01) return; // Close enough

    // Move toward target
    const step = Math.sign(diff) * Math.min(Math.abs(diff), this.VOLUME_RAMP_SPEED);
    this.currentVolume += step;

    await this.ambientSound.setVolumeAsync(this.currentVolume);
  }

  async stop() {
    if (this.interpolationInterval) {
      clearInterval(this.interpolationInterval);
      this.interpolationInterval = null;
    }

    if (this.ambientSound) {
      await this.ambientSound.stopAsync();
      this.isPlaying = false;
    }
  }

  async cleanup() {
    await this.stop();
    if (this.ambientSound) {
      await this.ambientSound.unloadAsync();
      this.ambientSound = null;
    }
  }
}
```

### Pattern 3: Difficulty-Aware Feedback Logic

**What:** Different audio behavior based on difficulty level.

**When to use:** All audio feedback decisions.

**Example:**
```typescript
// Extended FeedbackTrigger logic
class DifficultyAwareFeedback {
  private difficulty: DifficultyLevel = 'easy';
  private ambientController: AmbientAudioController | null = null;

  setDifficulty(difficulty: DifficultyLevel) {
    this.difficulty = difficulty;

    // Only Master mode has ambient
    if (difficulty === 'master' && !this.ambientController) {
      this.ambientController = new AmbientAudioController();
      this.ambientController.initialize();
    } else if (difficulty !== 'master' && this.ambientController) {
      this.ambientController.cleanup();
      this.ambientController = null;
    }
  }

  evaluateSpill(risk: number, isSpill: boolean, isPothole: boolean): SpillDecision {
    // Pothole forgiveness by difficulty
    if (isPothole) {
      if (this.difficulty === 'easy' || this.difficulty === 'experienced') {
        return {
          countAsSpill: false,
          playSound: 'pothole-bump',  // Distinct from water sounds
          showMarker: true
        };
      }
      // Master: potholes count as spills
      return { countAsSpill: true, playSound: null, showMarker: true };
    }

    // Normal spill logic
    if (isSpill) {
      if (this.difficulty === 'master') {
        // Dramatic splash + ambient silence
        this.ambientController?.onSpill();
        return {
          countAsSpill: true,
          playSound: 'spill-dramatic', // Heavier than normal spill
          showMarker: false  // Just audio feedback
        };
      }
      return { countAsSpill: true, playSound: 'spill', showMarker: false };
    }

    // Update ambient intensity (Master only)
    this.ambientController?.setRiskLevel(risk);

    return { countAsSpill: false, playSound: null, showMarker: false };
  }
}
```

### Anti-Patterns to Avoid

- **Using X/Y jerk for pothole detection:** Z-axis is the signal for vertical road impacts. X/Y captures driving smoothness (steering, braking).
- **Blocking UI thread with volume interpolation:** Use setInterval outside React render cycle; don't update volume in useEffect with rapid sensor changes.
- **Treating all Z-axis events as potholes:** Speed bumps are longer duration; distinguish by timing.
- **Playing ambient on Easy/Experienced:** User decision locks ambient to Master mode only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Volume interpolation | Custom easing library | setInterval + linear ramp | expo-av doesn't support native ramping; simple linear is sufficient |
| Pothole clustering | Complex temporal analysis | Simple time window check | 5-10 second window is effective; no need for ML |
| Difficulty thresholds | Dynamic calculation | Hardcoded lookup table | User decision specifies ranges; predictable is better |
| Z-axis gravity compensation | Manual math | DeviceMotion.acceleration | Already gravity-compensated by OS |

**Key insight:** The existing sensor pipeline already captures Z-axis data. The enhancement is adding a parallel analysis path, not replacing the working jerk calculation.

## Common Pitfalls

### Pitfall 1: Z-Axis Data Already Available But Not Exposed

**What goes wrong:** Building new sensor subscription for Z-axis when data already flows through pipeline.
**Why it happens:** JerkCalculator computes Z-axis jerk but magnitude only uses X/Y.
**How to avoid:** Expose `jerk.z` from SensorPipeline output; add parallel PotholeDetector that receives same sensor data.
**Warning signs:** Multiple DeviceMotion subscriptions, duplicated sensor processing.

### Pitfall 2: Looping Audio Gap on iOS

**What goes wrong:** Brief silence between ambient loop iterations.
**Why it happens:** Known expo-av issue - `setIsLoopingAsync` has small gap on iOS.
**How to avoid:** Use longer ambient audio (30+ seconds) so gaps are infrequent; or crossfade two instances (complex).
**Warning signs:** Users report "stuttering" ambient on iOS devices.

### Pitfall 3: Volume Changes Audible as Clicks

**What goes wrong:** Sudden volume changes cause audio artifacts.
**Why it happens:** Abrupt value jumps in `setVolumeAsync` without interpolation.
**How to avoid:** Always interpolate volume changes over 50-100ms minimum.
**Warning signs:** Clicking/popping sounds during driving when risk changes rapidly.

### Pitfall 4: Pothole Detection False Positives from Vibration

**What goes wrong:** Phone vibration (notifications) triggers pothole detection.
**Why it happens:** Vibration creates Z-axis acceleration similar to road impacts.
**How to avoid:** Check if haptic feedback is active; use higher threshold or require sustained spike.
**Warning signs:** Potholes detected while car is stationary.

### Pitfall 5: Master Mode Ambient Not Stopping

**What goes wrong:** Ambient continues playing after drive ends or mode switches.
**Why it happens:** Missing cleanup in drive state transitions.
**How to avoid:** Hook ambient controller lifecycle to drive session; stop on `drive_end` event and difficulty change.
**Warning signs:** Ambient sound plays on home screen.

## Code Examples

### Expose Z-Axis from Existing Pipeline

```typescript
// Update SensorPipeline.ts
export interface PipelineResult {
  risk: number;
  isSpill: boolean;
  jerk: JerkResult;
  // NEW: Expose filtered Z-axis acceleration for pothole detection
  zAccelFiltered: number;
}

// In process() method:
return {
  risk: smoothedRisk,
  isSpill,
  jerk,
  zAccelFiltered: filtered.z, // From low-pass filter output
};
```

### Update Audio Types

```typescript
// Update audio/types.ts
export type SoundName =
  | 'slosh-light'
  | 'slosh-medium'
  | 'slosh-heavy'
  | 'spill'
  | 'spill-dramatic'    // NEW: Master mode heavy splash
  | 'pothole-bump'      // NEW: Road impact sound
  | 'ambient-tension';  // NEW: Master mode ambient loop
```

### Pothole Event in Database

```typescript
// events.ts schema already has 'pothole' type
// Usage in DriveRecorder:
async function logPothole(event: {
  timestamp: number;
  location: LocationData | null;
  zPeak: number;
  forgiven: boolean;
}) {
  const driveId = getCurrentDriveId();
  if (!driveId) return;

  await db.insert(events).values({
    id: generateUUID(),
    driveId,
    type: 'pothole',
    timestamp: new Date(event.timestamp),
    latitude: event.location?.latitude ?? null,
    longitude: event.location?.longitude ?? null,
    severity: event.zPeak / 10, // Normalize to 0-1
    forgiven: event.forgiven,
  });
}
```

### Difficulty Threshold Validation

```typescript
// Verify existing thresholds match requirements
// SpillRiskNormalizer current values:
const thresholds = {
  easy: { slosh: 5.0, spill: 10.0 },       // ~0.5 G/s threshold
  experienced: { slosh: 3.0, spill: 7.0 }, // ~0.3 G/s threshold
  master: { slosh: 1.5, spill: 4.0 },      // ~0.15 G/s threshold
};

// Requirements state:
// Easy: 0.5 G/s = ~5 m/s^3 (1g = 9.81 m/s^2, so 0.5 g/s = 4.9 m/s^3)
// Experienced: 0.3 G/s = ~3 m/s^3
// Master: 0.15 G/s = ~1.5 m/s^3

// Current thresholds ARE CORRECT - no changes needed to base thresholds
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed threshold for all users | Difficulty-adaptive thresholds | Always available in code | Already implemented; Phase 5 enables user selection |
| Z-axis excluded entirely | Z-axis for pothole detection | This phase | Distinguishes road quality from driving skill |
| Single spill sound | Difficulty-specific audio | This phase | Master mode gets dramatic feedback + ambient |

**Deprecated/outdated:**
- N/A - Building on existing proven architecture.

## Open Questions

1. **Exact ambient audio file characteristics**
   - What we know: Looping, reactive volume, distinct from water sounds
   - What's unclear: Specific sound design (drone, engine, tense strings?)
   - Recommendation: Source/create 30-60 second loop; something atmospheric that can scale from calm to tense. Start with low drone/hum that gains harmonics as intensity increases.

2. **Pothole icon on map**
   - What we know: CONTEXT.md specifies pothole marker on route
   - What's unclear: Whether RouteMap component can display icons at coordinates
   - Recommendation: Verify RouteMap implementation; may need to add marker layer.

3. **Spill silence duration for Master mode**
   - What we know: "Ambient drops to complete silence after spill, then rebuilds"
   - What's unclear: How long to stay silent before rebuilding
   - Recommendation: 2-3 seconds of silence (matches spill cooldown), then linear volume rebuild over 3-5 seconds.

## Sources

### Primary (HIGH confidence)
- [expo-av Documentation](https://docs.expo.dev/versions/latest/sdk/av/) - Volume control via `setVolumeAsync()`, looping via `setIsLoopingAsync()`
- Existing codebase: `SpillRiskNormalizer.ts` - Verified difficulty thresholds match requirements
- Existing codebase: `JerkCalculator.ts` - Z-axis jerk already computed, just excluded from magnitude

### Secondary (MEDIUM confidence)
- [PMC Road Surface Monitoring Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC6263868/) - Z-THRESH=0.4g, Z-DIFF=0.2g thresholds; pothole vs speed bump profile difference
- [PMC Speed Bump Detection Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5856042/) - 2-second window analysis; feature extraction approach
- [Standards for Passenger Comfort](https://www.sciencedirect.com/science/article/pii/S0003687022002046) - Jerk comfort threshold 0.3-0.9 m/s^3, max 10 m/s^3
- [Shuttle Bus Comfort Research](https://www.mdpi.com/2079-9292/8/9/943) - Jerk limit 0.6 m/s^3 for comfortable experience

### Tertiary (LOW confidence)
- expo-av looping gap issue - Anecdotal from GitHub issues; needs iOS device testing
- Volume interpolation approach - Pattern from general audio programming; not React Native specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, building on proven expo-av and existing sensor pipeline
- Architecture: HIGH - Patterns follow existing codebase structure; pothole detection algorithms well-researched
- Pitfalls: MEDIUM - iOS looping gap and volume clicking need device testing to confirm
- Threshold values: HIGH - Current implementation matches requirements; research validates ranges

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable requirements, no external dependency changes expected)
