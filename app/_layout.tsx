// CRITICAL: Import background task registry FIRST
// TaskManager.defineTask must run before React initializes
import '../src/background/BackgroundTaskRegistry';

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDatabaseMigrations } from '@/db/client';
import { audioEngine } from '@/audio/AudioEngine';
import { useTheme } from '@/hooks/useTheme';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

/**
 * Database initialization wrapper
 * Runs migrations before allowing app to render
 */
function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.danger }]}>Database Error</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error.message}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Initializing database...
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Audio initialization wrapper
 * Initializes audio engine before rendering content
 */
function AudioProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.danger }]}>Audio Error</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Initializing audio...
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Root layout component
 * Wraps entire app with necessary providers in correct order:
 * 1. SafeAreaProvider - handles safe areas for notches/islands
 * 2. DatabaseProvider - ensures DB is ready before content
 * 3. AudioProvider - ensures audio engine is ready
 * 4. Slot - renders child routes
 */
export default function RootLayout() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // Hide splash screen after theme is determined
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <DatabaseProvider>
          <AudioProvider>
            <Slot />
          </AudioProvider>
        </DatabaseProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
