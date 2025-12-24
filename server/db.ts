import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  extrahopConfig, InsertExtrahopConfig, ExtrahopConfig,
  networkDevices, InsertNetworkDevice, NetworkDevice,
  networkAlerts, InsertNetworkAlert, NetworkAlert,
  networkMetrics, InsertNetworkMetric,
  activityMaps, InsertActivityMap,
  loreEntries, InsertLoreEntry, LoreEntry,
  chatHistory, InsertChatHistory,
  gameScores, InsertGameScore,
  notificationPrefs, InsertNotificationPref,
  crucibleDevices, InsertCrucibleDevice, CrucibleDevice,
  crucibleMatches, InsertCrucibleMatch, CrucibleMatch,
  crucibleMetrics, InsertCrucibleMetric, CrucibleMetric,
  cruciblePeers, InsertCruciblePeer, CruciblePeer,
  crucibleEvents, InsertCrucibleEvent, CrucibleEvent,
  bungieServers, InsertBungieServer, BungieServer,
  bungieConfig, InsertBungieConfig, BungieConfig,
  bungieMatches, InsertBungieMatch, BungieMatch,
  matchCorrelations, InsertMatchCorrelation, MatchCorrelation,
  userAchievements, InsertUserAchievement, UserAchievement,
  userTriumphStats, InsertUserTriumphStats, UserTriumphStats,
  achievementNotifications, InsertAchievementNotification, AchievementNotification,
  guardianLoadouts, InsertGuardianLoadout, GuardianLoadout
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User operations
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ExtraHop Config operations
export async function createExtrahopConfig(config: InsertExtrahopConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(extrahopConfig).values(config);
  return result;
}

export async function getExtrahopConfigByUser(userId: number): Promise<ExtrahopConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(extrahopConfig)
    .where(and(eq(extrahopConfig.userId, userId), eq(extrahopConfig.isActive, true)))
    .limit(1);
  return result[0];
}

export async function updateExtrahopConfig(id: number, updates: Partial<InsertExtrahopConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(extrahopConfig).set(updates).where(eq(extrahopConfig.id, id));
}

// Network Device operations
export async function upsertNetworkDevice(device: InsertNetworkDevice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (device.extrahopId) {
    const existing = await db.select().from(networkDevices)
      .where(eq(networkDevices.extrahopId, device.extrahopId)).limit(1);
    
    if (existing.length > 0) {
      await db.update(networkDevices).set(device).where(eq(networkDevices.id, existing[0].id));
      return existing[0].id;
    }
  }
  
  const result = await db.insert(networkDevices).values(device);
  return result[0].insertId;
}

export async function getNetworkDevices(configId: number, limit = 100): Promise<NetworkDevice[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(networkDevices)
    .where(eq(networkDevices.configId, configId))
    .orderBy(desc(networkDevices.updatedAt))
    .limit(limit);
}

export async function getActiveDeviceCount(configId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(networkDevices)
    .where(and(eq(networkDevices.configId, configId), eq(networkDevices.isActive, true)));
  return result[0]?.count || 0;
}

// Network Alert operations
export async function createNetworkAlert(alert: InsertNetworkAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(networkAlerts).values(alert);
  return result[0].insertId;
}

export async function getNetworkAlerts(configId: number, options?: {
  severity?: string;
  acknowledged?: boolean;
  limit?: number;
  from?: Date;
  until?: Date;
}): Promise<NetworkAlert[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(networkAlerts.configId, configId)];
  
  if (options?.severity) {
    conditions.push(eq(networkAlerts.severity, options.severity as any));
  }
  if (options?.acknowledged !== undefined) {
    conditions.push(eq(networkAlerts.isAcknowledged, options.acknowledged));
  }
  if (options?.from) {
    conditions.push(gte(networkAlerts.detectedAt, options.from));
  }
  if (options?.until) {
    conditions.push(lte(networkAlerts.detectedAt, options.until));
  }
  
  return db.select().from(networkAlerts)
    .where(and(...conditions))
    .orderBy(desc(networkAlerts.detectedAt))
    .limit(options?.limit || 50);
}

export async function acknowledgeAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(networkAlerts).set({
    isAcknowledged: true,
    acknowledgedBy: userId,
    acknowledgedAt: new Date(),
  }).where(eq(networkAlerts.id, alertId));
}

