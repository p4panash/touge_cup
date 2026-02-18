import { StyleSheet, Pressable, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../shared/ThemedText';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface StopButtonProps {
  onPress: () => void;
}

/**
 * Stop button for ending an active drive
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
        <View style={styles.stopIcon} />
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
  stopIcon: {
    width: 16,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 3,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
});
