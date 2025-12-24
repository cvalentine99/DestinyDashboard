import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  ExtrahopClient, 
  toDestinyDevice, 
  toDestinyAlert, 
  destinyTerminology 
} from "./extrahop";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { searchLore, destinyLore, loreCategories } from "./lore-data";
import * as crucible from "./crucible";
import { BungieClient, MembershipType, DestinyActivityModeType, analyzeNetworkMatchCorrelation } from "./bungie";

// ExtraHop router for network monitoring
const extrahopRouter = router({
  // Save ExtraHop configuration
  saveConfig: protectedProcedure
    .input(z.object({
      apiUrl: z.string().url(),
      apiKey: z.string().min(1),
      applianceName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existingConfig = await db.getExtrahopConfigByUser(ctx.user.id);
      
      if (existingConfig) {
        await db.updateExtrahopConfig(existingConfig.id, {
          apiUrl: input.apiUrl,
          apiKey: input.apiKey,
          applianceName: input.applianceName,
        });
        return { success: true, configId: existingConfig.id };
      }
      
      await db.createExtrahopConfig({
        userId: ctx.user.id,
        apiUrl: input.apiUrl,
        apiKey: input.apiKey,
        applianceName: input.applianceName,
      });
      return { success: true };
    }),

  // Get user's ExtraHop config
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const config = await db.getExtrahopConfigByUser(ctx.user.id);
    if (!config) return null;
    return {
      id: config.id,
      apiUrl: config.apiUrl,
      applianceName: config.applianceName,
      isActive: config.isActive,
    };
  }),

  // Test ExtraHop connection
  testConnection: protectedProcedure
    .input(z.object({
      apiUrl: z.string().url(),
      apiKey: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        const client = new ExtrahopClient(input);
        const info = await client.getApplianceInfo();
        return { success: true, appliance: info };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  // Get devices (Guardians)
  getDevices: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        const devices = await client.getDevices({ limit: input?.limit || 50 });
        
        // Convert to Destiny terminology
        return devices.map(toDestinyDevice);
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // Search devices by name pattern using /devices/search API
  searchDevices: protectedProcedure
    .input(z.object({ namePattern: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        const devices = await client.searchDevices({
          filter: {
            field: "name",
            operand: input.namePattern,
            operator: "~",
          },
          limit: 50,
        });
        return devices;
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // Get alerts (Threat Detections)
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    const config = await db.getExtrahopConfigByUser(ctx.user.id);
    if (!config) {
      throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
    }

    try {
      const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
      const alerts = await client.getAlerts();
      return alerts.map(toDestinyAlert);
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  // Get detections
  getDetections: protectedProcedure
    .input(z.object({
      from: z.number().optional(),
      until: z.number().optional(),
      limit: z.number().optional().default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        const now = Date.now();
        const result = await client.searchDetections({
          from: input?.from || now - 24 * 60 * 60 * 1000, // Last 24 hours
          until: input?.until || now,
          limit: input?.limit || 50,
        });
        return result.detections;
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // Get network topology
  getTopology: protectedProcedure
    .input(z.object({
      deviceId: z.number().optional(),
      from: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        const now = Date.now();
        
        const topology = await client.queryTopology({
          from: input?.from || now - 60 * 60 * 1000, // Last hour
          walks: [{
            origins: [{ 
              object_type: input?.deviceId ? "device" : "all_devices", 
              object_id: input?.deviceId || 0 
            }],
            steps: [{ relationships: [{ role: "any" }] }],
          }],
          weighting: "bytes",
          edge_annotations: ["protocols"],
        });
        
        return topology;
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // Get metrics
  getMetrics: protectedProcedure
    .input(z.object({
      metricCategory: z.string().default("net"),
      metricName: z.string().default("bytes_in"),
      cycle: z.enum(["auto", "1sec", "30sec", "5min", "1hr", "24hr"]).default("5min"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        const now = Date.now();
        
        const metrics = await client.queryMetrics({
          cycle: input?.cycle || "5min",
          from: now - 60 * 60 * 1000, // Last hour
          until: 0,
          metric_category: input?.metricCategory || "net",
          metric_specs: [{ name: input?.metricName || "bytes_in" }],
          object_type: "network",
          object_ids: [0], // All networks
        });
        
        return metrics;
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // Get dashboard summary
  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const config = await db.getExtrahopConfigByUser(ctx.user.id);
    
    // Return demo data if no config
    if (!config) {
      return {
        configured: false,
        guardians: {
          total: 247,
          active: 189,
          idle: 42,
          offline: 16,
        },
        threats: {
          critical: 2,
          high: 7,
          medium: 23,
          low: 45,
        },
        lightStream: {
          inbound: "1.24 TB",
          outbound: "892 GB",
          peak: "2.1 Gbps",
        },
        powerLevel: 1847,
        recentActivity: [
          { type: "alert", message: "Darkness Incursion detected on subnet 10.0.1.0/24", time: "2 min ago", severity: "high" },
          { type: "device", message: "New Guardian joined: TITAN-SERVER-01", time: "5 min ago", severity: "info" },
          { type: "metric", message: "Light Stream surge: +45% bandwidth utilization", time: "12 min ago", severity: "medium" },
        ],
      };
    }

    try {
      const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
      const [devices, alerts] = await Promise.all([
        client.getDevices({ limit: 1000 }),
        client.getAlerts(),
      ]);

      const activeDevices = devices.filter(d => (d.analysis_level || 0) > 0);
      const alertCounts = { critical: 0, high: 0, medium: 0, low: 0 };
      alerts.forEach(a => {
        if (a.severity >= 4) alertCounts.critical++;
        else if (a.severity >= 3) alertCounts.high++;
        else if (a.severity >= 2) alertCounts.medium++;
        else alertCounts.low++;
      });

      return {
        configured: true,
        guardians: {
          total: devices.length,
          active: activeDevices.length,
          idle: devices.length - activeDevices.length,
          offline: 0,
        },
        threats: alertCounts,
        lightStream: {
          inbound: "Calculating...",
          outbound: "Calculating...",
          peak: "Calculating...",
        },
        powerLevel: Math.floor(1800 + Math.random() * 100),
        recentActivity: alerts.slice(0, 5).map(a => ({
          type: "alert",
          message: a.name,
          time: new Date(a.mod_time).toLocaleTimeString(),
          severity: a.severity >= 3 ? "high" : a.severity >= 2 ? "medium" : "low",
        })),
      };
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  // Get terminology mapping
  getTerminology: publicProcedure.query(() => destinyTerminology),
});

// Lore chatbot router
const loreRouter = router({
  // Chat with the lore bot
  chat: protectedProcedure
    .input(z.object({
      message: z.string().min(1),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const sessionId = input.sessionId || nanoid();
      
      // Save user message
      await db.createChatMessage({
        userId: ctx.user.id,
        sessionId,
        role: "user",
        content: input.message,
      });

      // Get chat history for context
      const history = await db.getChatHistory(ctx.user.id, sessionId, 10);
      
      // Search for relevant lore using the comprehensive lore database
      const loreResults = searchLore(input.message, 5);
      
      // Build context from lore
      const loreContext = loreResults.length > 0
        ? `Relevant Destiny 2 Lore:\n${loreResults.map(l => `[${l.category}] ${l.title}: ${l.content.substring(0, 500)}...`).join('\n\n')}`
        : "";

      // Build messages for LLM
      const messages = [
        {
          role: "system" as const,
          content: `You are a Ghost, the AI companion of Guardians in Destiny 2. You have extensive knowledge of Destiny and Destiny 2 lore, including the Books of Sorrow, the history of the Traveler, the Darkness, the Vanguard, and all major characters and events.

Your personality:
- Helpful and knowledgeable, like a wise companion
- Occasionally make references to in-game events and characters
- Use Destiny terminology naturally (Guardians, Light, Darkness, Traveler, etc.)
- Be enthusiastic about sharing lore knowledge
- If you don't know something, admit it but offer to explore related topics

${loreContext}

Respond to the Guardian's question about Destiny lore.`,
        },
        ...history.reverse().map(h => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      try {
        const response = await invokeLLM({ messages });
        const messageContent = response.choices[0]?.message?.content;
        const assistantMessage = typeof messageContent === 'string' ? messageContent : "I'm having trouble accessing my memory banks, Guardian. Please try again.";

        // Save assistant response
        await db.createChatMessage({
          userId: ctx.user.id,
          sessionId,
          role: "assistant",
          content: assistantMessage,
        });

        return {
          message: assistantMessage,
          sessionId,
          sources: loreResults.map(l => ({ title: l.title, category: l.category })),
        };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate response" });
      }
    }),

  // Get chat history
  getHistory: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const history = await db.getChatHistory(ctx.user.id, input.sessionId, 50);
      return history.reverse();
    }),

  // Get lore categories
  getCategories: publicProcedure.query(async () => {
    const categories = await db.getLoreCategories();
    return categories.length > 0 ? categories : [
      "Books of Sorrow",
      "The Nine",
      "Guardians",
      "The Traveler",
      "The Darkness",
      "Vanguard",
      "Fallen Houses",
      "Hive",
      "Cabal",
      "Vex",
      "Taken",
      "Awoken",
      "Exo",
      "Golden Age",
      "The Collapse",
    ];
  }),

  // Search lore
  searchLore: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      category: z.string().optional(),
      limit: z.number().optional().default(10),
    }))
    .query(({ input }) => {
      return searchLore(input.query, input.limit);
    }),

  // Get all lore categories
  getAllCategories: publicProcedure.query(() => loreCategories),

  // Get all lore entries
  getAllLore: publicProcedure.query(() => destinyLore),
});

// Game router for mini-game
const gameRouter = router({
  // Save score
  saveScore: protectedProcedure
    .input(z.object({
      gameType: z.string(),
      score: z.number(),
      level: z.number().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.createGameScore({
        userId: ctx.user.id,
        gameType: input.gameType,
        score: input.score,
        level: input.level,
        metadata: input.metadata,
      });
      return { success: true };
    }),

  // Get leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({
      gameType: z.string(),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      return db.getTopScores(input.gameType, input.limit);
    }),

  // Get user's high score
  getHighScore: protectedProcedure
    .input(z.object({ gameType: z.string() }))
    .query(async ({ ctx, input }) => {
      return db.getUserHighScore(ctx.user.id, input.gameType);
    }),
});

// Notifications router
const notificationsRouter = router({
  // Get preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await db.getNotificationPrefs(ctx.user.id);
    return prefs || {
      alertSeverity: ["critical", "high"],
      pushEnabled: true,
      voiceEnabled: false,
    };
  }),

  // Update preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      alertSeverity: z.array(z.string()).optional(),
      pushEnabled: z.boolean().optional(),
      voiceEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.upsertNotificationPrefs({
        userId: ctx.user.id,
        alertSeverity: input.alertSeverity,
        pushEnabled: input.pushEnabled,
        voiceEnabled: input.voiceEnabled,
      });
      return { success: true };
    }),
});

// Voice interface router
const voiceRouter = router({
  processQuery: protectedProcedure
    .input(z.object({
      audioData: z.string(), // Base64 encoded audio
    }))
    .mutation(async ({ ctx, input }) => {
      // For now, return a simulated response
      // In production, this would use speech-to-text API
      const transcription = "What is the network status?";
      
      // Generate response using LLM
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are Ghost, a helpful AI assistant from Destiny 2. You help Guardians monitor their network using ExtraHop. Respond in character as Ghost - helpful, slightly witty, and knowledgeable. Keep responses brief and actionable.`,
          },
          {
            role: "user",
            content: transcription,
          },
        ],
      });

      const ghostResponse = response.choices?.[0]?.message?.content || 
        "Guardian, I'm having trouble processing that request. Please try again.";

      return {
        transcription,
        response: ghostResponse,
      };
    }),
});

// Crucible Operations Center router
const crucibleRouter = router({
  // Get terminology mappings
  getTerminology: publicProcedure.query(() => {
    return crucible.crucibleTerminology;
  }),

  // Register PS5 device for monitoring
  registerDevice: protectedProcedure
    .input(z.object({
      configId: z.number(),
      extrahopDeviceId: z.number().optional(),
      deviceName: z.string(),
      macAddress: z.string().optional(),
      ipAddress: z.string().optional(),
      platform: z.string().default("PS5"),
    }))
    .mutation(async ({ ctx, input }) => {
      const deviceId = await db.createCrucibleDevice({
        userId: ctx.user.id,
        configId: input.configId,
        extrahopDeviceId: input.extrahopDeviceId,
        deviceName: input.deviceName,
        macAddress: input.macAddress,
        ipAddress: input.ipAddress,
        platform: input.platform,
      });
      return { success: true, deviceId };
    }),

  // Get registered devices
  getDevices: protectedProcedure.query(async ({ ctx }) => {
    return db.getCrucibleDevices(ctx.user.id);
  }),

  // Delete device
  deleteDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCrucibleDevice(input.deviceId);
      return { success: true };
    }),

  // Start monitoring a match
  startMatch: protectedProcedure
    .input(z.object({
      deviceId: z.number(),
      gameMode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check for existing active match
      const activeMatch = await db.getActiveMatch(input.deviceId);
      if (activeMatch) {
        return { success: false, error: "Match already in progress", matchId: activeMatch.id };
      }

      const matchId = await db.createCrucibleMatch({
        userId: ctx.user.id,
        deviceId: input.deviceId,
        matchState: "matchmaking",
        gameMode: input.gameMode,
        startTime: new Date(),
      });

      // Create match start event
      await db.createCrucibleEvent({
        matchId,
        timestampNs: BigInt(Date.now() * 1000000),
        eventType: "match_start",
        severity: "info",
        description: "Match monitoring initiated",
      });

      return { success: true, matchId };
    }),

  // End a match
  endMatch: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      result: z.enum(["victory", "defeat", "mercy", "disconnect", "unknown"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const match = await db.getCrucibleMatchById(input.matchId);
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      const endTime = new Date();
      const durationMs = match.startTime ? endTime.getTime() - match.startTime.getTime() : 0;

      // Get metrics to calculate averages
      const metrics = await db.getMatchMetrics(input.matchId);
      let avgLatency = 0, maxLatency = 0, minLatency = 999999, avgJitter = 0;
      let totalPacketsLost = 0, totalPacketsSent = 0;

      if (metrics.length > 0) {
        const latencies = metrics.filter(m => m.latencyMs).map(m => m.latencyMs!);
        if (latencies.length > 0) {
          avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
          maxLatency = Math.max(...latencies);
          minLatency = Math.min(...latencies);
        }
        const jitters = metrics.filter(m => m.jitterMs).map(m => m.jitterMs!);
        if (jitters.length > 0) {
          avgJitter = Math.round(jitters.reduce((a, b) => a + b, 0) / jitters.length);
        }
        totalPacketsLost = metrics.reduce((sum, m) => sum + Number(m.packetsLost || 0), 0);
        totalPacketsSent = metrics.reduce((sum, m) => sum + Number(m.packetsSent || 0), 0);
      }

      const packetLossPercent = totalPacketsSent > 0 
        ? Math.round((totalPacketsLost / totalPacketsSent) * 10000) 
        : 0;

      // Get peer count
      const peers = await db.getMatchPeers(input.matchId);

      await db.updateCrucibleMatch(input.matchId, {
        matchState: "post_game",
        endTime,
        durationMs: durationMs,
        result: input.result || "unknown",
        avgLatencyMs: avgLatency,
        maxLatencyMs: maxLatency,
        minLatencyMs: minLatency === 999999 ? 0 : minLatency,
        avgJitterMs: avgJitter,
        packetLossPercent,
        peerCount: peers.length,
      });

      // Create match end event
      await db.createCrucibleEvent({
        matchId: input.matchId,
        timestampNs: BigInt(Date.now() * 1000000),
        eventType: "match_end",
        severity: "info",
        description: `Match ended: ${input.result || "unknown"}`,
      });

      return { success: true };
    }),

  // Update match state
  updateMatchState: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      state: z.enum(["orbit", "matchmaking", "loading", "in_match", "post_game", "unknown"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateCrucibleMatch(input.matchId, { matchState: input.state });
      return { success: true };
    }),

  // Record metrics sample
  recordMetrics: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      latencyMs: z.number().optional(),
      jitterMs: z.number().optional(),
      packetsSent: z.number().optional(),
      packetsReceived: z.number().optional(),
      packetsLost: z.number().optional(),
      bytesSent: z.number().optional(),
      bytesReceived: z.number().optional(),
      bungieTrafficBytes: z.number().optional(),
      p2pTrafficBytes: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const timestampNs = BigInt(Date.now() * 1000000);

      await db.createCrucibleMetric({
        matchId: input.matchId,
        timestampNs,
        latencyMs: input.latencyMs,
        jitterMs: input.jitterMs,
        packetsSent: input.packetsSent,
        packetsReceived: input.packetsReceived,
        packetsLost: input.packetsLost,
        bytesSent: input.bytesSent,
        bytesReceived: input.bytesReceived,
        bungieTrafficBytes: input.bungieTrafficBytes,
        p2pTrafficBytes: input.p2pTrafficBytes,
      });

      // Check for lag spike
      if (input.latencyMs) {
        const recentMetrics = await db.getRecentMetrics(input.matchId, 10);
        const avgLatency = recentMetrics.length > 0
          ? recentMetrics.reduce((sum, m) => sum + (m.latencyMs || 0), 0) / recentMetrics.length
          : input.latencyMs;

        const spike = crucible.detectLagSpike(input.latencyMs, avgLatency);
        if (spike.isSpike) {
          await db.createCrucibleEvent({
            matchId: input.matchId,
            timestampNs,
            eventType: "lag_spike",
            severity: spike.severity || "warning",
            description: spike.description,
            latencyMs: input.latencyMs,
          });
        }
      }

      return { success: true };
    }),

  // Record peer connection
  recordPeer: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      peerIp: z.string(),
      peerPort: z.number().optional(),
      avgLatencyMs: z.number().optional(),
      geoCountry: z.string().optional(),
      geoRegion: z.string().optional(),
      geoCity: z.string().optional(),
      isp: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Check if peer already exists
      const existingPeer = await db.getPeerByIp(input.matchId, input.peerIp);
      
      if (existingPeer) {
        await db.updateCruciblePeer(existingPeer.id, {
          avgLatencyMs: input.avgLatencyMs,
        });
        return { success: true, peerId: existingPeer.id, isNew: false };
      }

      const peerId = await db.createCruciblePeer({
        matchId: input.matchId,
        peerIp: input.peerIp,
        peerPort: input.peerPort,
        connectionStartTime: new Date(),
        avgLatencyMs: input.avgLatencyMs,
        geoCountry: input.geoCountry,
        geoRegion: input.geoRegion,
        geoCity: input.geoCity,
        isp: input.isp,
      });

      // Create peer joined event
      await db.createCrucibleEvent({
        matchId: input.matchId,
        timestampNs: BigInt(Date.now() * 1000000),
        eventType: "peer_joined",
        severity: "info",
        description: `Guardian connected from ${input.geoCity || input.geoCountry || "unknown location"}`,
        affectedPeerIp: input.peerIp,
      });

      return { success: true, peerId, isNew: true };
    }),

  // Get active match
  getActiveMatch: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input }) => {
      return db.getActiveMatch(input.deviceId);
    }),

  // Get match history
  getMatchHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return db.getCrucibleMatches(ctx.user.id, input.limit);
    }),

  // Get match details with metrics, peers, and events
  getMatchDetails: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .query(async ({ input }) => {
      const match = await db.getCrucibleMatchById(input.matchId);
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      const [metrics, peers, events, lagSpikeCount] = await Promise.all([
        db.getMatchMetrics(input.matchId),
        db.getMatchPeers(input.matchId),
        db.getMatchEvents(input.matchId),
        db.getLagSpikeCount(input.matchId),
      ]);

      // Generate match summary
      const summary = crucible.generateMatchSummary({
        durationMs: Number(match.durationMs || 0),
        avgLatencyMs: match.avgLatencyMs || 0,
        maxLatencyMs: match.maxLatencyMs || 0,
        packetLossPercent: (match.packetLossPercent || 0) / 100,
        avgJitterMs: match.avgJitterMs || 0,
        peerCount: peers.length,
        lagSpikeCount,
      });

      return {
        match,
        metrics: metrics.map(m => ({
          ...m,
          timestampNs: m.timestampNs.toString(),
          packetsSent: m.packetsSent ? Number(m.packetsSent) : null,
          packetsReceived: m.packetsReceived ? Number(m.packetsReceived) : null,
          packetsLost: m.packetsLost ? Number(m.packetsLost) : null,
          bytesSent: m.bytesSent ? Number(m.bytesSent) : null,
          bytesReceived: m.bytesReceived ? Number(m.bytesReceived) : null,
          bungieTrafficBytes: m.bungieTrafficBytes ? Number(m.bungieTrafficBytes) : null,
          p2pTrafficBytes: m.p2pTrafficBytes ? Number(m.p2pTrafficBytes) : null,
        })),
        peers: peers.map(p => ({
          ...p,
          packetsSent: p.packetsSent ? Number(p.packetsSent) : null,
          packetsReceived: p.packetsReceived ? Number(p.packetsReceived) : null,
          bytesSent: p.bytesSent ? Number(p.bytesSent) : null,
          bytesReceived: p.bytesReceived ? Number(p.bytesReceived) : null,
        })),
        events: events.map(e => ({
          ...e,
          timestampNs: e.timestampNs.toString(),
        })),
        summary,
      };
    }),

  // Get real-time metrics for active match
  getLiveMetrics: protectedProcedure
    .input(z.object({ matchId: z.number(), limit: z.number().default(60) }))
    .query(async ({ input }) => {
      const metrics = await db.getRecentMetrics(input.matchId, input.limit);
      const events = await db.getRecentEvents(input.matchId, 10);
      const peers = await db.getMatchPeers(input.matchId);

      // Calculate current connection quality
      const latestMetric = metrics[0];
      let connectionQuality = null;
      if (latestMetric?.latencyMs) {
        const avgLatency = metrics.slice(0, 10).reduce((sum, m) => sum + (m.latencyMs || 0), 0) / Math.min(10, metrics.length);
        const packetLoss = latestMetric.packetsLost && latestMetric.packetsSent
          ? (Number(latestMetric.packetsLost) / Number(latestMetric.packetsSent)) * 100
          : 0;
        connectionQuality = crucible.rateConnectionQuality(
          latestMetric.latencyMs,
          packetLoss,
          latestMetric.jitterMs || 0
        );
      }

      return {
        metrics: metrics.map(m => ({
          ...m,
          timestampNs: m.timestampNs.toString(),
          packetsSent: m.packetsSent ? Number(m.packetsSent) : null,
          packetsReceived: m.packetsReceived ? Number(m.packetsReceived) : null,
          packetsLost: m.packetsLost ? Number(m.packetsLost) : null,
          bytesSent: m.bytesSent ? Number(m.bytesSent) : null,
          bytesReceived: m.bytesReceived ? Number(m.bytesReceived) : null,
        })),
        events: events.map(e => ({
          ...e,
          timestampNs: e.timestampNs.toString(),
        })),
        peers: peers.map(p => ({
          ...p,
          packetsSent: p.packetsSent ? Number(p.packetsSent) : null,
          packetsReceived: p.packetsReceived ? Number(p.packetsReceived) : null,
          bytesSent: p.bytesSent ? Number(p.bytesSent) : null,
          bytesReceived: p.bytesReceived ? Number(p.bytesReceived) : null,
        })),
        connectionQuality,
        peerCount: peers.length,
      };
    }),

  // Get user's overall Crucible stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return db.getMatchStats(ctx.user.id);
  }),

  // Detect match state from current traffic
  detectMatchState: protectedProcedure
    .input(z.object({
      bytesPerSecond: z.number(),
      peerCount: z.number(),
      bungieTrafficPercent: z.number(),
      p2pTrafficPercent: z.number(),
      previousState: z.string().optional(),
    }))
    .query(({ input }) => {
      return crucible.detectMatchState(input);
    }),

  // Rate connection quality
  rateConnection: publicProcedure
    .input(z.object({
      latencyMs: z.number(),
      packetLossPercent: z.number(),
      jitterMs: z.number(),
    }))
    .query(({ input }) => {
      return crucible.rateConnectionQuality(
        input.latencyMs,
        input.packetLossPercent,
        input.jitterMs
      );
    }),

  // ============ REAL-TIME METRICS (1-second polling) ============

  // Get real-time 1-second metrics for a device from ExtraHop
  getRealtimeDeviceMetrics: protectedProcedure
    .input(z.object({
      deviceId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        
        // Get 1-second granularity metrics
        const metrics = await client.queryMetrics({
          cycle: "1sec",
          from: -30000, // Last 30 seconds
          until: 0,
          metric_category: "net",
          object_type: "device",
          object_ids: [input.deviceId],
          metric_specs: [
            { name: "bytes_in" },
            { name: "bytes_out" },
            { name: "pkts_in" },
            { name: "pkts_out" },
            { name: "rto_in" },
            { name: "rto_out" },
          ],
        });

        // Get TCP metrics for latency
        const tcpMetrics = await client.queryMetrics({
          cycle: "1sec",
          from: -30000,
          until: 0,
          metric_category: "tcp",
          object_type: "device",
          object_ids: [input.deviceId],
          metric_specs: [
            { name: "rtt" },
            { name: "retrans_out" },
          ],
        });

        // Parse and combine metrics
        const dataPoints: any[] = [];
        const stats = metrics.stats || [];
        const tcpStats = tcpMetrics.stats || [];

        for (let i = 0; i < stats.length; i++) {
          const netStat = stats[i];
          const tcpStat = tcpStats[i];
          
          if (netStat?.values) {
            const timestamp = netStat.time;
            const bytesIn = netStat.values[0]?.[0] || 0;
            const bytesOut = netStat.values[1]?.[0] || 0;
            const pktsIn = netStat.values[2]?.[0] || 0;
            const pktsOut = netStat.values[3]?.[0] || 0;
            const rtoIn = netStat.values[4]?.[0] || 0;
            const rtoOut = netStat.values[5]?.[0] || 0;
            
            const rtt = tcpStat?.values?.[0]?.[0] || 0;
            const retrans = tcpStat?.values?.[1]?.[0] || 0;

            // Calculate jitter from RTT variance
            const jitter = i > 0 && dataPoints[i-1]?.rtt 
              ? Math.abs(rtt - dataPoints[i-1].rtt) 
              : 0;

            dataPoints.push({
              timestamp,
              bytesIn,
              bytesOut,
              pktsIn,
              pktsOut,
              rtoIn,
              rtoOut,
              latencyMs: rtt,
              jitterMs: jitter,
              retransmits: retrans,
              packetLoss: pktsOut > 0 ? (retrans / pktsOut) * 100 : 0,
            });
          }
        }

        // Calculate current connection quality from latest data
        const latest = dataPoints[dataPoints.length - 1];
        let connectionQuality = null;
        if (latest) {
          connectionQuality = crucible.rateConnectionQuality(
            latest.latencyMs || 0,
            latest.packetLoss || 0,
            latest.jitterMs || 0
          );
        }

        return {
          dataPoints,
          connectionQuality,
          timestamp: Date.now(),
        };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // Get peer connections in real-time
  getRealtimePeers: protectedProcedure
    .input(z.object({
      deviceId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        
        // Get topology to find peers
        const topology = await client.getDeviceTopology(input.deviceId, -60000);
        
        // Get flow records for more detail
        const flows = await client.getDevicePeerRecords(input.deviceId, -60000);

        return {
          peers: topology.nodes.filter(n => n.id !== input.deviceId),
          edges: topology.edges,
          flowCount: flows?.records?.length || 0,
          timestamp: Date.now(),
        };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // ============ PCAP DOWNLOAD ============

  // Download PCAP for a device during a time range with optional BPF filter
  downloadPcap: protectedProcedure
    .input(z.object({
      deviceIp: z.string(),
      fromMs: z.number(),
      untilMs: z.number().optional(),
      limitBytes: z.number().optional().default(100000000), // 100MB default
      bpfFilter: z.string().optional(), // Berkeley Packet Filter expression
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        
        const pcapData = await client.downloadDevicePcap(
          input.deviceIp,
          input.fromMs,
          input.untilMs || 0,
          input.limitBytes,
          input.bpfFilter
        );

        // Convert ArrayBuffer to base64 for transport
        const base64 = Buffer.from(pcapData).toString("base64");
        const filename = `crucible_${input.deviceIp.replace(/\./g, "_")}_${Date.now()}.pcap`;

        return {
          success: true,
          filename,
          data: base64,
          sizeBytes: pcapData.byteLength,
        };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // Download PCAP for a specific match
  downloadMatchPcap: protectedProcedure
    .input(z.object({
      matchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      // Get match details
      const match = await db.getCrucibleMatchById(input.matchId);
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      // Get the device to find IP
      const device = await db.getCrucibleDeviceById(match.deviceId);
      if (!device?.ipAddress) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Device IP address not available" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        
        const fromMs = match.startTime ? match.startTime.getTime() : Date.now() - 3600000;
        const untilMs = match.endTime ? match.endTime.getTime() : 0;

        const pcapData = await client.downloadDevicePcap(
          device.ipAddress,
          fromMs,
          untilMs,
          100000000 // 100MB limit
        );

        const base64 = Buffer.from(pcapData).toString("base64");
        const filename = `crucible_match_${input.matchId}_${match.gameMode || "unknown"}.pcap`;

        return {
          success: true,
          filename,
          data: base64,
          sizeBytes: pcapData.byteLength,
          matchDuration: match.durationMs ? Number(match.durationMs) : null,
        };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // Download PCAP for peer-to-peer traffic
  downloadPeerPcap: protectedProcedure
    .input(z.object({
      deviceIp: z.string(),
      peerIp: z.string(),
      fromMs: z.number(),
      untilMs: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ExtraHop not configured" });
      }

      try {
        const client = new ExtrahopClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
        
        const pcapData = await client.downloadPeerPcap(
          input.deviceIp,
          input.peerIp,
          input.fromMs,
          input.untilMs || 0
        );

        const base64 = Buffer.from(pcapData).toString("base64");
        const filename = `crucible_p2p_${input.deviceIp.replace(/\./g, "_")}_${input.peerIp.replace(/\./g, "_")}_${Date.now()}.pcap`;

        return {
          success: true,
          filename,
          data: base64,
          sizeBytes: pcapData.byteLength,
        };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),
});

// Bungie API router for Destiny 2 match data
const bungieRouter = router({
  // Save Bungie API configuration
  saveConfig: protectedProcedure
    .input(z.object({
      apiKey: z.string().min(1),
      bungieName: z.string().min(1), // e.g., "Guardian#1234"
      autoSync: z.boolean().optional().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      // Parse Bungie name
      const client = new BungieClient(input.apiKey);
      const { displayName, displayNameCode } = client.parseBungieName(input.bungieName);
      
      // Search for player to get membership info
      const players = await client.searchPlayerByBungieName(
        displayName,
        displayNameCode,
        MembershipType.All
      );
      
      if (players.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });
      }
      
      // Prefer PSN for PS5 users
      const player = players.find(p => p.membershipType === MembershipType.PSN) || players[0];
      
      // Get profile to find characters
      const profile = await client.getProfile(
        player.membershipType,
        player.membershipId,
        [100, 200] // Profiles, Characters
      );
      
      // Find primary character (highest light level)
      let primaryCharacterId: string | undefined;
      let characterClass: string | undefined;
      let lightLevel: number | undefined;
      
      if (profile.characters?.data) {
        const characters = Object.values(profile.characters.data);
        const primary = characters.sort((a, b) => b.light - a.light)[0];
        if (primary) {
          primaryCharacterId = primary.characterId;
          characterClass = client.getClassName(primary.classType);
          lightLevel = primary.light;
        }
      }
      
      // Save config to database
      await db.saveBungieConfig({
        userId: ctx.user.id,
        apiKey: input.apiKey,
        bungieName: input.bungieName,
        membershipType: player.membershipType,
        membershipId: player.membershipId,
        primaryCharacterId,
        characterClass,
        lightLevel,
        autoSync: input.autoSync,
        lastSyncAt: new Date(),
      });
      
      return {
        success: true,
        player: {
          displayName: player.displayName,
          bungieGlobalDisplayName: player.bungieGlobalDisplayName,
          membershipType: player.membershipType,
          membershipId: player.membershipId,
          characterClass,
          lightLevel,
        },
      };
    }),

  // Get user's Bungie config
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    return await db.getBungieConfigByUser(ctx.user.id);
  }),

  // Get recent Crucible matches from Bungie API
  getRecentMatches: protectedProcedure
    .input(z.object({
      count: z.number().min(1).max(50).optional().default(10),
      mode: z.number().optional(), // DestinyActivityModeType
    }))
    .query(async ({ ctx, input }) => {
      const config = await db.getBungieConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bungie API not configured" });
      }
      
      const client = new BungieClient(config.apiKey);
      
      const matches = await client.getRecentCrucibleMatches(
        config.membershipType!,
        config.membershipId!,
        config.primaryCharacterId!,
        input.count
      );
      
      // Store matches in database
      for (const match of matches) {
        await db.saveBungieMatch({
          userId: ctx.user.id,
          activityId: match.activityId,
          period: new Date(match.period),
          mode: match.mode,
          modeName: match.modeName,
          mapHash: match.mapHash,
          durationSeconds: match.duration,
          isPrivate: match.isPrivate,
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          kd: match.kd.toString(),
          kda: match.kda.toString(),
          efficiency: match.efficiency.toString(),
          score: match.score,
          standing: match.standing,
          teamScore: match.teamScore,
          opponentScore: match.opponentScore,
          precisionKills: match.precisionKills,
          superKills: match.superKills,
          grenadeKills: match.grenadeKills,
          meleeKills: match.meleeKills,
          abilityKills: match.abilityKills,
          longestKillSpree: match.longestKillSpree,
          pgcrData: match.raw.pgcr,
        });
      }
      
      // Update last sync time
      await db.updateBungieConfigLastSync(ctx.user.id);
      
      return matches.map(m => ({
        activityId: m.activityId,
        period: m.period,
        modeName: m.modeName,
        duration: m.duration,
        kills: m.kills,
        deaths: m.deaths,
        assists: m.assists,
        kd: m.kd,
        kda: m.kda,
        standing: m.standing,
        teamScore: m.teamScore,
        opponentScore: m.opponentScore,
      }));
    }),

  // Get stored matches from database
  getStoredMatches: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(25),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return await db.getBungieMatches(ctx.user.id, input.limit, input.offset);
    }),

  // Get match details with PGCR
  getMatchDetails: protectedProcedure
    .input(z.object({
      activityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // First check database
      const stored = await db.getBungieMatchByActivityId(input.activityId);
      if (stored?.pgcrData) {
        return stored;
      }
      
      // Fetch from API if not in database
      const config = await db.getBungieConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bungie API not configured" });
      }
      
      const client = new BungieClient(config.apiKey);
      const pgcr = await client.getPostGameCarnageReport(input.activityId);
      
      return {
        activityId: input.activityId,
        pgcrData: pgcr,
      };
    }),

  // Correlate network metrics with match performance
  correlateMatch: protectedProcedure
    .input(z.object({
      bungieActivityId: z.string(),
      crucibleMatchId: z.number().optional(),
      networkMetrics: z.object({
        avgLatency: z.number(),
        maxLatency: z.number(),
        minLatency: z.number(),
        avgJitter: z.number(),
        maxJitter: z.number(),
        packetLoss: z.number(),
        lagSpikeCount: z.number(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get match data
      const match = await db.getBungieMatchByActivityId(input.bungieActivityId);
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }
      
      // Analyze correlation
      const correlation = analyzeNetworkMatchCorrelation(
        {
          activityId: match.activityId,
          period: match.period.toISOString(),
          mode: match.mode,
          modeName: match.modeName || '',
          mapHash: Number(match.mapHash) || 0,
          duration: match.durationSeconds || 0,
          isPrivate: match.isPrivate,
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          kd: parseFloat(match.kd || '0'),
          kda: parseFloat(match.kda || '0'),
          efficiency: parseFloat(match.efficiency || '0'),
          score: match.score || 0,
          standing: match.standing || 0,
          raw: {},
        },
        input.networkMetrics
      );
      
      // Save correlation to database
      await db.saveMatchCorrelation({
        userId: ctx.user.id,
        bungieMatchId: match.id,
        crucibleMatchId: input.crucibleMatchId,
        avgLatencyMs: input.networkMetrics.avgLatency.toString(),
        maxLatencyMs: input.networkMetrics.maxLatency.toString(),
        minLatencyMs: input.networkMetrics.minLatency.toString(),
        avgJitterMs: input.networkMetrics.avgJitter.toString(),
        maxJitterMs: input.networkMetrics.maxJitter.toString(),
        packetLossPercent: input.networkMetrics.packetLoss.toString(),
        lagSpikeCount: input.networkMetrics.lagSpikeCount,
        performanceImpact: correlation.performanceImpact,
        insights: correlation.insights,
      });
      
      return correlation;
    }),

  // Get correlation insights for a match
  getCorrelation: protectedProcedure
    .input(z.object({
      bungieActivityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const match = await db.getBungieMatchByActivityId(input.bungieActivityId);
      if (!match) {
        return null;
      }
      
      return await db.getMatchCorrelationByBungieMatch(match.id);
    }),

  // Get player profile from Bungie API
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const config = await db.getBungieConfigByUser(ctx.user.id);
    if (!config) {
      return null;
    }
    
    const client = new BungieClient(config.apiKey);
    const profile = await client.getProfile(
      config.membershipType!,
      config.membershipId!,
      [100, 200]
    );
    
    return {
      bungieName: config.bungieName,
      membershipType: config.membershipType,
      membershipId: config.membershipId,
      characterClass: config.characterClass,
      lightLevel: config.lightLevel,
      lastSyncAt: config.lastSyncAt,
      characters: profile.characters?.data ? Object.values(profile.characters.data).map(c => ({
        characterId: c.characterId,
        classType: c.classType,
        className: client.getClassName(c.classType),
        light: c.light,
        emblemPath: client.getAssetUrl(c.emblemPath || ''),
        emblemBackgroundPath: client.getAssetUrl(c.emblemBackgroundPath || ''),
      })) : [],
    };
  }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  extrahop: extrahopRouter,
  lore: loreRouter,
  game: gameRouter,
  notifications: notificationsRouter,
  voice: voiceRouter,
  crucible: crucibleRouter,
  bungie: bungieRouter,
});

export type AppRouter = typeof appRouter;
