import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { audioEngine } from '@/audio/AudioEngine';
import { useSensorPipeline } from '@/hooks/useSensorPipeline';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';
import { useSensorStore } from '@/stores/useSensorStore';
import { useDriveDetection } from '@/hooks/useDriveDetection';
import { useDriveStore, isDriving as isDrivingState } from '@/stores/useDriveStore';
import { useDebugStore } from '@/stores/useDebugStore';

/**
 * Loading screen shown during audio engine initialization
 */
function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00d4ff" />
      <Text style={styles.loadingText}>Initializing audio...</Text>
      <StatusBar style="light" />
    </View>
  );
}

/**
 * Zone display labels and colors
 */
const ZONE_CONFIG = {
  silent: { label: 'Smooth', color: '#00ff00' },
  light: { label: 'Light Slosh', color: '#ffff00' },
  medium: { label: 'Medium Slosh', color: '#ffaa00' },
  heavy: { label: 'Heavy Slosh', color: '#ff6600' },
  spill: { label: 'SPILL!', color: '#ff4444' },
} as const;

/**
 * Risk display component
 * Shows current risk value, zone, and jerk magnitude
 */
function RiskDisplay({
  currentZone,
}: {
  currentZone: 'silent' | 'light' | 'medium' | 'heavy' | 'spill';
}) {
  const risk = useSensorStore((state) => state.risk);
  const jerkMagnitude = useSensorStore((state) => state.jerkMagnitude);

  const zoneConfig = ZONE_CONFIG[currentZone];

  return (
    <View style={styles.riskContainer}>
      <Text style={styles.label}>Risk Level</Text>
      <Text style={[styles.riskValue, { color: zoneConfig.color }]}>
        {(risk * 100).toFixed(0)}%
      </Text>
      <View style={styles.riskBar}>
        <View
          style={[
            styles.riskFill,
            {
              width: `${Math.min(100, risk * 100)}%`,
              backgroundColor: zoneConfig.color,
            },
          ]}
        />
      </View>
      <Text style={styles.jerkText}>
        Jerk: {jerkMagnitude.toFixed(2)} m/s³
      </Text>
      {currentZone !== 'silent' && (
        <Text style={[styles.zoneText, { color: zoneConfig.color }]}>
          {zoneConfig.label}
        </Text>
      )}
    </View>
  );
}

/**
 * Drive status display component
 */
