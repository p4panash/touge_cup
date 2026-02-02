# Phase 3: Drive Session Management - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Persist drives, events, and scores to local database that survives app restarts. Users can view completed drives in a list, see their smoothness score, and access drive details. Creating the UI screens themselves is Phase 4 — this phase handles the data layer and basic display logic.

</domain>

<decisions>
## Implementation Decisions

### Drive list display
- Standard info per drive: date, duration, score, spill count, distance
- Grouped by day with date headers (Today, Yesterday, Jan 30...)
- Tapping a drive navigates to full summary screen (not inline expansion)
- Delete allowed with confirmation dialog (not swipe-to-delete without confirmation)

### Score presentation
- Visual meter showing where 0-100 score falls on a gauge/progress bar
- Simple breakdown: show spill count and point cost per spill
- Personal best comparison: highlight when a drive beats all-time best
- Score calculated at drive end, not live during the drive (reveal moment)

### Claude's Discretion
- Event logging granularity (what detail level per event)
- GPS breadcrumb storage format and indexing
- Database schema design and table structure
- Score calculation formula (how spills translate to point deductions)

</decisions>

<specifics>
## Specific Ideas

- Score reveal at end creates a "moment" — don't show it updating live
- Personal best celebration should feel rewarding but not over-the-top
- Day grouping makes it easy to remember "that drive yesterday"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-drive-session-management*
*Context gathered: 2026-02-02*
