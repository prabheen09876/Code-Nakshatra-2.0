-- Daily Gig Mode: instant gig broadcasts to active freelancers
ALTER TABLE `users` ADD `dailyGigMode` integer DEFAULT 0 NOT NULL;
ALTER TABLE `users` ADD `skillsJson` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
CREATE TABLE `daily_gigs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clientId` integer NOT NULL,
	`title` text NOT NULL,
	`budget` text NOT NULL,
	`duration` text NOT NULL,
	`requiredSkills` text DEFAULT '[]' NOT NULL,
	`description` text,
	`status` text DEFAULT 'open' NOT NULL,
	`acceptedFreelancerId` integer,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`acceptedFreelancerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `gig_offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gigId` integer NOT NULL,
	`freelancerId` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer,
	FOREIGN KEY (`gigId`) REFERENCES `daily_gigs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`freelancerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gig_offer_unique` ON `gig_offers` (`gigId`,`freelancerId`);
--> statement-breakpoint
CREATE TABLE `gig_recruiter_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clientId` integer NOT NULL,
	`gigId` integer NOT NULL,
	`freelancerId` integer NOT NULL,
	`read` integer DEFAULT 0 NOT NULL,
	`createdAt` integer,
	FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`gigId`) REFERENCES `daily_gigs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`freelancerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
