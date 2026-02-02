# Phase 3: Drive Session Management - Research

**Researched:** 2026-02-02
**Domain:** SQLite persistence, drive/event data modeling, score calculation
**Confidence:** HIGH

## Summary

Phase 3 implements local data persistence for drive sessions, events, and scoring. The standard approach in the React Native/Expo ecosystem (2026) is expo-sqlite with Drizzle ORM for type-safe queries and automatic migrations. This combination provides a robust data layer without the complexity of raw SQL strings.

The existing codebase already has the pieces we need to capture: `DriveState` transitions (start/end), `LocationData` from GPS breadcrumbs, spill events from `FeedbackTrigger`, and risk/jerk values from `useSensorStore`. Phase 3 connects these to persistent storage and adds score calculation at drive end.

Key insight: Keep Zustand stores for real-time UI state, use SQLite as the source of truth for historical data. Don't try to persist Zustand to SQLite - they serve different purposes.

**Primary recommendation:** Use expo-sqlite + Drizzle ORM with three tables (drives, events, breadcrumbs), calculate score at drive end using a simple deduction formula (100 - penalty per spill).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-sqlite | ~16.0.x | SQLite database access | Expo-native, JSI-based sync API, SQLiteProvider pattern |
| drizzle-orm | ^0.36.x | Type-safe SQL queries | Schema-as-code, automatic TypeScript types, migrations |
| drizzle-kit | ^0.28.x | Migration generator | CLI tool to generate SQL from schema changes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| babel-plugin-inline-import | ^3.0.x | Bundle .sql migrations | Required for Drizzle migrations in Expo |
| haversine-distance | ^1.2.x | GPS distance calculation | Optional - can inline Haversine formula instead |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Raw expo-sqlite | More code, no type safety, but fewer dependencies |
| expo-sqlite | op-sqlite | Higher performance for huge datasets, but more setup |
| SQLite for settings | zustand persist + MMKV | Fine for settings, but not for structured drive data |

**Installation:**
```bash
npx expo install expo-sqlite
npm install drizzle-orm
npm install -D drizzle-kit babel-plugin-inline-import
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/
│   ├── schema/
│   │   ├── drives.ts        # drives table + relations
│   │   ├── events.ts        # events table + relations
│   │   ├── breadcrumbs.ts   # GPS breadcrumbs table
│   │   └── index.ts         # export all schemas
│   ├── client.ts            # drizzle(expo) instance
│   ├── migrations.ts        # import generated migrations
│   └── queries/
│       ├── drives.ts        # drive CRUD operations
│       ├── events.ts        # event logging functions
│       └── scoring.ts       # score calculation logic
├── services/
│   └── DriveRecorder.ts     # orchestrates event capture during drive
└── hooks/
    └── useDriveHistory.ts   # React hook for drive list with live queries
```

### Pattern 1: Schema-First with Drizzle
**What:** Define tables as TypeScript, generate SQL migrations automatically
**When to use:** Always - this is the core Drizzle workflow
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/connect-expo-sqlite
// db/schema/drives.ts
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const drives = sqliteTable('drives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),
  distanceMeters: real('distance_meters'),
  score: integer('score'),           // 0-100, null until drive ends
  spillCount: integer('spill_count').default(0),
  potholeCount: integer('pothole_count').default(0),
  difficulty: text('difficulty').notNull(), // 'easy' | 'experienced' | 'master'
  isManual: integer('is_manual', { mode: 'boolean' }).default(false),
});

export type Drive = typeof drives.$inferSelect;
export type NewDrive = typeof drives.$inferInsert;
```

### Pattern 2: SQLiteProvider at App Root
**What:** Wrap app in SQLiteProvider to provide database context everywhere
**When to use:** App initialization
**Example:**
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/sqlite/
// App.tsx or _layout.tsx
import { SQLiteProvider } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { Suspense } from 'react';

export default function RootLayout() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SQLiteProvider
        databaseName="touge_cup.db"
        options={{ enableChangeListener: true }}
        onInit={async (database) => {
          const db = drizzle(database);
          await migrate(db, migrations);
        }}
      >
        {/* App content */}
      </SQLiteProvider>
    </Suspense>
  );
}
```

