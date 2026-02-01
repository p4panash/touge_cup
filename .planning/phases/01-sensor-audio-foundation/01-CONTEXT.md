# Phase 1: Sensor & Audio Foundation - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate the core differentiator: real-time sensor-to-audio feedback. User receives audio feedback within 100ms of rough driving inputs using jerk-based smoothness detection. This phase delivers the pipeline from sensor input to audio output — no UI, no persistence, no background execution.

</domain>

<decisions>
## Implementation Decisions

### Audio feedback character
- Stylized/game-like sounds — exaggerated for clarity, clearly audible over road noise
- Graduated intensity — light jerk = gentle slosh, hard jerk = dramatic slosh
- Spill sound is a dramatic splash — unmistakable failure signal, distinct from regular sloshing
- Silence means smooth driving — no ambient sounds, no positive cues, feedback only on mistakes

### Sensitivity & thresholds
- Forgiving baseline — most normal driving is fine, only jerky moves trigger feedback (encouraging first experience)
- Short cooldown after spill (~2-3 seconds) — prevents rapid-fire spills from one bad moment
- Brief settling period at startup (1-2 seconds) — sensor calibration before active feedback

### Audio mixing behavior
- Duck music when feedback plays — briefly lower music volume, then restore
- Pause feedback during phone calls and navigation prompts — safety and clarity first
- Independent volume control — separate slider in app, can be louder than music if needed
- Accept Bluetooth latency — don't warn or compensate, some delay is acceptable

### Claude's Discretion
- Per-axis sensitivity tuning (acceleration vs braking vs cornering) — tune based on typical driving physics to feel fair
- Settling period duration and feedback
- Exact cooldown duration
- Ducking curve and recovery timing
- Specific sound effect selection within the stylized/game-like aesthetic

</decisions>

<specifics>
## Specific Ideas

- Think arcade sound effects, not nature recordings
- The spill should feel like "you messed up" — dramatic enough to be memorable
- Graduated slosh teaches nuance — driver learns the difference between "a little rough" and "way too rough"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-sensor-audio-foundation*
*Context gathered: 2026-02-01*
