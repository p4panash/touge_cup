# Stack Research: Water Cup Driving Coach

**Domain:** Real-time sensor-based mobile app with audio feedback
**Researched:** 2026-02-01
**Confidence:** HIGH (Core stack verified via official docs; CarPlay/Android Auto is MEDIUM)

## Executive Summary

Building a real-time driving coach requires a carefully selected stack optimized for:
1. **High-frequency sensor sampling** (50Hz accelerometer/gyroscope)
2. **Sub-100ms audio latency** for immediate feedback
3. **Background execution** for drive detection
4. **CarPlay/Android Auto** integration for in-car use
5. **Local persistence** for drive history

The React Native/Expo ecosystem has matured significantly in 2025-2026, with Expo SDK 54 providing excellent native module support through development builds (CNG). The critical constraint is audio latency - standard Expo audio libraries add too much delay for real-time feedback, requiring Software Mansion's `react-native-audio-api`.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Expo SDK** | 54 | App framework | Current stable SDK with React Native 0.79+, New Architecture default, excellent DX with CNG (Continuous Native Generation). Enables native modules without ejecting. | HIGH |
| **React Native** | 0.79+ | Mobile runtime | Bundled with Expo SDK 54. New Architecture (Fabric + TurboModules) enabled by default for better performance. | HIGH |
| **TypeScript** | 5.x | Type safety | Essential for complex sensor data handling and state management. Industry standard. | HIGH |

### Sensors

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **expo-sensors** | ~16.0.x | Accelerometer, Gyroscope | Native Expo module with `setUpdateInterval()` API supporting high-frequency sampling. Requires `HIGH_SAMPLING_RATE_SENSORS` permission on Android 12+ for <200ms intervals. | HIGH |

**Critical Configuration:**
```typescript
// Required for 50Hz (20ms intervals) on Android 12+
// app.json
{
  "expo": {
    "android": {
      "permissions": ["android.permission.HIGH_SAMPLING_RATE_SENSORS"]
    }
  }
}
```

**API Usage:**
```typescript
import { Accelerometer, Gyroscope } from 'expo-sensors';

// 50Hz = 20ms intervals
Accelerometer.setUpdateInterval(20);
Gyroscope.setUpdateInterval(20);

const subscription = Accelerometer.addListener(({ x, y, z }) => {
  // Process acceleration data
});
```

### Audio (Critical Path)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **react-native-audio-api** | 0.11.2 | Low-latency audio playback | Software Mansion's Web Audio API implementation. Achieves <10ms latency (verified by Odisei Music production use). Only React Native solution capable of sub-100ms audio feedback. | HIGH |
| **react-native-track-player** | 4.1 | Background audio, lock screen controls | Industry standard for music apps. Provides Now Playing integration, background playback, and media controls. Required for CarPlay/Android Auto audio session. | HIGH |

**Why NOT expo-audio or expo-av:**
- `expo-av` is **deprecated** (being removed in SDK 55)
- `expo-audio` (~1.1.1) does NOT provide low-latency playback - designed for media playback, not real-time feedback
- Known latency issues: Community reports delays when playing sounds on button press
- Neither achieves the <100ms latency requirement

**Architecture Pattern:**
```typescript
// Use react-native-audio-api for instant water sounds
import { AudioContext } from 'react-native-audio-api';

const audioContext = new AudioContext();

// Preload audio buffers at app start
const waterSplashBuffer = await audioContext.decodeAudioDataSource(splashSource);

// Play with minimal latency on sensor threshold
function playSplash() {
  const source = audioContext.createBufferSource();
  source.buffer = waterSplashBuffer;
  source.connect(audioContext.destination);
  source.start();
}
```

```typescript
// Use react-native-track-player for background audio session
import TrackPlayer from 'react-native-track-player';

// Register playback service for background execution
TrackPlayer.registerPlaybackService(() => require('./playbackService'));
```

### Location & Background Execution

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **expo-location** | ~18.0.x | Background GPS monitoring | Native Expo module with `startLocationUpdatesAsync()` for background tracking. Sufficient for drive detection (not navigation). | HIGH |
| **expo-task-manager** | ~12.0.x | Background task coordination | Required for background location tasks. Defines tasks at global scope for background execution. | HIGH |
| **expo-background-task** | ~1.0.x | Deferred background work | New in SDK 53+. Uses WorkManager (Android) / BGTaskScheduler (iOS) for battery-efficient background processing. | MEDIUM |

**Alternative Considered:**
- **react-native-background-geolocation** (Transistorsoft): Superior battery optimization (<1% over 24hrs) and ML-based motion detection, but requires paid license for production. Consider upgrading if battery becomes an issue.

**Background Location Configuration:**
```typescript
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["location", "fetch", "audio"]
      }
    },
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ]
    }
  }
}
```

