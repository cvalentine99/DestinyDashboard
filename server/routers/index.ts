/**
 * Router Index
 *
 * This file combines all domain-specific routers into the main appRouter.
 * Routers have been split for better maintainability and code organization.
 */

import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { authRouter } from "./auth.router";
import { extrahopRouter } from "./extrahop.router";
import { loreRouter } from "./lore.router";
import { gameRouter } from "./game.router";
import { notificationsRouter } from "./notifications.router";
import { voiceRouter } from "./voice.router";
import { crucibleRouter } from "./crucible.router";
import { bungieRouter } from "./bungie.router";
import { achievementsRouter } from "./achievements.router";
import { loadoutRouter } from "./loadout.router";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  extrahop: extrahopRouter,
  lore: loreRouter,
  game: gameRouter,
  notifications: notificationsRouter,
  voice: voiceRouter,
  crucible: crucibleRouter,
  bungie: bungieRouter,
  achievements: achievementsRouter,
  loadout: loadoutRouter,
});

export type AppRouter = typeof appRouter;

// Re-export individual routers for direct access if needed
export {
  authRouter,
  extrahopRouter,
  loreRouter,
  gameRouter,
  notificationsRouter,
  voiceRouter,
  crucibleRouter,
  bungieRouter,
  achievementsRouter,
  loadoutRouter,
};
