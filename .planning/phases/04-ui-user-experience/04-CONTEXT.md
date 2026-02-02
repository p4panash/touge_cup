# Phase 4: UI & User Experience - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Build all app screens for navigating drives, viewing history, and configuring settings. Covers home screen, active drive screen, drive summary, history list, and settings. Navigation between screens and cross-platform deployment (iOS/Android).

</domain>

<decisions>
## Implementation Decisions

### Home Screen
- Hero button for starting a drive — large, centered, dominant primary action
- Single featured recent drive — show only the most recent drive prominently (not a list)
- Segmented control for difficulty — horizontal Easy | Experienced | Master toggle visible on home
- System adaptive theme — follows device dark/light mode setting

### Active Drive Screen
- Display: spill count + streak timer + water cup visualization
- Cup visualization: static cup icon with fill level that drops on spills, water inside animates/sloshes in response to real-time accelerometer data
- Visible stop button — clear button to end drive manually at any time
- Keep-awake behavior is user configurable (setting to toggle)

### Drive Summary Screen
- Color-coded polyline — route color changes based on smoothness (green=good, red=rough)
- Full stats breakdown — score, spill count, duration, distance, avg speed, severity breakdown, streak info
- Water drop icon markers at spill locations, tappable for details
- Tap marker shows info popup — timestamp, severity, trigger type (brake/turn/accel)

### Claude's Discretion
- History screen layout and filtering controls (not discussed)
- Settings screen organization
- Navigation pattern (tabs vs stack)
- Exact animation timings for water slosh
- Map provider choice (MapView, Google Maps, Mapbox)

</decisions>

<specifics>
## Specific Ideas

- Water cup should feel alive — the slosh animation responding to accelerometer makes it feel connected to your actual driving
- Initial D aesthetic appreciated but should remain subtle through system adaptive theming

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-ui-user-experience*
*Context gathered: 2026-02-03*
