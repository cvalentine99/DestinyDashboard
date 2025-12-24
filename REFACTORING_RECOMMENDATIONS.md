# Refactoring Recommendations for Second Sight Forensics

This document outlines areas for improvement identified during a comprehensive code review of the application.

---

## 1. Critical: Large File Decomposition

### Game.tsx (1,861 lines)
**Priority: High**

The game page is a monolithic file that should be split into multiple modules:

| Current Section | Recommended Module | Lines |
|-----------------|-------------------|-------|
| Game constants (classes, weapons, enemies) | `lib/game/constants.ts` | ~170 |
| Type definitions | `lib/game/types.ts` | ~50 |
| Enemy spawning logic | `lib/game/enemySystem.ts` | ~200 |
| Projectile system | `lib/game/projectileSystem.ts` | ~150 |
| Collision detection | `lib/game/collisionSystem.ts` | ~100 |
| Rendering functions | `lib/game/renderer.ts` | ~400 |
| Input handling | `hooks/useGameInput.ts` | ~100 |
| Game state management | `hooks/useGameState.ts` | ~150 |

**Benefits:**
- Easier testing of individual systems
- Better code organization and discoverability
- Reduced cognitive load when making changes
- Enables code reuse across game modes

### routers.ts (1,972 lines)
**Priority: High**

Split into domain-specific router files:

```
server/routers/
├── index.ts          # Main router combining all sub-routers
├── extrahop.ts       # ExtraHop integration routes
├── game.ts           # Game scoring and leaderboard routes
├── lore.ts           # Lore chatbot routes
├── crucible.ts       # Crucible monitoring routes
├── bungie.ts         # Bungie API integration routes
├── achievements.ts   # Achievement/triumph routes
└── loadout.ts        # Guardian loadout routes
```

### db.ts (1,149 lines)
**Priority: Medium**

Organize database functions by domain:

```
server/db/
├── index.ts          # Re-exports all functions
├── users.ts          # User CRUD operations
├── extrahop.ts       # ExtraHop config operations
├── game.ts           # Game scores and stats
├── crucible.ts       # Crucible match data
├── achievements.ts   # Achievement tracking
└── loadouts.ts       # Guardian loadouts
```

---

## 2. High: Eliminate Code Duplication

### TricornLogo Component (Duplicated 3x)
**Files:** `Home.tsx`, `Dashboard.tsx`, `Settings.tsx`

**Action:** Extract to `components/icons/TricornLogo.tsx`

```tsx
// components/icons/TricornLogo.tsx
export const TricornLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50 5 L95 85 L50 65 L5 85 Z" />
    <path d="M50 25 L75 70 L50 55 L25 70 Z" opacity="0.6" />
  </svg>
);
```

### TheNineLogo Component
**File:** `Crucible.tsx`

**Action:** Extract to `components/icons/TheNineLogo.tsx`

### TravelerIcon Component
**File:** `Topology.tsx`

**Action:** Extract to `components/icons/TravelerIcon.tsx`

### Swipe Gesture Logic (Duplicated)
**Files:** `Dashboard.tsx`

**Action:** Extract to `hooks/useSwipeGesture.ts`

```tsx
// hooks/useSwipeGesture.ts
export function useSwipeGesture(options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minDistance?: number;
}) { ... }
```

---

## 3. High: Create Shared Constants

### Destiny 2 Color Palette
**Issue:** 85+ hardcoded hex colors scattered across files

**Action:** Create centralized theme constants:

```tsx
// lib/destiny-theme.ts
export const DESTINY_COLORS = {
  // Guardian Classes
  titan: "#FF6B35",
  hunter: "#7B68EE",
  warlock: "#FFD700",
  
  // Elements
  solar: { primary: "#FF6B00", secondary: "#FFB347", glow: "rgba(255, 107, 0, 0.6)" },
  arc: { primary: "#00BFFF", secondary: "#87CEEB", glow: "rgba(0, 191, 255, 0.6)" },
  void: { primary: "#9B30FF", secondary: "#DA70D6", glow: "rgba(155, 48, 255, 0.6)" },
  stasis: { primary: "#4169E1", secondary: "#B0E0E6", glow: "rgba(65, 105, 225, 0.6)" },
  strand: { primary: "#32CD32", secondary: "#98FB98", glow: "rgba(50, 205, 50, 0.6)" },
  
  // Factions
  vanguard: "#00CED1",
  crucible: "#DC143C",
  gambit: "#228B22",
  tower: "#FFD700",
  darkness: "#2F4F4F",
  
  // Enemy Factions
  fallen: "#4A90A4",
  hive: "#5C4033",
  vex: "#C0C0C0",
  
  // Engram Rarities
  common: "#FFFFFF",
  uncommon: "#4ADE80",
  rare: "#60A5FA",
  legendary: "#A855F7",
  exotic: "#FBBF24",
  
  // UI
  theNine: {
    background: "#0a1520",
    card: "#0d1a25",
    border: "rgba(0, 139, 139, 0.3)",
    accent: "#00CED1",
  },
} as const;
```

