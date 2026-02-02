# Phase 2: Background Execution & Permissions - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable the app to detect drives automatically via GPS speed and continue providing sensor sampling and audio feedback with the screen off or app backgrounded. Manual start/stop, permission handling, and foreground service implementation are included. Drive persistence is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Drive detection logic
- Auto-start threshold: 15 km/h sustained for 5 seconds
- Auto-stop threshold: 120 seconds stationary (not 60) — survives long traffic lights and drive-throughs
- No passenger/transit detection — user responsibility to stop if not driving
- GPS loss handling: Keep recording using sensors only, continue audio feedback, resume location data when GPS returns

### Claude's Discretion
- Manual override behavior (how start/stop buttons interact with auto-detection)
- Background notification style and content
- Permission request timing and flow
- Battery optimization approach

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for background execution patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-background-execution-permissions*
*Context gathered: 2026-02-02*
