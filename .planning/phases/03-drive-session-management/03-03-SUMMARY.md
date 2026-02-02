---
phase: 03-drive-session-management
plan: 03
subsystem: scoring
tags: [jest, tdd, typescript, scoring-algorithm, hooks]

# Dependency graph
requires:
  - phase: 03-02
    provides: DriveRecorder service with event logging
provides:
  - calculateScore function with severity-based penalties
  - Score breakdown (base, penalty, duration bonus, perfect bonus)
  - DriveRecorder.endDrive score calculation integration
  - useDriveHistory hook for fetching completed drives
  - useDriveDetail hook for single drive with events
  - groupDrivesByDay helper for UI display
affects: [04-history-ui, 05-polish]

# Tech tracking
tech-stack:
  added: [jest, ts-jest, @types/jest]
  patterns: [TDD red-green-refactor, severity bracket scoring]

key-files:
  created:
    - src/scoring/calculateScore.ts
    - src/scoring/calculateScore.test.ts
    - src/hooks/useDriveHistory.ts
    - jest.config.js
  modified:
    - src/services/DriveRecorder.ts

key-decisions:
  - "Severity brackets: <0.5 = low (5pts), 0.5-0.7 = medium (10pts), >=0.7 = high (15pts)"
  - "Duration bonus: +1 per 5 minutes, capped at 10 - rewards longer drives"
  - "Perfect drive bonus: +5 if zero spills - gamification incentive"
  - "Score clamped to 0-100 range - never negative, never above 100"
  - "Jest for unit testing - standard choice, works with ts-jest"
  - "4-minute duration in tests isolates spill penalty testing (0 duration bonus)"

patterns-established:
  - "TDD for pure functions: RED (failing tests) -> GREEN (implementation) -> REFACTOR"
  - "Score breakdown returned with score for UI transparency"
  - "Hooks pattern: useDriveHistory/useDriveDetail for data fetching"

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 3 Plan 3: Score Calculation Engine Summary

**TDD-driven score calculation with severity brackets (5/10/15 pts), duration bonus (+1 per 5 min), and useDriveHistory hook for Phase 4 UI**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-02T22:16:55Z
- **Completed:** 2026-02-02T22:20:49Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Score calculation engine with 15 passing tests (TDD)
- Severity-based spill penalties: 5 pts (low), 10 pts (medium), 15 pts (high)
- Duration bonus system: +1 per 5 min, capped at +10
- Perfect drive bonus: +5 for zero spills (gamification)
- DriveRecorder integration - score calculated at drive end ("reveal moment")
- useDriveHistory hook ready for Phase 4 drive history UI

## Task Commits

Each task was committed atomically (TDD pattern):

1. **Task 1: Write failing tests (RED)** - `12a6f97` (test)
2. **Task 2: Implement score calculation (GREEN)** - `345606b` (feat)
3. **Task 3: Integration + useDriveHistory hook** - `f7884d1` (feat)

## Files Created/Modified
- `src/scoring/calculateScore.ts` - Score calculation with severity brackets and bonuses
- `src/scoring/calculateScore.test.ts` - 15 test cases covering all scenarios
- `src/hooks/useDriveHistory.ts` - Hooks for drive list and detail fetching
- `src/services/DriveRecorder.ts` - Integrated score calculation at drive end
- `jest.config.js` - Jest configuration for TypeScript

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Severity brackets: low <0.5, medium 0.5-0.7, high >=0.7 | Matches risk value ranges from audio feedback |
| Duration bonus +1 per 5 min, max +10 | Rewards longer/highway drives without dominating score |
| Perfect drive bonus +5 | Gamification - celebrate zero-spill achievements |
| Score clamped 0-100 | Clean score range, never negative or impossible |
| 4-min test duration | Isolates spill penalty tests from duration bonus |
| Jest + ts-jest | Standard TypeScript testing, good Expo ecosystem fit |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test expectations for duration bonus**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Plan's test cases used 5-minute duration which adds +1 bonus, but expected base-only scores
- **Fix:** Changed test duration to 4 minutes (0 duration bonus) to test spill penalties in isolation
- **Files modified:** src/scoring/calculateScore.test.ts
- **Verification:** All 15 tests pass
- **Committed in:** 345606b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (test case bug)
**Impact on plan:** Minor test fix, no scope change. Scoring logic unchanged.

## Issues Encountered
None - TDD flow worked smoothly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Score calculation complete and tested (15 tests)
- DriveRecorder stores score at drive end
- useDriveHistory hook ready for Phase 4 history UI
- Console log shows score on drive end (debugging verified)
- Phase 3 complete - all drive session management functionality delivered

---
*Phase: 03-drive-session-management*
*Completed: 2026-02-03*
