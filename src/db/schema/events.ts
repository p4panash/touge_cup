import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { drives } from './drives';

/**
 * Event types for drive logging
 * - spill: water spill detected (exceeded jerk threshold)
 * - pothole: pothole detected via z-axis (Phase 5)
 * - drive_start: drive session began
 * - drive_end: drive session ended
 * - gps_lost: GPS signal lost during drive
 * - gps_resumed: GPS signal restored during drive
 */
export type EventType = 'spill' | 'pothole' | 'drive_start' | 'drive_end' | 'gps_lost' | 'gps_resumed';

/**
 * Events table - logs significant events during a drive
 *
 * Each event is associated with a drive and has optional location data.
 * Cascade delete ensures events are removed when drive is deleted.
 */
export const events = sqliteTable('events', {
  id: text('id').primaryKey(), // UUID
  driveId: text('drive_id').notNull().references(() => drives.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // EventType
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  severity: real('severity'), // how far over threshold (0-1 for spills)
  forgiven: integer('forgiven', { mode: 'boolean' }).default(false), // for potholes on easy/experienced
}, (table) => [
  index('events_drive_id_idx').on(table.driveId),
]);

/**
 * Relations for Drizzle relational queries
 * Per 03-RESEARCH.md Pitfall 2: Always export relations alongside tables
 */
export const eventsRelations = relations(events, ({ one }) => ({
  drive: one(drives, {
    fields: [events.driveId],
    references: [drives.id],
  }),
}));

// Type exports for use in application code
export type DriveEvent = typeof events.$inferSelect;
export type NewDriveEvent = typeof events.$inferInsert;