function DriveStatusDisplay() {
  const { requestPermissions, startManual, stopManual, isDriving } = useDriveDetection();
  const permissionStatus = useDriveStore((s) => s.permissionStatus);
  const currentSpeed = useDriveStore((s) => s.currentSpeed);
  const driveState = useDriveStore((s) => s.driveState);
  const hasGpsSignal = useDriveStore((s) => s.hasGpsSignal);

  // Convert speed to km/h for display
  const speedKmh = (currentSpeed * 3.6).toFixed(1);

  // Get display label for drive state
  const getStateLabel = () => {
    switch (driveState.type) {
      case 'idle':
        return 'Idle';
      case 'detecting':
        return 'Detecting...';
      case 'driving':
        return 'Driving';
      case 'stopping':
        return 'Stopping (2min)';
      case 'manual_driving':
        return 'Manual Drive';
      default:
        return 'Unknown';
    }
  };

  const getStateColor = () => {
    switch (driveState.type) {
      case 'idle':
        return '#888888';
      case 'detecting':
        return '#ffaa00';
      case 'driving':
        return '#00ff00';
      case 'stopping':
        return '#ffaa00';
      case 'manual_driving':
        return '#00d4ff';
      default:
        return '#888888';
    }
  };

  const getPermissionLabel = () => {
    switch (permissionStatus) {
      case 'undetermined':
        return 'Not Requested';
      case 'foreground_only':
        return 'Foreground Only';
      case 'background_granted':
        return 'Background Granted';
      case 'denied':
        return 'Denied';
      default:
        return 'Unknown';
    }
  };

  const getPermissionColor = () => {
    switch (permissionStatus) {
      case 'background_granted':
        return '#00ff00';
      case 'foreground_only':
        return '#ffaa00';
      case 'denied':
        return '#ff4444';
      default:
        return '#888888';
    }
  };

  return (
    <View style={styles.driveContainer}>
      <Text style={styles.sectionTitle}>Drive Detection</Text>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Permission:</Text>
        <Text style={[styles.statusValue, { color: getPermissionColor() }]}>
          {getPermissionLabel()}
        </Text>
      </View>

      {permissionStatus !== 'background_granted' && permissionStatus !== 'denied' && (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermissions}
          activeOpacity={0.7}
        >
          <Text style={styles.permissionButtonText}>Request Location Permission</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>GPS Speed:</Text>
        <Text style={[styles.statusValue, { color: hasGpsSignal ? '#ffffff' : '#666666' }]}>
          {hasGpsSignal ? `${speedKmh} km/h` : 'No Signal'}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Drive State:</Text>
        <Text style={[styles.statusValue, { color: getStateColor() }]}>
          {getStateLabel()}
        </Text>
      </View>

      <View style={styles.driveButtonRow}>
        {!isDriving ? (
          <TouchableOpacity
            style={[styles.driveButton, { backgroundColor: '#00d4ff' }]}
            onPress={startManual}
            activeOpacity={0.7}
          >
            <Text style={styles.driveButtonText}>Start Drive</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.driveButton, { backgroundColor: '#ff4444' }]}
            onPress={stopManual}
            activeOpacity={0.7}
          >
            <Text style={styles.driveButtonText}>Stop Drive</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * Debug log viewer - shows recent events for debugging after a drive
 */
function DebugLogViewer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const logs = useDebugStore((s) => s.logs);
  const clearLogs = useDebugStore((s) => s.clearLogs);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <View style={styles.logContainer}>
      <TouchableOpacity
        style={styles.logHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.logTitle}>
          Debug Log ({logs.length}) {isExpanded ? '▼' : '▶'}
        </Text>
        {logs.length > 0 && (
          <TouchableOpacity onPress={clearLogs}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.logScroll} nestedScrollEnabled>
          {logs.length === 0 ? (
            <Text style={styles.logEmpty}>No logs yet. Drive events will appear here.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logEntry}>
                <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                {'  '}
                {log.message}
              </Text>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

/**
 * Main screen with drive controls and debug display
 */
function MainScreen() {
  // Sensors auto-start on mount, we just need the state for display
  const { isActive, isSettling } = useSensorPipeline();
  const { lastPlayedSound, isSpillOnCooldown, currentZone, isRecovering } =
    useAudioFeedback();
  const driveState = useDriveStore((s) => s.driveState);
  const isDrivingNow = isDrivingState(driveState);

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>Water Cup Coach</Text>
      <Text style={styles.subtitle}>Debug Mode</Text>

      <DriveStatusDisplay />

      <View style={styles.statusContainer}>
        <Text style={styles.sectionTitle}>Sensor Pipeline</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text
            style={[
              styles.statusValue,
              { color: isActive ? '#00ff00' : '#888888' },
            ]}
          >
            {isActive ? 'Active' : 'Starting...'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Settling:</Text>
          <Text
            style={[
              styles.statusValue,
              { color: isSettling ? '#ffaa00' : '#00ff00' },
            ]}
          >
            {isSettling ? 'Yes (calibrating...)' : 'No'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Audio Enabled:</Text>
          <Text
            style={[
              styles.statusValue,
              { color: isDrivingNow ? '#00ff00' : '#888888' },
            ]}
          >
            {isDrivingNow ? 'Yes (driving)' : 'No (start drive first)'}
          </Text>
        </View>

        {lastPlayedSound && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Sound:</Text>
            <Text style={styles.statusValue}>{lastPlayedSound}</Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Zone:</Text>
          <Text style={styles.statusValue}>{currentZone}</Text>
        </View>

        {isSpillOnCooldown && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Spill Cooldown:</Text>
            <Text style={[styles.statusValue, { color: '#ff4444' }]}>
              Active
            </Text>
          </View>
        )}

        {isRecovering && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Recovery:</Text>
            <Text style={[styles.statusValue, { color: '#ffaa00' }]}>
              Needs low risk
            </Text>
          </View>
        )}
      </View>

      <RiskDisplay currentZone={currentZone} />

      <Text style={styles.hint}>
        {isDrivingNow
          ? 'Audio feedback active - drive smoothly!'
          : 'Start a drive manually or wait for auto-detection at 15 km/h'}
      </Text>

      <DebugLogViewer />

      <StatusBar style="light" />
    </ScrollView>
  );
}

/**
 * Root app component
 * Initializes audio engine before rendering main content
 */
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await audioEngine.initialize();
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize audio engine:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!isReady) {
    return <LoadingScreen />;
  }

  return <MainScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  driveContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#888888',
  },
  statusValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#3a3a5e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
  },
  driveButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  driveButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  driveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  riskContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  riskValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  riskBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#3a3a5e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  riskFill: {
    height: '100%',
    borderRadius: 4,
  },
  jerkText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  zoneText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  logContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginTop: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  clearButton: {
    fontSize: 12,
    color: '#ff4444',
    paddingHorizontal: 8,
  },
  logScroll: {
    maxHeight: 200,
    marginTop: 12,
  },
  logEmpty: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  logEntry: {
    fontSize: 11,
    color: '#cccccc',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  logTime: {
    color: '#888888',
  },
});
