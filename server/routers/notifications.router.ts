/**
 * Notifications Router
 * User notification preferences endpoints
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const notificationsRouter = router({
  // Get preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await db.getNotificationPrefs(ctx.user.id);
    return (
      prefs || {
        alertSeverity: ["critical", "high"],
        pushEnabled: true,
        voiceEnabled: false,
      }
    );
  }),

  // Update preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        alertSeverity: z.array(z.string()).optional(),
        pushEnabled: z.boolean().optional(),
        voiceEnabled: z.boolean().optional(),
      })
    )
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
