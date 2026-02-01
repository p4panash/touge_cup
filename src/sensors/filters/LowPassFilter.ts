import { Vector3 } from '../types';

/**
 * Single-pole IIR low-pass filter for noise removal
 *
 * Removes high-frequency vibration noise from sensor data while
 * preserving meaningful driving dynamics. Uses exponential smoothing
 * with configurable cutoff frequency.
 *
 * Formula: output = alpha * input + (1 - alpha) * previous_output
 * Where: alpha = dt / (rc + dt), rc = 1 / (2 * PI * cutoff_hz)
 *
 * @see 01-RESEARCH.md "Low-Pass IIR Filter Implementation"
 */
export class LowPassFilter {
  private alpha: number;
  private previous: Vector3 | null = null;

  /**
   * Create a new low-pass filter
   * @param cutoffHz - Cutoff frequency in Hz (default: 2Hz for driving dynamics)
   * @param sampleHz - Expected sample rate in Hz (default: 50Hz)
   */
  constructor(cutoffHz: number = 2, sampleHz: number = 50) {
    // Calculate alpha for desired cutoff frequency
    // alpha = dt / (rc + dt) where rc = 1/(2*pi*fc)
    const dt = 1 / sampleHz;
    const rc = 1 / (2 * Math.PI * cutoffHz);
    this.alpha = dt / (rc + dt);
  }

  /**
   * Apply the low-pass filter to a new sample
   * @param current - Current sensor reading
   * @returns Filtered sensor reading
   */
  apply(current: Vector3): Vector3 {
    if (this.previous === null) {
      // First sample - initialize filter state
      this.previous = { ...current };
      return current;
    }

    // IIR filter: output = alpha * input + (1-alpha) * previous_output
    const filtered: Vector3 = {
      x: this.alpha * current.x + (1 - this.alpha) * this.previous.x,
      y: this.alpha * current.y + (1 - this.alpha) * this.previous.y,
      z: this.alpha * current.z + (1 - this.alpha) * this.previous.z,
    };

    this.previous = filtered;
    return filtered;
  }

  /**
   * Reset filter state (use when starting a new drive session)
   */
  reset(): void {
    this.previous = null;
  }

  /**
   * Get the current alpha value (for debugging/testing)
   */
  getAlpha(): number {
    return this.alpha;
  }
}
