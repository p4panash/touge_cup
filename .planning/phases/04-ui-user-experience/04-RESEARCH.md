# Phase 4: UI & User Experience - Research

**Researched:** 2026-02-03
**Domain:** React Native UI, Navigation, Maps, Animations
**Confidence:** HIGH

## Summary

This research covers the UI layer for Water Cup Coach: navigation architecture, screen implementations, map integration for drive summaries, and the water cup animation. The app currently has no navigation framework - it uses a single App.tsx with inline components. Phase 4 will introduce Expo Router for file-based navigation, react-native-maps for drive route visualization, and react-native-reanimated with optional Skia for the water cup slosh animation.

The locked decisions specify system adaptive theming (dark/light mode follows device), a hero start button home screen, water cup with real-time slosh animation, and color-coded route polylines on the drive summary. These are all achievable with the recommended stack. The key technical challenges are: (1) connecting accelerometer data to smooth 60fps water animation, and (2) rendering multi-color polylines for route smoothness visualization.

**Primary recommendation:** Use Expo Router with tabs for main navigation (Home, History, Settings), react-native-maps for drive summary maps with `strokeColors` polylines, and react-native-reanimated's `useAnimatedSensor` hook for direct accelerometer-to-animation pipeline.

## Standard Stack

### Core Navigation
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-router | ~4.0.x | File-based navigation | Official Expo navigation solution, uses React Navigation under the hood, supports tabs + nested stacks |
| @react-navigation/native | (peer dep) | Navigation foundation | Bundled with expo-router |
| react-native-screens | (peer dep) | Native screen primitives | Bundled with expo-router |

### UI Components
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-native-segmented-control/segmented-control | ~2.5.7 | Difficulty selector | Native UISegmentedControl on iOS, faithful recreation on Android, bundled with Expo |
| expo-keep-awake | ~14.0.x | Prevent screen sleep | Native Expo module, simple hook API, user-configurable |
| react-native-safe-area-context | (bundled) | Notch/safe area handling | Required for proper screen layouts, peer dep of expo-router |

### Maps
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-maps | ~1.20.x | Map display with markers/polylines | Most mature RN maps library, supports gradient polylines via strokeColors |

### Animation
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | ~3.17.x | 60fps animations, sensor integration | Already in stack research, has useAnimatedSensor hook for direct accelerometer access |
| @shopify/react-native-skia | ~1.8.x | Advanced water rendering (optional) | GPU-accelerated graphics for fluid simulation if basic approach insufficient |

### Theming
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native (Appearance API) | 0.81.x | System dark/light mode detection | Built-in, no extra dependency needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-status-bar | ~3.0.x | Status bar styling | Already installed, works with dark mode |
| expo-navigation-bar | ~4.0.x | Android nav bar styling | Edge-to-edge Android support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-maps | expo-maps | expo-maps newer but doesn't have strokeColors gradient support |
| react-native-maps | react-native-mapbox-gl | Mapbox is better for custom styling but requires API key and has usage costs |
| @shopify/react-native-skia | Pure reanimated | Skia enables shader-based water effects, but adds complexity; try reanimated first |
| expo-router | @react-navigation/native directly | expo-router simplifies with file-based routing and better Expo integration |

**Installation:**
```bash
# Navigation
npx expo install expo-router react-native-safe-area-context react-native-screens

# UI Components
npx expo install @react-native-segmented-control/segmented-control expo-keep-awake

# Maps
npx expo install react-native-maps

# Animation (reanimated already installed)
npx expo install @shopify/react-native-skia  # optional, for advanced water effects
```

## Architecture Patterns

