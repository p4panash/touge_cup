CREATE TABLE `drives` (
	`id` text PRIMARY KEY NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`duration_ms` integer,
	`distance_meters` real,
	`score` integer,
	`spill_count` integer DEFAULT 0,
	`pothole_count` integer DEFAULT 0,
	`difficulty` text NOT NULL,
	`manual_start` integer DEFAULT false,
	`manual_end` integer DEFAULT false,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`drive_id` text NOT NULL,
	`type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`latitude` real,
	`longitude` real,
	`severity` real,
	`forgiven` integer DEFAULT false,
	FOREIGN KEY (`drive_id`) REFERENCES `drives`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `events_drive_id_idx` ON `events` (`drive_id`);--> statement-breakpoint
CREATE TABLE `breadcrumbs` (
	`id` text PRIMARY KEY NOT NULL,
	`drive_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`speed` real,
	FOREIGN KEY (`drive_id`) REFERENCES `drives`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `breadcrumbs_drive_id_idx` ON `breadcrumbs` (`drive_id`);