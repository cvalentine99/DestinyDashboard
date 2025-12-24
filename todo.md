# Second Sight Forensics for ExtraHop - Project TODO

## Core Infrastructure
- [x] Configure Destiny 2 Year of Prophecy theme (warm orange/amber + cool teal/cyan)
- [x] Set up database schema for network data, lore, and user preferences
- [x] Create ExtraHop API integration service layer

## Dashboard Features
- [x] Main landing dashboard with Destiny 2 frontier aesthetic
- [x] Real-time device status display (Guardians)
- [x] Traffic flow visualization (Light Stream)
- [x] Alert/detection panels (Threat Detections)
- [x] Performance metrics cards (Power Level)
- [x] Dynamic status ticker with Destiny 2 terminology

## Network Topology
- [x] Interactive network topology map (2D force-directed)
- [x] Device relationship visualization
- [x] Protocol activity display
- [x] ExtraHop activity maps API integration

## RAG Lore Chatbot
- [x] Pop-out chatbot UI in lower right corner
- [x] Destiny 2 lore knowledge base (comprehensive lore data)
- [x] Keyword-based semantic search for lore retrieval
- [x] LLM integration for lore Q&A
- [x] Books of Sorrow, Guardians, The Nine, and other lore categories

## Mini-Game
- [x] Mobile-responsive game container
- [x] Engram Hunter collection game with canvas rendering
- [x] Destiny 2 themed visuals (engram types, Guardian player)
- [x] Score tracking and leaderboard
- [x] Level progression system

## Notifications & Voice
- [x] Notification preferences settings
- [x] Voice interface component with Web Speech API
- [x] Ghost Voice Assistant for alert readouts (text-to-speech)
- [x] Voice-to-text for hands-free queries

## Settings & Configuration
- [x] ExtraHop API configuration page
- [x] Connection testing functionality
- [x] Notification preferences management
- [x] Voice settings

## UI/UX Polish
- [x] Destiny terminology mapping (device -> Guardian, etc.)
- [x] Responsive design for all screen sizes
- [x] Loading states and skeletons
- [x] Error handling and fallbacks
- [x] Translation matrix display on landing page
- [x] Glow effects and Destiny-themed animations

## Testing
- [x] Lore search tests (17 tests)
- [x] Destiny terminology mapping tests
- [x] Auth logout tests
- [x] TypeScript compilation check


## Urgent Fix
- [x] Remove all "Second Sight" branding from the application
- [x] Rename to "Vanguard Ops" / "Vanguard Network Operations"

## Crucible Operations Center (PvP Match Monitoring)
- [x] PS5 device configuration (Sony Interactive Entertainment BCD278)
- [x] Bungie server traffic pattern detection
- [x] Real-time PvP match state detection (orbit, matchmaking, in-match, post-game)
- [x] Connection quality monitoring (latency, packet loss, jitter)
- [x] Real-time latency graph during matches
- [x] Peer-to-peer connection analysis (hybrid P2P networking)
- [x] Peer count and connection quality per peer
- [x] Match timeline event logging
- [x] Post-game match review with network events overlay
- [x] Lag spike detection and alerting
- [x] Crucible Operations Center dashboard UI

## Critical Fix - Use Real ExtraHop API
- [x] Remove fake device registration - ExtraHop discovers devices automatically
- [x] Rewrite extrahop.ts to use actual API spec endpoints (/devices/search, /metrics, /records/search, /activitymaps/query, /detections/search)
- [x] Update Crucible page to search for PS5 by vendor "Sony Interactive Entertainment" 
- [x] Use /metrics endpoint with proper metric_category, metric_specs, object_ids
- [x] Use /records/search for flow records and connection data
- [x] Use /activitymaps/query for peer topology
- [x] Remove all simulated/fake data generation

## Real-time Metric Polling & PCAP Download
- [x] Implement 1-second polling for live metrics during Crucible matches
- [x] Add real-time latency/jitter/packet loss graphs with 1-second updates
- [x] Create getRealtimeDeviceMetrics and getRealtimePeers endpoints
- [x] Add PCAP download feature using /packets/search endpoint
- [x] Build PCAP capture UI with time range selection (last 5 min button)
- [x] Add downloadPcap and downloadMatchPcap mutations
- [x] Add download button to post-game match review

## Ghost Voice Alerts
- [x] Implement Ghost voice announcements for lag spikes during matches
- [x] Add voice alerts for connection quality changes (Excellent → Fair, etc.)
- [x] Create configurable alert thresholds (latency > 100ms, packet loss > 2%)
- [x] Use Web Speech API with Destiny-themed phrases ("Guardian, connection degraded")
- [x] Add mute/unmute toggle for voice alerts

