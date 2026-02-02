/**
 * Database migrations for Drizzle ORM
 *
 * This file imports generated SQL migrations for bundling via babel-plugin-inline-import.
 * The migrations are applied on app start via useDatabaseMigrations hook.
 *
 * When adding new migrations:
 * 1. Run `npx drizzle-kit generate` to create new SQL file
 * 2. Add import statement below
 * 3. Add entry to journal and migrations objects
 */

// Import generated migration SQL (bundled as string via babel-plugin-inline-import)
// @ts-expect-error - SQL file imported as string by babel-plugin-inline-import
import m0000 from '../../drizzle/0000_faithful_penance.sql';

/**
 * Migration journal - tracks which migrations to apply in order
 * Structure matches what drizzle-orm/expo-sqlite/migrator expects
 */
export default {
  journal: {
    entries: [
      { idx: 0, when: 1770069973838, tag: '0000_faithful_penance', breakpoints: true },
    ],
  },
  migrations: {
    '0000_faithful_penance': m0000,
  },
};
