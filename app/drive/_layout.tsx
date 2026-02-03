import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

/**
 * Drive flow stack layout
 * Contains active drive screen and post-drive summary
 * Presented modally from home screen when drive starts
 */
export default function DriveLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen
        name="active"
        options={{
          title: 'Active Drive',
          headerShown: false, // Full screen for active drive
          gestureEnabled: false, // Prevent accidental dismissal
        }}
      />
      <Stack.Screen
        name="summary/[id]"
        options={{
          title: 'Drive Summary',
        }}
      />
    </Stack>
  );
}