export async function getAlertCounts(configId: number) {
  const db = await getDb();
  if (!db) return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  
  const result = await db.select({
    severity: networkAlerts.severity,
    count: sql<number>`count(*)`,
  }).from(networkAlerts)
    .where(and(eq(networkAlerts.configId, configId), eq(networkAlerts.isAcknowledged, false)))
    .groupBy(networkAlerts.severity);
  
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  result.forEach(r => {
    counts[r.severity as keyof typeof counts] = r.count;
  });
  return counts;
}

// Network Metrics operations
export async function createNetworkMetric(metric: InsertNetworkMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(networkMetrics).values(metric);
}

export async function getLatestMetrics(configId: number, metricType?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(networkMetrics.configId, configId)];
  if (metricType) {
    conditions.push(eq(networkMetrics.metricType, metricType));
  }
  
  return db.select().from(networkMetrics)
    .where(and(...conditions))
    .orderBy(desc(networkMetrics.timestamp))
    .limit(100);
}

// Activity Map operations
export async function upsertActivityMap(map: InsertActivityMap) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (map.extrahopId) {
    const existing = await db.select().from(activityMaps)
      .where(eq(activityMaps.extrahopId, map.extrahopId)).limit(1);
    
    if (existing.length > 0) {
      await db.update(activityMaps).set(map).where(eq(activityMaps.id, existing[0].id));
      return existing[0].id;
    }
  }
  
  const result = await db.insert(activityMaps).values(map);
  return result[0].insertId;
}

export async function getActivityMaps(configId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityMaps)
    .where(eq(activityMaps.configId, configId))
    .orderBy(desc(activityMaps.updatedAt));
}

// Lore Entry operations
export async function createLoreEntry(entry: InsertLoreEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(loreEntries).values(entry);
  return result[0].insertId;
}

export async function searchLoreEntries(query: string, category?: string, limit = 10): Promise<LoreEntry[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [sql`MATCH(${loreEntries.content}) AGAINST(${query} IN NATURAL LANGUAGE MODE)`];
  if (category) {
    conditions.push(eq(loreEntries.category, category));
  }
  
  // Fallback to LIKE if fulltext not available
  try {
    return await db.select().from(loreEntries)
      .where(and(...conditions))
      .limit(limit);
  } catch {
    const likeConditions = [sql`${loreEntries.content} LIKE ${`%${query}%`}`];
    if (category) {
      likeConditions.push(eq(loreEntries.category, category));
    }
    return db.select().from(loreEntries)
      .where(and(...likeConditions))
      .limit(limit);
  }
}

export async function getLoreCategories(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.selectDistinct({ category: loreEntries.category }).from(loreEntries);
  return result.map(r => r.category);
}

export async function getLoreByCategory(category: string, limit = 50): Promise<LoreEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loreEntries)
    .where(eq(loreEntries.category, category))
    .limit(limit);
}

// Chat History operations
export async function createChatMessage(message: InsertChatHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatHistory).values(message);
}

export async function getChatHistory(userId: number, sessionId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatHistory)
    .where(and(eq(chatHistory.userId, userId), eq(chatHistory.sessionId, sessionId)))
    .orderBy(desc(chatHistory.createdAt))
    .limit(limit);
}

// Game Score operations
export async function createGameScore(score: InsertGameScore) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gameScores).values(score);
}

export async function getTopScores(gameType: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    score: gameScores.score,
    level: gameScores.level,
    userId: gameScores.userId,
    userName: users.name,
    createdAt: gameScores.createdAt,
  }).from(gameScores)
    .leftJoin(users, eq(gameScores.userId, users.id))
    .where(eq(gameScores.gameType, gameType))
    .orderBy(desc(gameScores.score))
    .limit(limit);
}

export async function getUserHighScore(userId: number, gameType: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(gameScores)
    .where(and(eq(gameScores.userId, userId), eq(gameScores.gameType, gameType)))
    .orderBy(desc(gameScores.score))
    .limit(1);
  return result[0] || null;
}

// Notification Preferences operations
export async function getNotificationPrefs(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function upsertNotificationPrefs(prefs: InsertNotificationPref) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(notificationPrefs)
    .where(eq(notificationPrefs.userId, prefs.userId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(notificationPrefs).set(prefs).where(eq(notificationPrefs.id, existing[0].id));
  } else {
    await db.insert(notificationPrefs).values(prefs);
  }
}


// ============================================
// Crucible Operations Center - Database Functions
// ============================================

// Crucible Device operations
export async function createCrucibleDevice(device: InsertCrucibleDevice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(crucibleDevices).values(device);
  return result[0].insertId;
}

export async function getCrucibleDevices(userId: number): Promise<CrucibleDevice[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crucibleDevices)
    .where(eq(crucibleDevices.userId, userId))
    .orderBy(desc(crucibleDevices.updatedAt));
}

