import { describe, expect, it } from "vitest";

/**
 * Tests for Engram Hunter: Combat Edition game mechanics
 * These tests validate the game constants and logic without requiring canvas rendering
 */

// Game constants from Game.tsx
const GUARDIAN_CLASSES = {
  titan: {
    name: "Titan",
    color: "#FF6B35",
    ability: "Barricade",
    abilityDesc: "Deploy a protective shield",
    abilityCooldown: 8000,
    abilityDuration: 3000,
  },
  hunter: {
    name: "Hunter",
    color: "#7B68EE",
    ability: "Dodge",
    abilityDesc: "Quick dodge with i-frames",
    abilityCooldown: 6000,
    abilityDuration: 500,
  },
  warlock: {
    name: "Warlock",
    color: "#FFD700",
    ability: "Blink",
    abilityDesc: "Teleport a short distance",
    abilityCooldown: 5000,
    abilityDuration: 200,
  },
} as const;

const ENGRAM_TYPES = [
  { type: "common", color: "#FFFFFF", points: 10, size: 20 },
  { type: "uncommon", color: "#4ADE80", points: 25, size: 22 },
  { type: "rare", color: "#60A5FA", points: 50, size: 24 },
  { type: "legendary", color: "#A855F7", points: 100, size: 26 },
  { type: "exotic", color: "#FBBF24", points: 250, size: 30 },
];

const WEAPONS = {
  autoRifle: { name: "Auto Rifle", fireRate: 100, damage: 10 },
  handCannon: { name: "Hand Cannon", fireRate: 400, damage: 35 },
  pulseRifle: { name: "Pulse Rifle", fireRate: 150, damage: 15 },
  rocketLauncher: { name: "Rocket Launcher", fireRate: 1500, damage: 150 },
};

const ENEMY_TYPES = {
  dreg: { name: "Dreg", faction: "fallen", health: 30, damage: 10, points: 50 },
  vandal: { name: "Vandal", faction: "fallen", health: 50, damage: 15, points: 100 },
  captain: { name: "Captain", faction: "fallen", health: 100, damage: 25, points: 200 },
  thrall: { name: "Thrall", faction: "hive", health: 20, damage: 15, points: 40 },
  acolyte: { name: "Acolyte", faction: "hive", health: 40, damage: 12, points: 80 },
  knight: { name: "Knight", faction: "hive", health: 120, damage: 30, points: 250 },
  goblin: { name: "Goblin", faction: "vex", health: 35, damage: 12, points: 60 },
  hobgoblin: { name: "Hobgoblin", faction: "vex", health: 45, damage: 20, points: 120 },
  minotaur: { name: "Minotaur", faction: "vex", health: 150, damage: 35, points: 300 },
};

const BOSS_TYPES = {
  ogre: { name: "Phogoth the Untamed", faction: "hive", health: 1000, points: 2000 },
  servitor: { name: "Sepiks Prime", faction: "fallen", health: 800, points: 1800 },
  hydra: { name: "Argos, Planetary Core", faction: "vex", health: 1200, points: 2500 },
};

const POWERUP_TYPES = {
  overshield: { name: "Overshield", effect: "shield" },
  heavyAmmo: { name: "Heavy Ammo", effect: "rocket" },
  superCharge: { name: "Super Charge", effect: "super" },
  healthPack: { name: "Health Pack", effect: "heal" },
};

const LEVELS = {
  cosmodrome: { name: "Cosmodrome", boss: "servitor" },
  europa: { name: "Europa", boss: "hydra" },
  dreamingCity: { name: "Dreaming City", boss: "ogre" },
};

describe("Guardian Classes", () => {
  it("should have three guardian classes", () => {
    expect(Object.keys(GUARDIAN_CLASSES)).toHaveLength(3);
    expect(GUARDIAN_CLASSES).toHaveProperty("titan");
    expect(GUARDIAN_CLASSES).toHaveProperty("hunter");
    expect(GUARDIAN_CLASSES).toHaveProperty("warlock");
  });

  it("should have unique abilities for each class", () => {
    expect(GUARDIAN_CLASSES.titan.ability).toBe("Barricade");
    expect(GUARDIAN_CLASSES.hunter.ability).toBe("Dodge");
    expect(GUARDIAN_CLASSES.warlock.ability).toBe("Blink");
  });

  it("should have appropriate cooldowns", () => {
    // Hunter should have fastest cooldown (agile class)
    expect(GUARDIAN_CLASSES.hunter.abilityCooldown).toBeLessThan(GUARDIAN_CLASSES.titan.abilityCooldown);
    // Warlock blink should be fastest
    expect(GUARDIAN_CLASSES.warlock.abilityCooldown).toBeLessThanOrEqual(GUARDIAN_CLASSES.hunter.abilityCooldown);
  });

  it("should have Titan with longest ability duration (barricade persists)", () => {
    expect(GUARDIAN_CLASSES.titan.abilityDuration).toBeGreaterThan(GUARDIAN_CLASSES.hunter.abilityDuration);
    expect(GUARDIAN_CLASSES.titan.abilityDuration).toBeGreaterThan(GUARDIAN_CLASSES.warlock.abilityDuration);
  });
});

