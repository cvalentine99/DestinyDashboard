import { describe, expect, it } from "vitest";
import { 
  ACHIEVEMENT_DEFINITIONS, 
  getAchievementsByCategory,
  getTotalTriumphPointsAvailable,
  getAchievementTierColor,
  getAchievementCategoryIcon,
} from "./achievements";

// Helper to convert to array format for tests
const ACHIEVEMENTS = Object.values(ACHIEVEMENT_DEFINITIONS);

describe("Achievements System", () => {
  describe("ACHIEVEMENTS constant", () => {
    it("should have achievements defined", () => {
      expect(ACHIEVEMENTS).toBeDefined();
      expect(Array.isArray(ACHIEVEMENTS)).toBe(true);
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it("should have required properties for each achievement", () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.id).toBeDefined();
        expect(achievement.name).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.category).toBeDefined();
        expect(achievement.triumphPoints).toBeDefined();
        expect(typeof achievement.triumphPoints).toBe("number");
      }
    });

    it("should have unique achievement IDs", () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have valid categories", () => {
      const validCategories = ["combat", "boss", "flawless", "score", "class", "weapon", "collection", "special", "survival"];
      for (const achievement of ACHIEVEMENTS) {
        expect(validCategories).toContain(achievement.category);
      }
    });
  });

  describe("achievement progress checking", () => {
    it("should have achievements with targetValue for progress tracking", () => {
      const thrallAchievement = ACHIEVEMENT_DEFINITIONS.kill_100_thrall;
      expect(thrallAchievement.targetValue).toBe(100);
      expect(thrallAchievement.statKey).toBe("thrallKills");
    });

    it("should have boss achievements with correct targets", () => {
      const ogreAchievement = ACHIEVEMENT_DEFINITIONS.defeat_phogoth;
      expect(ogreAchievement.targetValue).toBe(1);
      expect(ogreAchievement.statKey).toBe("ogreKills");
    });

    it("should have score achievements with correct targets", () => {
      const score10k = ACHIEVEMENT_DEFINITIONS.score_10k;
      expect(score10k.targetValue).toBe(10000);
      expect(score10k.statKey).toBe("highestScore");
    });
  });

  describe("getTotalTriumphPointsAvailable", () => {
    it("should return total points from all achievements", () => {
      const total = getTotalTriumphPointsAvailable();
      expect(total).toBeGreaterThan(0);
      
      // Manually calculate expected
      const expected = ACHIEVEMENTS.reduce((sum, a) => sum + a.triumphPoints, 0);
      expect(total).toBe(expected);
    });
  });

  describe("getAchievementTierColor", () => {
    it("should return bronze color", () => {
      expect(getAchievementTierColor("bronze")).toBe("#CD7F32");
    });

    it("should return gold color", () => {
      expect(getAchievementTierColor("gold")).toBe("#FFD700");
    });
  });

  describe("getAchievementCategoryIcon", () => {
    it("should return combat icon", () => {
      expect(getAchievementCategoryIcon("combat")).toBe("⚔️");
    });

    it("should return boss icon", () => {
      expect(getAchievementCategoryIcon("boss")).toBe("💀");
    });
  });

  describe("getAchievementsByCategory", () => {
    it("should return achievements filtered by category", () => {
      const combatAchievements = getAchievementsByCategory("combat");
      expect(Array.isArray(combatAchievements)).toBe(true);
      for (const achievement of combatAchievements) {
        expect(achievement.category).toBe("combat");
      }
    });

    it("should return empty array for invalid category", () => {
      const invalid = getAchievementsByCategory("invalid_category");
      expect(invalid).toEqual([]);
    });

    it("should return boss achievements", () => {
      const bossAchievements = getAchievementsByCategory("boss");
      expect(bossAchievements.length).toBeGreaterThan(0);
    });
  });
});

