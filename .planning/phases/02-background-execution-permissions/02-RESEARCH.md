# Phase 2: Background Execution & Permissions - Research

**Researched:** 2026-02-02
**Domain:** React Native/Expo background execution, GPS location, permissions
**Confidence:** MEDIUM (verified with official docs, some areas require device testing)

## Summary

Background execution for drive detection in Expo requires careful orchestration of multiple libraries: `expo-location` for GPS speed data, `expo-task-manager` for background task registration, and `expo-av` for background audio. The key challenge is maintaining reliable sensor sampling and audio feedback when the screen is off, particularly on Android where aggressive battery optimization and Doze mode can suspend background tasks.

The standard Expo approach uses `Location.startLocationUpdatesAsync()` with a foreground service notification on Android. This provides GPS speed data (m/s) directly from the location object and allows the app to continue running in the background. iOS requires `UIBackgroundModes` configuration for both location and audio background capabilities. The existing sensor pipeline (DeviceMotion at 50Hz) and audio engine (expo-av) need modifications to work in background context.

Drive detection state machine should be implemented using GPS speed thresholds (15 km/h = 4.17 m/s for start, stationary check for stop) with the locked-in 120-second auto-stop timeout. Manual override should pause auto-detection temporarily to avoid conflicts.

**Primary recommendation:** Use expo-location's foreground service with HIGH accuracy for drive detection, implement a drive state machine in JavaScript that processes location updates, and enable background audio mode for expo-av.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-location | ~19.0.8 | GPS position and speed | Official Expo library, provides speed in m/s directly |
| expo-task-manager | ~14.0.9 | Background task registration | Required for background location callbacks |
| expo-av | ~16.0.8 | Background audio playback | Already in use, supports staysActiveInBackground |
| expo-battery | ~10.0.8 | Battery monitoring | Check optimization status, warn on low battery |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-intent-launcher | ~14.0.4 | Open system settings | Deep-link to battery optimization settings on Android |
| @notifee/react-native | ^9.x | Advanced notifications | If more control over foreground service notification needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-location | transistorsoft/react-native-background-geolocation | More sophisticated motion detection, but paid license for Android release builds |
| expo-task-manager | expo-background-task | expo-background-task is for deferred tasks (min 15 min), not real-time location |

**Installation:**
```bash
npx expo install expo-location expo-task-manager expo-battery expo-intent-launcher
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── drive/                    # Drive detection domain
│   ├── DriveStateManager.ts  # State machine for drive detection
│   ├── LocationManager.ts    # Wrapper around expo-location
│   ├── types.ts              # Drive-related types
│   └── constants.ts          # Thresholds (15km/h, 120s, etc.)
├── background/               # Background execution
│   ├── BackgroundTaskRegistry.ts  # TaskManager.defineTask calls (global scope)
│   ├── ForegroundServiceConfig.ts # Android notification config
│   └── PermissionManager.ts  # Permission request flow
├── stores/
│   └── useDriveStore.ts      # Drive state (isDriving, driveStartTime, etc.)
```

### Pattern 1: Global Task Definition
**What:** Background tasks MUST be defined in global scope, outside React components
**When to use:** Always for expo-task-manager
**Why:** When app launches in background, JS needs to spin up, run task, and shut down - no React lifecycle available

**Example:**
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/task-manager/
// FILE: src/background/BackgroundTaskRegistry.ts
// MUST be imported in app entry point (index.ts or App.tsx top-level)

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const LOCATION_TASK_NAME = 'background-location-task';

// Define task in module scope (NOT inside component)
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    // Process locations - update drive state, trigger audio
    handleBackgroundLocations(locations);
  }
});
```

### Pattern 2: Drive State Machine
**What:** Finite state machine for drive detection
**When to use:** Managing auto-start/auto-stop with manual override

**Example:**
```typescript
// Source: Phase 2 CONTEXT.md decisions

type DriveState =
  | { type: 'idle' }
  | { type: 'detecting'; speedAboveThreshold: number } // counting 5s
  | { type: 'driving'; startTime: number }
  | { type: 'stopping'; stationarySince: number } // counting 120s
  | { type: 'manual_driving'; startTime: number } // manual override active

const SPEED_THRESHOLD_MS = 4.17; // 15 km/h in m/s
const START_DURATION_MS = 5000;  // 5 seconds above threshold
const STOP_DURATION_MS = 120000; // 120 seconds stationary

