import { useEffect, useRef } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Home, BarChart3, Settings } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useDriveStore, isDriving } from '@/stores/useDriveStore';
import { DriveRecorder } from '@/services/DriveRecorder';

/**
 * Tab layout with three tabs: Home, History, Settings
 * Uses system adaptive theming for tab bar colors
 *
 * Also handles auto-navigation when drives auto-start/stop
 */
export default function TabLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const driveState = useDriveStore((s) => s.driveState);

  // Track previous drive state and ID for navigation
  const prevDrivingRef = useRef(false);
  const lastDriveIdRef = useRef<string | null>(null);

  // Watch for auto-start/stop and navigate accordingly
  useEffect(() => {
    const currentlyDriving = isDriving(driveState);
    const wasDriving = prevDrivingRef.current;

    // Track current drive ID while driving
    if (currentlyDriving) {
      const driveId = DriveRecorder.getCurrentDriveId();
      if (driveId) {
        lastDriveIdRef.current = driveId;
      }
    }

    // Auto-start: transitioned to driving, navigate to active screen
    if (currentlyDriving && !wasDriving) {
      // Only navigate if we're not already on drive screens
      if (!pathname.startsWith('/drive')) {
        router.push('/drive/active');
      }
    }

    // Auto-stop: transitioned from driving to idle, navigate to summary
    if (!currentlyDriving && wasDriving && driveState.type === 'idle') {
      // Navigate to summary if we have a drive ID and not already on summary
      if (lastDriveIdRef.current && !pathname.includes('/summary')) {
        router.replace(`/drive/summary/${lastDriveIdRef.current}`);
        lastDriveIdRef.current = null;
      }
    }

    prevDrivingRef.current = currentlyDriving;
  }, [driveState, pathname, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Tofu Coach',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: false, // History has its own stack with header
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