export async function getCrucibleDeviceById(id: number): Promise<CrucibleDevice | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(crucibleDevices)
    .where(eq(crucibleDevices.id, id))
    .limit(1);
  return result[0] || null;
}

export async function updateCrucibleDevice(id: number, updates: Partial<InsertCrucibleDevice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(crucibleDevices).set(updates).where(eq(crucibleDevices.id, id));
}

export async function deleteCrucibleDevice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(crucibleDevices).where(eq(crucibleDevices.id, id));
}

// Crucible Match operations
export async function createCrucibleMatch(match: InsertCrucibleMatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(crucibleMatches).values(match);
  return result[0].insertId;
}

export async function getCrucibleMatches(userId: number, limit = 20): Promise<CrucibleMatch[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crucibleMatches)
    .where(eq(crucibleMatches.userId, userId))
    .orderBy(desc(crucibleMatches.startTime))
    .limit(limit);
}

export async function getCrucibleMatchById(id: number): Promise<CrucibleMatch | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(crucibleMatches)
    .where(eq(crucibleMatches.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getActiveMatch(deviceId: number): Promise<CrucibleMatch | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(crucibleMatches)
    .where(and(
      eq(crucibleMatches.deviceId, deviceId),
      sql`${crucibleMatches.endTime} IS NULL`
    ))
    .orderBy(desc(crucibleMatches.startTime))
    .limit(1);
  return result[0] || null;
}

export async function updateCrucibleMatch(id: number, updates: Partial<InsertCrucibleMatch>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(crucibleMatches).set(updates).where(eq(crucibleMatches.id, id));
}

// Crucible Metrics operations (high-frequency samples)
export async function createCrucibleMetric(metric: InsertCrucibleMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(crucibleMetrics).values(metric);
}

export async function createCrucibleMetricsBatch(metrics: InsertCrucibleMetric[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (metrics.length === 0) return;
  await db.insert(crucibleMetrics).values(metrics);
}

export async function getMatchMetrics(matchId: number): Promise<CrucibleMetric[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crucibleMetrics)
    .where(eq(crucibleMetrics.matchId, matchId))
    .orderBy(crucibleMetrics.timestampNs);
}

export async function getRecentMetrics(matchId: number, limit = 60): Promise<CrucibleMetric[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crucibleMetrics)
    .where(eq(crucibleMetrics.matchId, matchId))
    .orderBy(desc(crucibleMetrics.timestampNs))
    .limit(limit);
}

// Crucible Peer operations
export async function createCruciblePeer(peer: InsertCruciblePeer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cruciblePeers).values(peer);
  return result[0].insertId;
}

export async function getMatchPeers(matchId: number): Promise<CruciblePeer[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cruciblePeers)
    .where(eq(cruciblePeers.matchId, matchId))
    .orderBy(cruciblePeers.connectionStartTime);
}

export async function updateCruciblePeer(id: number, updates: Partial<InsertCruciblePeer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cruciblePeers).set(updates).where(eq(cruciblePeers.id, id));
}

export async function getPeerByIp(matchId: number, peerIp: string): Promise<CruciblePeer | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(cruciblePeers)
    .where(and(eq(cruciblePeers.matchId, matchId), eq(cruciblePeers.peerIp, peerIp)))
    .limit(1);
  return result[0] || null;
}

// Crucible Event operations
export async function createCrucibleEvent(event: InsertCrucibleEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(crucibleEvents).values(event);
  return result[0].insertId;
}

export async function getMatchEvents(matchId: number): Promise<CrucibleEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crucibleEvents)
    .where(eq(crucibleEvents.matchId, matchId))
    .orderBy(crucibleEvents.timestampNs);
}

export async function getRecentEvents(matchId: number, limit = 20): Promise<CrucibleEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crucibleEvents)
    .where(eq(crucibleEvents.matchId, matchId))
    .orderBy(desc(crucibleEvents.timestampNs))
    .limit(limit);
}

export async function getEventsByType(matchId: number, eventType: string): Promise<CrucibleEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crucibleEvents)
    .where(and(
      eq(crucibleEvents.matchId, matchId),
      sql`${crucibleEvents.eventType} = ${eventType}`
    ))
    .orderBy(crucibleEvents.timestampNs);
}

