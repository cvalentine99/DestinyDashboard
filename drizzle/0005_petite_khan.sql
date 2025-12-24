CREATE TABLE `guardian_loadouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`guardianClass` enum('titan','hunter','warlock') NOT NULL,
	`primaryWeapon` enum('auto_rifle','hand_cannon','pulse_rifle','rocket_launcher') NOT NULL,
	`iconColor` varchar(32) DEFAULT '#00d4aa',
	`isDefault` boolean NOT NULL DEFAULT false,
	`slotNumber` int,
	`timesUsed` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guardian_loadouts_id` PRIMARY KEY(`id`)
);
