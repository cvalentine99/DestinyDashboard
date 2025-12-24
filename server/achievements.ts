// ============================================================================
// TRIUMPH ACHIEVEMENTS SYSTEM
// ============================================================================

// Achievement definitions - all achievements available in the game
export const ACHIEVEMENT_DEFINITIONS = {
  // ===== COMBAT ACHIEVEMENTS =====
  // Fallen kills
  kill_10_dregs: {
    id: "kill_10_dregs",
    name: "Dreg Slayer",
    description: "Eliminate 10 Fallen Dregs",
    category: "combat" as const,
    tier: "bronze" as const,
    targetValue: 10,
    rewardType: "points" as const,
    triumphPoints: 5,
    statKey: "dregKills",
  },
  kill_100_dregs: {
    id: "kill_100_dregs",
    name: "Dreg Exterminator",
    description: "Eliminate 100 Fallen Dregs",
    category: "combat" as const,
    tier: "silver" as const,
    targetValue: 100,
    rewardType: "points" as const,
    triumphPoints: 15,
    statKey: "dregKills",
  },
  kill_50_vandals: {
    id: "kill_50_vandals",
    name: "Vandal Hunter",
    description: "Eliminate 50 Fallen Vandals",
    category: "combat" as const,
    tier: "silver" as const,
    targetValue: 50,
    rewardType: "points" as const,
    triumphPoints: 20,
    statKey: "vandalKills",
  },
  kill_25_captains: {
    id: "kill_25_captains",
    name: "Captain's Bane",
    description: "Eliminate 25 Fallen Captains",
    category: "combat" as const,
    tier: "gold" as const,
    targetValue: 25,
    rewardType: "points" as const,
    triumphPoints: 30,
    statKey: "captainKills",
  },
  // Hive kills
  kill_100_thrall: {
    id: "kill_100_thrall",
    name: "Thrall Thrasher",
    description: "Eliminate 100 Hive Thrall",
    category: "combat" as const,
    tier: "silver" as const,
    targetValue: 100,
    rewardType: "points" as const,
    triumphPoints: 15,
    statKey: "thrallKills",
  },
  kill_500_thrall: {
    id: "kill_500_thrall",
    name: "Thrall Annihilator",
    description: "Eliminate 500 Hive Thrall",
    category: "combat" as const,
    tier: "gold" as const,
    targetValue: 500,
    rewardType: "title" as const,
    rewardValue: "Thrallslayer",
    triumphPoints: 50,
    statKey: "thrallKills",
  },
  kill_50_acolytes: {
    id: "kill_50_acolytes",
    name: "Acolyte Abolisher",
    description: "Eliminate 50 Hive Acolytes",
    category: "combat" as const,
    tier: "silver" as const,
    targetValue: 50,
    rewardType: "points" as const,
    triumphPoints: 20,
    statKey: "acolyteKills",
  },
  kill_25_knights: {
    id: "kill_25_knights",
    name: "Knight Slayer",
    description: "Eliminate 25 Hive Knights",
    category: "combat" as const,
    tier: "gold" as const,
    targetValue: 25,
    rewardType: "points" as const,
    triumphPoints: 35,
    statKey: "knightKills",
  },
  // Vex kills
  kill_50_goblins: {
    id: "kill_50_goblins",
    name: "Goblin Crusher",
    description: "Eliminate 50 Vex Goblins",
    category: "combat" as const,
    tier: "silver" as const,
    targetValue: 50,
    rewardType: "points" as const,
    triumphPoints: 15,
    statKey: "goblinKills",
  },
  kill_25_hobgoblins: {
    id: "kill_25_hobgoblins",
    name: "Sniper's End",
    description: "Eliminate 25 Vex Hobgoblins",
    category: "combat" as const,
    tier: "gold" as const,
    targetValue: 25,
    rewardType: "points" as const,
    triumphPoints: 25,
    statKey: "hobgoblinKills",
  },
  kill_10_minotaurs: {
    id: "kill_10_minotaurs",
    name: "Minotaur Destroyer",
    description: "Eliminate 10 Vex Minotaurs",
    category: "combat" as const,
    tier: "gold" as const,
    targetValue: 10,
    rewardType: "points" as const,
    triumphPoints: 30,
    statKey: "minotaurKills",
  },
  // Total kills
  kill_1000_total: {
    id: "kill_1000_total",
    name: "Thousand Kills",
    description: "Eliminate 1,000 enemies total",
    category: "combat" as const,
    tier: "gold" as const,
    targetValue: 1000,
    rewardType: "title" as const,
    rewardValue: "Slayer",
    triumphPoints: 50,
    statKey: "totalKills",
  },
  kill_10000_total: {
    id: "kill_10000_total",
    name: "Ten Thousand Strong",
    description: "Eliminate 10,000 enemies total",
    category: "combat" as const,
    tier: "platinum" as const,
    targetValue: 10000,
    rewardType: "title" as const,
    rewardValue: "Reaper",
    triumphPoints: 200,
    statKey: "totalKills",
  },

  // ===== BOSS ACHIEVEMENTS =====
  defeat_phogoth: {
    id: "defeat_phogoth",
    name: "Phogoth's End",
    description: "Defeat Phogoth the Untamed",
    category: "boss" as const,
    tier: "gold" as const,
    targetValue: 1,
    rewardType: "points" as const,
    triumphPoints: 50,
    statKey: "ogreKills",
  },
  defeat_phogoth_10: {
    id: "defeat_phogoth_10",
    name: "Ogre Slayer",
    description: "Defeat Phogoth 10 times",
    category: "boss" as const,
    tier: "platinum" as const,
    targetValue: 10,
    rewardType: "title" as const,
    rewardValue: "Ogreslayer",
    triumphPoints: 100,
    statKey: "ogreKills",
  },
  defeat_sepiks: {
    id: "defeat_sepiks",
    name: "Sepiks Destroyed",
    description: "Defeat Sepiks Prime",
    category: "boss" as const,
    tier: "gold" as const,
    targetValue: 1,
    rewardType: "points" as const,
    triumphPoints: 50,
    statKey: "servitorKills",
  },
  defeat_sepiks_10: {
    id: "defeat_sepiks_10",
    name: "Prime Hunter",
    description: "Defeat Sepiks Prime 10 times",
    category: "boss" as const,
    tier: "platinum" as const,
    targetValue: 10,
    rewardType: "title" as const,
    rewardValue: "Kell Breaker",
    triumphPoints: 100,
    statKey: "servitorKills",
  },
  defeat_argos: {
    id: "defeat_argos",
    name: "Core Breaker",
    description: "Defeat Argos, Planetary Core",
    category: "boss" as const,
    tier: "gold" as const,
    targetValue: 1,
    rewardType: "points" as const,
    triumphPoints: 50,
    statKey: "hydraKills",
  },
  defeat_argos_10: {
    id: "defeat_argos_10",
    name: "Vex Mythoclast",
    description: "Defeat Argos 10 times",
    category: "boss" as const,
    tier: "platinum" as const,
    targetValue: 10,
    rewardType: "title" as const,
    rewardValue: "Vex Mythoclast",
    triumphPoints: 100,
    statKey: "hydraKills",
  },
  defeat_all_bosses: {
    id: "defeat_all_bosses",
    name: "Boss Slayer",
    description: "Defeat all three bosses at least once",
    category: "boss" as const,
    tier: "exotic" as const,
    targetValue: 3,
    rewardType: "title" as const,
    rewardValue: "Raid Boss",
    triumphPoints: 150,
    statKey: "special", // Calculated from multiple stats
  },

  // ===== FLAWLESS ACHIEVEMENTS =====
  flawless_phogoth: {
    id: "flawless_phogoth",
    name: "Flawless Phogoth",
    description: "Defeat Phogoth without taking damage",
    category: "flawless" as const,
    tier: "exotic" as const,
    targetValue: 1,
    rewardType: "title" as const,
    rewardValue: "Flawless",
    triumphPoints: 200,
    statKey: "flawlessOgre",
  },
  flawless_sepiks: {
    id: "flawless_sepiks",
    name: "Flawless Sepiks",
    description: "Defeat Sepiks Prime without taking damage",
    category: "flawless" as const,
    tier: "exotic" as const,
    targetValue: 1,
    rewardType: "title" as const,
    rewardValue: "Untouchable",
    triumphPoints: 200,
    statKey: "flawlessServitor",
  },
  flawless_argos: {
    id: "flawless_argos",
    name: "Flawless Argos",
    description: "Defeat Argos without taking damage",
    category: "flawless" as const,
    tier: "exotic" as const,
    targetValue: 1,
    rewardType: "title" as const,
    rewardValue: "Perfected",
    triumphPoints: 200,
    statKey: "flawlessHydra",
  },

  // ===== SCORE ACHIEVEMENTS =====
  score_10k: {
    id: "score_10k",
    name: "Rising Guardian",
    description: "Reach a score of 10,000 in a single game",
    category: "score" as const,
    tier: "bronze" as const,
    targetValue: 10000,
    rewardType: "points" as const,
    triumphPoints: 10,
    statKey: "highestScore",
  },
  score_50k: {
    id: "score_50k",
    name: "Veteran Guardian",
    description: "Reach a score of 50,000 in a single game",
    category: "score" as const,
    tier: "silver" as const,
    targetValue: 50000,
    rewardType: "points" as const,
    triumphPoints: 25,
    statKey: "highestScore",
  },
  score_100k: {
    id: "score_100k",
    name: "Elite Guardian",
    description: "Reach a score of 100,000 in a single game",
    category: "score" as const,
    tier: "gold" as const,
    targetValue: 100000,
    rewardType: "title" as const,
    rewardValue: "Elite",
    triumphPoints: 50,
    statKey: "highestScore",
  },
  score_250k: {
    id: "score_250k",
    name: "Legend",
    description: "Reach a score of 250,000 in a single game",
    category: "score" as const,
    tier: "platinum" as const,
    targetValue: 250000,
    rewardType: "title" as const,
    rewardValue: "Legend",
    triumphPoints: 100,
    statKey: "highestScore",
  },
  score_500k: {
    id: "score_500k",
    name: "Mythic",
    description: "Reach a score of 500,000 in a single game",
    category: "score" as const,
    tier: "exotic" as const,
    targetValue: 500000,
    rewardType: "title" as const,
    rewardValue: "Mythic",
    triumphPoints: 250,
    statKey: "highestScore",
  },

  // ===== CLASS ACHIEVEMENTS =====
  titan_10_games: {
    id: "titan_10_games",
    name: "Titan Initiate",
    description: "Complete 10 games as a Titan",
    category: "class" as const,
    tier: "bronze" as const,
    targetValue: 10,
    rewardType: "points" as const,
    triumphPoints: 10,
    statKey: "titanGamesPlayed",
  },
  titan_mastery: {
    id: "titan_mastery",
    name: "Titan Mastery",
    description: "Win 25 games as a Titan",
    category: "class" as const,
    tier: "gold" as const,
    targetValue: 25,
    rewardType: "title" as const,
    rewardValue: "Sentinel",
    triumphPoints: 75,
    statKey: "titanWins",
  },
  hunter_10_games: {
    id: "hunter_10_games",
    name: "Hunter Initiate",
    description: "Complete 10 games as a Hunter",
    category: "class" as const,
    tier: "bronze" as const,
    targetValue: 10,
    rewardType: "points" as const,
    triumphPoints: 10,
    statKey: "hunterGamesPlayed",
  },
  hunter_mastery: {
    id: "hunter_mastery",
    name: "Hunter Mastery",
    description: "Win 25 games as a Hunter",
    category: "class" as const,
    tier: "gold" as const,
    targetValue: 25,
    rewardType: "title" as const,
    rewardValue: "Nightstalker",
    triumphPoints: 75,
    statKey: "hunterWins",
  },
  warlock_10_games: {
    id: "warlock_10_games",
    name: "Warlock Initiate",
    description: "Complete 10 games as a Warlock",
    category: "class" as const,
    tier: "bronze" as const,
    targetValue: 10,
    rewardType: "points" as const,
    triumphPoints: 10,
    statKey: "warlockGamesPlayed",
  },
  warlock_mastery: {
    id: "warlock_mastery",
    name: "Warlock Mastery",
    description: "Win 25 games as a Warlock",
    category: "class" as const,
    tier: "gold" as const,
    targetValue: 25,
    rewardType: "title" as const,
    rewardValue: "Voidwalker",
    triumphPoints: 75,
    statKey: "warlockWins",
  },
  all_class_mastery: {
    id: "all_class_mastery",
    name: "Guardian of All",
    description: "Win 10 games with each class",
    category: "class" as const,
    tier: "exotic" as const,
    targetValue: 30,
    rewardType: "title" as const,
    rewardValue: "Iron Lord",
    triumphPoints: 150,
    statKey: "special",
  },

  // ===== WEAPON ACHIEVEMENTS =====
  auto_rifle_100: {
    id: "auto_rifle_100",
    name: "Auto Rifle Adept",
    description: "Get 100 kills with Auto Rifle",
    category: "weapon" as const,
    tier: "silver" as const,
    targetValue: 100,
    rewardType: "points" as const,
    triumphPoints: 20,
    statKey: "autoRifleKills",
  },
  auto_rifle_500: {
    id: "auto_rifle_500",
    name: "Auto Rifle Master",
    description: "Get 500 kills with Auto Rifle",
    category: "weapon" as const,
    tier: "gold" as const,
    targetValue: 500,
    rewardType: "points" as const,
    triumphPoints: 50,
    statKey: "autoRifleKills",
  },
  hand_cannon_100: {
    id: "hand_cannon_100",
    name: "Hand Cannon Adept",
    description: "Get 100 kills with Hand Cannon",
    category: "weapon" as const,
    tier: "silver" as const,
    targetValue: 100,
    rewardType: "points" as const,
    triumphPoints: 25,
    statKey: "handCannonKills",
  },
  hand_cannon_500: {
    id: "hand_cannon_500",
    name: "Hand Cannon Master",
    description: "Get 500 kills with Hand Cannon",
    category: "weapon" as const,
    tier: "gold" as const,
    targetValue: 500,
    rewardType: "title" as const,
    rewardValue: "Gunslinger",
    triumphPoints: 75,
    statKey: "handCannonKills",
  },
  pulse_rifle_100: {
    id: "pulse_rifle_100",
    name: "Pulse Rifle Adept",
    description: "Get 100 kills with Pulse Rifle",
    category: "weapon" as const,
    tier: "silver" as const,
    targetValue: 100,
    rewardType: "points" as const,
    triumphPoints: 20,
    statKey: "pulseRifleKills",
  },
  rocket_50: {
    id: "rocket_50",
    name: "Rocket Scientist",
    description: "Get 50 kills with Rocket Launcher",
    category: "weapon" as const,
    tier: "gold" as const,
    targetValue: 50,
    rewardType: "points" as const,
    triumphPoints: 40,
    statKey: "rocketLauncherKills",
  },
  rocket_200: {
    id: "rocket_200",
    name: "Heavy Weapons Expert",
    description: "Get 200 kills with Rocket Launcher",
    category: "weapon" as const,
    tier: "platinum" as const,
    targetValue: 200,
    rewardType: "title" as const,
    rewardValue: "Bombardier",
    triumphPoints: 100,
    statKey: "rocketLauncherKills",
  },

  // ===== SURVIVAL ACHIEVEMENTS =====
  survive_wave_10: {
    id: "survive_wave_10",
    name: "Survivor",
    description: "Survive to Wave 10",
    category: "survival" as const,
    tier: "bronze" as const,
    targetValue: 10,
    rewardType: "points" as const,
    triumphPoints: 10,
    statKey: "highestWave",
  },
  survive_wave_25: {
    id: "survive_wave_25",
    name: "Endurance",
    description: "Survive to Wave 25",
    category: "survival" as const,
    tier: "silver" as const,
    targetValue: 25,
    rewardType: "points" as const,
    triumphPoints: 30,
    statKey: "highestWave",
  },
  survive_wave_50: {
    id: "survive_wave_50",
    name: "Unbreakable",
    description: "Survive to Wave 50",
    category: "survival" as const,
    tier: "gold" as const,
    targetValue: 50,
    rewardType: "title" as const,
    rewardValue: "Unbreakable",
    triumphPoints: 75,
    statKey: "highestWave",
  },
  clear_cosmodrome: {
    id: "clear_cosmodrome",
    name: "Cosmodrome Cleared",
    description: "Complete the Cosmodrome level",
    category: "survival" as const,
    tier: "silver" as const,
    targetValue: 1,
    rewardType: "points" as const,
    triumphPoints: 25,
    statKey: "cosmodromeClears",
  },
  clear_europa: {
    id: "clear_europa",
    name: "Europa Cleared",
    description: "Complete the Europa level",
    category: "survival" as const,
    tier: "silver" as const,
    targetValue: 1,
    rewardType: "points" as const,
    triumphPoints: 30,
    statKey: "europaClears",
  },
  clear_dreaming_city: {
    id: "clear_dreaming_city",
    name: "Dreaming City Cleared",
    description: "Complete the Dreaming City level",
    category: "survival" as const,
    tier: "gold" as const,
    targetValue: 1,
    rewardType: "points" as const,
    triumphPoints: 40,
    statKey: "dreamingCityClears",
  },

  // ===== COLLECTION ACHIEVEMENTS =====
  collect_100_engrams: {
    id: "collect_100_engrams",
    name: "Engram Collector",
    description: "Collect 100 engrams total",
    category: "collection" as const,
    tier: "bronze" as const,
    targetValue: 100,
    rewardType: "points" as const,
    triumphPoints: 10,
    statKey: "special",
  },
  collect_10_exotic: {
    id: "collect_10_exotic",
    name: "Exotic Hunter",
    description: "Collect 10 Exotic engrams",
    category: "collection" as const,
    tier: "gold" as const,
    targetValue: 10,
    rewardType: "points" as const,
    triumphPoints: 50,
    statKey: "exoticEngrams",
  },
  collect_100_exotic: {
    id: "collect_100_exotic",
    name: "Exotic Hoarder",
    description: "Collect 100 Exotic engrams",
    category: "collection" as const,
    tier: "exotic" as const,
    targetValue: 100,
    rewardType: "title" as const,
    rewardValue: "Collector",
    triumphPoints: 150,
    statKey: "exoticEngrams",
  },

  // ===== SPECIAL ACHIEVEMENTS =====
  first_game: {
    id: "first_game",
    name: "Eyes Up, Guardian",
    description: "Complete your first game",
    category: "special" as const,
    tier: "bronze" as const,
    targetValue: 1,
    rewardType: "points" as const,
    triumphPoints: 5,
    statKey: "gamesPlayed",
  },
  play_100_games: {
    id: "play_100_games",
    name: "Dedicated Guardian",
    description: "Play 100 games",
    category: "special" as const,
    tier: "gold" as const,
    targetValue: 100,
    rewardType: "title" as const,
    rewardValue: "Veteran",
    triumphPoints: 100,
    statKey: "gamesPlayed",
  },
  use_100_abilities: {
    id: "use_100_abilities",
    name: "Ability Spammer",
    description: "Use class abilities 100 times",
    category: "special" as const,
    tier: "silver" as const,
    targetValue: 100,
    rewardType: "points" as const,
    triumphPoints: 25,
    statKey: "abilitiesUsed",
  },
  use_50_supers: {
    id: "use_50_supers",
    name: "Super Charged",
    description: "Activate Super 50 times",
    category: "special" as const,
    tier: "gold" as const,
    targetValue: 50,
    rewardType: "points" as const,
    triumphPoints: 40,
    statKey: "supersUsed",
  },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENT_DEFINITIONS;
export type AchievementDefinition = typeof ACHIEVEMENT_DEFINITIONS[AchievementId];

// Get achievement tier color
export function getAchievementTierColor(tier: string): string {
  switch (tier) {
    case "bronze": return "#CD7F32";
    case "silver": return "#C0C0C0";
    case "gold": return "#FFD700";
    case "platinum": return "#E5E4E2";
    case "exotic": return "#FBBF24";
    default: return "#808080";
  }
}

// Get achievement category icon
export function getAchievementCategoryIcon(category: string): string {
  switch (category) {
    case "combat": return "⚔️";
    case "boss": return "💀";
    case "flawless": return "✨";
    case "score": return "🏆";
    case "class": return "🛡️";
    case "weapon": return "🔫";
    case "survival": return "❤️";
    case "collection": return "💎";
    case "special": return "⭐";
    default: return "🎯";
  }
}

// Calculate special achievement progress
export function calculateSpecialAchievementProgress(
  achievementId: string,
  stats: Record<string, number>
): number {
  switch (achievementId) {
    case "defeat_all_bosses":
      // Count how many unique bosses have been defeated
      let bossesDefeated = 0;
      if (stats.ogreKills > 0) bossesDefeated++;
      if (stats.servitorKills > 0) bossesDefeated++;
      if (stats.hydraKills > 0) bossesDefeated++;
      return bossesDefeated;
    
    case "all_class_mastery":
      // Minimum wins across all classes * 3
      const minWins = Math.min(
        stats.titanWins || 0,
        stats.hunterWins || 0,
        stats.warlockWins || 0
      );
      return minWins >= 10 ? 30 : Math.min(stats.titanWins || 0, 10) + 
             Math.min(stats.hunterWins || 0, 10) + 
             Math.min(stats.warlockWins || 0, 10);
    
    case "collect_100_engrams":
      return (stats.commonEngrams || 0) + 
             (stats.uncommonEngrams || 0) + 
             (stats.rareEngrams || 0) + 
             (stats.legendaryEngrams || 0) + 
             (stats.exoticEngrams || 0);
    
    default:
      return 0;
  }
}

// Get all achievements by category
export function getAchievementsByCategory(category: string): AchievementDefinition[] {
  return Object.values(ACHIEVEMENT_DEFINITIONS).filter(a => a.category === category);
}

// Get all achievements by tier
export function getAchievementsByTier(tier: string): AchievementDefinition[] {
  return Object.values(ACHIEVEMENT_DEFINITIONS).filter(a => a.tier === tier);
}

// Calculate total triumph points available
export function getTotalTriumphPointsAvailable(): number {
  return Object.values(ACHIEVEMENT_DEFINITIONS).reduce((sum, a) => sum + a.triumphPoints, 0);
}