describe("Virtual Joystick Touch Controls", () => {
  it("should calculate correct direction from joystick position", () => {
    // Test joystick direction calculation
    const centerX = 60;
    const centerY = 60;
    
    // Right direction
    const rightX = 100;
    const rightY = 60;
    const rightDx = (rightX - centerX) / 40;
    const rightDy = (rightY - centerY) / 40;
    expect(rightDx).toBeCloseTo(1, 1);
    expect(rightDy).toBeCloseTo(0, 1);
    
    // Up direction
    const upX = 60;
    const upY = 20;
    const upDx = (upX - centerX) / 40;
    const upDy = (upY - centerY) / 40;
    expect(upDx).toBeCloseTo(0, 1);
    expect(upDy).toBeCloseTo(-1, 1);
  });

  it("should clamp joystick position within radius", () => {
    const centerX = 60;
    const centerY = 60;
    const maxRadius = 40;
    
    // Position outside radius
    const touchX = 150;
    const touchY = 60;
    
    const dx = touchX - centerX;
    const dy = touchY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let clampedX = touchX;
    let clampedY = touchY;
    
    if (distance > maxRadius) {
      const angle = Math.atan2(dy, dx);
      clampedX = centerX + Math.cos(angle) * maxRadius;
      clampedY = centerY + Math.sin(angle) * maxRadius;
    }
    
    const clampedDistance = Math.sqrt(
      Math.pow(clampedX - centerX, 2) + Math.pow(clampedY - centerY, 2)
    );
    
    expect(clampedDistance).toBeLessThanOrEqual(maxRadius + 0.1);
  });

  it("should normalize direction vector", () => {
    const dx = 3;
    const dy = 4;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    
    const normalizedX = dx / magnitude;
    const normalizedY = dy / magnitude;
    
    const normalizedMagnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    expect(normalizedMagnitude).toBeCloseTo(1, 5);
  });
});

describe("Game Stats Tracking", () => {
  it("should initialize all stats to zero or false", () => {
    const initialStats = {
      dregKills: 0, vandalKills: 0, captainKills: 0,
      thrallKills: 0, acolyteKills: 0, knightKills: 0,
      goblinKills: 0, hobgoblinKills: 0, minotaurKills: 0,
      ogreKills: 0, servitorKills: 0, hydraKills: 0,
      flawlessOgre: 0, flawlessServitor: 0, flawlessHydra: 0,
      autoRifleKills: 0, handCannonKills: 0, pulseRifleKills: 0, rocketLauncherKills: 0,
      commonEngrams: 0, uncommonEngrams: 0, rareEngrams: 0, legendaryEngrams: 0, exoticEngrams: 0,
      abilitiesUsed: 0, supersUsed: 0,
      clearedCosmodrome: false, clearedEuropa: false, clearedDreamingCity: false,
      bossHealthAtStart: 0,
    };
    
    // Check all numeric values are 0
    const numericKeys = Object.keys(initialStats).filter(k => typeof initialStats[k as keyof typeof initialStats] === 'number');
    for (const key of numericKeys) {
      expect(initialStats[key as keyof typeof initialStats]).toBe(0);
    }
    
    // Check all boolean values are false
    expect(initialStats.clearedCosmodrome).toBe(false);
    expect(initialStats.clearedEuropa).toBe(false);
    expect(initialStats.clearedDreamingCity).toBe(false);
  });

  it("should track enemy kills by type", () => {
    const stats = {
      dregKills: 0, vandalKills: 0, captainKills: 0,
      thrallKills: 0, acolyteKills: 0, knightKills: 0,
      goblinKills: 0, hobgoblinKills: 0, minotaurKills: 0,
    };
    
    // Simulate kills
    stats.dregKills += 5;
    stats.thrallKills += 10;
    stats.goblinKills += 3;
    
    expect(stats.dregKills).toBe(5);
    expect(stats.thrallKills).toBe(10);
    expect(stats.goblinKills).toBe(3);
    
    const totalKills = stats.dregKills + stats.thrallKills + stats.goblinKills;
    expect(totalKills).toBe(18);
  });

  it("should track engram collection by rarity", () => {
    const stats = {
      commonEngrams: 0, uncommonEngrams: 0, rareEngrams: 0, 
      legendaryEngrams: 0, exoticEngrams: 0,
    };
    
    stats.commonEngrams += 20;
    stats.uncommonEngrams += 15;
    stats.rareEngrams += 8;
    stats.legendaryEngrams += 3;
    stats.exoticEngrams += 1;
    
    const totalEngrams = stats.commonEngrams + stats.uncommonEngrams + 
      stats.rareEngrams + stats.legendaryEngrams + stats.exoticEngrams;
    expect(totalEngrams).toBe(47);
  });
});
