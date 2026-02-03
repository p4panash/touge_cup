import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

/**
 * Drive flow stack layout
 * Contains active drive screen and post-drive summary
 * Presented modally from home screen when drive starts
 */
export default function DriveLayout() {
  const router = useRouter();
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
          headerLeft: () => (
            <Pressable onPress={() => router.replace('/')} style={styles.doneButton}>
              <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
            </Pressable>
          ),
          // Prevent going back to active drive (which no longer exists)
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  doneButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
