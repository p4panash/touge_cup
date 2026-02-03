import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

/**
 * Tab bar icon component using emoji
 * Simple placeholder - can be replaced with lucide-react-native icons later
 */
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={[styles.icon, { color }]}>{emoji}</Text>;
}

/**
 * Tab layout with three tabs: Home, History, Settings
 * Uses system adaptive theming for tab bar colors
 */
export default function TabLayout() {
  const { colors } = useTheme();

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
          headerTitle: 'Water Cup Coach',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: false, // History has its own stack with header
          tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
});