---

## 4. Medium: Type Safety Improvements

### Remove `as any` Type Assertions (27 instances)

**BungieIntegration.tsx (14 instances)**
Create proper type for match details:

```tsx
interface MatchDetails {
  kills: number;
  deaths: number;
  assists: number;
  kd: string;
  efficiency: string;
  score: number;
  precisionKills?: number;
  superKills?: number;
  longestKillSpree?: number;
}
```

**Game.tsx (9 instances)**
Add proper typing to weapon and enemy interfaces:

```tsx
interface WeaponConfig {
  name: string;
  color: string;
  fireRate: number;
  damage: number;
  projectileSpeed: number;
  spread?: number;
  burst?: number;
  explosive?: boolean;
  explosionRadius?: number;
}

interface EnemyConfig {
  name: string;
  faction: "fallen" | "hive" | "vex";
  health: number;
  speed: number;
  damage: number;
  points: number;
  size: number;
  color: string;
  fireRate: number;
  melee?: boolean;
  shield?: number;
  sniper?: boolean;
  teleport?: boolean;
}
```

**Crucible.tsx (3 instances)**
Define device interface:

```tsx
interface CrucibleDevice {
  id: number;
  name: string;
  ipAddress: string;
  macAddress: string;
  deviceType: string;
}
```

---

## 5. Medium: Component Extraction

### LoreChatbot Integration
**Issue:** LoreChatbot is imported in 5 different pages

**Action:** Consider adding to a layout wrapper or making it globally available via context, so it doesn't need to be imported individually.

### Navigation Header
**Issue:** Similar navigation patterns in Dashboard, Crucible, Topology, etc.

**Action:** Create a reusable `PageHeader` component:

```tsx
// components/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}
```

### Telemetry Graphs
**Issue:** `TelemetryGraph` component is defined inline in Crucible.tsx

**Action:** Extract to `components/charts/TelemetryGraph.tsx`

---

## 6. Low: Code Quality Improvements

### Remove Debug Statements
- `ComponentShowcase.tsx:197` - Remove `console.log`

### Unused Component
- `PageTransition.tsx` in components folder is unused (logic moved to App.tsx)

**Action:** Delete `/home/ubuntu/second-sight-forensics/client/src/components/PageTransition.tsx`

### Magic Numbers
Replace magic numbers with named constants:

```tsx
// Before
{ refetchInterval: 30000 }

// After
const DASHBOARD_REFRESH_INTERVAL_MS = 30_000;
{ refetchInterval: DASHBOARD_REFRESH_INTERVAL_MS }
```

---

## 7. Performance Optimizations

### Canvas Rendering
**Files:** `Game.tsx`, `Topology.tsx`, `Crucible.tsx`

**Issues:**
- Multiple canvas components with similar setup patterns
- No memoization of expensive calculations

**Actions:**
1. Create a `useCanvas` hook for common canvas setup
2. Use `useMemo` for static calculations
3. Consider using `OffscreenCanvas` for heavy rendering

### Query Optimization
**Issue:** Some queries refetch more frequently than necessary

**Actions:**
1. Review `refetchInterval` settings
2. Add `staleTime` to reduce unnecessary refetches
3. Use `enabled` flag to prevent queries when data isn't needed

---

## 8. Accessibility Improvements

### Missing ARIA Labels
- Canvas elements lack accessible descriptions
- Some interactive elements missing focus indicators

### Color Contrast
- Some text on dark backgrounds may not meet WCAG AA standards
- Review "The Nine" dashboard color scheme for contrast ratios

---

## 9. Testing Gaps

### Current Coverage
- 212 tests passing
- Server-side routers well covered

### Recommended Additions
1. **Component tests** for complex UI components (LoadoutSelector, TelemetryGraph)
2. **Integration tests** for critical user flows
3. **Visual regression tests** for canvas-based components

---

## Implementation Priority

| Priority | Category | Estimated Effort | Impact |
|----------|----------|------------------|--------|
| 1 | Split Game.tsx | 4-6 hours | High |
| 2 | Split routers.ts | 2-3 hours | High |
| 3 | Extract shared icons | 1 hour | Medium |
| 4 | Create color constants | 2 hours | Medium |
| 5 | Fix type assertions | 2-3 hours | Medium |
| 6 | Split db.ts | 2 hours | Medium |
| 7 | Extract hooks | 1-2 hours | Low |
| 8 | Performance optimizations | 3-4 hours | Medium |
| 9 | Accessibility fixes | 2-3 hours | Medium |

---

## Quick Wins (< 30 minutes each)

1. ✅ Delete unused `PageTransition.tsx` component
2. ✅ Remove `console.log` from ComponentShowcase.tsx
3. ✅ Extract `TricornLogo` to shared component
4. ✅ Add `staleTime` to dashboard queries
5. ✅ Create `DESTINY_COLORS` constant file

---

*Generated: December 24, 2024*
*Reviewed files: 24 client components, 15 server files, 3 shared utilities*
