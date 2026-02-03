import { StyleSheet, ScrollView, View, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/shared/ThemedView';
import { ThemedText } from '@/components/shared/ThemedText';
import { RouteMap } from '@/components/summary/RouteMap';
import { StatsBreakdown } from '@/components/summary/StatsBreakdown';
import { useDriveDetail } from '@/hooks/useDriveHistory';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { SensorDataExporter } from '@/services/SensorDataExporter';

/**
 * Drive summary screen
 * Shows route map with color-coded polyline, spill markers, and full stats
 */
export default function DriveSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { drive, loading, error } = useDriveDetail(id ?? null);
  const { colors } = useTheme();

  // Loading state
  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText variant="secondary" style={styles.loadingText}>
          Loading drive data...
        </ThemedText>
      </ThemedView>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={[styles.errorText, { color: colors.danger }]}>
          Error loading drive
        </ThemedText>
        <ThemedText variant="secondary" style={styles.errorDetail}>
          {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  // Drive not found
  if (!drive) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.notFoundText}>
          Drive not found
        </ThemedText>
        <ThemedText variant="secondary">
          ID: {id}
        </ThemedText>
      </ThemedView>
    );
  }

  // Filter events to only spills
  const spillEvents = drive.events?.filter((e) => e.type === 'spill') ?? [];

  return (
    <ThemedView style={styles.container}>
      {/* Map section - upper half */}
      <View style={styles.mapContainer}>
        <RouteMap
          breadcrumbs={drive.breadcrumbs ?? []}
          events={spillEvents}
        />
      </View>

      {/* Stats section - lower half */}
      <ScrollView
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
        showsVerticalScrollIndicator={false}
      >
        <StatsBreakdown drive={drive} />

        {/* Additional info */}
        <View style={styles.infoSection}>
          <ThemedText variant="secondary" style={styles.infoText}>
            {spillEvents.length === 0
              ? 'No spills recorded - great driving!'
              : `${spillEvents.length} spill${spillEvents.length === 1 ? '' : 's'} detected. Tap markers on map for details.`}
          </ThemedText>
        </View>

        {/* Export sensor data button */}
        {SensorDataExporter.hasData() && (
          <View style={styles.exportSection}>
            <Pressable
              onPress={() => SensorDataExporter.exportCSV()}
              style={({ pressed }) => [
                styles.exportButton,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText style={styles.exportButtonText}>
                Export Sensor Data ({SensorDataExporter.getSampleCount()} samples)
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  mapContainer: {
    flex: 1,
    minHeight: 250,
  },
  statsContainer: {
    flex: 1,
  },
  statsContent: {
    paddingBottom: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  errorDetail: {
    textAlign: 'center',
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  infoSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 12,
  },
  exportSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  exportButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
