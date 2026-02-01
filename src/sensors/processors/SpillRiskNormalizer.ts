/**
 * Difficulty level for spill risk thresholds
 */
export type DifficultyLevel = 'easy' | 'experienced' | 'master';

/**
 * Threshold configuration for a difficulty level
 */
interface DifficultyThresholds {
  /** Jerk threshold where slosh audio begins (m/s^3) */
  slosh: number;
  /** Jerk threshold where spill occurs (m/s^3) */
  spill: number;
}

/**
 * Result of risk normalization
 */
export interface RiskResult {
  /** Normalized risk value (0-1) */
  risk: number;
  /** True if jerk exceeded spill threshold */
  isSpill: boolean;
}

/**
 * Normalizes jerk magnitude to a 0-1 spill risk value
 *
 * Risk mapping:
 * - Below slosh threshold: risk = 0 (silence = smooth driving)
 * - Above spill threshold: risk = 1.0, isSpill = true
 * - Between thresholds: linear interpolation for graduated feedback
 *
 * Difficulty levels adjust thresholds:
 * - Easy: Forgiving baseline for new users
 * - Experienced: Moderate challenge
 * - Master: Strict thresholds for experts
 *
 * @see 01-CONTEXT.md "Sensitivity & thresholds"
 * @see 01-RESEARCH.md "Spill Risk Normalizer"
 */
export class SpillRiskNormalizer {
  /**
   * Difficulty threshold configurations
   *
   * Values based on research:
   * - Comfort threshold: ~1 m/s^3 optimal, ~10 m/s^3 maximum
   * - Easy mode is forgiving to encourage first experience
   */
  private readonly thresholds: Record<DifficultyLevel, DifficultyThresholds> = {
    easy: { slosh: 5.0, spill: 10.0 }, // Forgiving baseline
    experienced: { slosh: 3.0, spill: 7.0 }, // Moderate
    master: { slosh: 1.5, spill: 4.0 }, // Strict
  };

  private difficulty: DifficultyLevel = 'easy';

  /**
   * Set the difficulty level
   * @param difficulty - New difficulty level
   */
  setDifficulty(difficulty: DifficultyLevel): void {
    this.difficulty = difficulty;
  }

  /**
   * Get the current difficulty level
   */
  getDifficulty(): DifficultyLevel {
    return this.difficulty;
  }

  /**
   * Get the current thresholds
   */
  getThresholds(): DifficultyThresholds {
    return { ...this.thresholds[this.difficulty] };
  }

  /**
   * Normalize jerk magnitude to risk value
   *
   * @param jerkMagnitude - Combined jerk magnitude in m/s^3
   * @returns Risk value (0-1) and spill flag
   */
  normalize(jerkMagnitude: number): RiskResult {
    const { slosh, spill } = this.thresholds[this.difficulty];

    // Below slosh threshold = 0 risk (silence = smooth driving)
    if (jerkMagnitude < slosh) {
      return { risk: 0, isSpill: false };
    }

    // Above spill threshold = spill event
    if (jerkMagnitude >= spill) {
      return { risk: 1.0, isSpill: true };
    }

    // Linear interpolation between slosh and spill thresholds
    const risk = (jerkMagnitude - slosh) / (spill - slosh);
    return { risk, isSpill: false };
  }
}
