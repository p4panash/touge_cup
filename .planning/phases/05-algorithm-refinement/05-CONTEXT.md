# Phase 5: Algorithm Refinement - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Adapt smoothness detection to user skill level with difficulty-specific thresholds, and implement pothole detection to distinguish road imperfections from driver errors. Easy/Experienced/Master modes behave differently. This phase does NOT add new UI screens or change existing navigation.

</domain>

<decisions>
## Implementation Decisions

### Pothole Detection
- Detect via Z-axis spike + brief duration (<200ms) — distinguishes sudden impacts from deliberate bumps
- Speed bumps are NOT treated as potholes — they can be anticipated and handled smoothly, so they count as driver skill
- Consecutive potholes within 5-10 seconds cluster as one "rough road" event
- Feedback: distinct sound (bump/thunk, different from water splash) + pothole icon marker on route

### Master Mode Audio
- Reactive ambient soundscape — intensifies as jerk approaches threshold, calm when smooth, tense when risky
- Heavy splash sound on spill — exaggerated water crash, stays on metaphor but more dramatic than other modes
- Streak broken feedback: ambient drops to complete silence after spill, then rebuilds as driving resumes
- Easy and Experienced modes keep current audio unchanged — Master is the special immersive experience

### Claude's Discretion
- Exact jerk thresholds for each difficulty level (roadmap specifies 0.5 G/s Easy to 0.15 G/s Master as guideline)
- Z-axis spike threshold for pothole detection
- Duration threshold for distinguishing potholes from speed bumps
- Clustering window duration for consecutive potholes
- Audio file selection and mixing implementation
- Ambient intensity curve relative to jerk threshold proximity

</decisions>

<specifics>
## Specific Ideas

- Reactive ambient that intensifies as you approach the spill threshold creates "walking on eggshells" tension
- Silence after a spill in Master mode — the absence of sound IS the punishment, then ambient slowly returns
- Pothole sound should be clearly different from water sounds — a bump/thunk/road impact feel

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-algorithm-refinement*
*Context gathered: 2026-02-03*
