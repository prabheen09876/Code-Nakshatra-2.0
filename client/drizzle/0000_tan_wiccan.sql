CREATE TABLE `change_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`description` text NOT NULL,
	`classification` text,
	`priceAdjustment` integer DEFAULT 0,
	`timelineAdjustment` integer DEFAULT 0,
	`approved` integer DEFAULT false,
	`createdAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant1Id` integer NOT NULL,
	`participant2Id` integer NOT NULL,
	`lastMessageAt` integer,
	`createdAt` integer,
	FOREIGN KEY (`participant1Id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant2Id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_idx` ON `conversations` (`participant1Id`,`participant2Id`);--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'link',
	`status` text DEFAULT 'pending',
	`clientFeedback` text,
	`submittedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` integer NOT NULL,
	`senderId` integer NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer,
	FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`senderId` integer NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`freelancerId` integer NOT NULL,
	`clientId` integer NOT NULL,
	`title` text NOT NULL,
	`scopeChecklist` text DEFAULT '[]',
	`revisionLimit` integer NOT NULL,
	`revisionsUsed` integer DEFAULT 0,
	`status` text DEFAULT 'draft',
	`deadline` integer,
	`completedAt` integer,
	`trustImpact` integer DEFAULT 0,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`freelancerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`trustScore` integer DEFAULT 50,
	`scopeDiscipline` integer DEFAULT 100,
	`scopeCreepIndex` integer DEFAULT 0,
	`disputeRatio` integer DEFAULT 0,
	`trustVelocity` integer DEFAULT 0,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);