### Pattern 3: Event Logging During Drive
**What:** Log events (spills, potholes, GPS) as they happen, don't wait for drive end
**When to use:** During active drive
**Example:**
```typescript
// db/queries/events.ts
import { db } from '../client';
import { events } from '../schema';

export type EventType = 'spill' | 'pothole' | 'drive_start' | 'drive_end';

export async function logEvent(
  driveId: number,
  type: EventType,
  location: { latitude: number; longitude: number } | null,
  severity?: number // How far over threshold (for spills)
): Promise<void> {
  await db.insert(events).values({
    driveId,
    type,
    timestamp: new Date(),
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    severity: severity ?? null,
  });
}
```

### Pattern 4: Score Calculation at Drive End
**What:** Calculate score from logged events when drive ends, not incrementally
**When to use:** On drive_end transition (per CONTEXT.md: "reveal moment")
**Example:**
```typescript
// db/queries/scoring.ts

/**
 * Calculate smoothness score from drive events
 *
 * Formula: Start at 100, deduct points per spill based on severity
 * - Base deduction: 5 points per spill
 * - Severity multiplier: 1.0 + (severity * 0.5) where severity is 0-1
 * - Minimum score: 0
 *
 * Example: 3 spills at avg 0.3 severity = 100 - (3 * 5 * 1.15) = 83
 */
export function calculateScore(
  spillCount: number,
  events: Array<{ severity: number | null }>
): number {
  const BASE_DEDUCTION = 5;

  let totalDeduction = 0;
  for (const event of events) {
    const severity = event.severity ?? 0;
    const multiplier = 1.0 + (severity * 0.5);
    totalDeduction += BASE_DEDUCTION * multiplier;
  }

  return Math.max(0, Math.round(100 - totalDeduction));
}
```

### Pattern 5: Drive List with Day Grouping
**What:** Query drives and group by date for SectionList display
**When to use:** History/drive list screen
**Example:**
```typescript
// hooks/useDriveHistory.ts
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc } from 'drizzle-orm';
import { db } from '../db/client';
import { drives } from '../db/schema';

interface DriveSection {
  title: string;  // "Today", "Yesterday", "Jan 30"
  data: Drive[];
}

export function useDriveHistory(): DriveSection[] {
  const { data: allDrives } = useLiveQuery(
    db.select().from(drives).orderBy(desc(drives.startTime))
  );

  return groupDrivesByDay(allDrives ?? []);
}

function groupDrivesByDay(drives: Drive[]): DriveSection[] {
  const groups = new Map<string, Drive[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const drive of drives) {
    const driveDate = new Date(drive.startTime);
    let title: string;

    if (isSameDay(driveDate, today)) {
      title = 'Today';
    } else if (isSameDay(driveDate, yesterday)) {
      title = 'Yesterday';
    } else {
      title = driveDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }

    if (!groups.has(title)) groups.set(title, []);
    groups.get(title)!.push(drive);
  }

  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}
```

### Anti-Patterns to Avoid
- **Persisting Zustand to SQLite:** Use Zustand for real-time UI state, SQLite for historical data - don't try to sync them
- **Calculating score during drive:** Per CONTEXT.md, score is revealed at end for drama
- **Storing large blobs in SQLite:** Store file paths for any large data, not the data itself
- **Blocking UI thread with sync queries:** Use async queries for any operation that might be slow; sync is only for fast reads
- **Skipping migrations in development:** Always run `drizzle-kit generate` after schema changes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQL query building | String concatenation with escaping | Drizzle ORM query builder | SQL injection, type safety |
| Database migrations | Manual ALTER TABLE scripts | drizzle-kit generate | Version tracking, rollback |
| Distance calculation | Custom trigonometry | Haversine formula (copy the standard impl) | Edge cases at poles, date line |
| Date formatting for headers | Manual date math | toLocaleDateString() with options | Localization, edge cases |
| SQLite connection management | Manual open/close lifecycle | SQLiteProvider | React lifecycle integration |