### Recommended Project Structure
```
app/                           # Expo Router file-based routes
  _layout.tsx                  # Root layout with providers
  (tabs)/                      # Tab group
    _layout.tsx                # Tab bar configuration
    index.tsx                  # Home screen
    history/
      _layout.tsx              # Stack for history tab
      index.tsx                # History list
      [id].tsx                 # Drive detail/summary
    settings.tsx               # Settings screen
  drive/
    _layout.tsx                # Stack for drive flow
    active.tsx                 # Active drive screen (modal-like)
    summary/[id].tsx           # Post-drive summary

src/
  components/
    home/
      StartButton.tsx          # Hero start drive button
      RecentDrive.tsx          # Single recent drive card
      DifficultySelector.tsx   # Segmented control wrapper
    drive/
      WaterCup.tsx             # Cup with slosh animation
      SpillCounter.tsx         # Spill count display
      StreakTimer.tsx          # Current streak timer
      StopButton.tsx           # Stop drive button
    summary/
      RouteMap.tsx             # MapView with polyline
      SpillMarker.tsx          # Water drop marker
      StatsBreakdown.tsx       # Full stats grid
      SpillPopup.tsx           # Marker info popup
    history/
      DriveListItem.tsx        # Single drive row
      FilterBar.tsx            # Difficulty/sort filters
    settings/
      SettingRow.tsx           # Generic setting row
      SettingToggle.tsx        # Toggle switch row
    shared/
      Card.tsx                 # Common card wrapper
      ThemedText.tsx           # Text with dark mode support
      ThemedView.tsx           # View with dark mode support
  hooks/
    useTheme.ts                # Dark mode hook wrapper
    useKeepAwake.ts            # Configurable keep-awake
  theme/
    colors.ts                  # Light/dark color definitions
    spacing.ts                 # Layout constants
```

### Pattern 1: System Adaptive Theming
**What:** Follow device dark/light mode setting automatically
**When to use:** All screens and components
**Example:**
```typescript
// theme/colors.ts
export const Colors = {
  light: {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#1a1a1a',
    textSecondary: '#666666',
    primary: '#00d4ff',
    danger: '#ff4444',
    success: '#00ff00',
  },
  dark: {
    background: '#1a1a2e',
    surface: '#2a2a4e',
    text: '#ffffff',
    textSecondary: '#888888',
    primary: '#00d4ff',
    danger: '#ff4444',
    success: '#00ff00',
  },
};

// hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { Colors } from '../theme/colors';

export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  return {
    colors: Colors[colorScheme],
    isDark: colorScheme === 'dark',
  };
}

// components/shared/ThemedView.tsx
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export function ThemedView({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.background }, style]} {...props} />;
}
```

### Pattern 2: Accelerometer-Driven Water Animation
**What:** Connect device accelerometer to water slosh animation at 60fps
**When to use:** Active drive screen water cup visualization
**Example:**
```typescript
// Source: https://docs.swmansion.com/react-native-reanimated/docs/device/useAnimatedSensor/
import { useAnimatedSensor, SensorType, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

export function WaterCup({ fillLevel }: { fillLevel: number }) {
  // Direct accelerometer access - runs on UI thread
  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER, {
    interval: 16, // ~60fps
  });

  // Animate water surface tilt based on acceleration
  const waterStyle = useAnimatedStyle(() => {
    const { x, y } = accelerometer.sensor.value;

    // Map accelerometer to water tilt (clamp to reasonable range)
    const tiltX = interpolate(x, [-5, 5], [-15, 15], 'clamp');
    const tiltY = interpolate(y, [-5, 5], [-15, 15], 'clamp');

    return {
      transform: [
        { rotateX: `${tiltY}deg` },
        { rotateZ: `${tiltX}deg` },
      ],
    };
  });

  return (
    <View style={styles.cup}>
      <Animated.View style={[styles.water, { height: `${fillLevel * 100}%` }, waterStyle]}>
        {/* Water surface */}
      </Animated.View>
    </View>
  );
}
```

### Pattern 3: Color-Coded Route Polyline
**What:** Draw route with colors indicating smoothness (green=good, red=rough)
**When to use:** Drive summary map
**Example:**
```typescript
// Source: https://github.com/react-native-maps/react-native-maps/blob/master/docs/polyline.md
import MapView, { Polyline, Marker } from 'react-native-maps';

interface RoutePoint {
  latitude: number;
  longitude: number;
  smoothness: number; // 0-1 (0=rough, 1=smooth)
}

function smoothnessToColor(smoothness: number): string {
  // Interpolate from red (rough) to green (smooth)
  if (smoothness < 0.3) return '#ff4444'; // red
  if (smoothness < 0.5) return '#ffaa00'; // orange
  if (smoothness < 0.7) return '#ffff00'; // yellow
  return '#00ff00'; // green
}

export function RouteMap({ route }: { route: RoutePoint[] }) {
  const coordinates = route.map(p => ({ latitude: p.latitude, longitude: p.longitude }));
  const strokeColors = route.map(p => smoothnessToColor(p.smoothness));

  return (
    <MapView style={{ flex: 1 }} region={calculateRegion(coordinates)}>
      <Polyline
        coordinates={coordinates}
        strokeWidth={4}
        strokeColor="#00ff00" // fallback
        strokeColors={strokeColors}
      />
    </MapView>
  );
}
```

