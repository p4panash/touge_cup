/**
 * Pothole event detected by the PotholeDetector
 */
export interface PotholeEvent {
  /** Timestamp when pothole was detected (ms) */
  timestamp: number;
  /** Peak Z-axis deviation during spike (m/s^2) */
  zPeak: number;
  /** Duration of the Z-axis spike (ms) */
  duration: number;
  /** Whether this pothole should be forgiven (set by caller based on difficulty) */
  forgiven: boolean;
}

/**
 * Detects road imperfections via Z-axis acceleration spikes
 *
 * Distinguishes potholes from speed bumps using duration filtering:
 * - Potholes: Short, sharp spikes (<200ms) - sudden road impacts
 * - Speed bumps: Longer duration events (>200ms) - can be anticipated
 *
 * Consecutive potholes within the cluster window are grouped as
 * "rough road" to avoid excessive penalty for unavoidable conditions.
 *
 * @see 05-RESEARCH.md "Pattern 1: Independent Z-Axis Analysis"
 */
export class PotholeDetector {
  // Z-THRESH: Threshold for significant Z spike (0.4g = 3.9 m/s^2)
  // From PMC Road Surface Monitoring Review
  private readonly Z_THRESHOLD = 3.9; // m/s^2

  // Duration threshold: <200ms = pothole, longer = speed bump (deliberate)
  private readonly MAX_POTHOLE_DURATION_MS = 200;

  // Clustering window: consecutive potholes within this merge
  // Middle of 5-10s range per CONTEXT.md
  private readonly CLUSTER_WINDOW_MS = 7000;

  // Hysteresis: spike must drop to this factor of threshold to end
  // Prevents premature spike termination from noise
  private readonly HYSTERESIS_FACTOR = 0.5;

  // Internal state for spike tracking
  private spikeStartTime: number | null = null;
  private spikeStartZ: number = 0;
  private lastPotholeTime: number = 0;
  private inRoughRoad: boolean = false;

  /**
   * Process Z-axis acceleration to detect potholes
   *
   * @param zAccel - Z-axis acceleration in m/s^2 (already gravity-compensated)
   * @param timestamp - Current timestamp in milliseconds
   * @returns PotholeEvent if pothole detected, null otherwise
   */
  detect(zAccel: number, timestamp: number): PotholeEvent | null {
    const zDeviation = Math.abs(zAccel);

    // Start tracking spike when threshold exceeded
    if (zDeviation > this.Z_THRESHOLD && this.spikeStartTime === null) {
      this.spikeStartTime = timestamp;
      this.spikeStartZ = zDeviation;
      return null;
    }

    // Track peak during spike
    if (this.spikeStartTime !== null && zDeviation > this.spikeStartZ) {
      this.spikeStartZ = zDeviation;
    }

    // End of spike: deviation drops below hysteresis threshold
    if (
      this.spikeStartTime !== null &&
      zDeviation <= this.Z_THRESHOLD * this.HYSTERESIS_FACTOR
    ) {
      const duration = timestamp - this.spikeStartTime;
      const peakZ = this.spikeStartZ;

      // Reset spike tracking
      this.spikeStartTime = null;
      this.spikeStartZ = 0;

      // Too long = speed bump (driver should handle smoothly, not forgiven)
      if (duration > this.MAX_POTHOLE_DURATION_MS) {
        return null;
      }

      // Check clustering: if within window of last pothole and already in rough road
      const timeSinceLastPothole = timestamp - this.lastPotholeTime;
      const isCluster = timeSinceLastPothole < this.CLUSTER_WINDOW_MS;

      if (isCluster && this.inRoughRoad) {
        // Already in rough road segment - suppress this pothole
        this.lastPotholeTime = timestamp;
        return null;
      }

      // Record this pothole
      this.lastPotholeTime = timestamp;
      this.inRoughRoad = isCluster;

      return {
        timestamp,
        zPeak: peakZ,
        duration,
        forgiven: false, // Set by caller based on difficulty
      };
    }

    return null;
  }

  /**
   * Reset detector state (for settling period, new drive session)
   */
  reset(): void {
    this.spikeStartTime = null;
    this.spikeStartZ = 0;
    this.lastPotholeTime = 0;
    this.inRoughRoad = false;
  }
}
