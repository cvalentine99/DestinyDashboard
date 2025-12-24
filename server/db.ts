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
  notificationPrefs, InsertNotificationPref
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