### Pattern 4: Tab Navigation with Nested Stacks
**What:** Bottom tabs for main sections, stacks within tabs for drill-down
**When to use:** App-wide navigation architecture
**Example:**
```typescript
// app/(tabs)/_layout.tsx
// Source: https://docs.expo.dev/router/basics/common-navigation-patterns/
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { Home, Clock, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
```

### Anti-Patterns to Avoid
- **Inline anonymous functions in FlatList renderItem:** Creates new function every render. Use useCallback or move outside component.
- **Not using keyExtractor in lists:** Causes React reconciliation issues and poor performance.
- **Storing theme colors in state:** Use useColorScheme hook which auto-updates on system change.
- **Creating custom ScrollView-based lists:** Use FlatList for virtualization and memory efficiency.
- **Putting MapView last in view hierarchy:** Can cause tap event issues. Put MapView first in component tree.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Safe area handling | Manual padding for notches | react-native-safe-area-context | Handles all device types, rotation, dynamic islands |
| Dark mode detection | Manual platform checks | useColorScheme() hook | Built-in, handles system changes automatically |
| Segmented control | Custom button group | @react-native-segmented-control/segmented-control | Native on iOS, consistent cross-platform |
| Screen sleep prevention | Native module | expo-keep-awake | Simple hook API, handles component lifecycle |
| Map with markers | WebView with Google Maps | react-native-maps | Native performance, proper gesture handling |
| 60fps sensor animation | setInterval + useState | useAnimatedSensor | Runs on UI thread, no JS bridge bottleneck |
| Navigation | Custom screen stack | expo-router | Deep linking, web support, type-safe routes |
| List virtualization | Map over array in ScrollView | FlatList | Memory efficient, only renders visible items |

**Key insight:** React Native has a mature ecosystem for common UI patterns. Custom solutions typically perform worse and miss edge cases (accessibility, RTL, dynamic type, etc).

## Common Pitfalls

### Pitfall 1: Animation Jank from JS Thread Sensor Updates
**What goes wrong:** Water animation stutters because accelerometer updates go through JS thread
**Why it happens:** Using expo-sensors with useState causes bridge round-trips for every sample
**How to avoid:** Use `useAnimatedSensor` from react-native-reanimated which runs entirely on UI thread
**Warning signs:** Animation drops below 60fps when other JS work happens (e.g., during navigation)

### Pitfall 2: strokeColors Array Length Mismatch
**What goes wrong:** Polyline doesn't render or shows only partial route
**Why it happens:** `strokeColors` array must have exactly the same length as `coordinates` array
**How to avoid:** Generate colors in same loop as coordinates, verify lengths match before render
**Warning signs:** Route appears and disappears, or only shows first segment

### Pitfall 3: FlatList Performance with Complex Items
**What goes wrong:** History list scrolls poorly, items flash white during scroll
**Why it happens:** Not using getItemLayout, windowSize too large, or re-creating renderItem
**How to avoid:**
- Provide `getItemLayout` for fixed-height items
- Use `useCallback` for `renderItem`
- Set `windowSize` to ~5 for memory efficiency
- Use `keyExtractor` with stable IDs
**Warning signs:** Console warnings about VirtualizedList, visible blank areas while scrolling

### Pitfall 4: Dark Mode Flash on App Launch
**What goes wrong:** App shows light theme briefly then switches to dark
**Why it happens:** useColorScheme returns undefined on first render, default to 'light'
**How to avoid:**
- Set `userInterfaceStyle: "automatic"` in app.json (currently set to "light"!)
- Use SplashScreen.preventAutoHideAsync() until theme is determined
**Warning signs:** Visible flash when app opens in dark mode

### Pitfall 5: Map Marker Touch Events Not Working
**What goes wrong:** Tapping spill markers doesn't show popup
**Why it happens:** MapView must be early in component tree, or other views intercept touches
**How to avoid:** Put MapView as first child in parent, use Callout component for popups
**Warning signs:** onPress handlers never fire, or fire for wrong markers

### Pitfall 6: Keep-Awake Left Active After Drive Ends
**What goes wrong:** Screen stays awake even after returning to home screen
**Why it happens:** Using imperative activateKeepAwakeAsync without matching deactivation
**How to avoid:** Use `useKeepAwake` hook which auto-deactivates on unmount, or use tag parameter
**Warning signs:** Battery drain when app is open but not in active drive

