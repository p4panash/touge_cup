import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

/**
 * History tab stack layout
 * Enables drill-down navigation from history list to drive detail
 */
export default function HistoryLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'History',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Drive Details',
        }}
      />
    </Stack>
  );
}