function processLocation(state: DriveState, location: LocationObject): DriveState {
  const speed = location.coords.speed ?? 0;
  const now = Date.now();

  switch (state.type) {
    case 'idle':
      if (speed >= SPEED_THRESHOLD_MS) {
        return { type: 'detecting', speedAboveThreshold: now };
      }
      return state;

    case 'detecting':
      if (speed < SPEED_THRESHOLD_MS) {
        return { type: 'idle' };
      }
      if (now - state.speedAboveThreshold >= START_DURATION_MS) {
        return { type: 'driving', startTime: now };
      }
      return state;

    case 'driving':
      if (speed < 1) { // Nearly stationary (< 3.6 km/h)
        return { type: 'stopping', stationarySince: now };
      }
      return state;

    case 'stopping':
      if (speed >= 1) {
        return { type: 'driving', startTime: state.stationarySince }; // Resume
      }
      if (now - state.stationarySince >= STOP_DURATION_MS) {
        return { type: 'idle' };
      }
      return state;

    case 'manual_driving':
      // Manual mode - only user can stop
      return state;
  }
}
```

### Pattern 3: Permission Request Flow
**What:** Sequential permission requests with user education
**When to use:** Before starting background location

**Example:**
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/location/

async function requestLocationPermissions(): Promise<boolean> {
  // 1. Request foreground first
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    return false;
  }

  // 2. On Android 11+, show explanation modal before background request
  // (requestBackgroundPermissionsAsync opens system settings directly)
  if (Platform.OS === 'android' && Platform.Version >= 30) {
    // Show custom modal explaining why background needed
    await showBackgroundExplanationModal();
  }

  // 3. Request background permission
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === 'granted';
}
```

### Anti-Patterns to Avoid
- **Defining tasks inside components:** Task definitions in useEffect or component body will not work in background - define at module scope
- **Polling location instead of subscription:** Don't use setInterval with getCurrentPositionAsync - use startLocationUpdatesAsync
- **Ignoring GPS loss:** Don't crash or stop when location is null - continue with sensors only
- **Same notification for all states:** Update notification content based on drive state (detecting vs driving)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Background location | Custom native module | expo-location + expo-task-manager | Handles foreground service, permissions, platform differences |
| Battery status checks | Manual native bridge | expo-battery | Already handles platform differences, low power mode detection |
| Permission flow | Custom permission logic | expo-location permission hooks | useForegroundPermissions(), useBackgroundPermissions() |
| Open system settings | Linking.openSettings() | expo-intent-launcher | More specific intents (battery optimization page directly) |
| Notification updates | expo-notifications | expo-location foregroundService option | Built into location updates, less overhead |

**Key insight:** Background execution has many platform-specific edge cases (Doze mode, app standby, manufacturer-specific battery savers). The Expo libraries abstract these away but require careful configuration.

## Common Pitfalls

### Pitfall 1: Android Doze Mode Stops Location Updates
**What goes wrong:** After 5-10 minutes of screen off, Android enters Doze mode and batches location updates, breaking real-time tracking
**Why it happens:** Android's battery optimization defers non-critical tasks
**How to avoid:**
1. Use foreground service (creates persistent notification)
2. Request battery optimization exemption via expo-intent-launcher
3. Warn users about manufacturer-specific settings (dontkillmyapp.com)
**Warning signs:** Location callbacks stop being triggered after a few minutes in background tests

### Pitfall 2: iOS "Allow Once" Permission Trap
**What goes wrong:** User selects "Allow Once", app thinks it has permission, but background location fails
**Why it happens:** iOS doesn't distinguish "Allow Once" from "Allow While Using" in permission status
**How to avoid:**
1. Check both foreground AND background permission status
2. After first location request, verify location actually returned
3. Handle gracefully if background permission denied
**Warning signs:** Permission status shows 'granted' but background tasks don't fire

### Pitfall 3: Task Definition Not in Global Scope
**What goes wrong:** App works in foreground, fails silently in background
**Why it happens:** TaskManager.defineTask called inside component, not available when app starts headless
**How to avoid:** Define task at module top-level, import module in entry point
**Warning signs:** Console logs in task never appear when app backgrounded

### Pitfall 4: Audio Stops When Screen Locks
**What goes wrong:** Spill sounds stop playing when user locks screen
**Why it happens:** expo-av staysActiveInBackground: false (current setting), missing UIBackgroundModes
**How to avoid:**
1. Set staysActiveInBackground: true in setAudioModeAsync
2. Add "audio" to UIBackgroundModes in app.json
**Warning signs:** Audio works with screen on, stops immediately when locked

### Pitfall 5: Manufacturer Battery Killers (Samsung, Xiaomi, OnePlus)
**What goes wrong:** App works on Pixel, fails on Samsung/Xiaomi
**Why it happens:** OEM battery savers are more aggressive than stock Android
**How to avoid:**
1. Link users to dontkillmyapp.com instructions
2. Use expo-battery.isBatteryOptimizationEnabledAsync() to detect
3. Show in-app instructions for problematic manufacturers
**Warning signs:** Works fine during development, users report "app stops working"

### Pitfall 6: GPS Speed Returns null
**What goes wrong:** location.coords.speed is null, causing NaN in calculations
**Why it happens:** GPS not yet locked, or indoor/poor signal
**How to avoid:**
1. Always use ?? 0 or nullish coalescing
2. Implement graceful degradation - keep recording with sensors when GPS unavailable
3. Show UI indicator for GPS status
**Warning signs:** App crashes or misbehaves when testing indoors