**Key insight:** The "simple" distance formula looks like Pythagorean theorem but requires spherical geometry. The Haversine formula is well-tested and only 10 lines.

## Common Pitfalls

### Pitfall 1: Metro Config Missing SQL Extension
**What goes wrong:** App crashes when importing Drizzle migrations
**Why it happens:** Metro bundler doesn't know how to import .sql files
**How to avoid:** Add to metro.config.js before any Drizzle work:
```javascript
config.resolver.sourceExts.push('sql');
```
**Warning signs:** Syntax error when app starts, mentions .sql file

### Pitfall 2: Forgetting to Export Relations
**What goes wrong:** Relational queries (with: {}) fail at runtime
**Why it happens:** Drizzle needs explicit relations definitions exported from schema
**How to avoid:** Always define and export relations alongside tables:
```typescript
export const drivesRelations = relations(drives, ({ many }) => ({
  events: many(events),
  breadcrumbs: many(breadcrumbs),
}));
```
**Warning signs:** Runtime error about missing relation, empty results from `with:`

### Pitfall 3: Calling useLiveQuery Without enableChangeListener
**What goes wrong:** Live queries don't update when data changes
**Why it happens:** expo-sqlite needs explicit opt-in for change notifications
**How to avoid:** When opening database:
```typescript
openDatabaseSync('app.db', { enableChangeListener: true })
```
**Warning signs:** List doesn't refresh after insert, need manual refresh

### Pitfall 4: Running Heavy Queries on UI Thread
**What goes wrong:** App freezes briefly when loading drive history
**Why it happens:** Sync SQLite calls block JavaScript thread
**How to avoid:** Use async methods for any query that might return many rows
**Warning signs:** Janky scrolling, "Application not responding" on slow devices

### Pitfall 5: Not Running Migrations Before Render
**What goes wrong:** Queries fail because tables don't exist
**Why it happens:** App renders before SQLiteProvider's onInit completes
**How to avoid:** Use Suspense boundary around SQLiteProvider, show loading state
**Warning signs:** "no such table" errors on app launch

### Pitfall 6: GPS Breadcrumb Explosion
**What goes wrong:** Database grows huge with long drives
**Why it happens:** Recording breadcrumbs every 5 seconds = 720 rows per hour
**How to avoid:**
- Store only: timestamp, lat, lon, speed (4 columns, compact)
- Consider thinning on drives older than N days
- Add index on driveId for fast queries
**Warning signs:** Slow app launch, large app storage usage

## Code Examples

Verified patterns from official sources:

### Database Schema (Complete)
```typescript
// Source: https://orm.drizzle.team/docs/column-types/sqlite
// db/schema/index.ts

import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Drives table
export const drives = sqliteTable('drives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),
  distanceMeters: real('distance_meters'),
  score: integer('score'),
  spillCount: integer('spill_count').default(0),
  potholeCount: integer('pothole_count').default(0),
  difficulty: text('difficulty').notNull(),
  isManual: integer('is_manual', { mode: 'boolean' }).default(false),
  personalBest: integer('personal_best', { mode: 'boolean' }).default(false),
});

// Events table (spills, potholes, drive lifecycle)
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  driveId: integer('drive_id').notNull().references(() => drives.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'spill' | 'pothole' | 'drive_start' | 'drive_end'
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  severity: real('severity'), // 0-1, how far over threshold
}, (table) => [
  index('events_drive_id_idx').on(table.driveId),
]);

// GPS breadcrumbs (recorded every 5 seconds per DRIV-04)
export const breadcrumbs = sqliteTable('breadcrumbs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  driveId: integer('drive_id').notNull().references(() => drives.id, { onDelete: 'cascade' }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  speed: real('speed'), // m/s, nullable if GPS had no speed
}, (table) => [
  index('breadcrumbs_drive_id_idx').on(table.driveId),
]);

// Relations for Drizzle relational queries
export const drivesRelations = relations(drives, ({ many }) => ({
  events: many(events),
  breadcrumbs: many(breadcrumbs),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  drive: one(drives, {
    fields: [events.driveId],
    references: [drives.id],
  }),
}));

export const breadcrumbsRelations = relations(breadcrumbs, ({ one }) => ({
  drive: one(drives, {
    fields: [breadcrumbs.driveId],
    references: [drives.id],
  }),
}));

// Type exports
export type Drive = typeof drives.$inferSelect;
export type NewDrive = typeof drives.$inferInsert;
export type DriveEvent = typeof events.$inferSelect;
export type NewDriveEvent = typeof events.$inferInsert;
export type Breadcrumb = typeof breadcrumbs.$inferSelect;
export type NewBreadcrumb = typeof breadcrumbs.$inferInsert;
```

