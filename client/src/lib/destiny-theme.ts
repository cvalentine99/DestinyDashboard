/**
 * Destiny 2 Theme Constants
 * Centralized color palette and theme values for consistent styling
 */

// Guardian Class Colors
export const GUARDIAN_CLASSES = {
  titan: {
    primary: "#FF6B35",
    name: "Titan",
  },
  hunter: {
    primary: "#7B68EE",
    name: "Hunter",
  },
  warlock: {
    primary: "#FFD700",
    name: "Warlock",
  },
} as const;

// Element Colors (Light and Darkness subclasses)
export const ELEMENTS = {
  solar: {
    primary: "#FF6B00",
    secondary: "#FFB347",
    glow: "rgba(255, 107, 0, 0.6)",
    name: "Solar",
  },
  arc: {
    primary: "#00BFFF",
    secondary: "#87CEEB",
    glow: "rgba(0, 191, 255, 0.6)",
    name: "Arc",
  },
  void: {
    primary: "#9B30FF",
    secondary: "#DA70D6",
    glow: "rgba(155, 48, 255, 0.6)",
    name: "Void",
  },
  stasis: {
    primary: "#4169E1",
    secondary: "#B0E0E6",
    glow: "rgba(65, 105, 225, 0.6)",
    name: "Stasis",
  },
  strand: {
    primary: "#32CD32",
    secondary: "#98FB98",
    glow: "rgba(50, 205, 50, 0.6)",
    name: "Strand",
  },
} as const;

// Faction Colors
export const FACTIONS = {
  vanguard: {
    primary: "#00CED1",
    secondary: "#20B2AA",
    icon: "🛡️",
    name: "Vanguard",
  },
  crucible: {
    primary: "#DC143C",
    secondary: "#FF6347",
    icon: "⚔️",
    name: "Crucible",
  },
  gambit: {
    primary: "#228B22",
    secondary: "#32CD32",
    icon: "🎲",
    name: "Gambit",
  },
  tower: {
    primary: "#FFD700",
    secondary: "#FFA500",
    icon: "🏰",
    name: "Tower",
  },
  darkness: {
    primary: "#2F4F4F",
    secondary: "#696969",
    icon: "👁️",
    name: "Darkness Zone",
  },
} as const;

// Enemy Faction Colors
export const ENEMY_FACTIONS = {
  fallen: {
    primary: "#4A90A4",
    secondary: "#3D7A8C",
    dark: "#2D5A6A",
    name: "Fallen",
  },
  hive: {
    primary: "#5C4033",
    secondary: "#4A3728",
    dark: "#3D2D20",
    name: "Hive",
  },
  vex: {
    primary: "#C0C0C0",
    secondary: "#A0A0A0",
    dark: "#808080",
    name: "Vex",
  },
  cabal: {
    primary: "#8B4513",
    secondary: "#A0522D",
    dark: "#654321",
    name: "Cabal",
  },
  taken: {
    primary: "#1A1A2E",
    secondary: "#16213E",
    dark: "#0F0F1A",
    name: "Taken",
  },
} as const;

// Engram Rarity Colors
export const ENGRAM_RARITIES = {
  common: {
    color: "#FFFFFF",
    name: "Common",
    points: 10,
  },
  uncommon: {
    color: "#4ADE80",
    name: "Uncommon",
    points: 25,
  },
  rare: {
    color: "#60A5FA",
    name: "Rare",
    points: 50,
  },
  legendary: {
    color: "#A855F7",
    name: "Legendary",
    points: 100,
  },
  exotic: {
    color: "#FBBF24",
    name: "Exotic",
    points: 250,
  },
} as const;

// "The Nine" Surveillance Dashboard Theme
export const THE_NINE_THEME = {
  background: "#0a1520",
  card: "#0d1a25",
  border: "rgba(0, 139, 139, 0.3)",
  borderHover: "rgba(0, 139, 139, 0.5)",
  accent: "#00CED1",
  accentDim: "rgba(0, 206, 209, 0.3)",
  warning: "#FF6347",
  danger: "#DC143C",
  success: "#32CD32",
} as const;

// Weapon Colors
export const WEAPON_COLORS = {
  autoRifle: "#4ADE80",
  handCannon: "#FBBF24",
  pulseRifle: "#60A5FA",
  rocketLauncher: "#FF6B35",
  shotgun: "#A855F7",
  sniperRifle: "#00CED1",
  fusionRifle: "#9B30FF",
  sidearm: "#FFD700",
} as const;

// Power-up Colors
export const POWERUP_COLORS = {
  overshield: "#60A5FA",
  heavyAmmo: "#A855F7",
  superCharge: "#FBBF24",
  healthPack: "#4ADE80",
} as const;

// UI Status Colors
export const STATUS_COLORS = {
  online: "#4ADE80",
  offline: "#6B7280",
  warning: "#FBBF24",
  danger: "#EF4444",
  info: "#60A5FA",
} as const;

// Animation Durations (in ms)
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 250,
  slow: 400,
  pageTransition: {
    exit: 150,
    enter: 250,
  },
} as const;

// Refresh Intervals (in ms)
export const REFRESH_INTERVALS = {
  dashboard: 30000,
  staleTime: 15000,
  realtime: 5000,
  topology: 10000,
} as const;

// Type exports for TypeScript
export type GuardianClass = keyof typeof GUARDIAN_CLASSES;
export type Element = keyof typeof ELEMENTS;
export type Faction = keyof typeof FACTIONS;
export type EnemyFaction = keyof typeof ENEMY_FACTIONS;
export type EngramRarity = keyof typeof ENGRAM_RARITIES;
export type WeaponType = keyof typeof WEAPON_COLORS;
export type PowerupType = keyof typeof POWERUP_COLORS;
