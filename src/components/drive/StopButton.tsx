import { StyleSheet, Pressable, View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../shared/ThemedText';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface StopButtonProps {
  onPress: () => void;
}

/**
 * Stop button for ending an active drive
 * Danger-colored with Japanese accent text
 */
export function StopButton({ onPress }: StopButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.danger,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.textJP}>停止</Text>
        <ThemedText style={styles.text}>STOP</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textJP: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
});
