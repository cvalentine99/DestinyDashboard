/**
 * Routers Index
 *
 * This file re-exports the appRouter from the modular router structure.
 * Individual routers have been split into separate files in the ./routers/ directory
 * for better maintainability and code organization.
 *
 * Router Structure:
 * - routers/auth.router.ts       - Authentication endpoints
 * - routers/extrahop.router.ts   - ExtraHop network monitoring
 * - routers/lore.router.ts       - Destiny 2 lore chatbot
 * - routers/game.router.ts       - Mini-game score tracking
 * - routers/notifications.router.ts - Notification preferences
 * - routers/voice.router.ts      - Voice interface
 * - routers/crucible.router.ts   - PvP match monitoring
 * - routers/bungie.router.ts     - Bungie API integration
 * - routers/achievements.router.ts - Triumphs system
 * - routers/loadout.router.ts    - Guardian loadout management
 */

export { appRouter, type AppRouter } from "./routers/index";
