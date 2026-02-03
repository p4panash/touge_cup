import { StyleSheet, Pressable, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../shared/ThemedText';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface StopButtonProps {
  onPress: () => void;
}

/**
 * Stop button for ending an active drive
 *
 * Clearly visible danger-colored button to manually end the drive.
 * Per CONTEXT.md: "Visible stop button - clear button to end drive manually at any time"
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
      <ThemedText style={styles.text}>STOP</ThemedText>
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
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
