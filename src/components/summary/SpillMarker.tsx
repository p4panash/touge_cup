import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { useTheme } from '../../hooks/useTheme';
import type { DriveEvent } from '../../db/schema/events';

interface SpillMarkerProps {
  event: DriveEvent;
}

/**
 * Severity mapping based on 03-03 decisions:
 * - severity < 0.5: "Minor" (low)
 * - severity < 0.7: "Moderate" (medium)
 * - severity >= 0.7: "Major" (high)
 */
function getSeverityInfo(severity: number | null): { label: string; color: string } {
  const value = severity ?? 0;
  if (value < 0.5) {
    return { label: 'Minor Spill', color: '#ffcc00' }; // yellow
  }
  if (value < 0.7) {
    return { label: 'Moderate Spill', color: '#ff8800' }; // orange
  }
  return { label: 'Major Spill', color: '#ff4444' }; // red
}

function formatTime(timestamp: Date | number): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Water drop marker for spill locations on the drive summary map
 * Shows tappable marker with callout popup displaying severity and time
 */
export function SpillMarker({ event }: SpillMarkerProps) {
  const { colors } = useTheme();

  // Must have location to render marker
  if (event.latitude === null || event.longitude === null) {
    return null;
  }

  const { label, color } = getSeverityInfo(event.severity);

  return (
    <Marker
      coordinate={{
        latitude: event.latitude,
        longitude: event.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
    >
      {/* Custom water drop icon */}
      <View style={[styles.markerContainer, { borderColor: color }]}>
        <Text style={styles.dropIcon}>💧</Text>
      </View>

      <Callout tooltip>
        <View style={[styles.calloutContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.calloutTitle, { color }]}>{label}</Text>
          <Text style={[styles.calloutTime, { color: colors.textSecondary }]}>
            {formatTime(event.timestamp)}
          </Text>
          {event.severity !== null && (
            <Text style={[styles.calloutSeverity, { color: colors.textSecondary }]}>
              Severity: {(event.severity * 100).toFixed(0)}%
            </Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropIcon: {
    fontSize: 18,
  },
  calloutContainer: {
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutTime: {
    fontSize: 12,
  },
  calloutSeverity: {
    fontSize: 11,
    marginTop: 2,
  },
});
