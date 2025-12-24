CREATE TABLE `activity_maps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`extrahopId` bigint,
	`configId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`mode` varchar(32),
	`weighting` varchar(32),
	`nodes` json,
	`edges` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_maps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `extrahop_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiUrl` varchar(512) NOT NULL,
	`apiKey` varchar(512) NOT NULL,
	`applianceName` varchar(256),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `extrahop_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameType` varchar(64) NOT NULL,
	`score` int NOT NULL,
	`level` int DEFAULT 1,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lore_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(128) NOT NULL,
	`subcategory` varchar(128),
	`title` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`source` varchar(256),
	`sourceUrl` varchar(512),
	`embedding` json,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lore_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`extrahopId` bigint,
	`configId` int NOT NULL,
	`severity` enum('critical','high','medium','low','info') NOT NULL,
	`alertType` varchar(128) NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`sourceDevice` varchar(256),
	`targetDevice` varchar(256),
	`protocol` varchar(64),
	`isAcknowledged` boolean NOT NULL DEFAULT false,
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`metadata` json,
	`detectedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `network_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`extrahopId` bigint,
	`configId` int NOT NULL,
	`displayName` varchar(256),
	`ipAddress` varchar(64),
	`macAddress` varchar(64),
	`deviceClass` varchar(128),
	`role` varchar(64),
	`vendor` varchar(256),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSeen` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `network_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`metricType` varchar(64) NOT NULL,
	`deviceId` int,
	`value` bigint NOT NULL,
	`unit` varchar(32),
	`timestamp` timestamp NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `network_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_prefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertSeverity` json,
	`pushEnabled` boolean NOT NULL DEFAULT true,
	`voiceEnabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_prefs_id` PRIMARY KEY(`id`)
);
