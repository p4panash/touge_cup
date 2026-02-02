import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { drives } from './drives';

/**
 * Breadcrumbs table - GPS location history during a drive
 *
 * Stores location samples at regular intervals for:
 * - Distance calculation via Haversine formula
 * - Route visualization on map (Phase 4)
 * - Speed history analysis
 *
 * Per 03-RESEARCH.md Pitfall 6: Keep columns minimal to avoid database bloat
 * (720 rows per hour at 5-second intervals)
 */
export const breadcrumbs = sqliteTable('breadcrumbs', {
  id: text('id').primaryKey(), // UUID
  driveId: text('drive_id').notNull().references(() => drives.id, { onDelete: 'cascade' }),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  speed: real('speed'), // m/s, nullable if GPS didn't provide
}, (table) => [
  // Index for efficient queries when loading all breadcrumbs for a drive
  index('breadcrumbs_drive_id_idx').on(table.driveId),
]);

/**
 * Relations for Drizzle relational queries
 * Per 03-RESEARCH.md Pitfall 2: Always export relations alongside tables
 */
export const breadcrumbsRelations = relations(breadcrumbs, ({ one }) => ({
  drive: one(drives, {
    fields: [breadcrumbs.driveId],
    references: [drives.id],
  }),
}));

// Type exports for use in application code
export type Breadcrumb = typeof breadcrumbs.$inferSelect;
export type NewBreadcrumb = typeof breadcrumbs.$inferInsert;