## Nanosecond Precision Timestamps
- [x] Upgrade timeline event timestamps to nanosecond precision
- [x] Update database schema for BigInt nanosecond storage (already had timestampNs)
- [x] Implement high-resolution time formatting in UI (nanoseconds.ts utility)
- [x] Add nanosecond precision to PCAP correlation
- [x] Update match timeline display with ns-level accuracy (HH:MM:SS.ms.μs.ns)

## BPF Filter Builder
- [x] Create BPF filter builder UI component
- [x] Add preset filters for Destiny 2 traffic (UDP 3074, STUN 3478-3480, Bungie API)
- [x] Implement custom filter input with syntax validation
- [x] Add filter preview showing expected traffic types
- [x] Integrate BPF filters with PCAP download feature

## Bungie API Integration
- [x] Create Bungie API service (bungie.ts)
- [x] Implement player search by Bungie name
- [x] Fetch Crucible match history (PGCR - Post Game Carnage Report)
- [x] Extract K/D, map, game mode, and match duration
- [x] Add database schema for Bungie match data
- [x] Store Bungie API key in user settings
- [x] Build match correlation UI showing network + gameplay stats
- [x] Auto-correlate matches by timestamp overlap
- [x] Display performance insights (high latency = lower K/D correlation)

## Mini-Game Upgrade - Engram Hunter Combat Edition

### Combat System
- [x] Add enemy types (Fallen Dreg, Vandal, Captain)
- [x] Add enemy types (Hive Thrall, Acolyte, Knight)
- [x] Add enemy types (Vex Goblin, Hobgoblin, Minotaur)
- [x] Enemy AI with movement patterns and shooting
- [x] Projectile system for enemy attacks
- [x] Player health system with damage and death
- [x] Hit detection and collision system

### Guardian Abilities
- [x] Class selection (Titan, Hunter, Warlock)
- [x] Titan Shield ability with cooldown
- [x] Hunter Dodge ability with i-frames
- [x] Warlock Blink teleport ability
- [x] Ability cooldown UI indicators
- [x] Class-specific visual effects

### Boss Fights
- [x] Ogre boss with ground slam attack
- [x] Servitor boss with void blasts
- [x] Hydra boss with rotating shields
- [x] Boss health bars with phases
- [x] Boss spawn waves every N points
- [x] Unique boss attack patterns

### Power-ups
- [x] Super meter that charges from kills
- [x] Super activation with devastating attack
- [x] Heavy ammo drops (rocket launcher burst)
- [x] Overshield pickup (temporary damage reduction)
- [x] Special ammo for weapon upgrades
- [x] Power-up spawn system

### Multiple Levels
- [x] Cosmodrome environment (snow, ruins)
- [x] Europa environment (ice, Bray facility)
- [x] Dreaming City environment (taken corruption)
- [x] Environment-specific hazards
- [x] Level progression system
- [x] Visual theme changes per level

### Weapon System
- [x] Auto Rifle (rapid fire, low damage)
- [x] Hand Cannon (slow fire, high damage)
- [x] Pulse Rifle (burst fire)
- [x] Rocket Launcher (heavy, explosive)
- [x] Weapon engram drops to switch weapons
- [x] Weapon-specific visual effects

### Multiplayer Leaderboards
- [x] Real-time score submission
- [x] Global leaderboard display
- [x] Daily/weekly/all-time rankings
- [x] Player name display on scores
- [x] Live score updates during gameplay

## Mobile Touch Controls
- [x] Virtual joystick component for movement (left side)
- [x] Fire button overlay (right side)
- [x] Ability button (Q) touch control
- [x] Weapon switch buttons (1-4)
- [x] Super activation button (Space)
- [x] Touch event handling for multi-touch
- [x] Responsive sizing for different mobile screens
- [x] Hide touch controls on desktop

## Triumph Achievements System
- [x] Achievement data model and database schema
- [x] Kill tracking achievements (Kill 100 Thrall, 50 Captains, etc.)
- [x] Boss achievements (Defeat Phogoth, Sepiks, Argos)
- [x] Flawless achievements (Defeat boss without damage)
- [x] Score milestones (Reach 10K, 50K, 100K points)
- [x] Class mastery achievements (Complete level with each class)
- [x] Weapon mastery achievements (Get 100 kills with each weapon)
- [x] Achievement notification popups
- [x] Triumphs page with progress tracking
- [x] Achievement rewards (unlock cosmetics, titles)

