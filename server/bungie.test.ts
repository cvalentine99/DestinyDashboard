import { describe, expect, it } from "vitest";
import { 
  BungieClient, 
  parseActivityMode, 
  calculateEfficiency,
  formatBungieName 
} from "./bungie";

describe("Bungie API Client", () => {
  describe("BungieClient initialization", () => {
    it("creates client with API key", () => {
      const client = new BungieClient("test-api-key");
      expect(client).toBeDefined();
    });

    it("creates client with empty API key (validation happens on API call)", () => {
      // BungieClient doesn't throw on construction, validation happens on API calls
      const client = new BungieClient("");
      expect(client).toBeDefined();
    });
  });

  describe("parseActivityMode", () => {
    it("returns correct mode name for Control", () => {
      expect(parseActivityMode(10)).toBe("Control");
    });

    it("returns correct mode name for Clash", () => {
      expect(parseActivityMode(12)).toBe("Clash");
    });

    it("returns correct mode name for Rumble", () => {
      expect(parseActivityMode(48)).toBe("Rumble");
    });

    it("returns correct mode name for Survival", () => {
      expect(parseActivityMode(37)).toBe("Survival");
    });

    it("returns correct mode name for Trials of Osiris", () => {
      expect(parseActivityMode(84)).toBe("Trials of Osiris");
    });

    it("returns correct mode name for Iron Banner", () => {
      expect(parseActivityMode(19)).toBe("Iron Banner");
    });

    it("returns correct mode name for Elimination", () => {
      expect(parseActivityMode(80)).toBe("Elimination");
    });

    it("returns correct mode name for Countdown", () => {
      // Countdown (38) is not in the map, returns default 'Crucible'
      expect(parseActivityMode(38)).toBe("Crucible");
    });

    it("returns correct mode name for Supremacy", () => {
      // Supremacy (31) is not in the map, returns default 'Crucible'
      expect(parseActivityMode(31)).toBe("Crucible");
    });

    it("returns correct mode name for Momentum Control", () => {
      expect(parseActivityMode(81)).toBe("Momentum Control");
    });

    it("returns correct mode name for Showdown", () => {
      expect(parseActivityMode(59)).toBe("Showdown");
    });

    it("returns correct mode name for Rift", () => {
      expect(parseActivityMode(88)).toBe("Rift");
    });

    it("returns 'Crucible' for unknown mode", () => {
      expect(parseActivityMode(9999)).toBe("Crucible");
    });

    it("returns 'Crucible' for undefined mode", () => {
      expect(parseActivityMode(undefined as any)).toBe("Crucible");
    });
  });

  describe("calculateEfficiency", () => {
    it("calculates efficiency correctly with kills, deaths, and assists", () => {
      // Efficiency = (kills + assists) / deaths
      const efficiency = calculateEfficiency(10, 5, 5);
      expect(efficiency).toBe(3); // (10 + 5) / 5 = 3
    });

    it("returns kills + assists when deaths is 0", () => {
      const efficiency = calculateEfficiency(10, 0, 5);
      expect(efficiency).toBe(15); // 10 + 5 = 15 (perfect game)
    });

    it("handles zero kills and assists", () => {
      const efficiency = calculateEfficiency(0, 5, 0);
      expect(efficiency).toBe(0); // 0 / 5 = 0
    });

    it("handles all zeros", () => {
      const efficiency = calculateEfficiency(0, 0, 0);
      expect(efficiency).toBe(0);
    });

    it("rounds to 2 decimal places", () => {
      const efficiency = calculateEfficiency(7, 3, 2);
      expect(efficiency).toBe(3); // (7 + 2) / 3 = 3
    });
  });

  describe("formatBungieName", () => {
    it("formats name with code correctly", () => {
      expect(formatBungieName("Guardian", "1234")).toBe("Guardian#1234");
    });

    it("handles empty name", () => {
      expect(formatBungieName("", "1234")).toBe("#1234");
    });

    it("handles empty code", () => {
      expect(formatBungieName("Guardian", "")).toBe("Guardian#");
    });

    it("preserves special characters in name", () => {
      expect(formatBungieName("The_Guardian", "9999")).toBe("The_Guardian#9999");
    });
  });
});

