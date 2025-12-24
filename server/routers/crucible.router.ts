/**
 * Crucible Router
 * PvP match monitoring and network performance tracking
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import * as crucible from "../crucible";
import { ExtrahopClient } from "../extrahop";

export const crucibleRouter = router({
  // Get terminology mappings
  getTerminology: publicProcedure.query(() => {
    return crucible.crucibleTerminology;
  }),

  // Register PS5 device for monitoring
  registerDevice: protectedProcedure
    .input(
      z.object({
        configId: z.number(),
        extrahopDeviceId: z.number().optional(),
        deviceName: z.string(),
        macAddress: z.string().optional(),
        ipAddress: z.string().optional(),
        platform: z.string().default("PS5"),
      })
    )
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
    .input(
      z.object({
        deviceId: z.number(),
        gameMode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing active match
      const activeMatch = await db.getActiveMatch(input.deviceId);
      if (activeMatch) {
        return {
          success: false,
          error: "Match already in progress",
          matchId: activeMatch.id,
        };
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
    .input(
      z.object({
        matchId: z.number(),
        result: z
          .enum(["victory", "defeat", "mercy", "disconnect", "unknown"])
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const match = await db.getCrucibleMatchById(input.matchId);
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      const endTime = new Date();
      const durationMs = match.startTime
        ? endTime.getTime() - match.startTime.getTime()
        : 0;

      // Get metrics to calculate averages
      const metrics = await db.getMatchMetrics(input.matchId);
      let avgLatency = 0,
        maxLatency = 0,
        minLatency = 999999,
        avgJitter = 0;
      let totalPacketsLost = 0,
        totalPacketsSent = 0;

      if (metrics.length > 0) {
        const latencies = metrics
          .filter((m) => m.latencyMs)
          .map((m) => m.latencyMs!);
        if (latencies.length > 0) {
          avgLatency = Math.round(
            latencies.reduce((a, b) => a + b, 0) / latencies.length
          );
          maxLatency = Math.max(...latencies);
          minLatency = Math.min(...latencies);
        }
        const jitters = metrics.filter((m) => m.jitterMs).map((m) => m.jitterMs!);
        if (jitters.length > 0) {
          avgJitter = Math.round(
            jitters.reduce((a, b) => a + b, 0) / jitters.length
          );
        }
        totalPacketsLost = metrics.reduce(
          (sum, m) => sum + Number(m.packetsLost || 0),
          0
        );
        totalPacketsSent = metrics.reduce(
          (sum, m) => sum + Number(m.packetsSent || 0),
          0
        );
      }

      const packetLossPercent =
        totalPacketsSent > 0
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
    .input(
      z.object({
        matchId: z.number(),
        state: z.enum([
          "orbit",
          "matchmaking",
          "loading",
          "in_match",
          "post_game",
          "unknown",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateCrucibleMatch(input.matchId, { matchState: input.state });
      return { success: true };
    }),

  // Record metrics sample
  recordMetrics: protectedProcedure
    .input(
      z.object({
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
      })
    )
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
        const avgLatency =
          recentMetrics.length > 0
            ? recentMetrics.reduce((sum, m) => sum + (m.latencyMs || 0), 0) /
              recentMetrics.length
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
    .input(
      z.object({
        matchId: z.number(),
        peerIp: z.string(),
        peerPort: z.number().optional(),
        avgLatencyMs: z.number().optional(),
        geoCountry: z.string().optional(),
        geoRegion: z.string().optional(),
        geoCity: z.string().optional(),
        isp: z.string().optional(),
      })
    )
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
        metrics: metrics.map((m) => ({
          ...m,
          timestampNs: m.timestampNs.toString(),
          packetsSent: m.packetsSent ? Number(m.packetsSent) : null,
          packetsReceived: m.packetsReceived ? Number(m.packetsReceived) : null,
          packetsLost: m.packetsLost ? Number(m.packetsLost) : null,
          bytesSent: m.bytesSent ? Number(m.bytesSent) : null,
          bytesReceived: m.bytesReceived ? Number(m.bytesReceived) : null,
          bungieTrafficBytes: m.bungieTrafficBytes
            ? Number(m.bungieTrafficBytes)
            : null,
          p2pTrafficBytes: m.p2pTrafficBytes ? Number(m.p2pTrafficBytes) : null,
        })),
        peers: peers.map((p) => ({
          ...p,
          packetsSent: p.packetsSent ? Number(p.packetsSent) : null,
          packetsReceived: p.packetsReceived ? Number(p.packetsReceived) : null,
          bytesSent: p.bytesSent ? Number(p.bytesSent) : null,
          bytesReceived: p.bytesReceived ? Number(p.bytesReceived) : null,
        })),
        events: events.map((e) => ({
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
        const avgLatency =
          metrics.slice(0, 10).reduce((sum, m) => sum + (m.latencyMs || 0), 0) /
          Math.min(10, metrics.length);
        const packetLoss =
          latestMetric.packetsLost && latestMetric.packetsSent
            ? (Number(latestMetric.packetsLost) /
                Number(latestMetric.packetsSent)) *
              100
            : 0;
        connectionQuality = crucible.rateConnectionQuality(
          latestMetric.latencyMs,
          packetLoss,
          latestMetric.jitterMs || 0
        );
      }

      return {
        metrics: metrics.map((m) => ({
          ...m,
          timestampNs: m.timestampNs.toString(),
          packetsSent: m.packetsSent ? Number(m.packetsSent) : null,
          packetsReceived: m.packetsReceived ? Number(m.packetsReceived) : null,
          packetsLost: m.packetsLost ? Number(m.packetsLost) : null,
          bytesSent: m.bytesSent ? Number(m.bytesSent) : null,
          bytesReceived: m.bytesReceived ? Number(m.bytesReceived) : null,
        })),
        events: events.map((e) => ({
          ...e,
          timestampNs: e.timestampNs.toString(),
        })),
        peers: peers.map((p) => ({
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
    .input(
      z.object({
        bytesPerSecond: z.number(),
        peerCount: z.number(),
        bungieTrafficPercent: z.number(),
        p2pTrafficPercent: z.number(),
        previousState: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return crucible.detectMatchState(input);
    }),

  // Rate connection quality
  rateConnection: publicProcedure
    .input(
      z.object({
        latencyMs: z.number(),
        packetLossPercent: z.number(),
        jitterMs: z.number(),
      })
    )
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
    .input(
      z.object({
        deviceId: z.number(),
      })
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
          metric_specs: [{ name: "rtt" }, { name: "retrans_out" }],
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
            const jitter =
              i > 0 && dataPoints[i - 1]?.rtt
                ? Math.abs(rtt - dataPoints[i - 1].rtt)
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Get peer connections in real-time
  getRealtimePeers: protectedProcedure
    .input(
      z.object({
        deviceId: z.number(),
      })
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

        // Get topology to find peers
        const topology = await client.getDeviceTopology(input.deviceId, -60000);

        // Get flow records for more detail
        const flows = await client.getDevicePeerRecords(input.deviceId, -60000);

        return {
          peers: topology.nodes.filter((n) => n.id !== input.deviceId),
          edges: topology.edges,
          flowCount: flows?.records?.length || 0,
          timestamp: Date.now(),
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // ============ PCAP DOWNLOAD ============

  // Download PCAP for a device during a time range with optional BPF filter
  downloadPcap: protectedProcedure
    .input(
      z.object({
        deviceIp: z.string(),
        fromMs: z.number(),
        untilMs: z.number().optional(),
        limitBytes: z.number().optional().default(100000000), // 100MB default
        bpfFilter: z.string().optional(), // Berkeley Packet Filter expression
      })
    )
    .mutation(async ({ ctx, input }) => {
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Download PCAP for a specific match
  downloadMatchPcap: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const config = await db.getExtrahopConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ExtraHop not configured",
        });
      }

      // Get match details
      const match = await db.getCrucibleMatchById(input.matchId);
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      // Get the device to find IP
      const device = await db.getCrucibleDeviceById(match.deviceId);
      if (!device?.ipAddress) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Device IP address not available",
        });
      }

      try {
        const client = new ExtrahopClient({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
        });

        const fromMs = match.startTime
          ? match.startTime.getTime()
          : Date.now() - 3600000;
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Download PCAP for peer-to-peer traffic
  downloadPeerPcap: protectedProcedure
    .input(
      z.object({
        deviceIp: z.string(),
        peerIp: z.string(),
        fromMs: z.number(),
        untilMs: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),
});
