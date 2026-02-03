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

// Migration SQL inlined directly (babel-plugin-inline-import not working reliably)
const m0000 = `CREATE TABLE \`drives\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`start_time\` integer NOT NULL,
	\`end_time\` integer,
	\`duration_ms\` integer,
	\`distance_meters\` real,
	\`score\` integer,
	\`spill_count\` integer DEFAULT 0,
	\`pothole_count\` integer DEFAULT 0,
	\`difficulty\` text NOT NULL,
	\`manual_start\` integer DEFAULT false,
	\`manual_end\` integer DEFAULT false,
	\`created_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`events\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`drive_id\` text NOT NULL,
	\`type\` text NOT NULL,
	\`timestamp\` integer NOT NULL,
	\`latitude\` real,
	\`longitude\` real,
	\`severity\` real,
	\`forgiven\` integer DEFAULT false,
	FOREIGN KEY (\`drive_id\`) REFERENCES \`drives\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX \`events_drive_id_idx\` ON \`events\` (\`drive_id\`);--> statement-breakpoint
CREATE TABLE \`breadcrumbs\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`drive_id\` text NOT NULL,
	\`timestamp\` integer NOT NULL,
	\`latitude\` real NOT NULL,
	\`longitude\` real NOT NULL,
	\`speed\` real,
	FOREIGN KEY (\`drive_id\`) REFERENCES \`drives\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX \`breadcrumbs_drive_id_idx\` ON \`breadcrumbs\` (\`drive_id\`);`;

/**
 * Migration journal - tracks which migrations to apply in order
 * Structure matches what drizzle-orm/expo-sqlite/migrator expects
 */
export default {
  journal: {
    entries: [
      { idx: 0, version: '6', when: 1770069973838, tag: '0000_faithful_penance', breakpoints: true },
    ],
  },
  migrations: {
    'm0000': m0000,
  },
};