### Pitfall 7: Missing Safe Area on Android Edge-to-Edge
**What goes wrong:** Content overlaps with status bar or navigation bar on Android
**Why it happens:** Android edge-to-edge mode (enabled in app.json) requires explicit safe area handling
**How to avoid:** Wrap screens with SafeAreaView or use useSafeAreaInsets hook
**Warning signs:** Text cut off at top of screen, buttons behind Android nav bar

## Code Examples

### Configurable Keep-Awake Hook
```typescript
// hooks/useConfigurableKeepAwake.ts
import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

export function useConfigurableKeepAwake(enabled: boolean, tag = 'ActiveDrive') {
  useEffect(() => {
    if (enabled) {
      activateKeepAwakeAsync(tag);
    } else {
      deactivateKeepAwake(tag);
    }

    return () => {
      deactivateKeepAwake(tag);
    };
  }, [enabled, tag]);
}

// Usage in ActiveDriveScreen:
const keepAwakeEnabled = useSettingsStore(s => s.keepScreenAwake);
useConfigurableKeepAwake(keepAwakeEnabled);
```

### Spill Marker with Callout Popup
```typescript
// Source: https://github.com/react-native-maps/react-native-maps/blob/master/docs/callout.md
import { Marker, Callout } from 'react-native-maps';
import { View, Text, Image } from 'react-native';

interface SpillEvent {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  severity: number;
  triggerType: 'brake' | 'turn' | 'accel';
}

export function SpillMarker({ event }: { event: SpillEvent }) {
  const severityLabel = event.severity < 0.3 ? 'Minor' : event.severity < 0.7 ? 'Moderate' : 'Major';
  const triggerLabels = { brake: 'Hard Brake', turn: 'Sharp Turn', accel: 'Acceleration' };

  return (
    <Marker
      coordinate={{ latitude: event.latitude, longitude: event.longitude }}
      anchor={{ x: 0.5, y: 1 }}
    >
      {/* Custom water drop icon */}
      <Image source={require('../assets/water-drop.png')} style={{ width: 24, height: 32 }} />

      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{severityLabel} Spill</Text>
          <Text style={styles.calloutText}>{triggerLabels[event.triggerType]}</Text>
          <Text style={styles.calloutTime}>
            {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
}
```

### Difficulty Segmented Control
```typescript
// components/home/DifficultySelector.tsx
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '../../hooks/useTheme';
import { useSensorStore, DifficultyLevel } from '../../stores/useSensorStore';

const DIFFICULTIES: DifficultyLevel[] = ['easy', 'experienced', 'master'];
const LABELS = ['Easy', 'Experienced', 'Master'];

export function DifficultySelector() {
  const { colors, isDark } = useTheme();
  const difficulty = useSensorStore(s => s.difficulty);
  const setDifficulty = useSensorStore(s => s.setDifficulty);

  return (
    <SegmentedControl
      values={LABELS}
      selectedIndex={DIFFICULTIES.indexOf(difficulty)}
      onChange={(event) => {
        setDifficulty(DIFFICULTIES[event.nativeEvent.selectedSegmentIndex]);
      }}
      appearance={isDark ? 'dark' : 'light'}
      style={{ marginVertical: 16 }}
    />
  );
}
```

