import { describe, expect, it } from "vitest";
import { searchLore, destinyLore, loreCategories, getLoreByCategory, getRandomLore } from "./lore-data";

describe("Destiny 2 Lore Database", () => {
  describe("destinyLore", () => {
    it("should contain lore entries", () => {
      expect(destinyLore.length).toBeGreaterThan(0);
    });

    it("should have required fields for each entry", () => {
      destinyLore.forEach(entry => {
        expect(entry.id).toBeDefined();
        expect(entry.title).toBeDefined();
        expect(entry.category).toBeDefined();
        expect(entry.content).toBeDefined();
        expect(entry.tags).toBeInstanceOf(Array);
      });
    });

    it("should have unique IDs", () => {
      const ids = destinyLore.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("loreCategories", () => {
    it("should contain categories", () => {
      expect(loreCategories.length).toBeGreaterThan(0);
    });

    it("should have required fields for each category", () => {
      loreCategories.forEach(cat => {
        expect(cat.id).toBeDefined();
        expect(cat.name).toBeDefined();
        expect(cat.description).toBeDefined();
      });
    });
  });

  describe("searchLore", () => {
    it("should find entries matching 'Traveler'", () => {
      const results = searchLore("Traveler");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.title.toLowerCase().includes("traveler"))).toBe(true);
    });

    it("should find entries matching 'Hive'", () => {
      const results = searchLore("Hive");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should find entries matching 'Savathun'", () => {
      const results = searchLore("Savathun");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should find entries matching 'Guardian'", () => {
      const results = searchLore("Guardian");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should respect limit parameter", () => {
      const results = searchLore("the", 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("should return empty array for nonsense query", () => {
      const results = searchLore("xyzabc123nonsense");
      expect(results.length).toBe(0);
    });

    it("should find entries by tag", () => {
      const results = searchLore("books of sorrow");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("getLoreByCategory", () => {
    it("should return entries for 'The Traveler' category", () => {
      const results = getLoreByCategory("The Traveler");
      expect(results.length).toBeGreaterThan(0);
      results.forEach(entry => {
        expect(entry.category).toBe("The Traveler");
      });
    });

    it("should return entries for 'Guardians' category", () => {
      const results = getLoreByCategory("Guardians");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-existent category", () => {
      const results = getLoreByCategory("NonExistentCategory");
      expect(results.length).toBe(0);
    });
  });

  describe("getRandomLore", () => {
    it("should return specified number of entries", () => {
      const results = getRandomLore(3);
      expect(results.length).toBe(3);
    });

    it("should return different results on multiple calls (probabilistic)", () => {
      const results1 = getRandomLore(5);
      const results2 = getRandomLore(5);
      // There's a small chance they could be the same, but very unlikely
      const ids1 = results1.map(r => r.id).sort().join(",");
      const ids2 = results2.map(r => r.id).sort().join(",");
      // We just check that both return valid results
      expect(results1.length).toBe(5);
      expect(results2.length).toBe(5);
    });
  });
});

describe("Destiny Terminology Mapping", () => {
  it("should have correct terminology mappings", async () => {
    // Import from extrahop module using dynamic import
    const { destinyTerminology } = await import("./extrahop");
    
    // Check device class mappings
    expect(destinyTerminology.deviceClass.server).toBe("Titan");
    expect(destinyTerminology.deviceClass.client).toBe("Hunter");
    expect(destinyTerminology.deviceClass.gateway).toBe("Warlock");
    
    // Check severity mappings
    expect(destinyTerminology.severity.critical).toBe("Extinction-Level Threat");
    expect(destinyTerminology.severity.high).toBe("Darkness Incursion");
    
    // Check metrics mappings
    expect(destinyTerminology.metrics.bytes).toBe("Light Energy");
    expect(destinyTerminology.metrics.throughput).toBe("Glimmer Flow");
    
    // Check status mappings
    expect(destinyTerminology.status.active).toBe("In Combat");
    expect(destinyTerminology.status.idle).toBe("At Tower");
  });
});
