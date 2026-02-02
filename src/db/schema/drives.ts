import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { events } from './events';
import { breadcrumbs } from './breadcrumbs';

/**
 * Drives table - stores completed and in-progress drive sessions
 *
 * Note on timestamps: Using timestamp_ms mode for millisecond precision.
 * This stores as integer but Drizzle handles Date conversion automatically.
 */
export const drives = sqliteTable('drives', {
  id: text('id').primaryKey(), // UUID
  startTime: integer('start_time', { mode: 'timestamp_ms' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp_ms' }),
  durationMs: integer('duration_ms'),
  distanceMeters: real('distance_meters'),
  score: integer('score'), // 0-100, null until drive ends
  spillCount: integer('spill_count').default(0),
  potholeCount: integer('pothole_count').default(0),
  difficulty: text('difficulty').notNull(), // 'easy' | 'experienced' | 'master'
  manualStart: integer('manual_start', { mode: 'boolean' }).default(false),
  manualEnd: integer('manual_end', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Relations for Drizzle relational queries
 * Per 03-RESEARCH.md Pitfall 2: Always export relations alongside tables
 */
export const drivesRelations = relations(drives, ({ many }) => ({
  events: many(events),
  breadcrumbs: many(breadcrumbs),
}));

// Type exports for use in application code
export type Drive = typeof drives.$inferSelect;
export type NewDrive = typeof drives.$inferInsert;
