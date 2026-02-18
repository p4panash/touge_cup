import { StyleSheet, Pressable, View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import Svg, { Path } from 'react-native-svg';

interface StartButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Engine start/stop button — inspired by modern car ignition buttons
 *
 * Metallic outer ring, red center with power icon.
 * Designed to feel premium and tactile.
 */
export function StartButton({ onPress, disabled = false }: StartButtonProps) {
  const { colors, isDark } = useTheme();

  const ringColor = isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.06)';

  const ringBorder = isDark
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.wrapper}>
      {/* Metallic outer ring */}
      <View
        style={[
          styles.outerRing,
          {
            backgroundColor: ringColor,
            borderColor: ringBorder,
          },
        ]}
      >
        {/* Inner shadow ring for depth */}
        <View
          style={[
            styles.innerRing,
            {
              borderColor: isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.03)',
            },
          ]}
        >
          <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: disabled
                  ? colors.textSecondary
                  : colors.primary,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                shadowColor: disabled ? '#000' : colors.primary,
              },
            ]}
          >
            <View style={styles.content}>
              {/* Power icon */}
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" style={styles.icon}>
                <Path
                  d="M12 2v8"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                <Path
                  d="M16.24 7.76a6 6 0 11-8.49 0"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.startLabel}>
                {disabled ? 'RUNNING' : 'ENGINE'}
              </Text>
              <Text style={styles.engineLabel}>
                {disabled ? '' : 'START'}
              </Text>
            </View>
          </Pressable>
        </View>
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
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 172,
    height: 172,
    borderRadius: 86,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 8,
  },
  startLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 4,
  },
  engineLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
    marginTop: 2,
  },
});