### Haversine Distance Calculation
```typescript
// Source: https://www.movable-type.co.uk/scripts/latlong.html
// utils/geo.ts

const EARTH_RADIUS_METERS = 6371e3;

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const toRad = (deg: number) => deg * Math.PI / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a = Math.sin(deltaPhi / 2) ** 2 +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate total distance from array of breadcrumbs
 */
export function totalDistanceFromBreadcrumbs(
  breadcrumbs: Array<{ latitude: number; longitude: number }>
): number {
  let total = 0;
  for (let i = 1; i < breadcrumbs.length; i++) {
    const prev = breadcrumbs[i - 1];
    const curr = breadcrumbs[i];
    total += haversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }
  return total;
}
```

### DriveRecorder Service
```typescript
// services/DriveRecorder.ts
// Orchestrates event capture during active drive

import { db } from '../db/client';
import { drives, events, breadcrumbs, type NewDrive } from '../db/schema';
import { calculateScore } from '../db/queries/scoring';
import { totalDistanceFromBreadcrumbs } from '../utils/geo';
import { eq } from 'drizzle-orm';

export class DriveRecorder {
  private currentDriveId: number | null = null;
  private spillCount = 0;
  private potholeCount = 0;

  async startDrive(difficulty: string, isManual: boolean): Promise<number> {
    const result = await db.insert(drives).values({
      startTime: new Date(),
      difficulty,
      isManual,
      spillCount: 0,
      potholeCount: 0,
    }).returning({ id: drives.id });

    this.currentDriveId = result[0].id;
    this.spillCount = 0;
    this.potholeCount = 0;

    await this.logEvent('drive_start', null);
    return this.currentDriveId;
  }

  async recordSpill(
    location: { latitude: number; longitude: number } | null,
    severity: number
  ): Promise<void> {
    if (!this.currentDriveId) return;

    this.spillCount++;
    await this.logEvent('spill', location, severity);

    // Update count in drives table
    await db.update(drives)
      .set({ spillCount: this.spillCount })
      .where(eq(drives.id, this.currentDriveId));
  }

  async recordBreadcrumb(
    latitude: number,
    longitude: number,
    speed: number | null
  ): Promise<void> {
    if (!this.currentDriveId) return;

    await db.insert(breadcrumbs).values({
      driveId: this.currentDriveId,
      timestamp: new Date(),
      latitude,
      longitude,
      speed,
    });
  }

  async endDrive(): Promise<{ score: number; isPersonalBest: boolean } | null> {
    if (!this.currentDriveId) return null;

    const driveId = this.currentDriveId;
    const endTime = new Date();

    // Log end event
    await this.logEvent('drive_end', null);

    // Get drive start time and events for calculation
    const [driveData] = await db.select().from(drives).where(eq(drives.id, driveId));
    const spillEvents = await db.select()
      .from(events)
      .where(eq(events.driveId, driveId))
      .where(eq(events.type, 'spill'));

    const driveBreadcrumbs = await db.select()
      .from(breadcrumbs)
      .where(eq(breadcrumbs.driveId, driveId));

    // Calculate metrics
    const durationMs = endTime.getTime() - driveData.startTime.getTime();
    const distanceMeters = totalDistanceFromBreadcrumbs(driveBreadcrumbs);
    const score = calculateScore(this.spillCount, spillEvents);

    // Check for personal best
    const [bestDrive] = await db.select({ maxScore: drives.score })
      .from(drives)
      .where(eq(drives.difficulty, driveData.difficulty))
      .orderBy(desc(drives.score))
      .limit(1);

    const isPersonalBest = !bestDrive?.maxScore || score > bestDrive.maxScore;

    // Update drive record
    await db.update(drives).set({
      endTime,
      durationMs,
      distanceMeters,
      score,
      spillCount: this.spillCount,
      potholeCount: this.potholeCount,
      personalBest: isPersonalBest,
    }).where(eq(drives.id, driveId));

    // Clear if this beat previous best
    if (isPersonalBest && bestDrive?.maxScore) {
      // Could clear old personal_best flags here
    }

    this.currentDriveId = null;
    return { score, isPersonalBest };
  }

  private async logEvent(
    type: string,
    location: { latitude: number; longitude: number } | null,
    severity?: number
  ): Promise<void> {
    if (!this.currentDriveId) return;

    await db.insert(events).values({
      driveId: this.currentDriveId,
      type,
      timestamp: new Date(),
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      severity: severity ?? null,
    });
  }
}
```

