import { Vector3 } from './types';
import { LowPassFilter } from './filters/LowPassFilter';
import { JerkCalculator, JerkResult } from './processors/JerkCalculator';
import {
  SpillRiskNormalizer,
  DifficultyLevel,
} from './processors/SpillRiskNormalizer';
import { RollingWindow } from './processors/RollingWindow';
import { PotholeDetector, PotholeEvent } from './processors/PotholeDetector';

/**
 * Result from processing a sensor sample
 */
export interface PipelineResult {
  /** Smoothed risk value (0-1) */
  risk: number;
  /** True if spill threshold exceeded */
  isSpill: boolean;
  /** Jerk values for debugging/display */
  jerk: JerkResult;
  /** Filtered Z-axis acceleration for pothole detection (m/s^2) */
  zAccelFiltered: number;
  /** Detected pothole event, or null if none */
  pothole: PotholeEvent | null;
}

/**
 * Complete synchronous sensor processing pipeline
 *
 * Chains all processing stages for minimum latency:
 * 1. Low-pass filter (removes high-frequency noise)
 * 2. Jerk calculator (rate of acceleration change)
 * 3. Risk normalizer (jerk to 0-1 risk with difficulty)
 * 4. Rolling window (temporal smoothing)
 *
 * ALL processing is synchronous - no async boundaries.
 * This ensures minimum latency from sensor event to audio trigger.
 *
 * @see 01-RESEARCH.md "Pattern 1: Synchronous Pipeline for Minimum Latency"
 */
export class SensorPipeline {
  private lowPass: LowPassFilter;
  private jerkCalc: JerkCalculator;
  private riskNorm: SpillRiskNormalizer;
  private rollingWindow: RollingWindow;
  private potholeDetector: PotholeDetector;

  /**
   * Create a new sensor pipeline
   *
   * @param lowPassCutoffHz - Low-pass filter cutoff (default: 2Hz)
   * @param windowMs - Rolling window duration (default: 500ms)
   */
  constructor(lowPassCutoffHz: number = 2, windowMs: number = 500) {
    this.lowPass = new LowPassFilter(lowPassCutoffHz);
    this.jerkCalc = new JerkCalculator();
    this.riskNorm = new SpillRiskNormalizer();
    this.rollingWindow = new RollingWindow(windowMs);
    this.potholeDetector = new PotholeDetector();
  }

  /**
   * Process a sensor sample through the entire pipeline
   *
   * @param accel - Acceleration vector in m/s^2 (gravity-compensated)
   * @param timestamp - Timestamp in seconds
   * @returns Risk value, spill flag, and jerk data
   */
  process(accel: Vector3, timestamp: number): PipelineResult {
    // 1. Apply low-pass filter (removes vibration noise)
    // Note: DeviceMotionManager already applies this, but we include
    // for completeness and to support direct pipeline usage
    const filtered = this.lowPass.apply(accel);

    // 2. Calculate jerk from filtered acceleration
    const jerk = this.jerkCalc.compute(filtered, timestamp);

    // 3. Normalize jerk to risk
    const { risk: instantRisk, isSpill } = this.riskNorm.normalize(
      jerk.magnitude
    );

    // 4. Smooth risk through rolling window
    // Convert timestamp from seconds to milliseconds for window
    const smoothedRisk = this.rollingWindow.add(
      instantRisk,
      timestamp * 1000
    );

    // 5. Detect potholes from filtered Z-axis acceleration
    // Note: timestamp is in seconds, convert to ms for pothole detector
    const pothole = this.potholeDetector.detect(filtered.z, timestamp * 1000);

    return {
      risk: smoothedRisk,
      isSpill,
      jerk,
      zAccelFiltered: filtered.z,
      pothole,
    };
  }

  /**
   * Set difficulty level (adjusts risk thresholds)
   *
   * @param difficulty - Difficulty level
   */
  setDifficulty(difficulty: DifficultyLevel): void {
    this.riskNorm.setDifficulty(difficulty);
  }

  /**
   * Get current difficulty level
   */
  getDifficulty(): DifficultyLevel {
    return this.riskNorm.getDifficulty();
  }

  /**
   * Reset all processors (for settling period, new drive session)
   */
  reset(): void {
    this.lowPass.reset();
    this.jerkCalc.reset();
    this.rollingWindow.reset();
    this.potholeDetector.reset();
  }
}