### History List with Filtering
```typescript
// screens/history/index.tsx
import { useState, useCallback, useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useDriveHistory } from '../../hooks/useDriveHistory';
import { DriveListItem } from '../../components/history/DriveListItem';
import { FilterBar } from '../../components/history/FilterBar';

type SortOption = 'date' | 'score';
type DifficultyFilter = 'all' | 'easy' | 'experienced' | 'master';

export default function HistoryScreen() {
  const { drives, loading, refresh } = useDriveHistory(100);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');

  const filteredDrives = useMemo(() => {
    let result = drives;

    if (difficultyFilter !== 'all') {
      result = result.filter(d => d.difficulty === difficultyFilter);
    }

    return result.sort((a, b) => {
      if (sortBy === 'score') {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
  }, [drives, sortBy, difficultyFilter]);

  const renderItem = useCallback(
    ({ item }) => <DriveListItem drive={item} />,
    []
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={{ flex: 1 }}>
      <FilterBar
        sortBy={sortBy}
        onSortChange={setSortBy}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
      />
      <FlatList
        data={filteredDrives}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onRefresh={refresh}
        refreshing={loading}
        getItemLayout={(_, index) => ({ length: 80, offset: 80 * index, index })}
        windowSize={5}
        maxToRenderPerBatch={10}
      />
    </View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Navigation imperative API | Expo Router file-based routing | Expo SDK 49 (2023) | Simpler navigation, automatic deep linking |
| Animated.Value + JS thread | Reanimated shared values + UI thread | Reanimated v2 (2021) | 60fps animations even with JS load |
| expo-av for all audio | expo-audio (media) + react-native-audio-api (low-latency) | SDK 53 (2025) | expo-av deprecated in SDK 55 |
| Manual dark mode toggle | useColorScheme + userInterfaceStyle: automatic | RN 0.62 (2020) | System-integrated theme switching |
| Custom safe area padding | react-native-safe-area-context | 2019 | Handles all notch types, Dynamic Island |

**Deprecated/outdated:**
- `userInterfaceStyle: "light"` in app.json: Change to `"automatic"` for system adaptive theme
- SafeAreaView from react-native: Use react-native-safe-area-context instead (cross-platform)
- SegmentedControlIOS: Use @react-native-segmented-control/segmented-control

## Open Questions

1. **Water animation complexity level**
   - What we know: useAnimatedSensor provides accelerometer data at 60fps, can drive simple transforms
   - What's unclear: How complex should the water slosh look? Simple tilt vs realistic fluid simulation
   - Recommendation: Start with reanimated transforms (tilt/wave), add Skia shaders only if insufficient

2. **Smoothness calculation for route colors**
   - What we know: Breadcrumbs table stores location data, events store spills
   - What's unclear: How to calculate "smoothness" between breadcrumbs for polyline coloring
   - Recommendation: Use inverse of jerk magnitude at each breadcrumb, or interpolate from nearby spill events

3. **Map provider on Android**
   - What we know: react-native-maps uses Google Maps on Android, Apple Maps on iOS (default)
   - What's unclear: Is Google Maps API key already configured? (Not in current app.json)
   - Recommendation: Add Google Maps API key config during implementation, or use Apple Maps for both platforms

## Sources

### Primary (HIGH confidence)
- [Expo Router Common Navigation Patterns](https://docs.expo.dev/router/basics/common-navigation-patterns/) - tabs with nested stacks
- [Expo Keep-Awake Documentation](https://docs.expo.dev/versions/latest/sdk/keep-awake/) - API reference
- [Expo Color Themes](https://docs.expo.dev/develop/user-interface/color-themes/) - userInterfaceStyle config
- [react-native-maps Polyline](https://github.com/react-native-maps/react-native-maps/blob/master/docs/polyline.md) - strokeColors gradient
- [react-native-maps Marker](https://github.com/react-native-maps/react-native-maps/blob/master/docs/marker.md) - custom markers
- [react-native-maps Callout](https://github.com/react-native-maps/react-native-maps/blob/master/docs/callout.md) - popup API
- [useAnimatedSensor](https://docs.swmansion.com/react-native-reanimated/docs/device/useAnimatedSensor/) - accelerometer hook
- [React Native Skia Animations](https://shopify.github.io/react-native-skia/docs/animations/animations/) - Reanimated integration
- [Expo Segmented Control](https://docs.expo.dev/versions/latest/sdk/segmented-control/) - bundled version 2.5.7

### Secondary (MEDIUM confidence)
- [FlatList Performance Guide](https://reactnative.dev/docs/optimizing-flatlist-configuration) - official RN docs
- [react-native-safe-area-context](https://docs.expo.dev/versions/latest/sdk/safe-area-context/) - safe areas for notches
- [Best Practices for Expo Router](https://medium.com/@siddhantshelake/best-practices-for-expo-router-tabs-stacks-shared-screens-b3cacc3e8ebb) - community patterns

### Tertiary (LOW confidence)
- Liquid animation with Skia may require custom shader development - no specific water slosh tutorial found
- strokeColors on Android may have rendering differences from iOS - test on both platforms

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official Expo modules or well-documented community standards
- Architecture: HIGH - Patterns from official Expo documentation
- Pitfalls: HIGH - Documented issues from official docs and verified GitHub issues
- Water animation: MEDIUM - Basic approach verified, advanced fluid simulation may need experimentation

**Research date:** 2026-02-03
**Valid until:** 30 days (stable UI libraries, but check for Expo SDK 55 changes)
