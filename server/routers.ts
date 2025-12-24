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
        const result = await client.getDetections({
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
          metric_category: input?.metricCategory || "net",
          metric_specs: [{ name: input?.metricName || "bytes_in" }],
          object_type: "application",
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

      const activeDevices = devices.filter(d => d.analysis_level > 0);
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
});

export type AppRouter = typeof appRouter;
