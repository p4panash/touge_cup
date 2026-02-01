import { Vector3 } from '../types';

/**
 * Jerk data with per-axis values and combined magnitude
 */
export interface JerkResult {
  /** Jerk in x-axis (lateral motion - cornering) in m/s^3 */
  x: number;
  /** Jerk in y-axis (longitudinal motion - accel/brake) in m/s^3 */
  y: number;
  /** Jerk in z-axis (vertical motion - road surface) in m/s^3 */
  z: number;
  /** Combined magnitude using RMS of x and y (excludes z) in m/s^3 */
  magnitude: number;
}

/**
 * Calculates jerk (rate of acceleration change) from sensor data
 *
 * Jerk is the derivative of acceleration with respect to time: dA/dt
 * High jerk values indicate rough driving (sudden braking, harsh steering).
 *
 * Key features:
 * - Uses ACTUAL timestamp deltas (not assumed 20ms intervals)
 * - Excludes z-axis from magnitude (vertical = road surface, not driving)
 * - RMS combination of lateral (x) and longitudinal (y) jerk
 *
 * @see 01-RESEARCH.md "Jerk Calculator with Actual Delta Time"
 */
export class JerkCalculator {
  private previousAccel: Vector3 | null = null;
  private previousTimestamp: number | null = null;

  /**
   * Compute jerk from current acceleration and timestamp
   *
   * @param accel - Current acceleration vector in m/s^2
   * @param timestamp - Current timestamp in seconds
   * @returns Jerk per axis and combined magnitude, or zeros on first call
   */
  compute(accel: Vector3, timestamp: number): JerkResult {
    // First call - no previous data to compare
    if (this.previousAccel === null || this.previousTimestamp === null) {
      this.previousAccel = { ...accel };
      this.previousTimestamp = timestamp;
      return { x: 0, y: 0, z: 0, magnitude: 0 };
    }

    // Use actual time delta - critical for Android where intervals vary
    const deltaTime = timestamp - this.previousTimestamp;

    // Guard against zero or negative delta (clock issues, duplicate events)
    if (deltaTime <= 0) {
      return { x: 0, y: 0, z: 0, magnitude: 0 };
    }

    // Calculate jerk per axis: (currentAccel - previousAccel) / deltaTime
    const jerk: JerkResult = {
      x: (accel.x - this.previousAccel.x) / deltaTime,
      y: (accel.y - this.previousAccel.y) / deltaTime,
      z: (accel.z - this.previousAccel.z) / deltaTime,
      magnitude: 0,
    };

    // RMS of lateral (x) and longitudinal (y) jerk
    // Z-axis (vertical) excluded - represents road surface, not driving smoothness
    jerk.magnitude = Math.sqrt(jerk.x * jerk.x + jerk.y * jerk.y);

    // Store current values for next computation
    this.previousAccel = { ...accel };
    this.previousTimestamp = timestamp;

    return jerk;
  }

  /**
   * Reset calculator state (for settling period, new drive session)
   */
  reset(): void {
    this.previousAccel = null;
    this.previousTimestamp = null;
  }
}