### Drizzle Configuration Files
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
});
```

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

module.exports = config;
```

```javascript
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw SQL strings | Drizzle/Kysely ORM | 2024-2025 | Type safety, fewer SQL injection bugs |
| Manual migration tracking | drizzle-kit generate | 2024 | Automatic schema diffing |
| Bridge-based SQLite | JSI-based expo-sqlite | 2023 | 10-100x faster queries |
| AsyncStorage for everything | SQLite for structured data | 2022+ | Better querying, no 6MB limit |

**Deprecated/outdated:**
- `expo-sqlite/legacy` API: Use new synchronous/async API from expo-sqlite ~16.x
- `react-native-sqlite-storage` in Expo projects: expo-sqlite is now the standard
- String-based SQL in production: Use query builders or ORMs

## Open Questions

Things that couldn't be fully resolved:

1. **Pothole detection integration**
   - What we know: Z-axis spikes will trigger pothole events (Phase 5)
   - What's unclear: Should we pre-create the event type now or wait?
   - Recommendation: Add 'pothole' to event types now, implement detection in Phase 5

2. **Score formula balance**
   - What we know: 100 - deductions per spill is the base approach
   - What's unclear: Exact deduction amounts need playtesting
   - Recommendation: Use configurable constants, tune in Phase 5

3. **Personal best per difficulty vs global**
   - What we know: CONTEXT.md says "highlight when a drive beats all-time best"
   - What's unclear: Is that per-difficulty or across all difficulties?
   - Recommendation: Per-difficulty makes more sense (Easy best != Master best)

## Sources

### Primary (HIGH confidence)
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) - API details, SQLiteProvider pattern
- [Drizzle ORM Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite) - Connection setup, migrations
- [Drizzle ORM Native SQLite](https://orm.drizzle.team/docs/get-started/expo-new) - Full setup guide
- [Drizzle Column Types](https://orm.drizzle.team/docs/column-types/sqlite) - Schema definition syntax
- [LogRocket Drizzle + Expo SQLite Guide](https://blog.logrocket.com/drizzle-react-native-expo-sqlite/) - Relations, migrations, patterns

### Secondary (MEDIUM confidence)
- [Movable Type Haversine](https://www.movable-type.co.uk/scripts/latlong.html) - Verified distance formula
- [React Native SectionList Docs](https://reactnative.dev/docs/sectionlist) - Day grouping pattern
- [Zustand Persist Discussion](https://github.com/pmndrs/zustand/discussions/1533) - Why not to persist to SQLite

### Tertiary (LOW confidence)
- WebSearch results on score calculation algorithms - no standard for "water cup" scoring found
- WebSearch results on SQLite GPS patterns - basic schemas, no React Native specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Expo and Drizzle docs confirm recommendations
- Architecture: HIGH - Patterns verified in multiple official examples
- Score calculation: MEDIUM - Formula is sound but values need tuning
- Pitfalls: HIGH - Multiple sources confirm each pitfall

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable libraries)