### Database

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **expo-sqlite** | ~16.0.10 | Local SQLite database | Native Expo module with sync and async APIs. Supports FTS (full-text search), prepared statements, transactions. | HIGH |
| **drizzle-orm** | ~0.44.x | Type-safe ORM | Best-in-class TypeScript ORM for SQLite. Native Expo SQLite support, `useLiveQuery` hook for reactive queries, built-in migrations. | HIGH |
| **drizzle-kit** | latest | Migration tooling | Generates SQL migrations from TypeScript schema. | HIGH |

**Why Drizzle over raw SQL:**
- Type inference from schema definitions
- SQL injection protection via prepared statements
- Migration management with `drizzle-kit generate`
- `useLiveQuery` hook for reactive UI updates
- Zero runtime overhead (just a query builder)

**Setup:**
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './db/schema.ts',
  out: './drizzle',
});
```

```typescript
// db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const drives = sqliteTable('drives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  smoothnessScore: real('smoothness_score'),
});

export const sensorEvents = sqliteTable('sensor_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  driveId: integer('drive_id').references(() => drives.id),
  timestamp: integer('timestamp').notNull(),
  eventType: text('event_type').notNull(), // 'harsh_brake', 'hard_turn', etc.
  severity: real('severity'),
  accelX: real('accel_x'),
  accelY: real('accel_y'),
  accelZ: real('accel_z'),
});
```

### CarPlay & Android Auto

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **@g4rb4g3/react-native-carplay** | latest | CarPlay + Android Auto UI | Fork of react-native-carplay with better Android Auto support, Expo SDK 53+ compatibility, Now Playing template. | MEDIUM |
| **react-native-track-player** | 4.1 | Audio session for car systems | Required for Now Playing controls in CarPlay/Android Auto. Syncs with native audio player. | HIGH |

**Current State (Honest Assessment):**
- **CarPlay:** Well-supported via NowPlaying template + RNTP integration
- **Android Auto:** Beta status in react-native-carplay 2.4.0+, but actively developed
- **Integration:** NowPlaying template displays RNTP's currently playing track automatically

**Confidence: MEDIUM** - CarPlay works well; Android Auto integration is improving but may require debugging. Plan for potential native code work.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zustand** | 5.x | State management | Lightweight, TypeScript-first. Perfect for sensor state and UI without Redux boilerplate. |
| **react-native-reanimated** | 3.x | Smooth animations | Water cup visualization, smooth UI updates at 60fps. |
| **expo-haptics** | ~14.0.x | Haptic feedback | Optional: vibration on harsh driving events. |
| **date-fns** | 4.x | Date handling | Drive duration, timestamps, formatting. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Expo Dev Client** | Development builds | Required for native modules (react-native-audio-api, react-native-carplay). Cannot use Expo Go. |
| **EAS Build** | Cloud builds | iOS/Android builds without local Xcode/Android Studio setup. |
| **drizzle-studio-expo** | Database inspection | Dev tools plugin for inspecting SQLite database in Expo CLI. |
| **Flipper** | Debugging | Optional: Network inspection, React DevTools, performance profiling. |

---

## Installation

```bash
# Create Expo project with TypeScript
npx create-expo-app@latest touge-cup --template blank-typescript
cd touge-cup

# Core Expo modules
npx expo install expo-sensors expo-location expo-task-manager expo-background-task expo-sqlite expo-haptics

# Audio (requires development build)
npm install react-native-audio-api react-native-track-player

# CarPlay/Android Auto (requires development build)
npm install @g4rb4g3/react-native-carplay

# Database ORM
npm install drizzle-orm
npm install -D drizzle-kit

# State & Utilities
npm install zustand date-fns

# Animation
npx expo install react-native-reanimated

# Development
npm install -D typescript @types/react
```

**Note:** After installing native modules, run:
```bash
npx expo prebuild
# or use EAS Build for cloud builds
eas build --profile development --platform all
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| **Audio** | react-native-audio-api | expo-audio | expo-audio lacks low-latency playback; designed for media, not real-time feedback |
| **Audio** | react-native-audio-api | react-native-sound | Lower-level but less maintained; react-native-audio-api has better API |
| **Audio** | react-native-audio-api | expo-av | Deprecated, being removed in SDK 55 |
| **Background GPS** | expo-location | react-native-background-geolocation | Transistorsoft is superior but requires paid license; expo-location sufficient for drive detection |
| **Database** | expo-sqlite + drizzle | react-native-mmkv | MMKV is key-value only; we need relational queries for drive history |
| **Database** | drizzle-orm | TypeORM | TypeORM has runtime overhead; Drizzle is lighter and better for mobile |
| **State** | zustand | Redux Toolkit | Zustand is simpler, less boilerplate for our use case |
| **CarPlay** | @g4rb4g3/react-native-carplay | birkir/react-native-carplay | Fork has better Android Auto support and Expo compatibility |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **expo-av** | Deprecated, will be removed in SDK 55. Known latency issues. | expo-audio (for media) or react-native-audio-api (for low-latency) |
| **expo-audio** for real-time feedback | Not designed for low-latency; no <100ms guarantee | react-native-audio-api |
| **Expo Go** | Cannot run native modules (react-native-audio-api, react-native-carplay) | Expo Development Client |
| **@react-native-community/geolocation** | Deprecated, no background support | expo-location |
| **AsyncStorage** for structured data | Key-value only, no queries | expo-sqlite + drizzle-orm |
| **react-native-sqlite-storage** | Outdated, not maintained | expo-sqlite (actively maintained) |
| **setInterval for sensors** | Unreliable timing, battery drain | Use sensor library's native listeners |