## Code Examples

Verified patterns from official sources:

### Starting Background Location Updates
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/location/

import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from './BackgroundTaskRegistry';

async function startDriveDetection(): Promise<void> {
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 1000,      // Update every 1 second
    distanceInterval: 0,     // Update regardless of distance
    foregroundService: {
      notificationTitle: 'Water Cup Coach',
      notificationBody: 'Monitoring your driving...',
      notificationColor: '#3B82F6',
    },
    // Deferred updates for battery efficiency when driving steadily
    deferredUpdatesInterval: 5000,
    deferredUpdatesDistance: 10,
  });
}

async function stopDriveDetection(): Promise<void> {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
}
```

### Configuring Background Audio
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/audio-av/

import { Audio, InterruptionModeIOS } from 'expo-av';

async function configureBackgroundAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true, // KEY: Enable background audio
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}
```

### app.json Configuration
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["location", "audio"],
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Water Cup Coach needs continuous location access to detect when you're driving and provide real-time feedback.",
        "NSLocationWhenInUseUsageDescription": "Water Cup Coach uses your location to detect driving speed."
      }
    },
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Water Cup Coach needs continuous location access to detect when you're driving and provide real-time feedback.",
          "isIosBackgroundLocationEnabled": true,
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ]
    ]
  }
}
```

### Checking Battery Optimization
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/battery/

import * as Battery from 'expo-battery';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

async function checkBatteryOptimization(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const isOptimized = await Battery.isBatteryOptimizationEnabledAsync();
  if (isOptimized) {
    // Show modal explaining why user should disable
    const shouldOpenSettings = await showBatteryOptimizationModal();
    if (shouldOpenSettings) {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-background-fetch | expo-background-task | SDK 53 | Better system integration, but min 15min interval (not for real-time) |
| Manual permission checking | useBackgroundPermissions hook | SDK 48+ | Reactive permission state |
| Custom foreground service | expo-location foregroundService option | SDK 47+ | Simpler setup, automatic notification |
| Polling getCurrentPositionAsync | startLocationUpdatesAsync | Always preferred | Battery efficient, works in background |

**Deprecated/outdated:**
- expo-background-fetch: Being replaced by expo-background-task, but neither suitable for real-time location (min 15 min intervals)
- Direct AndroidManifest editing: Use expo-location plugin config instead

## Open Questions

Things that couldn't be fully resolved:

1. **Exact battery consumption for 1-hour drive**
   - What we know: HIGH accuracy GPS is most battery-intensive; balanced is ~100m accuracy
   - What's unclear: Exact percentage drain depends on device, signal strength, update frequency
   - Recommendation: Use HIGH accuracy (needed for speed), test on physical devices, document findings. Target is <10% per hour.

2. **setImportantWhileForeground fix availability in Expo**
   - What we know: Native Android fix exists for Doze mode batching; requires modifying TaskManagerUtils.java
   - What's unclear: Whether current expo-task-manager already includes this, or if config plugin needed
   - Recommendation: Test background location reliability first. If batching occurs after 5-10 min, investigate config plugin.

3. **Sensor sampling in true background**
   - What we know: DeviceMotion (accelerometer) works in foreground; location task runs in background
   - What's unclear: Whether DeviceMotion subscription continues when app is backgrounded
   - Recommendation: Test if expo-sensors works in background with foreground service. May need to process only in location callback if not.

## Sources

### Primary (HIGH confidence)
- [expo-location official docs](https://docs.expo.dev/versions/latest/sdk/location/) - Background location, permissions, foreground service
- [expo-task-manager official docs](https://docs.expo.dev/versions/latest/sdk/task-manager/) - Task definition, global scope requirement
- [expo-av official docs](https://docs.expo.dev/versions/latest/sdk/audio-av/) - staysActiveInBackground, UIBackgroundModes
- [expo-battery official docs](https://docs.expo.dev/versions/latest/sdk/battery/) - Optimization detection

### Secondary (MEDIUM confidence)
- [GitHub Issue #14076](https://github.com/expo/expo/issues/14076) - Android Doze mode fix with setImportantWhileForeground
- [dontkillmyapp.com](https://dontkillmyapp.com) - OEM-specific battery optimization issues
- [Android developers - background location](https://developer.android.com/develop/sensors-and-location/location/battery) - Battery impact of different accuracy levels

### Tertiary (LOW confidence)
- Community articles on background location patterns - Useful for patterns but need verification
- Battery consumption estimates - Highly device-dependent, requires real testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official Expo packages with current documentation
- Architecture: MEDIUM - Patterns verified from docs, but background execution has device-specific behavior
- Pitfalls: MEDIUM - Known issues documented in GitHub, but OEM-specific issues require testing

**Research date:** 2026-02-02
**Valid until:** 30 days (Expo SDK stable, but test on target devices)
