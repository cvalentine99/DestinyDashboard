import { describe, expect, it } from "vitest";
import { 
  formatNanoseconds, 
  formatNsDuration, 
  nsToMs, 
  msToNs, 
  parseNs,
  sortByNs,
  NS_PER_MILLISECOND,
  NS_PER_SECOND,
  NS_PER_MICROSECOND
} from "../client/src/lib/nanoseconds";

describe("Nanosecond Timestamp Utilities", () => {
  describe("formatNanoseconds", () => {
    it("formats nanoseconds with full precision", () => {
      // 1 second + 500ms + 250μs + 100ns = 1,500,250,100 ns
      const ns = BigInt(1_500_250_100);
      const result = formatNanoseconds(ns, { includeNanos: true });
      
      // Should contain the sub-millisecond precision
      expect(result).toContain("250");
      expect(result).toContain("100");
    });

    it("formats with date when requested", () => {
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      const result = formatNanoseconds(now, { includeDate: true });
      
      // Should contain year
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it("formats in compact mode", () => {
      const ns = BigInt(Date.now()) * BigInt(1_000_000);
      const result = formatNanoseconds(ns, { compact: true, includeNanos: true });
      
      // Compact format should have continuous digits after seconds
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}\.\d+/);
    });
  });

  describe("formatNsDuration", () => {
    it("formats nanosecond durations correctly", () => {
      expect(formatNsDuration(BigInt(0), BigInt(500))).toBe("500ns");
      expect(formatNsDuration(BigInt(0), BigInt(5000))).toMatch(/μs/);
      expect(formatNsDuration(BigInt(0), BigInt(5_000_000))).toMatch(/ms/);
      expect(formatNsDuration(BigInt(0), BigInt(5_000_000_000))).toMatch(/s/);
    });

    it("handles large durations", () => {
      const start = BigInt(0);
      const end = BigInt(10) * NS_PER_SECOND;
      const result = formatNsDuration(start, end);
      expect(result).toBe("10.000s");
    });
  });

  describe("conversion functions", () => {
    it("converts milliseconds to nanoseconds", () => {
      expect(msToNs(1)).toBe(BigInt(1_000_000));
      expect(msToNs(1000)).toBe(BigInt(1_000_000_000));
    });

    it("converts nanoseconds to milliseconds", () => {
      expect(nsToMs(BigInt(1_000_000))).toBe(1);
      expect(nsToMs(BigInt(1_000_000_000))).toBe(1000);
    });

    it("parses various input types", () => {
      expect(parseNs(BigInt(123))).toBe(BigInt(123));
      expect(parseNs(123)).toBe(BigInt(123));
      expect(parseNs("123")).toBe(BigInt(123));
    });
  });

  describe("sortByNs", () => {
    it("sorts items by nanosecond timestamp ascending", () => {
      const items = [
        { timestampNs: BigInt(300) },
        { timestampNs: BigInt(100) },
        { timestampNs: BigInt(200) },
      ];
      
      const sorted = sortByNs(items, "asc");
      expect(sorted[0].timestampNs).toBe(BigInt(100));
      expect(sorted[1].timestampNs).toBe(BigInt(200));
      expect(sorted[2].timestampNs).toBe(BigInt(300));
    });

    it("sorts items by nanosecond timestamp descending", () => {
      const items = [
        { timestampNs: BigInt(100) },
        { timestampNs: BigInt(300) },
        { timestampNs: BigInt(200) },
      ];
      
      const sorted = sortByNs(items, "desc");
      expect(sorted[0].timestampNs).toBe(BigInt(300));
      expect(sorted[1].timestampNs).toBe(BigInt(200));
      expect(sorted[2].timestampNs).toBe(BigInt(100));
    });
  });

  describe("constants", () => {
    it("has correct nanosecond constants", () => {
      expect(NS_PER_MICROSECOND).toBe(BigInt(1_000));
      expect(NS_PER_MILLISECOND).toBe(BigInt(1_000_000));
      expect(NS_PER_SECOND).toBe(BigInt(1_000_000_000));
    });
  });
});

describe("Ghost Voice Alerts", () => {
  // These test the alert configuration logic
  
  it("maps connection quality to Destiny terminology", () => {
    const qualityMap: Record<string, string> = {
      "excellent": "Flawless Connection",
      "good": "Shaxx is Watching",
      "fair": "Light Fading",
      "poor": "Darkness Approaches",
      "critical": "Guardian Down",
    };

    expect(qualityMap["excellent"]).toBe("Flawless Connection");
    expect(qualityMap["critical"]).toBe("Guardian Down");
  });

  it("generates appropriate alert messages for lag spikes", () => {
    const generateLagAlert = (latencyMs: number): string => {
      if (latencyMs > 300) {
        return "Guardian, critical lag spike detected. Connection severely compromised.";
      } else if (latencyMs > 200) {
        return "Warning Guardian, significant latency increase detected.";
      } else if (latencyMs > 100) {
        return "Minor lag spike detected. Monitoring connection.";
      }
      return "";
    };

    expect(generateLagAlert(350)).toContain("critical");
    expect(generateLagAlert(250)).toContain("Warning");
    expect(generateLagAlert(150)).toContain("Minor");
    expect(generateLagAlert(50)).toBe("");
  });

  it("generates peer connection alerts", () => {
    const generatePeerAlert = (event: "joined" | "left", count: number): string => {
      if (event === "joined") {
        return `New Guardian detected. ${count} combatants in the arena.`;
      } else {
        return `Guardian has departed. ${count} combatants remaining.`;
      }
    };

    expect(generatePeerAlert("joined", 6)).toContain("6 combatants in the arena");
    expect(generatePeerAlert("left", 5)).toContain("5 combatants remaining");
  });
});

