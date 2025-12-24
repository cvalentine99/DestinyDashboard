/**
 * Loadout Router
 * Guardian loadout management for the mini-game
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

// Helper function to get class-specific colors
function getClassColor(guardianClass: string): string {
  switch (guardianClass) {
    case "titan":
      return "#f97316"; // Orange for Titans
    case "hunter":
      return "#06b6d4"; // Cyan for Hunters
    case "warlock":
      return "#a855f7"; // Purple for Warlocks
    default:
      return "#00d4aa"; // Teal default
  }
}

export const loadoutRouter = router({
  // Get all loadouts for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const loadouts = await db.getUserLoadouts(ctx.user.id);
    return loadouts;
  }),

  // Get the default loadout
  getDefault: protectedProcedure.query(async ({ ctx }) => {
    return db.getDefaultLoadout(ctx.user.id);
  }),

  // Get a specific loadout by ID
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const loadout = await db.getLoadoutById(input.id);
      if (!loadout || loadout.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Loadout not found" });
      }
      return loadout;
    }),

  // Create a new loadout
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        guardianClass: z.enum(["titan", "hunter", "warlock"]),
        primaryWeapon: z.enum([
          "auto_rifle",
          "hand_cannon",
          "pulse_rifle",
          "rocket_launcher",
        ]),
        iconColor: z.string().optional(),
        isDefault: z.boolean().optional(),
        slotNumber: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has 10 loadouts (max limit)
      const existingLoadouts = await db.getUserLoadouts(ctx.user.id);
      if (existingLoadouts.length >= 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum 10 loadouts allowed. Delete an existing loadout first.",
        });
      }

      // If this is the first loadout or marked as default, set it as default
      const shouldBeDefault = input.isDefault || existingLoadouts.length === 0;

      // If setting as default, clear other defaults first
      if (shouldBeDefault && existingLoadouts.length > 0) {
        await db.setDefaultLoadout(ctx.user.id, -1); // Clear all defaults
      }

      const loadoutId = await db.createLoadout({
        userId: ctx.user.id,
        name: input.name,
        guardianClass: input.guardianClass,
        primaryWeapon: input.primaryWeapon,
        iconColor: input.iconColor || getClassColor(input.guardianClass),
        isDefault: shouldBeDefault,
        slotNumber: input.slotNumber || null,
      });

      return { success: true, loadoutId };
    }),

  // Update an existing loadout
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(64).optional(),
        guardianClass: z.enum(["titan", "hunter", "warlock"]).optional(),
        primaryWeapon: z
          .enum(["auto_rifle", "hand_cannon", "pulse_rifle", "rocket_launcher"])
          .optional(),
        iconColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const loadout = await db.getLoadoutById(input.id);
      if (!loadout || loadout.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Loadout not found" });
      }

      const updates: Record<string, unknown> = {};
      if (input.name) updates.name = input.name;
      if (input.guardianClass) updates.guardianClass = input.guardianClass;
      if (input.primaryWeapon) updates.primaryWeapon = input.primaryWeapon;
      if (input.iconColor) updates.iconColor = input.iconColor;

      await db.updateLoadout(input.id, updates);
      return { success: true };
    }),

  // Delete a loadout
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const loadout = await db.getLoadoutById(input.id);
      if (!loadout || loadout.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Loadout not found" });
      }

      await db.deleteLoadout(input.id);

      // If this was the default, set another loadout as default
      if (loadout.isDefault) {
        const remaining = await db.getUserLoadouts(ctx.user.id);
        if (remaining.length > 0) {
          await db.setDefaultLoadout(ctx.user.id, remaining[0].id);
        }
      }

      return { success: true };
    }),

  // Set a loadout as default
  setDefault: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const loadout = await db.getLoadoutById(input.id);
      if (!loadout || loadout.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Loadout not found" });
      }

      await db.setDefaultLoadout(ctx.user.id, input.id);
      return { success: true };
    }),

  // Assign a loadout to a quick-switch slot (1-5)
  assignSlot: protectedProcedure
    .input(
      z.object({
        loadoutId: z.number(),
        slotNumber: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const loadout = await db.getLoadoutById(input.loadoutId);
      if (!loadout || loadout.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Loadout not found" });
      }

      await db.assignLoadoutSlot(input.loadoutId, input.slotNumber, ctx.user.id);
      return { success: true };
    }),

  // Record loadout usage (for stats)
  recordUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const loadout = await db.getLoadoutById(input.id);
      if (!loadout || loadout.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Loadout not found" });
      }

      await db.incrementLoadoutUsage(input.id);
      return { success: true };
    }),
});
