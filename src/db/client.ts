/**
 * Database client for Drizzle ORM with expo-sqlite
 *
 * Provides:
 * - db: The Drizzle database client instance for queries
 * - useDatabaseMigrations: Hook to run migrations on app start
 * - generateId: UUID generation utility
 */

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from './schema';
import migrations from './migrations';

const DATABASE_NAME = 'watercup.db';

/**
 * Open database with change listener enabled for live queries
 * Per 03-RESEARCH.md Pitfall 3: enableChangeListener required for useLiveQuery
 */
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

/**
 * Drizzle database client with full schema for typed queries
 *
 * Usage:
 * ```ts
 * import { db } from './db/client';
 * import { drives } from './db/schema';
 *
 * // Insert
 * await db.insert(drives).values({ ... });
 *
 * // Select
 * const allDrives = await db.select().from(drives);
 *
 * // Relational query
 * const driveWithEvents = await db.query.drives.findFirst({
 *   with: { events: true }
 * });
 * ```
 */
export const db = drizzle(expoDb, { schema });

/**
 * Hook to run migrations on app start
 *
 * Per 03-RESEARCH.md Pitfall 5: Migrations must run before any queries.
 * Wrap your app root in a migration check to prevent "no such table" errors.
 *
 * Usage:
 * ```tsx
 * function App() {
 *   const { success, error } = useDatabaseMigrations();
 *
 *   if (error) {
 *     return <Text>Database error: {error.message}</Text>;
 *   }
 *
 *   if (!success) {
 *     return <Text>Initializing database...</Text>;
 *   }
 *
 *   return <MainApp />;
 * }
 * ```
 */
export function useDatabaseMigrations() {
  return useMigrations(db, migrations);
}

/**
 * Generate a UUID for new database records
 *
 * Uses crypto.randomUUID() when available (most modern environments),
 * falls back to timestamp-based ID for compatibility.
 *
 * @returns A unique identifier string
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