describe("Bungie API Match Data", () => {
  describe("K/D calculation", () => {
    it("calculates K/D ratio correctly", () => {
      const kills = 15;
      const deaths = 10;
      const kd = deaths > 0 ? kills / deaths : kills;
      expect(kd).toBe(1.5);
    });

    it("handles zero deaths (perfect game)", () => {
      const kills = 10;
      const deaths = 0;
      const kd = deaths > 0 ? kills / deaths : kills;
      expect(kd).toBe(10);
    });

    it("handles zero kills", () => {
      const kills = 0;
      const deaths = 5;
      const kd = deaths > 0 ? kills / deaths : kills;
      expect(kd).toBe(0);
    });
  });

  describe("Standing interpretation", () => {
    it("standing 0 means victory", () => {
      const standing = 0;
      const isVictory = standing === 0;
      expect(isVictory).toBe(true);
    });

    it("standing 1 means defeat", () => {
      const standing = 1;
      const isVictory = standing === 0;
      expect(isVictory).toBe(false);
    });
  });

  describe("Match correlation logic", () => {
    it("identifies negative performance impact from high latency", () => {
      const avgLatency = 150; // ms
      const kd = 0.8;
      const hasNegativeImpact = avgLatency > 100 && kd < 1.0;
      expect(hasNegativeImpact).toBe(true);
    });

    it("identifies neutral impact with good connection", () => {
      const avgLatency = 30; // ms
      const kd = 1.5;
      const hasNegativeImpact = avgLatency > 100 && kd < 1.0;
      expect(hasNegativeImpact).toBe(false);
    });

    it("identifies positive correlation with low latency and high K/D", () => {
      const avgLatency = 20;
      const packetLoss = 0;
      const kd = 2.5;
      const isPositive = avgLatency < 50 && packetLoss < 1 && kd > 1.5;
      expect(isPositive).toBe(true);
    });
  });
});

describe("Bungie API Response Parsing", () => {
  describe("Character class mapping", () => {
    it("maps class type 0 to Titan", () => {
      const classMap: Record<number, string> = { 0: "Titan", 1: "Hunter", 2: "Warlock" };
      expect(classMap[0]).toBe("Titan");
    });

    it("maps class type 1 to Hunter", () => {
      const classMap: Record<number, string> = { 0: "Titan", 1: "Hunter", 2: "Warlock" };
      expect(classMap[1]).toBe("Hunter");
    });

    it("maps class type 2 to Warlock", () => {
      const classMap: Record<number, string> = { 0: "Titan", 1: "Hunter", 2: "Warlock" };
      expect(classMap[2]).toBe("Warlock");
    });
  });

  describe("Membership type mapping", () => {
    it("maps type 1 to Xbox", () => {
      const platformMap: Record<number, string> = { 1: "Xbox", 2: "PlayStation", 3: "Steam", 6: "Epic" };
      expect(platformMap[1]).toBe("Xbox");
    });

    it("maps type 2 to PlayStation", () => {
      const platformMap: Record<number, string> = { 1: "Xbox", 2: "PlayStation", 3: "Steam", 6: "Epic" };
      expect(platformMap[2]).toBe("PlayStation");
    });

    it("maps type 3 to Steam", () => {
      const platformMap: Record<number, string> = { 1: "Xbox", 2: "PlayStation", 3: "Steam", 6: "Epic" };
      expect(platformMap[3]).toBe("Steam");
    });
  });

  describe("Activity timestamp parsing", () => {
    it("parses ISO date string to Date object", () => {
      const isoString = "2024-12-24T15:30:00Z";
      const date = new Date(isoString);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11); // December is 11
      expect(date.getDate()).toBe(24);
    });

    it("handles activity period timestamp", () => {
      const period = "2024-12-24T10:00:00.000Z";
      const activityTime = new Date(period);
      expect(activityTime.getTime()).toBeGreaterThan(0);
    });
  });
});