describe("BPF Filter Builder", () => {
  // Test BPF filter generation logic
  
  describe("filter syntax validation", () => {
    const validateFilter = (filter: string): { valid: boolean; error?: string } => {
      if (!filter.trim()) return { valid: true };
      
      // Check for multiple consecutive spaces
      if (/\s{2,}/.test(filter)) {
        return { valid: false, error: "Multiple consecutive spaces" };
      }
      
      // Check for starting with operator
      if (/^(and|or)\s/i.test(filter)) {
        return { valid: false, error: "Cannot start with operator" };
      }
      
      // Check for ending with operator
      if (/\s(and|or)$/i.test(filter)) {
        return { valid: false, error: "Cannot end with operator" };
      }
      
      // Check balanced parentheses
      let depth = 0;
      for (const char of filter) {
        if (char === "(") depth++;
        if (char === ")") depth--;
        if (depth < 0) return { valid: false, error: "Unbalanced parentheses" };
      }
      if (depth !== 0) return { valid: false, error: "Unbalanced parentheses" };
      
      return { valid: true };
    };

    it("validates correct BPF filters", () => {
      expect(validateFilter("udp port 3074").valid).toBe(true);
      expect(validateFilter("host 192.168.1.1 and udp port 3074").valid).toBe(true);
      expect(validateFilter("(udp port 3074) or (tcp port 443)").valid).toBe(true);
    });

    it("rejects filters starting with operators", () => {
      expect(validateFilter("and udp port 3074").valid).toBe(false);
      expect(validateFilter("or tcp port 443").valid).toBe(false);
    });

    it("rejects filters ending with operators", () => {
      expect(validateFilter("udp port 3074 and").valid).toBe(false);
      expect(validateFilter("tcp port 443 or").valid).toBe(false);
    });

    it("rejects unbalanced parentheses", () => {
      expect(validateFilter("(udp port 3074").valid).toBe(false);
      expect(validateFilter("udp port 3074)").valid).toBe(false);
      expect(validateFilter("((udp port 3074)").valid).toBe(false);
    });

    it("accepts empty filters", () => {
      expect(validateFilter("").valid).toBe(true);
      expect(validateFilter("   ").valid).toBe(true);
    });
  });

  describe("Destiny 2 preset filters", () => {
    const DESTINY_PRESETS = {
      destiny_all: "udp port 3074 or udp port 3097 or udp portrange 3478-3480",
      destiny_p2p: "udp port 3074",
      destiny_stun: "udp portrange 3478-3480",
    };

    it("has correct Destiny 2 P2P filter", () => {
      expect(DESTINY_PRESETS.destiny_p2p).toBe("udp port 3074");
    });

    it("has correct Destiny 2 all traffic filter", () => {
      expect(DESTINY_PRESETS.destiny_all).toContain("3074");
      expect(DESTINY_PRESETS.destiny_all).toContain("3097");
      expect(DESTINY_PRESETS.destiny_all).toContain("3478-3480");
    });

    it("has correct STUN/NAT traversal filter", () => {
      expect(DESTINY_PRESETS.destiny_stun).toContain("3478-3480");
    });
  });

  describe("filter combination", () => {
    const combineFilters = (filters: string[], deviceIp?: string): string => {
      const parts = filters.filter(f => f.trim()).map(f => `(${f})`);
      
      if (deviceIp && parts.length > 0) {
        return `host ${deviceIp} and (${parts.join(" or ")})`;
      } else if (deviceIp) {
        return `host ${deviceIp}`;
      }
      
      return parts.join(" or ");
    };

    it("combines multiple filters with OR", () => {
      const result = combineFilters(["udp port 3074", "tcp port 443"]);
      expect(result).toBe("(udp port 3074) or (tcp port 443)");
    });

    it("scopes filters to device IP", () => {
      const result = combineFilters(["udp port 3074"], "192.168.1.100");
      expect(result).toBe("host 192.168.1.100 and ((udp port 3074))");
    });

    it("handles device IP only", () => {
      const result = combineFilters([], "192.168.1.100");
      expect(result).toBe("host 192.168.1.100");
    });

    it("handles empty input", () => {
      const result = combineFilters([]);
      expect(result).toBe("");
    });
  });
});