// Bungie Server operations
export async function upsertBungieServer(server: InsertBungieServer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(bungieServers)
    .where(eq(bungieServers.ipAddress, server.ipAddress))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(bungieServers)
      .set({ ...server, lastSeen: new Date() })
      .where(eq(bungieServers.id, existing[0].id));
    return existing[0].id;
  }
  
  const result = await db.insert(bungieServers).values(server);
  return result[0].insertId;
}

export async function getBungieServers(): Promise<BungieServer[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bungieServers)
    .where(eq(bungieServers.isActive, true))
    .orderBy(desc(bungieServers.lastSeen));
}

export async function isBungieServerIp(ip: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(bungieServers)
    .where(eq(bungieServers.ipAddress, ip))
    .limit(1);
  return result.length > 0;
}

// Match statistics aggregation
export async function getMatchStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalMatches: 0, avgLatency: 0, avgPacketLoss: 0, victories: 0, defeats: 0 };
  
  const result = await db.select({
    totalMatches: sql<number>`COUNT(*)`,
    avgLatency: sql<number>`AVG(${crucibleMatches.avgLatencyMs})`,
    avgPacketLoss: sql<number>`AVG(${crucibleMatches.packetLossPercent})`,
    victories: sql<number>`SUM(CASE WHEN ${crucibleMatches.result} = 'victory' THEN 1 ELSE 0 END)`,
    defeats: sql<number>`SUM(CASE WHEN ${crucibleMatches.result} = 'defeat' THEN 1 ELSE 0 END)`,
  }).from(crucibleMatches)
    .where(eq(crucibleMatches.userId, userId));
  
  return result[0] || { totalMatches: 0, avgLatency: 0, avgPacketLoss: 0, victories: 0, defeats: 0 };
}

// Get lag spike count for a match
export async function getLagSpikeCount(matchId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(crucibleEvents)
    .where(and(
      eq(crucibleEvents.matchId, matchId),
      sql`${crucibleEvents.eventType} = 'lag_spike'`
    ));
  
  return result[0]?.count || 0;
}


// ==========================================
// Bungie API Operations
// ==========================================

// Save or update Bungie API configuration
export async function saveBungieConfig(config: InsertBungieConfig): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if config exists for user
  const existing = await db.select().from(bungieConfig)
    .where(eq(bungieConfig.userId, config.userId))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(bungieConfig)
      .set({
        apiKey: config.apiKey,
        bungieName: config.bungieName,
        membershipType: config.membershipType,
        membershipId: config.membershipId,
        primaryCharacterId: config.primaryCharacterId,
        characterClass: config.characterClass,
        lightLevel: config.lightLevel,
        autoSync: config.autoSync,
        lastSyncAt: config.lastSyncAt,
      })
      .where(eq(bungieConfig.userId, config.userId));
  } else {
    await db.insert(bungieConfig).values(config);
  }
}

// Get Bungie config for a user
export async function getBungieConfigByUser(userId: number): Promise<BungieConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bungieConfig)
    .where(eq(bungieConfig.userId, userId))
    .limit(1);
  
  return result[0];
}

// Update last sync time
export async function updateBungieConfigLastSync(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(bungieConfig)
    .set({ lastSyncAt: new Date() })
    .where(eq(bungieConfig.userId, userId));
}

// Save Bungie match data
export async function saveBungieMatch(match: InsertBungieMatch): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Upsert by activityId
  const existing = await db.select().from(bungieMatches)
    .where(eq(bungieMatches.activityId, match.activityId))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(bungieMatches)
      .set(match)
      .where(eq(bungieMatches.activityId, match.activityId));
  } else {
    await db.insert(bungieMatches).values(match);
  }
}

// Get Bungie matches for a user
export async function getBungieMatches(userId: number, limit: number = 25, offset: number = 0): Promise<BungieMatch[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(bungieMatches)
    .where(eq(bungieMatches.userId, userId))
    .orderBy(desc(bungieMatches.period))
    .limit(limit)
    .offset(offset);
}

// Get Bungie match by activity ID
export async function getBungieMatchByActivityId(activityId: string): Promise<BungieMatch | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bungieMatches)
    .where(eq(bungieMatches.activityId, activityId))
    .limit(1);
  
  return result[0];
}

// Save match correlation
export async function saveMatchCorrelation(correlation: InsertMatchCorrelation): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(matchCorrelations).values(correlation);
}

// Get match correlation by Bungie match ID
export async function getMatchCorrelationByBungieMatch(bungieMatchId: number): Promise<MatchCorrelation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(matchCorrelations)
    .where(eq(matchCorrelations.bungieMatchId, bungieMatchId))
    .limit(1);
  
  return result[0];
}

