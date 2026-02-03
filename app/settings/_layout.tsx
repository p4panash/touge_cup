import { Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="logs"
        options={{
          title: 'Debug Logs',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingRight: 8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={28} color={colors.text} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
