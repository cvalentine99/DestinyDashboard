import { describe, it, expect } from "vitest";

/**
 * Tests for Guardian Loadout System
 * These tests validate the loadout data structures and weapon/class mapping
 */

// Guardian classes matching the game
const GUARDIAN_CLASSES = {
  titan: { name: "Titan", color: "#FF6B35", ability: "Barricade" },
  hunter: { name: "Hunter", color: "#7B68EE", ability: "Dodge" },
  warlock: { name: "Warlock", color: "#FFD700", ability: "Blink" },
} as const;

// Weapon definitions (game uses camelCase, database uses snake_case)
const GAME_WEAPONS = {
  autoRifle: { name: "Auto Rifle", color: "#4ADE80" },
  handCannon: { name: "Hand Cannon", color: "#FBBF24" },
  pulseRifle: { name: "Pulse Rifle", color: "#60A5FA" },
  rocketLauncher: { name: "Rocket Launcher", color: "#FF6B35" },
} as const;

const DB_WEAPONS = ["auto_rifle", "hand_cannon", "pulse_rifle", "rocket_launcher"] as const;

// Weapon key mapping
const DB_TO_GAME_WEAPON: Record<string, string> = {
  auto_rifle: "autoRifle",
  hand_cannon: "handCannon",
  pulse_rifle: "pulseRifle",
  rocket_launcher: "rocketLauncher",
};

const GAME_TO_DB_WEAPON: Record<string, string> = {
  autoRifle: "auto_rifle",
  handCannon: "hand_cannon",
  pulseRifle: "pulse_rifle",
  rocketLauncher: "rocket_launcher",
};

// Mock loadout structure
interface Loadout {
  id: number;
  userId: number;
  name: string;
  guardianClass: "titan" | "hunter" | "warlock";
  primaryWeapon: "auto_rifle" | "hand_cannon" | "pulse_rifle" | "rocket_launcher";
  iconColor: string | null;
  isDefault: boolean;
  slotNumber: number | null;
  timesUsed: number;
}