// Get all correlations for a user
export async function getMatchCorrelations(userId: number, limit: number = 25): Promise<MatchCorrelation[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(matchCorrelations)
    .where(eq(matchCorrelations.userId, userId))
    .orderBy(desc(matchCorrelations.createdAt))
    .limit(limit);
}

// Get aggregated performance insights
export async function getPerformanceInsights(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get matches with correlations
  const correlations = await db.select().from(matchCorrelations)
    .where(eq(matchCorrelations.userId, userId));
  
  if (correlations.length === 0) return null;
  
  // Calculate averages
  let totalKd = 0;
  let highLatencyKd = 0;
  let lowLatencyKd = 0;
  let highLatencyCount = 0;
  let lowLatencyCount = 0;
  
  for (const c of correlations) {
    const avgLatency = parseFloat(c.avgLatencyMs || '0');
    // We need to join with bungieMatches to get K/D
  }
  
  return {
    totalMatches: correlations.length,
    avgLatency: correlations.reduce((sum, c) => sum + parseFloat(c.avgLatencyMs || '0'), 0) / correlations.length,
    avgJitter: correlations.reduce((sum, c) => sum + parseFloat(c.avgJitterMs || '0'), 0) / correlations.length,
    avgPacketLoss: correlations.reduce((sum, c) => sum + parseFloat(c.packetLossPercent || '0'), 0) / correlations.length,
    positiveImpactCount: correlations.filter(c => c.performanceImpact === 'positive').length,
    neutralImpactCount: correlations.filter(c => c.performanceImpact === 'neutral').length,
    negativeImpactCount: correlations.filter(c => c.performanceImpact === 'negative').length,
  };
}

// ============================================================================
// ACHIEVEMENTS DATABASE OPERATIONS
// ============================================================================

// Get or create user triumph stats
export async function getOrCreateTriumphStats(userId: number): Promise<UserTriumphStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(userTriumphStats)
    .where(eq(userTriumphStats.userId, userId)).limit(1);
  
  if (existing.length > 0) return existing[0];

  // Create new stats record
  await db.insert(userTriumphStats).values({ userId });
  const created = await db.select().from(userTriumphStats)
    .where(eq(userTriumphStats.userId, userId)).limit(1);
  return created[0];
}

// Update triumph stats after a game
export async function updateTriumphStats(
  userId: number, 
  updates: Partial<InsertUserTriumphStats>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await getOrCreateTriumphStats(userId); // Ensure record exists
  await db.update(userTriumphStats)
    .set(updates)
    .where(eq(userTriumphStats.userId, userId));
}

// Increment specific stat counters
export async function incrementTriumphStat(
  userId: number,
  statKey: string,
  amount: number = 1
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await getOrCreateTriumphStats(userId);
  
  // Use raw SQL for atomic increment
  await db.execute(sql`
    UPDATE user_triumph_stats 
    SET ${sql.identifier(statKey)} = ${sql.identifier(statKey)} + ${amount}
    WHERE userId = ${userId}
  `);
}

// Get user's achievement progress
export async function getUserAchievements(userId: number): Promise<UserAchievement[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(userAchievements)
    .where(eq(userAchievements.oderId, userId));
}

// Get or create achievement progress
export async function getOrCreateAchievementProgress(
  userId: number,
  achievementId: string
): Promise<UserAchievement> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(userAchievements)
    .where(and(
      eq(userAchievements.oderId, userId),
      eq(userAchievements.achievementId, achievementId)
    )).limit(1);
  
  if (existing.length > 0) return existing[0];

  await db.insert(userAchievements).values({
    oderId: userId,
    achievementId,
    currentValue: 0,
    isCompleted: false,
  });

  const created = await db.select().from(userAchievements)
    .where(and(
      eq(userAchievements.oderId, userId),
      eq(userAchievements.achievementId, achievementId)
    )).limit(1);
  return created[0];
}

// Update achievement progress
export async function updateAchievementProgress(
  userId: number,
  achievementId: string,
  currentValue: number,
  isCompleted: boolean = false
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await getOrCreateAchievementProgress(userId, achievementId);
  
  const updateData: Partial<InsertUserAchievement> = {
    currentValue,
    isCompleted,
  };
  
  if (isCompleted) {
    updateData.completedAt = new Date();
  }

  await db.update(userAchievements)
    .set(updateData)
    .where(and(
      eq(userAchievements.oderId, userId),
      eq(userAchievements.achievementId, achievementId)
    ));
}

