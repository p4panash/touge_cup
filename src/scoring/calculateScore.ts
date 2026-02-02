/**
 * Score Calculation Engine
 *
 * Calculates smoothness score (0-100) for completed drives.
 * Score is revealed at drive end as a "moment" (per CONTEXT.md).
 *
 * Formula:
 * - Base: 100
 * - Spill penalty: varies by severity (5/10/15 points)
 * - Duration bonus: +1 per 5 minutes (max +10)
 * - Perfect bonus: +5 if zero spills
 * - Floor: 0 (never negative)
 * - Ceiling: 100 (never above)
 */

export interface SpillEvent {
  severity: number | null;
}

export interface ScoreInput {
  spillEvents: SpillEvent[];
  durationMs: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  spillPenalty: number;
  durationBonus: number;
  perfectBonus: number;
}

export interface ScoreResult {
  score: number;
  isPerfect: boolean;
  breakdown: ScoreBreakdown;
}

/** Penalty points by severity bracket */
const SEVERITY_PENALTIES = {
  low: 5,    // severity < 0.5
  medium: 10, // 0.5 <= severity < 0.7
  high: 15,   // severity >= 0.7
} as const;

/** Duration bonus: 1 point per this many ms */
const DURATION_BONUS_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/** Maximum duration bonus */
const MAX_DURATION_BONUS = 10;

/** Perfect drive bonus (zero spills) */
const PERFECT_BONUS = 5;

/** Base score before penalties/bonuses */
const BASE_SCORE = 100;

/**
 * Get penalty for a single spill based on severity
 */
function getPenaltyForSeverity(severity: number | null): number {
  // Treat null/undefined as low severity
  const s = severity ?? 0;

  if (s >= 0.7) return SEVERITY_PENALTIES.high;
  if (s >= 0.5) return SEVERITY_PENALTIES.medium;
  return SEVERITY_PENALTIES.low;
}

/**
 * Calculate smoothness score for a completed drive
 *
 * @param input - Spill events and duration
 * @returns Score (0-100) with breakdown
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  const { spillEvents, durationMs } = input;

  // Calculate spill penalty
  const spillPenalty = spillEvents.reduce(
    (total, event) => total + getPenaltyForSeverity(event.severity),
    0
  );

  // Calculate duration bonus (capped)
  const rawDurationBonus = Math.floor(durationMs / DURATION_BONUS_INTERVAL_MS);
  const durationBonus = Math.min(rawDurationBonus, MAX_DURATION_BONUS);

  // Perfect bonus if no spills
  const isPerfect = spillEvents.length === 0;
  const perfectBonus = isPerfect ? PERFECT_BONUS : 0;

  // Calculate final score
  const rawScore = BASE_SCORE - spillPenalty + durationBonus + perfectBonus;

  // Apply floor (0) and ceiling (100)
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    isPerfect,
    breakdown: {
      baseScore: BASE_SCORE,
      spillPenalty,
      durationBonus,
      perfectBonus,
    },
  };
}
