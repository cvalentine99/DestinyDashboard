CREATE TABLE `bungie_servers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(64) NOT NULL,
	`ipRange` varchar(64),
	`serverType` varchar(64),
	`region` varchar(64),
	`description` varchar(256),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSeen` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bungie_servers_id` PRIMARY KEY(`id`),
	CONSTRAINT `bungie_servers_ipAddress_unique` UNIQUE(`ipAddress`)
);
--> statement-breakpoint
CREATE TABLE `crucible_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`configId` int NOT NULL,
	`extrahopDeviceId` bigint,
	`deviceName` varchar(256) NOT NULL,
	`macAddress` varchar(64),
	`ipAddress` varchar(64),
	`platform` varchar(64) NOT NULL DEFAULT 'PS5',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crucible_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crucible_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`timestampNs` bigint NOT NULL,
	`eventType` enum('match_start','match_end','lag_spike','packet_loss_spike','peer_joined','peer_left','connection_degraded','connection_recovered','bungie_server_switch','network_anomaly','high_jitter','disconnect','reconnect') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`description` text,
	`latencyMs` int,
	`packetLossPercent` int,
	`affectedPeerIp` varchar(64),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crucible_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crucible_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceId` int NOT NULL,
	`matchState` enum('orbit','matchmaking','loading','in_match','post_game','unknown') NOT NULL DEFAULT 'unknown',
	`gameMode` varchar(64),
	`startTime` timestamp,
	`endTime` timestamp,
	`durationMs` bigint,
	`avgLatencyMs` int,
	`maxLatencyMs` int,
	`minLatencyMs` int,
	`packetLossPercent` int,
	`avgJitterMs` int,
	`peerCount` int,
	`bungieServerIp` varchar(64),
	`result` enum('victory','defeat','mercy','disconnect','unknown'),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crucible_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crucible_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`timestampNs` bigint NOT NULL,
	`latencyMs` int,
	`jitterMs` int,
	`packetsSent` bigint,
	`packetsReceived` bigint,
	`packetsLost` bigint,
	`bytesSent` bigint,
	`bytesReceived` bigint,
	`bungieTrafficBytes` bigint,
	`p2pTrafficBytes` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crucible_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crucible_peers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`peerIp` varchar(64) NOT NULL,
	`peerPort` int,
	`connectionStartTime` timestamp,
	`connectionEndTime` timestamp,
	`avgLatencyMs` int,
	`maxLatencyMs` int,
	`packetsSent` bigint,
	`packetsReceived` bigint,
	`bytesSent` bigint,
	`bytesReceived` bigint,
	`geoCountry` varchar(64),
	`geoRegion` varchar(128),
	`geoCity` varchar(128),
	`isp` varchar(256),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crucible_peers_id` PRIMARY KEY(`id`)
);