## Loadout System
- [x] Database schema for loadouts (userId, name, class, weapon, icon, isDefault)
- [x] Create loadout API endpoints (create, update, delete, list, setDefault)
- [x] Loadout selection UI in game start menu
- [x] Quick-switch loadout buttons (1-5 slots)
- [x] Loadout icons/thumbnails based on class
- [x] Default loadout auto-selection on game start
- [x] Loadout management integrated into game start screen
- [x] 33 loadout system tests passing


## Network Topology Destiny 2 Redesign
- [x] Transform topology into "Traveler's Light Network" visualization
- [x] Replace node styling with Guardian class icons (Titan, Hunter, Warlock, Sentinel, Ghost)
- [x] Add Destiny-themed connection lines (Light streams with element colors)
- [x] Implement faction-based node grouping (Vanguard, Crucible, Gambit, Tower, Darkness zones)
- [x] Add glowing effects and flowing particle animations along edges
- [x] Use Destiny element colors (Solar orange, Arc blue, Void purple, Stasis ice, Strand green)
- [x] Add themed tooltips with Light Level, Element, and Faction info
- [x] Create dual legends for Elements and Factions with Destiny iconography
- [x] Central Traveler node with special rendering and gravity effect
- [x] Orbital ring layout for Guardian nodes
- [x] Named nodes after Destiny characters (Zavala, Ikora, Cayde, Saint-14, etc.)
- [x] Interactive node selection with detailed info panel
- [x] Canvas rendering with DPR scaling for crisp visuals
- [x] Physics-based node movement with damping


## Crucible Operations Center Redesign ("The Nine" Style)
- [x] Header with "THE NINE" branding, IP/MAC display, and CAPTURE status
- [x] Crucible Telemetry section with animated latency graph (45ms range)
- [x] Jitter Stability graph with 1ms baseline
- [x] Packet Loss indicator bar (red warning style)
- [x] Vanguard Security Protocols panel with Geo-Fencing toggle
- [x] Cheater Database status with threat count (2 THREATS badge)
- [x] VoIP Comms Array section with Voice Quality (MOS) score display
- [x] Voice Jitter metric (1.3ms style)
- [x] Live waveform/histogram visualization for voice quality
- [x] Lobby Telemetry table with Guardian names, platform badges, region, latency, jitter, loss/threat
- [x] Action buttons (Report) for suspicious players with VPN DETECTED/ELEVATED badges
- [x] Match History Correlation cards (Trials of Osiris, Competitive, Iron Banner)
- [x] K/D ratio and ping stats per match type
- [x] Net Deaths indicator with skull icons
- [x] Dark surveillance dashboard aesthetic with cyan/red accent colors

## Bug Fixes
- [x] Fix broken dashboard link in Crucible Operations Center (was working correctly)

## Navigation Improvements
- [x] Add Crucible link to dashboard top navigation
- [x] Implement breadcrumbs component for navigation flow
- [x] Optimize navigation for mobile responsiveness
- [x] Add hamburger menu for mobile view with slide-out menu
- [x] Hide username and refresh button on small screens
- [x] Active state highlighting for current page

## Navigation Improvements Phase 2
- [x] Add Triumphs link to dashboard top navigation
- [x] Add Triumphs link to mobile menu
- [x] Add breadcrumbs to Crucible page (Home > Command Center > Crucible Ops)
- [x] Add breadcrumbs to Topology page (Home > Command Center > Topology)
- [x] Add breadcrumbs to Settings page (Home > Command Center > Settings)
- [x] Implement swipe gestures to open/close mobile menu (swipe right to open, left to close)
- [x] Created reusable Breadcrumbs component

## Navigation Improvements Phase 3
- [x] Add breadcrumbs to Mini-Game page (Home > Command Center > Mini-Game)
- [x] Add breadcrumbs to Triumphs page (Home > Command Center > Triumphs)

## Page Transition Animations
- [x] Create PageTransition component with fade/slide effects
- [x] Integrate transitions into App.tsx router
- [x] Add inline style animations for smooth enter/exit (150ms exit, 250ms enter)
- [x] Test transitions across all pages (Dashboard, Topology, Crucible, etc.)


---

# REFACTORING TASKS

## 1. Critical: Large File Decomposition

