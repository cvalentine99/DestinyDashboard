/**
 * Bungie Router
 * Destiny 2 API integration for match history and player data
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import {
  BungieClient,
  MembershipType,
  analyzeNetworkMatchCorrelation,
} from "../bungie";

export const bungieRouter = router({
  // Save Bungie API configuration
  saveConfig: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        bungieName: z.string().min(1), // e.g., "Guardian#1234"
        autoSync: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Parse Bungie name
      const client = new BungieClient(input.apiKey);
      const { displayName, displayNameCode } = client.parseBungieName(
        input.bungieName
      );

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
      const player =
        players.find((p) => p.membershipType === MembershipType.PSN) ||
        players[0];

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
    .input(
      z.object({
        count: z.number().min(1).max(50).optional().default(10),
        mode: z.number().optional(), // DestinyActivityModeType
      })
    )
    .query(async ({ ctx, input }) => {
      const config = await db.getBungieConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bungie API not configured",
        });
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

      return matches.map((m) => ({
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
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(25),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return await db.getBungieMatches(ctx.user.id, input.limit, input.offset);
    }),

  // Get match details with PGCR
  getMatchDetails: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // First check database
      const stored = await db.getBungieMatchByActivityId(input.activityId);
      if (stored?.pgcrData) {
        return stored;
      }

      // Fetch from API if not in database
      const config = await db.getBungieConfigByUser(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bungie API not configured",
        });
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
    .input(
      z.object({
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
      })
    )
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
          modeName: match.modeName || "",
          mapHash: Number(match.mapHash) || 0,
          duration: match.durationSeconds || 0,
          isPrivate: match.isPrivate,
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          kd: parseFloat(match.kd || "0"),
          kda: parseFloat(match.kda || "0"),
          efficiency: parseFloat(match.efficiency || "0"),
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
    .input(
      z.object({
        bungieActivityId: z.string(),
      })
    )
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
      characters: profile.characters?.data
        ? Object.values(profile.characters.data).map((c) => ({
            characterId: c.characterId,
            classType: c.classType,
            className: client.getClassName(c.classType),
            light: c.light,
            emblemPath: client.getAssetUrl(c.emblemPath || ""),
            emblemBackgroundPath: client.getAssetUrl(c.emblemBackgroundPath || ""),
          }))
        : [],
    };
  }),
});
