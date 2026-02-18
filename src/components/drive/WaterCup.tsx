import { StyleSheet, View, Text } from 'react-native';
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
 * Tofu delivery box visualization
 *
 * An open-top wooden delivery box filled with water and a block of tofu.
 * The tofu tilts with the device accelerometer — if you drive rough,
 * the tofu slides and the water sloshes. Classic Fujiwara style.
 *
 * Uses useAnimatedSensor on UI thread for 60fps performance.
 */
export function WaterCup({ fillLevel }: WaterCupProps) {
  const { colors, isDark } = useTheme();

  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER, {
    interval: 16,
  });

  // Animate tofu block tilt based on acceleration
  const tofuStyle = useAnimatedStyle(() => {
    const { x, y } = accelerometer.sensor.value;

    const tiltX = interpolate(x, [-5, 5], [-12, 12], Extrapolation.CLAMP);
    const tiltY = interpolate(y, [-5, 5], [-8, 8], Extrapolation.CLAMP);
    const slideX = interpolate(x, [-5, 5], [-6, 6], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: slideX },
        { perspective: 300 },
        { rotateZ: `${-tiltX}deg` },
        { rotateX: `${tiltY}deg` },
      ],
    };
  });

  // Animate water surface
  const waterStyle = useAnimatedStyle(() => {
    const { x, y } = accelerometer.sensor.value;

    const tiltX = interpolate(x, [-5, 5], [-15, 15], Extrapolation.CLAMP);
    const tiltY = interpolate(y, [-5, 5], [-10, 10], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective: 300 },
        { rotateX: `${tiltY}deg` },
        { rotateZ: `${-tiltX}deg` },
      ],
    };
  });

  const waterColor = isDark ? 'rgba(80, 140, 180, 0.35)' : 'rgba(100, 160, 210, 0.35)';
  const waterSurfaceColor = isDark ? 'rgba(120, 180, 220, 0.4)' : 'rgba(130, 190, 230, 0.45)';
  const boxColor = isDark ? '#1a1610' : '#c4a97d';
  const boxBorderColor = isDark ? '#333' : '#a08860';
  const tofuColor = isDark ? '#e8e0d0' : '#f5f0e4';
  const tofuShadow = isDark ? '#c8c0b0' : '#e0d8c8';

  const clampedFill = Math.max(0.1, Math.min(1, fillLevel));

  return (
    <View style={styles.container}>
      {/* Box label */}
      <View style={styles.labelContainer}>
        <Text style={[styles.labelJP, { color: isDark ? '#555' : '#8a7e6b' }]}>
          藤原豆腐店
        </Text>
      </View>

      {/* The delivery box */}
      <View
        style={[
          styles.box,
          {
            backgroundColor: boxColor,
            borderColor: boxBorderColor,
          },
        ]}
      >
        {/* Wood grain lines */}
        <View style={[styles.woodGrain, styles.grain1, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }]} />
        <View style={[styles.woodGrain, styles.grain2, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)' }]} />
        <View style={[styles.woodGrain, styles.grain3, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }]} />

        {/* Water container */}
        <View style={styles.waterContainer}>
          {/* Water fill */}
          <Animated.View
            style={[
              styles.water,
              waterStyle,
              {
                height: `${clampedFill * 55}%`,
                backgroundColor: waterColor,
              },
            ]}
          >
            <View
              style={[
                styles.waterSurface,
                { backgroundColor: waterSurfaceColor },
              ]}
            />
          </Animated.View>

          {/* Tofu block */}
          <Animated.View
            style={[
              styles.tofuWrapper,
              tofuStyle,
            ]}
          >
            <View style={[styles.tofu, { backgroundColor: tofuColor }]}>
              {/* Tofu texture lines */}
              <View style={[styles.tofuLine, styles.tofuLine1, { backgroundColor: tofuShadow }]} />
              <View style={[styles.tofuLine, styles.tofuLine2, { backgroundColor: tofuShadow }]} />
              {/* Tofu top surface highlight */}
              <View style={[styles.tofuHighlight, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' }]} />
            </View>
          </Animated.View>
        </View>

        {/* Box edge / rim */}
        <View style={[styles.boxRim, { backgroundColor: boxBorderColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  labelJP: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 6,
  },
  box: {
    width: 180,
    height: 160,
    borderWidth: 3,
    borderRadius: 4,
    borderTopWidth: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  woodGrain: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  grain1: { top: '25%' },
  grain2: { top: '50%' },
  grain3: { top: '75%' },
  waterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  water: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
  },
  waterSurface: {
    width: '100%',
    height: 6,
    opacity: 0.7,
  },
  tofuWrapper: {
    position: 'absolute',
    bottom: '12%',
  },
  tofu: {
    width: 72,
    height: 52,
    borderRadius: 4,
    overflow: 'hidden',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tofuLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 1,
    opacity: 0.3,
  },
  tofuLine1: { top: '33%' },
  tofuLine2: { top: '66%' },
  tofuHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  boxRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});