---

## Stack Patterns by Variant

**If targeting CarPlay/Android Auto as primary interface:**
- Prioritize react-native-track-player setup early
- Test NowPlaying template integration before building full UI
- Plan for Android Auto beta limitations

**If battery life is critical (long drives):**
- Consider upgrading to react-native-background-geolocation (paid)
- Implement adaptive sensor sampling (reduce Hz when car is stopped)
- Use geofencing instead of continuous GPS when possible

**If offline-first is critical:**
- Add PowerSync or similar for sync
- Implement queue for events during offline periods
- Test airplane mode scenarios thoroughly

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| expo@54 | React Native 0.79+ | New Architecture enabled by default |
| expo-sensors@~16.0.x | Expo SDK 54 | Check expo install for exact version |
| react-native-audio-api@0.11.2 | React Native 0.79+ | Active development, check releases |
| react-native-track-player@4.1 | React Native 0.70+ | Stable, widely used |
| drizzle-orm@~0.44.x | expo-sqlite@~16.0.x | Native Expo SQLite driver |
| @g4rb4g3/react-native-carplay | Expo SDK 53+ | Fork maintains Expo compatibility |

---

## Risk Assessment

| Component | Risk Level | Mitigation |
|-----------|------------|------------|
| **Low-latency audio** | LOW | react-native-audio-api proven in production (<10ms) |
| **50Hz sensors** | LOW | expo-sensors supports with proper Android permissions |
| **Background GPS** | LOW | expo-location well-documented, widely used |
| **CarPlay** | LOW | Mature, well-supported via NowPlaying template |
| **Android Auto** | MEDIUM | Beta in react-native-carplay; plan for debugging time |
| **SQLite + Drizzle** | LOW | Both production-ready, great TypeScript support |

---

## Sources

### Official Documentation (HIGH confidence)
- [Expo Accelerometer Documentation](https://docs.expo.dev/versions/latest/sdk/accelerometer/) - Sensor API, update intervals, permissions
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/) - Background location, startLocationUpdatesAsync
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) - Database API, version ~16.0.10
- [Expo TaskManager Documentation](https://docs.expo.dev/versions/latest/sdk/task-manager/) - Background tasks
- [Expo SDK 53 Changelog](https://expo.dev/changelog/sdk-53) - expo-background-task, expo-audio stable
- [Drizzle ORM - Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite) - Setup, migrations, useLiveQuery

### Library Documentation (HIGH confidence)
- [React Native Audio API](https://docs.swmansion.com/react-native-audio-api/) - <10ms latency, Web Audio API
- [React Native Audio API GitHub](https://github.com/software-mansion/react-native-audio-api) - v0.11.2, features
- [React Native Track Player](https://rntp.dev/) - v4.1, background playback, media controls

### Community/GitHub (MEDIUM confidence)
- [react-native-carplay GitHub](https://github.com/birkir/react-native-carplay) - CarPlay + Android Auto
- [@g4rb4g3/react-native-carplay npm](https://www.npmjs.com/package/@g4rb4g3/react-native-carplay) - Expo-compatible fork
- [RNTP CarPlay Discussion](https://github.com/doublesymmetry/react-native-track-player/discussions/1984) - NowPlaying integration

### Ecosystem Research (MEDIUM confidence)
- [Real-time audio processing with Expo](https://expo.dev/blog/real-time-audio-processing-with-expo-and-native-code) - Native module patterns
- [Building local-first apps with Expo SQLite and Drizzle](https://israataha.com/blog/build-local-first-app-with-expo-sqlite-and-drizzle/) - Drizzle setup patterns
- [Transistorsoft Background Geolocation](https://github.com/transistorsoft/react-native-background-geolocation) - Alternative for battery optimization

---

*Stack research for: Water Cup Driving Coach*
*Researched: 2026-02-01*
