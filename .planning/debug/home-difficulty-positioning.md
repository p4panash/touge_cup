---
status: resolved
trigger: "Difficulty selector not positioned right below the Start Drive button on home screen"
created: 2026-02-03T00:00:00Z
updated: 2026-02-03T00:00:00Z
---

## Current Focus
Diagnosis complete. Root cause identified and documented.

## Symptoms
- Expected: Difficulty selector should be positioned directly below the Start Drive button
- Actual: Difficulty selector appears after Start button but with improper spacing due to flex layout
- User feedback: "The difficulty could be right below the Start Drive."

## Root Cause

**File:** `/Users/papanash/touge_cup/app/(tabs)/index.tsx`

**Problem:** The home screen layout uses a flex container with the Start button having `flex: 1` and `justifyContent: 'center'`.

**Current component order (lines 36-59):**
1. Header (title + subtitle) - fixed height
2. ButtonContainer with `flex: 1` - EXPANDS to fill available space with Start button centered inside
3. DifficultySelector - positioned AFTER the flex container
4. RecentDrive - at the bottom

**Why it's not right below:**
- The `buttonContainer` has `flex: 1` (line 84) which makes it expand to fill all available space
- The Start button is centered within this expanded container
- The DifficultySelector is rendered after the entire flex container, so it sits below with significant gap
- This creates visual separation instead of having difficulty selector positioned directly beneath the button

## Recommended Fix

Restructure the layout to use a flexbox arrangement where:

1. Keep header with fixed spacing
2. Create a button + difficulty group that stays together (no flex: 1 on container)
3. Let the flex: 1 space sit BELOW this group instead of containing it

**Changes needed:**
1. Remove `flex: 1` from `buttonContainer` style (line 84)
2. Create a new wrapper for button + difficulty selector that groups them together
3. Add a spacer element with `flex: 1` below the grouped items OR adjust the container flex direction
4. This ensures difficulty selector renders immediately below the button with minimal gap

**Minimal fix approach:**
- Change the container to use `flexDirection: 'column'` (likely already does)
- Remove `flex: 1` from buttonContainer
- Add `flex: 1` to a new spacer View or recentContainer instead
- Or: wrap buttonContainer + DifficultySelector in a new View and control spacing there
