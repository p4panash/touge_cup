import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { audioEngine } from '@/audio/AudioEngine';
import { useSensorPipeline } from '@/hooks/useSensorPipeline';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';
import { useSensorStore } from '@/stores/useSensorStore';

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
 * Risk display component
 * Shows current risk value and jerk magnitude from sensor store
 */
function RiskDisplay() {
  const risk = useSensorStore((state) => state.risk);
  const jerkMagnitude = useSensorStore((state) => state.jerkMagnitude);
  const isSpill = useSensorStore((state) => state.isSpill);

  // Determine color based on risk level
  const getRiskColor = () => {
    if (risk >= 0.7 || isSpill) return '#ff4444';
    if (risk >= 0.5) return '#ffaa00';
    if (risk >= 0.3) return '#ffff00';
    return '#00ff00';
  };

  return (
    <View style={styles.riskContainer}>
      <Text style={styles.label}>Risk Level</Text>
      <Text style={[styles.riskValue, { color: getRiskColor() }]}>
        {(risk * 100).toFixed(0)}%
      </Text>
      <View style={styles.riskBar}>
        <View
          style={[
            styles.riskFill,
            {
              width: `${Math.min(100, risk * 100)}%`,
              backgroundColor: getRiskColor(),
            },
          ]}
        />
      </View>
      <Text style={styles.jerkText}>
        Jerk: {jerkMagnitude.toFixed(2)} m/s^3
      </Text>
      {isSpill && <Text style={styles.spillText}>SPILL!</Text>}
    </View>
  );
}

/**
 * Main screen with sensor pipeline controls and debug display
 */
function MainScreen() {
  const { isActive, isSettling, start, stop } = useSensorPipeline();
  const { lastPlayedSound, isSpillOnCooldown } = useAudioFeedback();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Cup Coach</Text>
      <Text style={styles.subtitle}>Debug Mode</Text>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text
            style={[
              styles.statusValue,
              { color: isActive ? '#00ff00' : '#888888' },
            ]}
          >
            {isActive ? 'Active' : 'Stopped'}
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

        {lastPlayedSound && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Sound:</Text>
            <Text style={styles.statusValue}>{lastPlayedSound}</Text>
          </View>
        )}

        {isSpillOnCooldown && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Spill Cooldown:</Text>
            <Text style={[styles.statusValue, { color: '#ff4444' }]}>
              Active
            </Text>
          </View>
        )}
      </View>

      <RiskDisplay />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isActive ? '#ff4444' : '#00d4ff' },
        ]}
        onPress={isActive ? stop : start}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>{isActive ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {isActive
          ? 'Move your phone to test audio feedback'
          : 'Press Start to begin sensor tracking'}
      </Text>

      <StatusBar style="light" />
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
    marginTop: 16,
  },
  statusContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
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
  riskContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
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
  spillText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
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
});
