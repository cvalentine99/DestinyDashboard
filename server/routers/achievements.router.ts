/**
 * Achievements Router
 * Triumph and achievement tracking system
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import {
  ACHIEVEMENT_DEFINITIONS,
  getAchievementTierColor,
  getAchievementCategoryIcon,
  calculateSpecialAchievementProgress,
  getTotalTriumphPointsAvailable,
} from "../achievements";

export const achievementsRouter = router({
  // Get all achievement definitions
  getDefinitions: publicProcedure.query(() => {
    return {
      achievements: Object.values(ACHIEVEMENT_DEFINITIONS).map((a) => ({
        ...a,
        tierColor: getAchievementTierColor(a.tier),
        categoryIcon: getAchievementCategoryIcon(a.category),
      })),
      totalPointsAvailable: getTotalTriumphPointsAvailable(),
      categories: [
        "combat",
        "boss",
        "flawless",
        "score",
        "class",
        "weapon",
        "survival",
        "collection",
        "special",
      ],
      tiers: ["bronze", "silver", "gold", "platinum", "exotic"],
    };
  }),

  // Get user's triumph stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await db.getOrCreateTriumphStats(ctx.user.id);
    return stats;
  }),

  // Get user's achievement progress
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const achievements = await db.getUserAchievements(ctx.user.id);
    const stats = await db.getOrCreateTriumphStats(ctx.user.id);

    // Calculate progress for all achievements
    const progress = Object.values(ACHIEVEMENT_DEFINITIONS).map((def) => {
      const userAch = achievements.find((a) => a.achievementId === def.id);
      let currentValue = userAch?.currentValue || 0;

      // For special achievements, calculate from stats
      if (def.statKey === "special") {
        currentValue = calculateSpecialAchievementProgress(
          def.id,
          stats as unknown as Record<string, number>
        );
      } else if (
        def.statKey &&
        stats[def.statKey as keyof typeof stats] !== undefined
      ) {
        currentValue = Number(stats[def.statKey as keyof typeof stats]) || 0;
      }

      const isCompleted =
        userAch?.isCompleted || currentValue >= def.targetValue;
      const progressPercent = Math.min(
        100,
        (currentValue / def.targetValue) * 100
      );

      return {
        ...def,
        tierColor: getAchievementTierColor(def.tier),
        categoryIcon: getAchievementCategoryIcon(def.category),
        currentValue,
        isCompleted,
        progressPercent,
        completedAt: userAch?.completedAt,
        claimedReward: userAch?.claimedReward || false,
      };
    });

    return {
      progress,
      totalCompleted: progress.filter((p) => p.isCompleted).length,
      totalPoints: stats.totalTriumphPoints,
      totalPointsAvailable: getTotalTriumphPointsAvailable(),
      titlesEarned: (stats.titlesEarned as string[]) || [],
    };
  }),

  // Get pending notifications
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await db.getPendingAchievementNotifications(
      ctx.user.id
    );
    return notifications.map((n) => {
      const def =
        ACHIEVEMENT_DEFINITIONS[
          n.achievementId as keyof typeof ACHIEVEMENT_DEFINITIONS
        ];
      return {
        ...n,
        achievement: def
          ? {
              ...def,
              tierColor: getAchievementTierColor(def.tier),
              categoryIcon: getAchievementCategoryIcon(def.category),
            }
          : null,
      };
    });
  }),

  // Mark notification as shown
  dismissNotification: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationShown(input.notificationId);
      return { success: true };
    }),

  // Submit game stats and check achievements
  submitGameStats: protectedProcedure
    .input(
      z.object({
        // Kill counts
        dregKills: z.number().default(0),
        vandalKills: z.number().default(0),
        captainKills: z.number().default(0),
        thrallKills: z.number().default(0),
        acolyteKills: z.number().default(0),
        knightKills: z.number().default(0),
        goblinKills: z.number().default(0),
        hobgoblinKills: z.number().default(0),
        minotaurKills: z.number().default(0),
        // Boss kills
        ogreKills: z.number().default(0),
        servitorKills: z.number().default(0),
        hydraKills: z.number().default(0),
        // Flawless boss kills
        flawlessOgre: z.number().default(0),
        flawlessServitor: z.number().default(0),
        flawlessHydra: z.number().default(0),
        // Weapon kills
        autoRifleKills: z.number().default(0),
        handCannonKills: z.number().default(0),
        pulseRifleKills: z.number().default(0),
        rocketLauncherKills: z.number().default(0),
        // Game info
        guardianClass: z.enum(["titan", "hunter", "warlock"]),
        score: z.number(),
        wave: z.number(),
        level: z.number(),
        won: z.boolean(),
        // Engrams collected
        commonEngrams: z.number().default(0),
        uncommonEngrams: z.number().default(0),
        rareEngrams: z.number().default(0),
        legendaryEngrams: z.number().default(0),
        exoticEngrams: z.number().default(0),
        // Abilities
        abilitiesUsed: z.number().default(0),
        supersUsed: z.number().default(0),
        // Level clears
        clearedCosmodrome: z.boolean().default(false),
        clearedEuropa: z.boolean().default(false),
        clearedDreamingCity: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const stats = await db.getOrCreateTriumphStats(userId);

      // Calculate total kills
      const totalKillsThisGame =
        input.dregKills +
        input.vandalKills +
        input.captainKills +
        input.thrallKills +
        input.acolyteKills +
        input.knightKills +
        input.goblinKills +
        input.hobgoblinKills +
        input.minotaurKills +
        input.ogreKills +
        input.servitorKills +
        input.hydraKills;

      // Update stats
      const newStats = {
        totalKills: (stats.totalKills || 0) + totalKillsThisGame,
        dregKills: (stats.dregKills || 0) + input.dregKills,
        vandalKills: (stats.vandalKills || 0) + input.vandalKills,
        captainKills: (stats.captainKills || 0) + input.captainKills,
        thrallKills: (stats.thrallKills || 0) + input.thrallKills,
        acolyteKills: (stats.acolyteKills || 0) + input.acolyteKills,
        knightKills: (stats.knightKills || 0) + input.knightKills,
        goblinKills: (stats.goblinKills || 0) + input.goblinKills,
        hobgoblinKills: (stats.hobgoblinKills || 0) + input.hobgoblinKills,
        minotaurKills: (stats.minotaurKills || 0) + input.minotaurKills,
        ogreKills: (stats.ogreKills || 0) + input.ogreKills,
        servitorKills: (stats.servitorKills || 0) + input.servitorKills,
        hydraKills: (stats.hydraKills || 0) + input.hydraKills,
        flawlessOgre: (stats.flawlessOgre || 0) + input.flawlessOgre,
        flawlessServitor: (stats.flawlessServitor || 0) + input.flawlessServitor,
        flawlessHydra: (stats.flawlessHydra || 0) + input.flawlessHydra,
        autoRifleKills: (stats.autoRifleKills || 0) + input.autoRifleKills,
        handCannonKills: (stats.handCannonKills || 0) + input.handCannonKills,
        pulseRifleKills: (stats.pulseRifleKills || 0) + input.pulseRifleKills,
        rocketLauncherKills:
          (stats.rocketLauncherKills || 0) + input.rocketLauncherKills,
        gamesPlayed: (stats.gamesPlayed || 0) + 1,
        highestScore: Math.max(stats.highestScore || 0, input.score),
        totalScore: (stats.totalScore || 0) + input.score,
        highestWave: Math.max(stats.highestWave || 0, input.wave),
        highestLevel: Math.max(stats.highestLevel || 0, input.level),
        commonEngrams: (stats.commonEngrams || 0) + input.commonEngrams,
        uncommonEngrams: (stats.uncommonEngrams || 0) + input.uncommonEngrams,
        rareEngrams: (stats.rareEngrams || 0) + input.rareEngrams,
        legendaryEngrams: (stats.legendaryEngrams || 0) + input.legendaryEngrams,
        exoticEngrams: (stats.exoticEngrams || 0) + input.exoticEngrams,
        abilitiesUsed: (stats.abilitiesUsed || 0) + input.abilitiesUsed,
        supersUsed: (stats.supersUsed || 0) + input.supersUsed,
        cosmodromeClears:
          (stats.cosmodromeClears || 0) + (input.clearedCosmodrome ? 1 : 0),
        europaClears:
          (stats.europaClears || 0) + (input.clearedEuropa ? 1 : 0),
        dreamingCityClears:
          (stats.dreamingCityClears || 0) + (input.clearedDreamingCity ? 1 : 0),
        // Class stats - initialize all
        titanGamesPlayed: stats.titanGamesPlayed || 0,
        titanWins: stats.titanWins || 0,
        hunterGamesPlayed: stats.hunterGamesPlayed || 0,
        hunterWins: stats.hunterWins || 0,
        warlockGamesPlayed: stats.warlockGamesPlayed || 0,
        warlockWins: stats.warlockWins || 0,
      };

      // Update class-specific stats
      if (input.guardianClass === "titan") {
        newStats.titanGamesPlayed = (stats.titanGamesPlayed || 0) + 1;
        if (input.won) newStats.titanWins = (stats.titanWins || 0) + 1;
      } else if (input.guardianClass === "hunter") {
        newStats.hunterGamesPlayed = (stats.hunterGamesPlayed || 0) + 1;
        if (input.won) newStats.hunterWins = (stats.hunterWins || 0) + 1;
      } else if (input.guardianClass === "warlock") {
        newStats.warlockGamesPlayed = (stats.warlockGamesPlayed || 0) + 1;
        if (input.won) newStats.warlockWins = (stats.warlockWins || 0) + 1;
      }

      await db.updateTriumphStats(userId, newStats);

      // Check all achievements
      const newlyCompleted: string[] = [];
      const updatedStats = { ...stats, ...newStats };

      for (const def of Object.values(ACHIEVEMENT_DEFINITIONS)) {
        const userAch = await db.getOrCreateAchievementProgress(userId, def.id);

        if (userAch.isCompleted) continue; // Already completed

        let currentValue = 0;
        if (def.statKey === "special") {
          currentValue = calculateSpecialAchievementProgress(
            def.id,
            updatedStats as unknown as Record<string, number>
          );
        } else if (
          def.statKey &&
          updatedStats[def.statKey as keyof typeof updatedStats] !== undefined
        ) {
          currentValue =
            Number(updatedStats[def.statKey as keyof typeof updatedStats]) || 0;
        }

        // Update progress
        const isNowCompleted = currentValue >= def.targetValue;
        await db.updateAchievementProgress(
          userId,
          def.id,
          currentValue,
          isNowCompleted
        );

        if (isNowCompleted && !userAch.isCompleted) {
          await db.completeAchievement(userId, def.id, def.triumphPoints);
          newlyCompleted.push(def.id);

          // Award title if applicable
          if (def.rewardType === "title" && def.rewardValue) {
            await db.addTitleToUser(userId, def.rewardValue);
          }
        }
      }

      return {
        success: true,
        newlyCompleted: newlyCompleted.map((id) => {
          const def =
            ACHIEVEMENT_DEFINITIONS[id as keyof typeof ACHIEVEMENT_DEFINITIONS];
          return {
            ...def,
            tierColor: getAchievementTierColor(def.tier),
            categoryIcon: getAchievementCategoryIcon(def.category),
          };
        }),
      };
    }),
});
