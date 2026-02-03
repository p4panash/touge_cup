import { StyleSheet, Pressable, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../shared/ThemedText';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface StartButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Hero start button for initiating a drive
 *
 * Large, prominent button that serves as the primary action on the home screen.
 * Uses primary color from theme with appropriate disabled state.
 */
export function StartButton({ onPress, disabled = false }: StartButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? colors.textSecondary : colors.primary,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.content}>
        <ThemedText style={styles.text}>START DRIVE</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