### Game.tsx Decomposition (1,861 lines → ~8 modules)
- [ ] Extract game constants to `lib/game/constants.ts` (classes, weapons, enemies, engrams, powerups)
- [ ] Extract type definitions to `lib/game/types.ts`
- [ ] Extract enemy spawning logic to `lib/game/enemySystem.ts`
- [ ] Extract projectile system to `lib/game/projectileSystem.ts`
- [ ] Extract collision detection to `lib/game/collisionSystem.ts`
- [ ] Extract rendering functions to `lib/game/renderer.ts`
- [ ] Extract input handling to `hooks/useGameInput.ts`
- [ ] Extract game state management to `hooks/useGameState.ts`
- [ ] Update Game.tsx to import from new modules
- [ ] Add unit tests for extracted game systems

### routers.ts Decomposition (1,972 lines → ~8 files)
- [ ] Create `server/routers/index.ts` as main router combining sub-routers
- [ ] Extract ExtraHop routes to `server/routers/extrahop.ts`
- [ ] Extract game routes to `server/routers/game.ts`
- [ ] Extract lore routes to `server/routers/lore.ts`
- [ ] Extract crucible routes to `server/routers/crucible.ts`
- [ ] Extract bungie routes to `server/routers/bungie.ts`
- [ ] Extract achievement routes to `server/routers/achievements.ts`
- [ ] Extract loadout routes to `server/routers/loadout.ts`
- [ ] Update imports across the application

### db.ts Decomposition (1,149 lines → ~7 files)
- [ ] Create `server/db/index.ts` to re-export all functions
- [ ] Extract user operations to `server/db/users.ts`
- [ ] Extract ExtraHop config operations to `server/db/extrahop.ts`
- [ ] Extract game operations to `server/db/game.ts`
- [ ] Extract crucible operations to `server/db/crucible.ts`
- [ ] Extract achievement operations to `server/db/achievements.ts`
- [ ] Extract loadout operations to `server/db/loadouts.ts`

---

## 2. High: Eliminate Code Duplication

### Extract Shared Icon Components
- [ ] Create `components/icons/TricornLogo.tsx` (currently duplicated in Home, Dashboard, Settings)
- [ ] Create `components/icons/TheNineLogo.tsx` (from Crucible.tsx)
- [ ] Create `components/icons/TravelerIcon.tsx` (from Topology.tsx)
- [ ] Create `components/icons/index.ts` barrel export
- [ ] Update Home.tsx to use shared TricornLogo
- [ ] Update Dashboard.tsx to use shared TricornLogo
- [ ] Update Settings.tsx to use shared TricornLogo
- [ ] Update Crucible.tsx to use shared TheNineLogo
- [ ] Update Topology.tsx to use shared TravelerIcon

### Extract Shared Hooks
- [ ] Create `hooks/useSwipeGesture.ts` for mobile swipe detection
- [ ] Update Dashboard.tsx to use useSwipeGesture hook
- [ ] Create `hooks/useCanvas.ts` for common canvas setup patterns
- [ ] Update Game.tsx to use useCanvas hook
- [ ] Update Topology.tsx to use useCanvas hook
- [ ] Update Crucible.tsx TelemetryGraph to use useCanvas hook

---

## 3. High: Create Shared Constants

### Destiny 2 Color Theme
- [ ] Create `lib/destiny-theme.ts` with centralized color constants
- [ ] Add Guardian class colors (Titan, Hunter, Warlock)
- [ ] Add Element colors (Solar, Arc, Void, Stasis, Strand)
- [ ] Add Faction colors (Vanguard, Crucible, Gambit, Tower, Darkness)
- [ ] Add Enemy faction colors (Fallen, Hive, Vex)
- [ ] Add Engram rarity colors (Common, Uncommon, Rare, Legendary, Exotic)
- [ ] Add "The Nine" UI theme colors
- [ ] Update Game.tsx to use DESTINY_COLORS
- [ ] Update Topology.tsx to use DESTINY_COLORS
- [ ] Update Crucible.tsx to use DESTINY_COLORS
- [ ] Update BungieIntegration.tsx to use DESTINY_COLORS

### Magic Number Constants
- [ ] Create `lib/constants.ts` for app-wide constants
- [ ] Add DASHBOARD_REFRESH_INTERVAL_MS (currently 30000)
- [ ] Add GAME_TICK_RATE constants
- [ ] Add ANIMATION_DURATION constants
- [ ] Replace magic numbers throughout codebase

---

## 4. Medium: Type Safety Improvements

