/**
 * Game Router
 * Mini-game score tracking endpoints
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const gameRouter = router({
  // Save score
  saveScore: protectedProcedure
    .input(
      z.object({
        gameType: z.string(),
        score: z.number(),
        level: z.number().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
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
    .input(
      z.object({
        gameType: z.string(),
        limit: z.number().optional().default(10),
      })
    )
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
