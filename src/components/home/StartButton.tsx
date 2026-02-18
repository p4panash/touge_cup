import { StyleSheet, Pressable, View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../shared/ThemedText';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface StartButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Hero start button — styled as an ignition/launch action
 *
 * Large circular button with a subtle ring and Japanese text accent.
 * The primary action on the home screen.
 */
export function StartButton({ onPress, disabled = false }: StartButtonProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      {/* Outer glow ring */}
      <View
        style={[
          styles.outerRing,
          {
            borderColor: disabled
              ? 'transparent'
              : isDark
                ? 'rgba(224, 107, 79, 0.2)'
                : 'rgba(212, 88, 58, 0.15)',
          },
        ]}
      >
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: disabled ? colors.textSecondary : colors.primary,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <View style={styles.content}>
            <Text style={styles.textJP}>発進</Text>
            <ThemedText style={styles.text}>START</ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textJP: {
    fontSize: 28,
    fontWeight: '200',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 8,
    marginBottom: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 6,
  },
});
