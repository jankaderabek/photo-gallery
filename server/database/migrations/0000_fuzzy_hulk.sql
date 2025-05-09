CREATE TABLE `albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`pathname` text NOT NULL,
	`date_created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `albums_pathname_unique` ON `albums` (`pathname`);