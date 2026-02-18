import { StyleSheet, Pressable, View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import Svg, { Path } from 'react-native-svg';

interface StartButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Engine start/stop button — inspired by real car ignition buttons
 *
 * Layered construction: chrome bezel → groove → red button face
 * with highlight arc for 3D depth. Power icon centered.
 */
export function StartButton({ onPress, disabled = false }: StartButtonProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      {/* Chrome bezel ring */}
      <View
        style={[
          styles.bezel,
          {
            backgroundColor: isDark ? '#2a2a2a' : '#d4d4d4',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {/* Groove / channel */}
        <View
          style={[
            styles.groove,
            {
              backgroundColor: isDark ? '#0a0a0a' : '#e8e4de',
            },
          ]}
        >
          {/* Button face */}
          <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: disabled ? colors.textSecondary : colors.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                shadowColor: disabled ? '#000' : colors.primary,
              },
            ]}
          >
            {/* Highlight arc overlay */}
            <View style={styles.highlightArc} />

            <View style={styles.content}>
              {/* Power icon */}
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" style={styles.icon}>
                <Path
                  d="M12 2v8"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <Path
                  d="M16.24 7.76a6 6 0 11-8.49 0"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth={2.5}
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
  bezel: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  groove: {
    width: 208,
    height: 208,
    borderRadius: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
    overflow: 'hidden',
  },
  highlightArc: {
    position: 'absolute',
    top: 8,
    left: 28,
    right: 28,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
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
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 4,
  },
  engineLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 3,
    marginTop: 2,
  },
});
