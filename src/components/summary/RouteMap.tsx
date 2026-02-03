import { StyleSheet, View, Text } from 'react-native';
import MapView, { Polyline, Region } from 'react-native-maps';
import { SpillMarker } from './SpillMarker';
import { useTheme } from '../../hooks/useTheme';
import type { Breadcrumb } from '../../db/schema/breadcrumbs';
import type { DriveEvent } from '../../db/schema/events';

interface RouteMapProps {
  breadcrumbs: Breadcrumb[];
  events: DriveEvent[];
}

/**
 * Haversine distance calculation between two coordinates
 * Returns distance in meters
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate map region from breadcrumb coordinates
 * Centers on route with padding for visibility
 */
function calculateRegion(breadcrumbs: Breadcrumb[]): Region {
  if (breadcrumbs.length === 0) {
    // Default region (San Francisco)
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }

  const lats = breadcrumbs.map((b) => b.latitude);
  const lngs = breadcrumbs.map((b) => b.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Add 20% padding
  const latDelta = (maxLat - minLat) * 1.2 || 0.01;
  const lngDelta = (maxLng - minLng) * 1.2 || 0.01;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/**
 * Check if a breadcrumb is near any spill event
 * Returns color based on proximity:
 * - Within 50m and 10 seconds: red (#ff4444)
 * - Within 100m and 30 seconds: orange (#ffaa00)
 * - Otherwise: green (#00ff00)
 */
function getColorForBreadcrumb(
  breadcrumb: Breadcrumb,
  spillEvents: DriveEvent[]
): string {
  const breadcrumbTime =
    breadcrumb.timestamp instanceof Date
      ? breadcrumb.timestamp.getTime()
      : new Date(breadcrumb.timestamp).getTime();

  for (const spill of spillEvents) {
    if (spill.latitude === null || spill.longitude === null) continue;

    const spillTime =
      spill.timestamp instanceof Date
        ? spill.timestamp.getTime()
        : new Date(spill.timestamp).getTime();

    const distance = haversineDistance(
      breadcrumb.latitude,
      breadcrumb.longitude,
      spill.latitude,
      spill.longitude
    );
    const timeDiff = Math.abs(breadcrumbTime - spillTime);

    // Close proximity: within 50m and 10 seconds
    if (distance < 50 && timeDiff < 10000) {
      return '#ff4444'; // red
    }

    // Medium proximity: within 100m and 30 seconds
    if (distance < 100 && timeDiff < 30000) {
      return '#ffaa00'; // orange
    }
  }

  return '#00ff00'; // green - good driving
}

/**
 * Generate stroke colors array for polyline
 * Per RESEARCH.md Pitfall 2: strokeColors must have same length as coordinates
 */
function generateStrokeColors(
  breadcrumbs: Breadcrumb[],
  spillEvents: DriveEvent[]
): string[] {
  return breadcrumbs.map((breadcrumb) =>
    getColorForBreadcrumb(breadcrumb, spillEvents)
  );
}

/**
 * Route map component for drive summary
 * Shows color-coded polyline and spill markers
 */
export function RouteMap({ breadcrumbs, events }: RouteMapProps) {
  const { colors } = useTheme();

  // Filter to only spill events with location
  const spillEvents = events.filter(
    (e) => e.type === 'spill' && e.latitude !== null && e.longitude !== null
  );

  // Handle empty breadcrumbs
  if (breadcrumbs.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No route data available
        </Text>
      </View>
    );
  }

  // Generate coordinates and colors
  const coordinates = breadcrumbs.map((b) => ({
    latitude: b.latitude,
    longitude: b.longitude,
  }));
  const strokeColors = generateStrokeColors(breadcrumbs, spillEvents);
  const region = calculateRegion(breadcrumbs);

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      showsUserLocation={false}
      showsMyLocationButton={false}
    >
      <Polyline
        coordinates={coordinates}
        strokeWidth={4}
        strokeColor="#00ff00"
        strokeColors={strokeColors}
      />
      {spillEvents.map((event) => (
        <SpillMarker key={event.id} event={event} />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    minHeight: 200,
  },
  emptyContainer: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