// Mark achievement as completed
export async function completeAchievement(
  userId: number,
  achievementId: string,
  triumphPoints: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update achievement
  await db.update(userAchievements)
    .set({
      isCompleted: true,
      completedAt: new Date(),
    })
    .where(and(
      eq(userAchievements.oderId, userId),
      eq(userAchievements.achievementId, achievementId)
    ));

  // Add triumph points
  await db.execute(sql`
    UPDATE user_triumph_stats 
    SET totalTriumphPoints = totalTriumphPoints + ${triumphPoints}
    WHERE userId = ${userId}
  `);

  // Create notification
  await db.insert(achievementNotifications).values({
    oderId: userId,
    achievementId,
    shown: false,
  });
}

// Get pending achievement notifications
export async function getPendingAchievementNotifications(
  userId: number
): Promise<AchievementNotification[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(achievementNotifications)
    .where(and(
      eq(achievementNotifications.oderId, userId),
      eq(achievementNotifications.shown, false)
    ))
    .orderBy(achievementNotifications.createdAt);
}

// Mark notification as shown
export async function markNotificationShown(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(achievementNotifications)
    .set({ shown: true })
    .where(eq(achievementNotifications.id, notificationId));
}

// Get completed achievements count
export async function getCompletedAchievementsCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(userAchievements)
    .where(and(
      eq(userAchievements.oderId, userId),
      eq(userAchievements.isCompleted, true)
    ));
  
  return result[0]?.count || 0;
}

// Add title to user
export async function addTitleToUser(userId: number, title: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const stats = await getOrCreateTriumphStats(userId);
  const currentTitles = (stats.titlesEarned as string[]) || [];
  
  if (!currentTitles.includes(title)) {
    await db.update(userTriumphStats)
      .set({ titlesEarned: [...currentTitles, title] })
      .where(eq(userTriumphStats.userId, userId));
  }
}


// ============================================================================
// LOADOUT OPERATIONS
// ============================================================================

export async function createLoadout(loadout: InsertGuardianLoadout): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(guardianLoadouts).values(loadout);
  return result[0].insertId;
}

export async function getUserLoadouts(userId: number): Promise<GuardianLoadout[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(guardianLoadouts)
    .where(eq(guardianLoadouts.userId, userId))
    .orderBy(guardianLoadouts.slotNumber);
}

export async function getLoadoutById(id: number): Promise<GuardianLoadout | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(guardianLoadouts)
    .where(eq(guardianLoadouts.id, id))
    .limit(1);
  return result[0];
}

export async function getDefaultLoadout(userId: number): Promise<GuardianLoadout | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(guardianLoadouts)
    .where(and(
      eq(guardianLoadouts.userId, userId),
      eq(guardianLoadouts.isDefault, true)
    ))
    .limit(1);
  return result[0];
}

export async function updateLoadout(id: number, updates: Partial<InsertGuardianLoadout>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(guardianLoadouts)
    .set(updates)
    .where(eq(guardianLoadouts.id, id));
}

export async function deleteLoadout(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(guardianLoadouts).where(eq(guardianLoadouts.id, id));
}

export async function setDefaultLoadout(userId: number, loadoutId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Clear existing default
  await db.update(guardianLoadouts)
    .set({ isDefault: false })
    .where(eq(guardianLoadouts.userId, userId));
  
  // Set new default
  await db.update(guardianLoadouts)
    .set({ isDefault: true })
    .where(and(
      eq(guardianLoadouts.id, loadoutId),
      eq(guardianLoadouts.userId, userId)
    ));
}

export async function incrementLoadoutUsage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const loadout = await getLoadoutById(id);
  if (loadout) {
    await db.update(guardianLoadouts)
      .set({ 
        timesUsed: (loadout.timesUsed || 0) + 1,
        lastUsedAt: new Date()
      })
      .where(eq(guardianLoadouts.id, id));
  }
}

export async function assignLoadoutSlot(loadoutId: number, slotNumber: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Clear any existing loadout in this slot for this user
  await db.update(guardianLoadouts)
    .set({ slotNumber: null })
    .where(and(
      eq(guardianLoadouts.userId, userId),
      eq(guardianLoadouts.slotNumber, slotNumber)
    ));
  
  // Assign the slot to the new loadout
  await db.update(guardianLoadouts)
    .set({ slotNumber })
    .where(and(
      eq(guardianLoadouts.id, loadoutId),
      eq(guardianLoadouts.userId, userId)
    ));
}
