import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

/**
 * History tab stack layout
 * Enables drill-down navigation from history list to drive detail
 */
export default function HistoryLayout() {
  const { colors } = useTheme();
  const router = useRouter();

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
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
