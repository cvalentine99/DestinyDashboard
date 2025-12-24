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
  bungieServers, InsertBungieServer, BungieServer
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
