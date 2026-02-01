/**
 * Sample with timestamp for windowing
 */
interface TimestampedSample {
  value: number;
  timestamp: number;
}

/**
 * Rolling window smoother for temporal averaging
 *
 * Smooths risk values over a configurable time window to prevent
 * transient spikes from triggering feedback. Uses simple array
 * storage (not circular buffer) since window size is small
 * (~25 samples at 50Hz over 500ms).
 *
 * @see 01-RESEARCH.md "Rolling Window Smoother"
 */
export class RollingWindow {
  private readonly windowMs: number;
  private samples: TimestampedSample[] = [];

  /**
   * Create a new rolling window
   * @param windowMs - Window duration in milliseconds (default: 500ms per SMTH-04)
   */
  constructor(windowMs: number = 500) {
    this.windowMs = windowMs;
  }

  /**
   * Add a value and return the smoothed average
   *
   * @param value - New sample value
   * @param timestamp - Optional timestamp in ms (default: Date.now())
   * @returns Average of all samples within the window
   */
  add(value: number, timestamp?: number): number {
    const ts = timestamp ?? Date.now();

    // Add new sample
    this.samples.push({ value, timestamp: ts });

    // Remove samples outside window
    const cutoff = ts - this.windowMs;
    this.samples = this.samples.filter((s) => s.timestamp >= cutoff);

    // Return average of window
    if (this.samples.length === 0) {
      return 0;
    }

    const sum = this.samples.reduce((acc, s) => acc + s.value, 0);
    return sum / this.samples.length;
  }

  /**
   * Reset window (clears all samples)
   */
  reset(): void {
    this.samples = [];
  }

  /**
   * Get current window size in milliseconds
   */
  getWindowMs(): number {
    return this.windowMs;
  }

  /**
   * Get current sample count
   */
  getSampleCount(): number {
    return this.samples.length;
  }
}
