import { StyleSheet, Pressable, View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import Svg, { Path, Circle } from 'react-native-svg';

interface StartButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Engine start/stop button — inspired by modern car ignition buttons
 *
 * Large circular button with a metallic ring, power icon, and
 * START / ENGINE labels. Glows red when active.
 */
export function StartButton({ onPress, disabled = false }: StartButtonProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      {/* Chrome-style outer ring */}
      <View
        style={[
          styles.outerRing,
          {
            borderColor: disabled
              ? 'transparent'
              : isDark
                ? 'rgba(224, 107, 79, 0.2)'
                : 'rgba(80, 80, 80, 0.15)',
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
            {/* Power icon */}
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" style={styles.icon}>
              <Path
                d="M12 2v6"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <Path
                d="M16.24 7.76a6 6 0 11-8.49 0"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.startLabel}>START</Text>
            <Text style={styles.engineLabel}>ENGINE</Text>
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
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 6,
  },
  startLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 3,
  },
  engineLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
    marginTop: 2,
  },
});