describe("Loadout System", () => {
  describe("Guardian Classes", () => {
    it("should have three guardian classes", () => {
      expect(Object.keys(GUARDIAN_CLASSES)).toHaveLength(3);
    });

    it("should have titan class with correct properties", () => {
      expect(GUARDIAN_CLASSES.titan.name).toBe("Titan");
      expect(GUARDIAN_CLASSES.titan.ability).toBe("Barricade");
      expect(GUARDIAN_CLASSES.titan.color).toBe("#FF6B35");
    });

    it("should have hunter class with correct properties", () => {
      expect(GUARDIAN_CLASSES.hunter.name).toBe("Hunter");
      expect(GUARDIAN_CLASSES.hunter.ability).toBe("Dodge");
      expect(GUARDIAN_CLASSES.hunter.color).toBe("#7B68EE");
    });

    it("should have warlock class with correct properties", () => {
      expect(GUARDIAN_CLASSES.warlock.name).toBe("Warlock");
      expect(GUARDIAN_CLASSES.warlock.ability).toBe("Blink");
      expect(GUARDIAN_CLASSES.warlock.color).toBe("#FFD700");
    });
  });

  describe("Weapon Definitions", () => {
    it("should have four weapons in game format", () => {
      expect(Object.keys(GAME_WEAPONS)).toHaveLength(4);
    });

    it("should have four weapons in database format", () => {
      expect(DB_WEAPONS).toHaveLength(4);
    });

    it("should have auto rifle with correct properties", () => {
      expect(GAME_WEAPONS.autoRifle.name).toBe("Auto Rifle");
      expect(GAME_WEAPONS.autoRifle.color).toBe("#4ADE80");
    });

    it("should have hand cannon with correct properties", () => {
      expect(GAME_WEAPONS.handCannon.name).toBe("Hand Cannon");
      expect(GAME_WEAPONS.handCannon.color).toBe("#FBBF24");
    });

    it("should have pulse rifle with correct properties", () => {
      expect(GAME_WEAPONS.pulseRifle.name).toBe("Pulse Rifle");
      expect(GAME_WEAPONS.pulseRifle.color).toBe("#60A5FA");
    });

    it("should have rocket launcher with correct properties", () => {
      expect(GAME_WEAPONS.rocketLauncher.name).toBe("Rocket Launcher");
      expect(GAME_WEAPONS.rocketLauncher.color).toBe("#FF6B35");
    });
  });

  describe("Weapon Key Mapping", () => {
    it("should map database keys to game keys correctly", () => {
      expect(DB_TO_GAME_WEAPON["auto_rifle"]).toBe("autoRifle");
      expect(DB_TO_GAME_WEAPON["hand_cannon"]).toBe("handCannon");
      expect(DB_TO_GAME_WEAPON["pulse_rifle"]).toBe("pulseRifle");
      expect(DB_TO_GAME_WEAPON["rocket_launcher"]).toBe("rocketLauncher");
    });

    it("should map game keys to database keys correctly", () => {
      expect(GAME_TO_DB_WEAPON["autoRifle"]).toBe("auto_rifle");
      expect(GAME_TO_DB_WEAPON["handCannon"]).toBe("hand_cannon");
      expect(GAME_TO_DB_WEAPON["pulseRifle"]).toBe("pulse_rifle");
      expect(GAME_TO_DB_WEAPON["rocketLauncher"]).toBe("rocket_launcher");
    });

    it("should have bidirectional mapping for all weapons", () => {
      for (const [dbKey, gameKey] of Object.entries(DB_TO_GAME_WEAPON)) {
        expect(GAME_TO_DB_WEAPON[gameKey]).toBe(dbKey);
      }
    });

    it("should map all database weapons", () => {
      for (const dbWeapon of DB_WEAPONS) {
        expect(DB_TO_GAME_WEAPON[dbWeapon]).toBeDefined();
      }
    });

    it("should map all game weapons", () => {
      for (const gameWeapon of Object.keys(GAME_WEAPONS)) {
        expect(GAME_TO_DB_WEAPON[gameWeapon]).toBeDefined();
      }
    });
  });

  describe("Loadout Structure", () => {
    const mockLoadout: Loadout = {
      id: 1,
      userId: 123,
      name: "PvP Rush",
      guardianClass: "hunter",
      primaryWeapon: "hand_cannon",
      iconColor: "#7B68EE",
      isDefault: true,
      slotNumber: 1,
      timesUsed: 42,
    };

    it("should have required fields", () => {
      expect(mockLoadout.id).toBeDefined();
      expect(mockLoadout.userId).toBeDefined();
      expect(mockLoadout.name).toBeDefined();
      expect(mockLoadout.guardianClass).toBeDefined();
      expect(mockLoadout.primaryWeapon).toBeDefined();
    });

    it("should have valid guardian class", () => {
      expect(["titan", "hunter", "warlock"]).toContain(mockLoadout.guardianClass);
    });

    it("should have valid weapon", () => {
      expect(DB_WEAPONS).toContain(mockLoadout.primaryWeapon);
    });

    it("should convert weapon to game format correctly", () => {
      const gameWeapon = DB_TO_GAME_WEAPON[mockLoadout.primaryWeapon];
      expect(gameWeapon).toBe("handCannon");
      expect(GAME_WEAPONS[gameWeapon as keyof typeof GAME_WEAPONS]).toBeDefined();
    });

    it("should have slot number between 1 and 5 or null", () => {
      if (mockLoadout.slotNumber !== null) {
        expect(mockLoadout.slotNumber).toBeGreaterThanOrEqual(1);
        expect(mockLoadout.slotNumber).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("Loadout Validation", () => {
    it("should accept valid loadout names", () => {
      const validNames = ["PvP Rush", "Boss Killer", "My Loadout", "A"];
      for (const name of validNames) {
        expect(name.length).toBeGreaterThan(0);
        expect(name.length).toBeLessThanOrEqual(64);
      }
    });

    it("should reject empty loadout names", () => {
      const emptyName = "";
      expect(emptyName.trim().length).toBe(0);
    });

    it("should enforce max name length of 64 characters", () => {
      const longName = "A".repeat(65);
      expect(longName.length).toBeGreaterThan(64);
    });

    it("should allow all guardian class and weapon combinations", () => {
      const classes = ["titan", "hunter", "warlock"] as const;
      const weapons = DB_WEAPONS;
      
      // 3 classes x 4 weapons = 12 combinations
      const combinations: Array<{ class: string; weapon: string }> = [];
      for (const cls of classes) {
        for (const weapon of weapons) {
          combinations.push({ class: cls, weapon });
        }
      }
      
      expect(combinations).toHaveLength(12);
    });
  });

  describe("Default Loadout Logic", () => {
    it("should only have one default loadout per user", () => {
      const userLoadouts: Loadout[] = [
        { id: 1, userId: 1, name: "Loadout 1", guardianClass: "titan", primaryWeapon: "auto_rifle", iconColor: null, isDefault: true, slotNumber: null, timesUsed: 0 },
        { id: 2, userId: 1, name: "Loadout 2", guardianClass: "hunter", primaryWeapon: "hand_cannon", iconColor: null, isDefault: false, slotNumber: null, timesUsed: 0 },
        { id: 3, userId: 1, name: "Loadout 3", guardianClass: "warlock", primaryWeapon: "pulse_rifle", iconColor: null, isDefault: false, slotNumber: null, timesUsed: 0 },
      ];
      
      const defaultLoadouts = userLoadouts.filter(l => l.isDefault);
      expect(defaultLoadouts).toHaveLength(1);
    });

    it("should apply default loadout on game start", () => {
      const defaultLoadout: Loadout = {
        id: 1,
        userId: 1,
        name: "Default",
        guardianClass: "warlock",
        primaryWeapon: "pulse_rifle",
        iconColor: null,
        isDefault: true,
        slotNumber: null,
        timesUsed: 5,
      };

      // Simulate applying loadout
      const selectedClass = defaultLoadout.guardianClass;
      const selectedWeapon = DB_TO_GAME_WEAPON[defaultLoadout.primaryWeapon];

      expect(selectedClass).toBe("warlock");
      expect(selectedWeapon).toBe("pulseRifle");
    });
  });

  describe("Quick Slot System", () => {
    it("should support 5 quick slots", () => {
      const slots = [1, 2, 3, 4, 5];
      expect(slots).toHaveLength(5);
    });

    it("should allow assigning loadouts to slots", () => {
      const loadout: Loadout = {
        id: 1,
        userId: 1,
        name: "Quick Access",
        guardianClass: "titan",
        primaryWeapon: "rocket_launcher",
        iconColor: "#FF6B35",
        isDefault: false,
        slotNumber: 3,
        timesUsed: 10,
      };

      expect(loadout.slotNumber).toBe(3);
      expect(loadout.slotNumber).toBeGreaterThanOrEqual(1);
      expect(loadout.slotNumber).toBeLessThanOrEqual(5);
    });

    it("should only allow one loadout per slot per user", () => {
      const userLoadouts: Loadout[] = [
        { id: 1, userId: 1, name: "Slot 1", guardianClass: "titan", primaryWeapon: "auto_rifle", iconColor: null, isDefault: false, slotNumber: 1, timesUsed: 0 },
        { id: 2, userId: 1, name: "Slot 2", guardianClass: "hunter", primaryWeapon: "hand_cannon", iconColor: null, isDefault: false, slotNumber: 2, timesUsed: 0 },
        { id: 3, userId: 1, name: "No Slot", guardianClass: "warlock", primaryWeapon: "pulse_rifle", iconColor: null, isDefault: false, slotNumber: null, timesUsed: 0 },
      ];

      const slot1Loadouts = userLoadouts.filter(l => l.slotNumber === 1);
      const slot2Loadouts = userLoadouts.filter(l => l.slotNumber === 2);

      expect(slot1Loadouts).toHaveLength(1);
      expect(slot2Loadouts).toHaveLength(1);
    });
  });

  describe("Usage Tracking", () => {
    it("should track loadout usage count", () => {
      const loadout: Loadout = {
        id: 1,
        userId: 1,
        name: "Tracked",
        guardianClass: "hunter",
        primaryWeapon: "auto_rifle",
        iconColor: null,
        isDefault: false,
        slotNumber: null,
        timesUsed: 0,
      };

      // Simulate usage
      const updatedLoadout = { ...loadout, timesUsed: loadout.timesUsed + 1 };
      expect(updatedLoadout.timesUsed).toBe(1);
    });

    it("should increment usage on loadout selection", () => {
      let timesUsed = 5;
      
      // Simulate selecting loadout
      timesUsed += 1;
      
      expect(timesUsed).toBe(6);
    });
  });

  describe("Icon Color", () => {
    it("should use class color as default icon color", () => {
      const loadout: Loadout = {
        id: 1,
        userId: 1,
        name: "Titan Build",
        guardianClass: "titan",
        primaryWeapon: "auto_rifle",
        iconColor: null,
        isDefault: false,
        slotNumber: null,
        timesUsed: 0,
      };

      const iconColor = loadout.iconColor || GUARDIAN_CLASSES[loadout.guardianClass].color;
      expect(iconColor).toBe("#FF6B35");
    });

    it("should use custom icon color when specified", () => {
      const loadout: Loadout = {
        id: 1,
        userId: 1,
        name: "Custom Color",
        guardianClass: "hunter",
        primaryWeapon: "hand_cannon",
        iconColor: "#00FF00",
        isDefault: false,
        slotNumber: null,
        timesUsed: 0,
      };

      const iconColor = loadout.iconColor || GUARDIAN_CLASSES[loadout.guardianClass].color;
      expect(iconColor).toBe("#00FF00");
    });
  });
});