### Fix Type Assertions in BungieIntegration.tsx (14 instances)
- [ ] Create `MatchDetails` interface for match statistics
- [ ] Replace `(matchDetails as any).kills` with typed access
- [ ] Replace `(matchDetails as any).deaths` with typed access
- [ ] Replace `(matchDetails as any).assists` with typed access
- [ ] Replace `(matchDetails as any).kd` with typed access
- [ ] Replace `(matchDetails as any).efficiency` with typed access
- [ ] Replace `(matchDetails as any).score` with typed access
- [ ] Replace optional stat accesses with proper typing

### Fix Type Assertions in Game.tsx (9 instances)
- [ ] Add `shield` and `maxShield` to EnemyConfig interface
- [ ] Add `spread`, `explosive`, `explosionRadius` to WeaponConfig interface
- [ ] Add `melee`, `sniper`, `teleport` to EnemyConfig interface
- [ ] Replace all `(enemyData as any)` with typed access
- [ ] Replace all `(weapon as any)` with typed access

### Fix Type Assertions in Crucible.tsx (3 instances)
- [ ] Create `CrucibleDevice` interface
- [ ] Type `onDeviceFound` callback parameter
- [ ] Type `foundDevices` array properly

---

## 5. Medium: Component Extraction

### Extract Reusable Components
- [ ] Extract `TelemetryGraph` from Crucible.tsx to `components/charts/TelemetryGraph.tsx`
- [ ] Extract `VoiceQualityMeter` from Crucible.tsx to `components/charts/VoiceQualityMeter.tsx`
- [ ] Create `components/PageHeader.tsx` for consistent page headers
- [ ] Create `components/StatCard.tsx` for dashboard stat displays
- [ ] Create `components/LegendItem.tsx` (currently in Topology.tsx)

### LoreChatbot Global Integration
- [ ] Consider adding LoreChatbot to App.tsx layout wrapper
- [ ] Or create LoreChatbotProvider context
- [ ] Remove individual LoreChatbot imports from 5 pages

---

## 6. Low: Code Quality Improvements

### Cleanup Tasks
- [ ] Delete unused `components/PageTransition.tsx` (logic moved to App.tsx)
- [ ] Remove `console.log` from ComponentShowcase.tsx:197
- [ ] Review and remove any other debug statements
- [ ] Add JSDoc comments to exported functions in lib/

### Code Organization
- [ ] Create `lib/` directory structure for shared utilities
- [ ] Move game-related code to `lib/game/`
- [ ] Move destiny theme to `lib/destiny/`
- [ ] Update import paths across application

---

## 7. Performance Optimizations

### Canvas Rendering
- [ ] Create `useCanvas` hook with DPR handling and resize logic
- [ ] Add `useMemo` for static calculations in Game.tsx
- [ ] Add `useMemo` for static calculations in Topology.tsx
- [ ] Consider OffscreenCanvas for heavy rendering operations
- [ ] Profile and optimize game loop performance

### Query Optimization
- [ ] Add `staleTime` to dashboard queries to reduce refetches
- [ ] Review all `refetchInterval` settings for appropriateness
- [ ] Add `enabled` flags to conditional queries
- [ ] Implement query result caching where appropriate

---

## 8. Accessibility Improvements

### ARIA Labels
- [ ] Add aria-label to canvas elements in Game.tsx
- [ ] Add aria-label to canvas elements in Topology.tsx
- [ ] Add aria-label to canvas elements in Crucible.tsx
- [ ] Ensure all interactive elements have focus indicators
- [ ] Add screen reader descriptions for game state

### Color Contrast
- [ ] Audit "The Nine" dashboard colors for WCAG AA compliance
- [ ] Audit text colors on dark backgrounds
- [ ] Create high-contrast mode option if needed
- [ ] Document color contrast ratios in theme file

---

## 9. Testing Improvements

### Component Tests
- [ ] Add tests for LoadoutSelector component
- [ ] Add tests for TelemetryGraph component
- [ ] Add tests for Breadcrumbs component
- [ ] Add tests for PageTransition animations

### Integration Tests
- [ ] Add E2E test for game start flow
- [ ] Add E2E test for loadout save/load flow
- [ ] Add E2E test for Crucible monitoring flow
- [ ] Add E2E test for Bungie integration flow

### Visual Regression
- [ ] Set up visual regression testing for canvas components
- [ ] Add baseline screenshots for key UI states
- [ ] Configure CI to run visual tests

---

## Quick Wins Checklist (< 30 min each)
- [x] Delete unused PageTransition.tsx
- [x] Remove console.log from ComponentShowcase.tsx
- [x] Extract TricornLogo to shared component
- [x] Add staleTime to dashboard queries
- [x] Create DESTINY_COLORS constant file

---

*Tasks generated from code review on December 24, 2024*
