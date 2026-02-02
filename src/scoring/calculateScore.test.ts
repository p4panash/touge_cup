import { calculateScore, ScoreInput, ScoreResult } from './calculateScore';

describe('calculateScore', () => {
  describe('perfect drives', () => {
    it('returns 100 for perfect 10-minute drive', () => {
      const input: ScoreInput = {
        spillEvents: [],
        durationMs: 10 * 60 * 1000, // 10 minutes
      };
      const result = calculateScore(input);
      expect(result.score).toBe(100);
      expect(result.isPerfect).toBe(true);
    });

    it('returns 100 for perfect 5-minute drive', () => {
      const input: ScoreInput = {
        spillEvents: [],
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.score).toBe(100);
      expect(result.isPerfect).toBe(true);
    });

    it('returns 100 for perfect 1-minute drive (short drives ok)', () => {
      const input: ScoreInput = {
        spillEvents: [],
        durationMs: 1 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.score).toBe(100);
      expect(result.isPerfect).toBe(true);
    });
  });

  describe('spill penalties', () => {
    it('deducts 5 points for low severity spill (0.0-0.5)', () => {
      const input: ScoreInput = {
        spillEvents: [{ severity: 0.3 }],
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.score).toBe(95);
      expect(result.breakdown.spillPenalty).toBe(5);
    });

    it('deducts 10 points for medium severity spill (0.5-0.7)', () => {
      const input: ScoreInput = {
        spillEvents: [{ severity: 0.6 }],
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.score).toBe(90);
      expect(result.breakdown.spillPenalty).toBe(10);
    });

    it('deducts 15 points for high severity spill (0.7-1.0)', () => {
      const input: ScoreInput = {
        spillEvents: [{ severity: 0.9 }],
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.score).toBe(85);
      expect(result.breakdown.spillPenalty).toBe(15);
    });

    it('accumulates penalties for multiple spills', () => {
      const input: ScoreInput = {
        spillEvents: [
          { severity: 0.3 },  // low: -5
          { severity: 0.6 },  // med: -10
          { severity: 0.9 },  // high: -15
        ],
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.score).toBe(70);
      expect(result.breakdown.spillPenalty).toBe(30);
    });
  });

  describe('score floor', () => {
    it('never returns negative score', () => {
      const input: ScoreInput = {
        spillEvents: Array(20).fill({ severity: 0.9 }), // 20 * 15 = 300 penalty
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.score).toBe(0);
    });

    it('returns 0 for 10 high-severity spills', () => {
      const input: ScoreInput = {
        spillEvents: Array(10).fill({ severity: 0.9 }), // 10 * 15 = 150 penalty
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.score).toBe(0);
    });
  });

  describe('duration bonus', () => {
    it('adds 1 point per 5 minutes of driving', () => {
      const input: ScoreInput = {
        spillEvents: [{ severity: 0.3 }], // -5
        durationMs: 15 * 60 * 1000, // 15 min = +3
      };
      const result = calculateScore(input);
      // 100 - 5 + 3 = 98
      expect(result.score).toBe(98);
      expect(result.breakdown.durationBonus).toBe(3);
    });

    it('caps duration bonus at 10 points', () => {
      const input: ScoreInput = {
        spillEvents: [{ severity: 0.3 }], // -5
        durationMs: 120 * 60 * 1000, // 120 min = +24, capped to +10
      };
      const result = calculateScore(input);
      // 100 - 5 + 10 = 105, capped to 100
      expect(result.score).toBe(100);
      expect(result.breakdown.durationBonus).toBe(10);
    });
  });

  describe('score breakdown', () => {
    it('provides detailed breakdown', () => {
      const input: ScoreInput = {
        spillEvents: [
          { severity: 0.3 },
          { severity: 0.9 },
        ],
        durationMs: 10 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.breakdown).toEqual({
        baseScore: 100,
        spillPenalty: 20, // 5 + 15
        durationBonus: 2,  // 10 min = 2
        perfectBonus: 0,   // has spills
      });
      expect(result.score).toBe(82); // 100 - 20 + 2
    });
  });

  describe('severity edge cases', () => {
    it('treats severity at boundary 0.5 as medium', () => {
      const input: ScoreInput = {
        spillEvents: [{ severity: 0.5 }],
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.breakdown.spillPenalty).toBe(10);
    });

    it('treats severity at boundary 0.7 as high', () => {
      const input: ScoreInput = {
        spillEvents: [{ severity: 0.7 }],
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.breakdown.spillPenalty).toBe(15);
    });

    it('handles null severity as low', () => {
      const input: ScoreInput = {
        spillEvents: [{ severity: null }],
        durationMs: 5 * 60 * 1000,
      };
      const result = calculateScore(input);
      expect(result.breakdown.spillPenalty).toBe(5);
    });
  });
});