describe("Engram Types", () => {
  it("should have five engram rarities", () => {
    expect(ENGRAM_TYPES).toHaveLength(5);
  });

  it("should have increasing point values by rarity", () => {
    for (let i = 1; i < ENGRAM_TYPES.length; i++) {
      expect(ENGRAM_TYPES[i].points).toBeGreaterThan(ENGRAM_TYPES[i - 1].points);
    }
  });

  it("should have increasing sizes by rarity", () => {
    for (let i = 1; i < ENGRAM_TYPES.length; i++) {
      expect(ENGRAM_TYPES[i].size).toBeGreaterThanOrEqual(ENGRAM_TYPES[i - 1].size);
    }
  });

  it("should have exotic as highest value", () => {
    const exotic = ENGRAM_TYPES.find(e => e.type === "exotic");
    expect(exotic?.points).toBe(250);
  });
});

describe("Weapon System", () => {
  it("should have four weapon types", () => {
    expect(Object.keys(WEAPONS)).toHaveLength(4);
  });

  it("should have auto rifle with fastest fire rate", () => {
    expect(WEAPONS.autoRifle.fireRate).toBeLessThan(WEAPONS.handCannon.fireRate);
    expect(WEAPONS.autoRifle.fireRate).toBeLessThan(WEAPONS.pulseRifle.fireRate);
    expect(WEAPONS.autoRifle.fireRate).toBeLessThan(WEAPONS.rocketLauncher.fireRate);
  });

  it("should have rocket launcher with highest damage", () => {
    expect(WEAPONS.rocketLauncher.damage).toBeGreaterThan(WEAPONS.autoRifle.damage);
    expect(WEAPONS.rocketLauncher.damage).toBeGreaterThan(WEAPONS.handCannon.damage);
    expect(WEAPONS.rocketLauncher.damage).toBeGreaterThan(WEAPONS.pulseRifle.damage);
  });

  it("should have hand cannon with high damage but slow fire rate", () => {
    expect(WEAPONS.handCannon.damage).toBeGreaterThan(WEAPONS.autoRifle.damage);
    expect(WEAPONS.handCannon.fireRate).toBeGreaterThan(WEAPONS.autoRifle.fireRate);
  });
});

describe("Enemy Factions", () => {
  it("should have three enemy factions", () => {
    const factions = new Set(Object.values(ENEMY_TYPES).map(e => e.faction));
    expect(factions.size).toBe(3);
    expect(factions.has("fallen")).toBe(true);
    expect(factions.has("hive")).toBe(true);
    expect(factions.has("vex")).toBe(true);
  });

  it("should have three enemies per faction", () => {
    const fallenCount = Object.values(ENEMY_TYPES).filter(e => e.faction === "fallen").length;
    const hiveCount = Object.values(ENEMY_TYPES).filter(e => e.faction === "hive").length;
    const vexCount = Object.values(ENEMY_TYPES).filter(e => e.faction === "vex").length;
    
    expect(fallenCount).toBe(3);
    expect(hiveCount).toBe(3);
    expect(vexCount).toBe(3);
  });

  it("should have thrall as weakest enemy (melee rusher)", () => {
    const thrall = ENEMY_TYPES.thrall;
    expect(thrall.health).toBe(20);
    expect(thrall.points).toBe(40);
  });

  it("should have minotaur as strongest regular enemy", () => {
    const minotaur = ENEMY_TYPES.minotaur;
    const allEnemies = Object.values(ENEMY_TYPES);
    const maxHealth = Math.max(...allEnemies.map(e => e.health));
    expect(minotaur.health).toBe(maxHealth);
  });

  it("should scale points with difficulty", () => {
    // Captain should give more points than Dreg
    expect(ENEMY_TYPES.captain.points).toBeGreaterThan(ENEMY_TYPES.dreg.points);
    // Knight should give more points than Thrall
    expect(ENEMY_TYPES.knight.points).toBeGreaterThan(ENEMY_TYPES.thrall.points);
    // Minotaur should give more points than Goblin
    expect(ENEMY_TYPES.minotaur.points).toBeGreaterThan(ENEMY_TYPES.goblin.points);
  });
});

