import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, bigint, boolean, decimal } from "drizzle-orm/mysql-core";

// Core user table backing auth flow
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ExtraHop API configuration
export const extrahopConfig = mysqlTable("extrahop_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apiUrl: varchar("apiUrl", { length: 512 }).notNull(),
  apiKey: varchar("apiKey", { length: 512 }).notNull(),
  applianceName: varchar("applianceName", { length: 256 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExtrahopConfig = typeof extrahopConfig.$inferSelect;
export type InsertExtrahopConfig = typeof extrahopConfig.$inferInsert;

// Network devices (Guardians in Destiny terminology)
export const networkDevices = mysqlTable("network_devices", {
  id: int("id").autoincrement().primaryKey(),
  extrahopId: bigint("extrahopId", { mode: "number" }),
  configId: int("configId").notNull(),
  displayName: varchar("displayName", { length: 256 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  macAddress: varchar("macAddress", { length: 64 }),
  deviceClass: varchar("deviceClass", { length: 128 }), // Guardian class equivalent
  role: varchar("role", { length: 64 }), // client, server, gateway
  vendor: varchar("vendor", { length: 256 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastSeen: timestamp("lastSeen"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NetworkDevice = typeof networkDevices.$inferSelect;
export type InsertNetworkDevice = typeof networkDevices.$inferInsert;

// Network alerts (Threat Detections)
export const networkAlerts = mysqlTable("network_alerts", {
  id: int("id").autoincrement().primaryKey(),
  extrahopId: bigint("extrahopId", { mode: "number" }),
  configId: int("configId").notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "info"]).notNull(),
  alertType: varchar("alertType", { length: 128 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  sourceDevice: varchar("sourceDevice", { length: 256 }),
  targetDevice: varchar("targetDevice", { length: 256 }),
  protocol: varchar("protocol", { length: 64 }),
  isAcknowledged: boolean("isAcknowledged").default(false).notNull(),
  acknowledgedBy: int("acknowledgedBy"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  metadata: json("metadata"),
  detectedAt: timestamp("detectedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetworkAlert = typeof networkAlerts.$inferSelect;
export type InsertNetworkAlert = typeof networkAlerts.$inferInsert;

// Network metrics snapshots (Power Level data)
export const networkMetrics = mysqlTable("network_metrics", {
  id: int("id").autoincrement().primaryKey(),
  configId: int("configId").notNull(),
  metricType: varchar("metricType", { length: 64 }).notNull(),
  deviceId: int("deviceId"),
  value: bigint("value", { mode: "number" }).notNull(),
  unit: varchar("unit", { length: 32 }),
  timestamp: timestamp("timestamp").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetworkMetric = typeof networkMetrics.$inferSelect;
export type InsertNetworkMetric = typeof networkMetrics.$inferInsert;

// Activity maps / Topology data
export const activityMaps = mysqlTable("activity_maps", {
  id: int("id").autoincrement().primaryKey(),
  extrahopId: bigint("extrahopId", { mode: "number" }),
  configId: int("configId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  mode: varchar("mode", { length: 32 }), // 2dforce, 3dforce
  weighting: varchar("weighting", { length: 32 }), // bytes, connections, turns
  nodes: json("nodes"), // Device nodes
  edges: json("edges"), // Connections between devices
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActivityMap = typeof activityMaps.$inferSelect;
export type InsertActivityMap = typeof activityMaps.$inferInsert;

// Destiny 2 Lore entries for RAG
export const loreEntries = mysqlTable("lore_entries", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 128 }).notNull(), // Books of Sorrow, Guardians, The Nine, etc.
  subcategory: varchar("subcategory", { length: 128 }),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 256 }), // Ishtar Collective, Grimoire, etc.
  sourceUrl: varchar("sourceUrl", { length: 512 }),
  embedding: json("embedding"), // Vector embedding for semantic search
  tags: json("tags"), // Array of tags for filtering
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoreEntry = typeof loreEntries.$inferSelect;
export type InsertLoreEntry = typeof loreEntries.$inferInsert;

// Chat history for lore chatbot
export const chatHistory = mysqlTable("chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;

// Game scores for mini-game
export const gameScores = mysqlTable("game_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gameType: varchar("gameType", { length: 64 }).notNull(),
  score: int("score").notNull(),
  level: int("level").default(1),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = typeof gameScores.$inferInsert;

// Notification preferences
export const notificationPrefs = mysqlTable("notification_prefs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  alertSeverity: json("alertSeverity"), // Array of severities to notify
  pushEnabled: boolean("pushEnabled").default(true).notNull(),
  voiceEnabled: boolean("voiceEnabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPref = typeof notificationPrefs.$inferSelect;
export type InsertNotificationPref = typeof notificationPrefs.$inferInsert;


// Crucible Operations - PS5 Device Configuration
export const crucibleDevices = mysqlTable("crucible_devices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  configId: int("configId").notNull(), // ExtraHop config reference
  extrahopDeviceId: bigint("extrahopDeviceId", { mode: "number" }),
  deviceName: varchar("deviceName", { length: 256 }).notNull(), // e.g., "Sony Interactive Entertainment BCD278"
  macAddress: varchar("macAddress", { length: 64 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  platform: varchar("platform", { length: 64 }).default("PS5").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrucibleDevice = typeof crucibleDevices.$inferSelect;
export type InsertCrucibleDevice = typeof crucibleDevices.$inferInsert;

// Crucible Match Sessions
export const crucibleMatches = mysqlTable("crucible_matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId").notNull(), // Reference to crucibleDevices
  matchState: mysqlEnum("matchState", ["orbit", "matchmaking", "loading", "in_match", "post_game", "unknown"]).default("unknown").notNull(),
  gameMode: varchar("gameMode", { length: 64 }), // Control, Clash, Trials, Iron Banner, etc.
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  durationMs: bigint("durationMs", { mode: "number" }),
  // Connection quality summary
  avgLatencyMs: int("avgLatencyMs"),
  maxLatencyMs: int("maxLatencyMs"),
  minLatencyMs: int("minLatencyMs"),
  packetLossPercent: int("packetLossPercent"), // Stored as percentage * 100 (e.g., 150 = 1.5%)
  avgJitterMs: int("avgJitterMs"),
  // Peer info
  peerCount: int("peerCount"),
  bungieServerIp: varchar("bungieServerIp", { length: 64 }),
  // Match result
  result: mysqlEnum("result", ["victory", "defeat", "mercy", "disconnect", "unknown"]),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrucibleMatch = typeof crucibleMatches.$inferSelect;
export type InsertCrucibleMatch = typeof crucibleMatches.$inferInsert;

// Crucible Connection Quality Samples (high-frequency metrics during match)
export const crucibleMetrics = mysqlTable("crucible_metrics", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(), // Reference to crucibleMatches
  timestampNs: bigint("timestampNs", { mode: "bigint" }).notNull(), // Nanosecond precision
  latencyMs: int("latencyMs"),
  jitterMs: int("jitterMs"),
  packetsSent: bigint("packetsSent", { mode: "number" }),
  packetsReceived: bigint("packetsReceived", { mode: "number" }),
  packetsLost: bigint("packetsLost", { mode: "number" }),
  bytesSent: bigint("bytesSent", { mode: "number" }),
  bytesReceived: bigint("bytesReceived", { mode: "number" }),
  // Traffic breakdown
  bungieTrafficBytes: bigint("bungieTrafficBytes", { mode: "number" }),
  p2pTrafficBytes: bigint("p2pTrafficBytes", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrucibleMetric = typeof crucibleMetrics.$inferSelect;
export type InsertCrucibleMetric = typeof crucibleMetrics.$inferInsert;

// Crucible Peer Connections (P2P analysis)
export const cruciblePeers = mysqlTable("crucible_peers", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(), // Reference to crucibleMatches
  peerIp: varchar("peerIp", { length: 64 }).notNull(),
  peerPort: int("peerPort"),
  connectionStartTime: timestamp("connectionStartTime"),
  connectionEndTime: timestamp("connectionEndTime"),
  avgLatencyMs: int("avgLatencyMs"),
  maxLatencyMs: int("maxLatencyMs"),
  packetsSent: bigint("packetsSent", { mode: "number" }),
  packetsReceived: bigint("packetsReceived", { mode: "number" }),
  bytesSent: bigint("bytesSent", { mode: "number" }),
  bytesReceived: bigint("bytesReceived", { mode: "number" }),
  // Geolocation (if available from ExtraHop)
  geoCountry: varchar("geoCountry", { length: 64 }),
  geoRegion: varchar("geoRegion", { length: 128 }),
  geoCity: varchar("geoCity", { length: 128 }),
  isp: varchar("isp", { length: 256 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CruciblePeer = typeof cruciblePeers.$inferSelect;
export type InsertCruciblePeer = typeof cruciblePeers.$inferInsert;

// Crucible Match Timeline Events (lag spikes, disconnects, etc.)
export const crucibleEvents = mysqlTable("crucible_events", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(), // Reference to crucibleMatches
  timestampNs: bigint("timestampNs", { mode: "bigint" }).notNull(), // Nanosecond precision
  eventType: mysqlEnum("eventType", [
    "match_start",
    "match_end",
    "lag_spike",
    "packet_loss_spike",
    "peer_joined",
    "peer_left",
    "connection_degraded",
    "connection_recovered",
    "bungie_server_switch",
    "network_anomaly",
    "high_jitter",
    "disconnect",
    "reconnect"
  ]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  description: text("description"),
  // Event-specific data
  latencyMs: int("latencyMs"),
  packetLossPercent: int("packetLossPercent"),
  affectedPeerIp: varchar("affectedPeerIp", { length: 64 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrucibleEvent = typeof crucibleEvents.$inferSelect;
export type InsertCrucibleEvent = typeof crucibleEvents.$inferInsert;

// Known Bungie Server IPs for traffic detection
export const bungieServers = mysqlTable("bungie_servers", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 64 }).notNull().unique(),
  ipRange: varchar("ipRange", { length: 64 }), // CIDR notation
  serverType: varchar("serverType", { length: 64 }), // auth, matchmaking, game, api
  region: varchar("region", { length: 64 }),
  description: varchar("description", { length: 256 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastSeen: timestamp("lastSeen"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BungieServer = typeof bungieServers.$inferSelect;
export type InsertBungieServer = typeof bungieServers.$inferInsert;

// Bungie API Configuration
export const bungieConfig = mysqlTable("bungie_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apiKey: varchar("apiKey", { length: 512 }).notNull(),
  // Player identity
  bungieName: varchar("bungieName", { length: 256 }), // e.g., "Guardian#1234"
  membershipType: int("membershipType"), // PSN=2, Xbox=1, Steam=3, etc.
  membershipId: varchar("membershipId", { length: 64 }),
  // Primary character
  primaryCharacterId: varchar("primaryCharacterId", { length: 64 }),
  characterClass: varchar("characterClass", { length: 32 }), // Titan, Hunter, Warlock
  lightLevel: int("lightLevel"),
  // Sync settings
  autoSync: boolean("autoSync").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BungieConfig = typeof bungieConfig.$inferSelect;
export type InsertBungieConfig = typeof bungieConfig.$inferInsert;

// Bungie Match Data (from PGCR)
export const bungieMatches = mysqlTable("bungie_matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Bungie identifiers
  activityId: varchar("activityId", { length: 64 }).notNull().unique(),
  instanceId: varchar("instanceId", { length: 64 }),
  // Match details
  period: timestamp("period").notNull(), // When the match occurred
  mode: int("mode").notNull(), // DestinyActivityModeType
  modeName: varchar("modeName", { length: 64 }), // Human readable (Control, Clash, etc.)
  mapHash: bigint("mapHash", { mode: "number" }),
  mapName: varchar("mapName", { length: 128 }),
  durationSeconds: int("durationSeconds"),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  // Player performance
  kills: int("kills").default(0).notNull(),
  deaths: int("deaths").default(0).notNull(),
  assists: int("assists").default(0).notNull(),
  kd: decimal("kd", { precision: 6, scale: 3 }), // e.g., 1.500
  kda: decimal("kda", { precision: 6, scale: 3 }),
  efficiency: decimal("efficiency", { precision: 6, scale: 3 }),
  score: int("score").default(0),
  standing: int("standing"), // 0 = victory, 1 = defeat
  // Team scores
  teamScore: int("teamScore"),
  opponentScore: int("opponentScore"),
  // Extended stats
  precisionKills: int("precisionKills"),
  superKills: int("superKills"),
  grenadeKills: int("grenadeKills"),
  meleeKills: int("meleeKills"),
  abilityKills: int("abilityKills"),
  longestKillSpree: int("longestKillSpree"),
  // Raw PGCR data
  pgcrData: json("pgcrData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BungieMatch = typeof bungieMatches.$inferSelect;
export type InsertBungieMatch = typeof bungieMatches.$inferInsert;

// Network-Match Correlation (links ExtraHop metrics to Bungie matches)
export const matchCorrelations = mysqlTable("match_correlations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // References
  bungieMatchId: int("bungieMatchId").notNull(), // Reference to bungieMatches
  crucibleMatchId: int("crucibleMatchId"), // Reference to crucibleMatches (if available)
  // Network metrics during match
  avgLatencyMs: decimal("avgLatencyMs", { precision: 8, scale: 3 }),
  maxLatencyMs: decimal("maxLatencyMs", { precision: 8, scale: 3 }),
  minLatencyMs: decimal("minLatencyMs", { precision: 8, scale: 3 }),
  avgJitterMs: decimal("avgJitterMs", { precision: 8, scale: 3 }),
  maxJitterMs: decimal("maxJitterMs", { precision: 8, scale: 3 }),
  packetLossPercent: decimal("packetLossPercent", { precision: 5, scale: 2 }),
  lagSpikeCount: int("lagSpikeCount").default(0),
  // Correlation analysis
  performanceImpact: mysqlEnum("performanceImpact", ["positive", "neutral", "negative"]).default("neutral"),
  insights: json("insights"), // Array of insight strings
  // Timestamps for correlation matching
  networkStartTime: timestamp("networkStartTime"),
  networkEndTime: timestamp("networkEndTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchCorrelation = typeof matchCorrelations.$inferSelect;
export type InsertMatchCorrelation = typeof matchCorrelations.$inferInsert;

// ============================================================================
// TRIUMPH ACHIEVEMENTS SYSTEM
// ============================================================================

// Achievement Definitions (static data)
export const achievementDefinitions = mysqlTable("achievement_definitions", {
  id: varchar("id", { length: 64 }).primaryKey(), // e.g., "kill_100_thrall"
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "combat",      // Kill-based achievements
    "boss",        // Boss defeat achievements
    "flawless",    // No-damage achievements
    "score",       // Score milestone achievements
    "class",       // Class mastery achievements
    "weapon",      // Weapon mastery achievements
    "survival",    // Wave/level survival achievements
    "collection",  // Engram collection achievements
    "special",     // Special/secret achievements
  ]).notNull(),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum", "exotic"]).notNull(),
  targetValue: int("targetValue").notNull(), // e.g., 100 for "kill 100 thrall"
  rewardType: mysqlEnum("rewardType", ["title", "emblem", "shader", "points"]).default("points"),
  rewardValue: varchar("rewardValue", { length: 256 }), // Title name, emblem ID, etc.
  triumphPoints: int("triumphPoints").default(10).notNull(),
  iconUrl: varchar("iconUrl", { length: 512 }),
  isSecret: boolean("isSecret").default(false).notNull(),
  prerequisiteId: varchar("prerequisiteId", { length: 64 }), // Chain achievements
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AchievementDefinition = typeof achievementDefinitions.$inferSelect;
export type InsertAchievementDefinition = typeof achievementDefinitions.$inferInsert;

// User Achievement Progress
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  oderId: int("userId").notNull(),
  achievementId: varchar("achievementId", { length: 64 }).notNull(),
  currentValue: int("currentValue").default(0).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  claimedReward: boolean("claimedReward").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// User Triumph Stats (aggregate tracking)
export const userTriumphStats = mysqlTable("user_triumph_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Kill tracking
  totalKills: int("totalKills").default(0).notNull(),
  dregKills: int("dregKills").default(0).notNull(),
  vandalKills: int("vandalKills").default(0).notNull(),
  captainKills: int("captainKills").default(0).notNull(),
  thrallKills: int("thrallKills").default(0).notNull(),
  acolyteKills: int("acolyteKills").default(0).notNull(),
  knightKills: int("knightKills").default(0).notNull(),
  goblinKills: int("goblinKills").default(0).notNull(),
  hobgoblinKills: int("hobgoblinKills").default(0).notNull(),
  minotaurKills: int("minotaurKills").default(0).notNull(),
  // Boss tracking
  ogreKills: int("ogreKills").default(0).notNull(),
  servitorKills: int("servitorKills").default(0).notNull(),
  hydraKills: int("hydraKills").default(0).notNull(),
  flawlessOgre: int("flawlessOgre").default(0).notNull(),
  flawlessServitor: int("flawlessServitor").default(0).notNull(),
  flawlessHydra: int("flawlessHydra").default(0).notNull(),
  // Weapon tracking
  autoRifleKills: int("autoRifleKills").default(0).notNull(),
  handCannonKills: int("handCannonKills").default(0).notNull(),
  pulseRifleKills: int("pulseRifleKills").default(0).notNull(),
  rocketLauncherKills: int("rocketLauncherKills").default(0).notNull(),
  // Class tracking
  titanGamesPlayed: int("titanGamesPlayed").default(0).notNull(),
  hunterGamesPlayed: int("hunterGamesPlayed").default(0).notNull(),
  warlockGamesPlayed: int("warlockGamesPlayed").default(0).notNull(),
  titanWins: int("titanWins").default(0).notNull(),
  hunterWins: int("hunterWins").default(0).notNull(),
  warlockWins: int("warlockWins").default(0).notNull(),
  // Score tracking
  highestScore: int("highestScore").default(0).notNull(),
  totalScore: bigint("totalScore", { mode: "number" }).default(0).notNull(),
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  // Level tracking
  highestWave: int("highestWave").default(0).notNull(),
  highestLevel: int("highestLevel").default(0).notNull(),
  cosmodromeClears: int("cosmodromeClears").default(0).notNull(),
  europaClears: int("europaClears").default(0).notNull(),
  dreamingCityClears: int("dreamingCityClears").default(0).notNull(),
  // Engram tracking
  commonEngrams: int("commonEngrams").default(0).notNull(),
  uncommonEngrams: int("uncommonEngrams").default(0).notNull(),
  rareEngrams: int("rareEngrams").default(0).notNull(),
  legendaryEngrams: int("legendaryEngrams").default(0).notNull(),
  exoticEngrams: int("exoticEngrams").default(0).notNull(),
  // Ability tracking
  abilitiesUsed: int("abilitiesUsed").default(0).notNull(),
  supersUsed: int("supersUsed").default(0).notNull(),
  // Triumph points
  totalTriumphPoints: int("totalTriumphPoints").default(0).notNull(),
  // Titles earned
  titlesEarned: json("titlesEarned").$type<string[]>(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserTriumphStats = typeof userTriumphStats.$inferSelect;
export type InsertUserTriumphStats = typeof userTriumphStats.$inferInsert;

// Achievement Notification Queue (for showing popups)
export const achievementNotifications = mysqlTable("achievement_notifications", {
  id: int("id").autoincrement().primaryKey(),
  oderId: int("userId").notNull(),
  achievementId: varchar("achievementId", { length: 64 }).notNull(),
  shown: boolean("shown").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AchievementNotification = typeof achievementNotifications.$inferSelect;
export type InsertAchievementNotification = typeof achievementNotifications.$inferInsert;


// ============================================================================
// LOADOUT SYSTEM
// ============================================================================

// Guardian Loadouts - saved weapon/class combinations
export const guardianLoadouts = mysqlTable("guardian_loadouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  // Guardian class: titan, hunter, warlock
  guardianClass: mysqlEnum("guardianClass", ["titan", "hunter", "warlock"]).notNull(),
  // Primary weapon: auto_rifle, hand_cannon, pulse_rifle, rocket_launcher
  primaryWeapon: mysqlEnum("primaryWeapon", ["auto_rifle", "hand_cannon", "pulse_rifle", "rocket_launcher"]).notNull(),
  // Icon/color theme for the loadout
  iconColor: varchar("iconColor", { length: 32 }).default("#00d4aa"),
  // Is this the default loadout for this user?
  isDefault: boolean("isDefault").default(false).notNull(),
  // Slot number (1-5) for quick switching
  slotNumber: int("slotNumber"),
  // Usage stats
  timesUsed: int("timesUsed").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GuardianLoadout = typeof guardianLoadouts.$inferSelect;
export type InsertGuardianLoadout = typeof guardianLoadouts.$inferInsert;
