/**
 * ExtraHop Router
 * Network monitoring and device management endpoints
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  ExtrahopClient,
  toDestinyDevice,
  toDestinyAlert,
  destinyTerminology,
} from "../extrahop";
import * as db from "../db";

export const extrahopRouter = router({
  // Save ExtraHop configuration
  saveConfig: protectedProcedure
    .input(
      z.object({
        apiUrl: z.string().url(),
        apiKey: z.string().min(1),
        applianceName: z.string().optional(),
      })
    )
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
    .input(
      z.object({
        apiUrl: z.string().url(),
        apiKey: z.string().min(1),
      })
    )
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
    .input(
      z
        .object({
          limit: z.number().optional().default(50),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ExtraHop not configured",
        });
      }

      try {
        const client = new ExtrahopClient({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
        });
        const devices = await client.getDevices({ limit: input?.limit || 50 });

        // Convert to Destiny terminology
        return devices.map(toDestinyDevice);
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Search devices by name pattern using /devices/search API
  searchDevices: protectedProcedure
    .input(z.object({ namePattern: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ExtraHop not configured",
        });
      }

      try {
        const client = new ExtrahopClient({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
        });
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Get alerts (Threat Detections)
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    const config = await db.getExtrahopConfigByUser(ctx.user.id);
    if (!config) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ExtraHop not configured",
      });
    }

    try {
      const client = new ExtrahopClient({
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
      });
      const alerts = await client.getAlerts();
      return alerts.map(toDestinyAlert);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

  // Get detections
  getDetections: protectedProcedure
    .input(
      z
        .object({
          from: z.number().optional(),
          until: z.number().optional(),
          limit: z.number().optional().default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ExtraHop not configured",
        });
      }

      try {
        const client = new ExtrahopClient({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
        });
        const now = Date.now();
        const result = await client.searchDetections({
          from: input?.from || now - 24 * 60 * 60 * 1000, // Last 24 hours
          until: input?.until || now,
          limit: input?.limit || 50,
        });
        return result.detections;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Get network topology
  getTopology: protectedProcedure
    .input(
      z
        .object({
          deviceId: z.number().optional(),
          from: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ExtraHop not configured",
        });
      }

      try {
        const client = new ExtrahopClient({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
        });
        const now = Date.now();

        const topology = await client.queryTopology({
          from: input?.from || now - 60 * 60 * 1000, // Last hour
          walks: [
            {
              origins: [
                {
                  object_type: input?.deviceId ? "device" : "all_devices",
                  object_id: input?.deviceId || 0,
                },
              ],
              steps: [{ relationships: [{ role: "any" }] }],
            },
          ],
          weighting: "bytes",
          edge_annotations: ["protocols"],
        });

        return topology;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Get metrics
  getMetrics: protectedProcedure
    .input(
      z
        .object({
          metricCategory: z.string().default("net"),
          metricName: z.string().default("bytes_in"),
          cycle: z
            .enum(["auto", "1sec", "30sec", "5min", "1hr", "24hr"])
            .default("5min"),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ExtraHop not configured",
        });
      }

      try {
        const client = new ExtrahopClient({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
        });
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
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
          {
            type: "alert",
            message: "Darkness Incursion detected on subnet 10.0.1.0/24",
            time: "2 min ago",
            severity: "high",
          },
          {
            type: "device",
            message: "New Guardian joined: TITAN-SERVER-01",
            time: "5 min ago",
            severity: "info",
          },
          {
            type: "metric",
            message: "Light Stream surge: +45% bandwidth utilization",
            time: "12 min ago",
            severity: "medium",
          },
        ],
      };
    }

    try {
      const client = new ExtrahopClient({
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
      });
      const [devices, alerts] = await Promise.all([
        client.getDevices({ limit: 1000 }),
        client.getAlerts(),
      ]);

      const activeDevices = devices.filter((d) => (d.analysis_level || 0) > 0);
      const alertCounts = { critical: 0, high: 0, medium: 0, low: 0 };
      alerts.forEach((a) => {
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
        recentActivity: alerts.slice(0, 5).map((a) => ({
          type: "alert",
          message: a.name,
          time: new Date(a.mod_time).toLocaleTimeString(),
          severity: a.severity >= 3 ? "high" : a.severity >= 2 ? "medium" : "low",
        })),
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

  // Get terminology mapping
  getTerminology: publicProcedure.query(() => destinyTerminology),
});