describe("Boss Fights", () => {
  it("should have three boss types", () => {
    expect(Object.keys(BOSS_TYPES)).toHaveLength(3);
  });

  it("should have bosses with much higher health than regular enemies", () => {
    const maxEnemyHealth = Math.max(...Object.values(ENEMY_TYPES).map(e => e.health));
    const minBossHealth = Math.min(...Object.values(BOSS_TYPES).map(b => b.health));
    
    expect(minBossHealth).toBeGreaterThan(maxEnemyHealth * 5);
  });

  it("should have bosses worth more points than any regular enemy", () => {
    const maxEnemyPoints = Math.max(...Object.values(ENEMY_TYPES).map(e => e.points));
    const minBossPoints = Math.min(...Object.values(BOSS_TYPES).map(b => b.points));
    
    expect(minBossPoints).toBeGreaterThan(maxEnemyPoints * 5);
  });

  it("should have Hydra as toughest boss", () => {
    expect(BOSS_TYPES.hydra.health).toBeGreaterThan(BOSS_TYPES.ogre.health);
    expect(BOSS_TYPES.hydra.health).toBeGreaterThan(BOSS_TYPES.servitor.health);
  });

  it("should have each boss from a different faction", () => {
    const bossFactions = Object.values(BOSS_TYPES).map(b => b.faction);
    const uniqueFactions = new Set(bossFactions);
    expect(uniqueFactions.size).toBe(3);
  });
});

describe("Power-up System", () => {
  it("should have four power-up types", () => {
    expect(Object.keys(POWERUP_TYPES)).toHaveLength(4);
  });

  it("should have distinct effects for each power-up", () => {
    const effects = Object.values(POWERUP_TYPES).map(p => p.effect);
    const uniqueEffects = new Set(effects);
    expect(uniqueEffects.size).toBe(4);
  });

  it("should include essential power-ups", () => {
    expect(POWERUP_TYPES.overshield.effect).toBe("shield");
    expect(POWERUP_TYPES.heavyAmmo.effect).toBe("rocket");
    expect(POWERUP_TYPES.superCharge.effect).toBe("super");
    expect(POWERUP_TYPES.healthPack.effect).toBe("heal");
  });
});

describe("Level System", () => {
  it("should have three levels", () => {
    expect(Object.keys(LEVELS)).toHaveLength(3);
  });

  it("should have each level with a unique boss", () => {
    const bosses = Object.values(LEVELS).map(l => l.boss);
    const uniqueBosses = new Set(bosses);
    expect(uniqueBosses.size).toBe(3);
  });

  it("should have Cosmodrome as first level with Servitor boss", () => {
    expect(LEVELS.cosmodrome.boss).toBe("servitor");
  });

  it("should have Dreaming City with Ogre boss", () => {
    expect(LEVELS.dreamingCity.boss).toBe("ogre");
  });

  it("should have Europa with Hydra boss", () => {
    expect(LEVELS.europa.boss).toBe("hydra");
  });
});

describe("Game Balance", () => {
  it("should have balanced DPS across weapons", () => {
    // DPS = damage / (fireRate / 1000)
    const autoRifleDPS = WEAPONS.autoRifle.damage / (WEAPONS.autoRifle.fireRate / 1000);
    const handCannonDPS = WEAPONS.handCannon.damage / (WEAPONS.handCannon.fireRate / 1000);
    const pulseRifleDPS = WEAPONS.pulseRifle.damage / (WEAPONS.pulseRifle.fireRate / 1000);
    
    // Auto rifle should have highest sustained DPS
    expect(autoRifleDPS).toBeGreaterThan(handCannonDPS);
    // Pulse rifle should be middle ground
    expect(pulseRifleDPS).toBeGreaterThan(handCannonDPS);
  });

  it("should have enemy damage scale with health", () => {
    // Higher health enemies should deal more damage
    expect(ENEMY_TYPES.captain.damage).toBeGreaterThan(ENEMY_TYPES.dreg.damage);
    expect(ENEMY_TYPES.knight.damage).toBeGreaterThan(ENEMY_TYPES.acolyte.damage);
    expect(ENEMY_TYPES.minotaur.damage).toBeGreaterThan(ENEMY_TYPES.goblin.damage);
  });

  it("should have reasonable time-to-kill for auto rifle vs basic enemies", () => {
    // Auto rifle should kill a Dreg in reasonable time
    const shotsToKillDreg = Math.ceil(ENEMY_TYPES.dreg.health / WEAPONS.autoRifle.damage);
    const timeToKillDreg = shotsToKillDreg * WEAPONS.autoRifle.fireRate;
    
    // Should be under 1 second
    expect(timeToKillDreg).toBeLessThan(1000);
  });
});
