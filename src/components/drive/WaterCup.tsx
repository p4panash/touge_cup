import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedSensor,
  SensorType,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface WaterCupProps {
  /** Water fill level from 0 to 1 (1 = full, drops on spills) */
  fillLevel: number;
}

/**
 * Animated water cup visualization
 *
 * Uses device accelerometer to create real-time water slosh animation.
 * The water surface tilts based on x/y acceleration, creating an immersive
 * connection between driving smoothness and visual feedback.
 *
 * Per RESEARCH.md Pattern 2: Accelerometer-Driven Water Animation
 * Uses useAnimatedSensor running on UI thread for 60fps performance.
 */
export function WaterCup({ fillLevel }: WaterCupProps) {
  const { colors, isDark } = useTheme();

  // Direct accelerometer access - runs on UI thread for 60fps
  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER, {
    interval: 16, // ~60fps
  });

  // Animate water surface tilt based on acceleration
  const waterStyle = useAnimatedStyle(() => {
    const { x, y } = accelerometer.sensor.value;

    // Map accelerometer to water tilt (clamp to reasonable range)
    // X affects left/right tilt (rotateZ)
    // Y affects forward/back tilt (rotateX)
    const tiltX = interpolate(
      x,
      [-5, 5],
      [-15, 15],
      Extrapolation.CLAMP
    );
    const tiltY = interpolate(
      y,
      [-5, 5],
      [-15, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { perspective: 300 },
        { rotateX: `${tiltY}deg` },
        { rotateZ: `${-tiltX}deg` },
      ],
    };
  });

  // Water color based on theme
  const waterColor = isDark ? '#00b4d8' : '#0077b6';
  const waterSurfaceColor = isDark ? '#48cae4' : '#00b4d8';

  // Clamp fill level between 0.1 and 1 (never fully empty for visual appeal)
  const clampedFill = Math.max(0.1, Math.min(1, fillLevel));

  return (
    <View style={styles.container}>
      {/* Cup outline */}
      <View
        style={[
          styles.cup,
          {
            borderColor: isDark ? '#666' : '#333',
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          },
        ]}
      >
        {/* Water container with overflow hidden */}
        <View style={styles.waterContainer}>
          {/* Animated water fill */}
          <Animated.View
            style={[
              styles.water,
              waterStyle,
              {
                height: `${clampedFill * 100}%`,
                backgroundColor: waterColor,
              },
            ]}
          >
            {/* Water surface highlight */}
            <View
              style={[
                styles.waterSurface,
                { backgroundColor: waterSurfaceColor },
              ]}
            />
          </Animated.View>
        </View>
      </View>

      {/* Cup handle */}
      <View
        style={[
          styles.handle,
          {
            borderColor: isDark ? '#666' : '#333',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cup: {
    width: 160,
    height: 200,
    borderWidth: 4,
    borderRadius: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  waterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  water: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  waterSurface: {
    width: '100%',
    height: 8,
    opacity: 0.6,
  },
  handle: {
    width: 40,
    height: 80,
    borderWidth: 4,
    borderLeftWidth: 0,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    marginLeft: -4,
  },
});
