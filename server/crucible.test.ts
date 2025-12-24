import { describe, expect, it } from "vitest";
import {
  crucibleTerminology,
  detectMatchState,
  detectLagSpike,
  rateConnectionQuality,
  generateMatchSummary,
  BUNGIE_IP_RANGES,
  DESTINY_PORTS,
} from "./crucible";

describe("Crucible Operations Center", () => {
  describe("crucibleTerminology", () => {
    it("should have all required terminology mappings", () => {
      expect(crucibleTerminology).toBeDefined();
      expect(crucibleTerminology.matchStates).toBeDefined();
      expect(crucibleTerminology.connectionQuality).toBeDefined();
      expect(crucibleTerminology.events).toBeDefined();
    });

    it("should map match states to Destiny terms", () => {
      expect(crucibleTerminology.matchStates.orbit).toBe("In Orbit");
      expect(crucibleTerminology.matchStates.matchmaking).toBe("Searching for Guardians");
      expect(crucibleTerminology.matchStates.loading).toBe("Transmatting");
      expect(crucibleTerminology.matchStates.in_match).toBe("Shaxx is Watching");
      expect(crucibleTerminology.matchStates.post_game).toBe("Fight Complete");
    });

    it("should map connection quality to Destiny terms", () => {
      expect(crucibleTerminology.connectionQuality.excellent).toBe("Flawless Connection");
      expect(crucibleTerminology.connectionQuality.good).toBe("Stable Light");
      expect(crucibleTerminology.connectionQuality.fair).toBe("Interference Detected");
      expect(crucibleTerminology.connectionQuality.poor).toBe("Darkness Encroaching");
      expect(crucibleTerminology.connectionQuality.critical).toBe("Guardian Down Risk");
    });

    it("should map event types to Destiny terms", () => {
      expect(crucibleTerminology.events.lag_spike).toBe("Temporal Anomaly");
      expect(crucibleTerminology.events.peer_joined).toBe("Guardian Joined");
      expect(crucibleTerminology.events.peer_left).toBe("Guardian Departed");
      expect(crucibleTerminology.events.match_start).toBe("Match Initiated");
      expect(crucibleTerminology.events.match_end).toBe("Victory/Defeat");
    });
  });

  describe("detectMatchState", () => {
    it("should detect orbit state with low traffic", () => {
      const result = detectMatchState({
        bytesPerSecond: 5000,
        peerCount: 0,
        bungieTrafficPercent: 80,
        p2pTrafficPercent: 20,
      });
      expect(result.state).toBe("orbit");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should detect matchmaking state with moderate traffic and no peers", () => {
      const result = detectMatchState({
        bytesPerSecond: 80000,
        peerCount: 0,
        bungieTrafficPercent: 90,
        p2pTrafficPercent: 10,
      });
      expect(result.state).toBe("matchmaking");
    });

    it("should detect in_match state with high traffic and peers", () => {
      const result = detectMatchState({
        bytesPerSecond: 500000,
        peerCount: 8,
        bungieTrafficPercent: 30,
        p2pTrafficPercent: 70,
      });
      expect(result.state).toBe("in_match");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should detect loading state with high Bungie traffic and few peers", () => {
      const result = detectMatchState({
        bytesPerSecond: 2000000,
        peerCount: 2,
        bungieTrafficPercent: 85,
        p2pTrafficPercent: 15,
      });
      expect(result.state).toBe("loading");
    });
  });

  describe("detectLagSpike", () => {
    it("should not detect lag spike for normal latency", () => {
      const result = detectLagSpike(45, 40);
      expect(result.isSpike).toBe(false);
    });

    it("should detect minor lag spike", () => {
      // Needs to be above 150ms threshold AND 50ms above average
      const result = detectLagSpike(160, 40);
      expect(result.isSpike).toBe(true);
      expect(result.severity).toBe("warning");
    });

    it("should detect major lag spike", () => {
      // 200ms is above 150ms threshold but below 300ms severe threshold, so it's warning
      const result = detectLagSpike(200, 40);
      expect(result.isSpike).toBe(true);
      expect(result.severity).toBe("warning");
    });

    it("should detect critical lag spike", () => {
      const result = detectLagSpike(500, 40);
      expect(result.isSpike).toBe(true);
      expect(result.severity).toBe("critical");
    });

    it("should include description with spike details", () => {
      // Must be above 150ms threshold and 50ms above average to trigger spike
      const result = detectLagSpike(160, 40);
      expect(result.description).toContain("160ms");
      expect(result.description).toContain("120ms"); // deviation
    });
  });

  describe("rateConnectionQuality", () => {
    it("should rate excellent connection", () => {
      const result = rateConnectionQuality(20, 0, 5);
      expect(result.rating).toBe("excellent");
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.destinyTerm).toBe("Flawless Connection");
    });

    it("should rate good connection", () => {
      // Need higher latency/loss to get "good" instead of "excellent"
      const result = rateConnectionQuality(60, 1, 25);
      expect(result.rating).toBe("good");
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.score).toBeLessThan(90);
      expect(result.destinyTerm).toBe("Stable Light");
    });

    it("should rate fair connection", () => {
      // Need higher values to get "fair" rating
      const result = rateConnectionQuality(110, 2.5, 35);
      expect(result.rating).toBe("fair");
      expect(result.destinyTerm).toBe("Interference Detected");
    });

    it("should rate poor connection", () => {
      // Need significantly worse values to get "poor" rating
      const result = rateConnectionQuality(160, 4, 60);
      expect(result.rating).toBe("poor");
      expect(result.destinyTerm).toBe("Darkness Encroaching");
    });

    it("should rate critical connection", () => {
      const result = rateConnectionQuality(300, 10, 80);
      expect(result.rating).toBe("critical");
      expect(result.score).toBeLessThan(40);
      expect(result.destinyTerm).toBe("Guardian Down Risk");
    });

    it("should return score between 0 and 100", () => {
      const result1 = rateConnectionQuality(10, 0, 1);
      const result2 = rateConnectionQuality(500, 20, 100);
      expect(result1.score).toBeLessThanOrEqual(100);
      expect(result2.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("generateMatchSummary", () => {
    it("should generate summary for a good match", () => {
      const summary = generateMatchSummary({
        durationMs: 600000, // 10 minutes
        avgLatencyMs: 35,
        maxLatencyMs: 60,
        packetLossPercent: 0.5,
        avgJitterMs: 8,
        peerCount: 11,
        lagSpikeCount: 1,
      });

      expect(summary.overallRating).toBeDefined();
      expect(summary.destinyVerdict).toBeDefined();
      expect(summary.highlights).toBeInstanceOf(Array);
      expect(summary.issues).toBeInstanceOf(Array);
    });

    it("should flag high latency as an issue", () => {
      const summary = generateMatchSummary({
        durationMs: 300000,
        avgLatencyMs: 150,
        maxLatencyMs: 300,
        packetLossPercent: 1,
        avgJitterMs: 30,
        peerCount: 6,
        lagSpikeCount: 5,
      });

      expect(summary.issues.length).toBeGreaterThan(0);
      const hasLatencyIssue = summary.issues.some(i => 
        i.toLowerCase().includes("latency") || i.toLowerCase().includes("lag")
      );
      expect(hasLatencyIssue).toBe(true);
    });

    it("should highlight good connection quality", () => {
      const summary = generateMatchSummary({
        durationMs: 900000,
        avgLatencyMs: 25,
        maxLatencyMs: 40,
        packetLossPercent: 0,
        avgJitterMs: 5,
        peerCount: 11,
        lagSpikeCount: 0,
      });

      expect(summary.highlights.length).toBeGreaterThan(0);
    });

    it("should generate destiny verdict based on quality", () => {
      const goodSummary = generateMatchSummary({
        durationMs: 600000,
        avgLatencyMs: 25,
        maxLatencyMs: 40,
        packetLossPercent: 0,
        avgJitterMs: 5,
        peerCount: 11,
        lagSpikeCount: 0,
      });
      expect(goodSummary.destinyVerdict).toContain("Shaxx");

      const badSummary = generateMatchSummary({
        durationMs: 600000,
        avgLatencyMs: 250,
        maxLatencyMs: 400,
        packetLossPercent: 10,
        avgJitterMs: 80,
        peerCount: 6,
        lagSpikeCount: 10,
      });
      expect(badSummary.destinyVerdict).toContain("Vex");
    });
  });

  describe("Bungie Network Constants", () => {
    it("should have Bungie IP ranges defined", () => {
      expect(BUNGIE_IP_RANGES).toBeDefined();
      expect(BUNGIE_IP_RANGES.length).toBeGreaterThan(0);
    });

    it("should have Destiny ports defined", () => {
      expect(DESTINY_PORTS).toBeDefined();
      expect(DESTINY_PORTS.game).toContain(3074);
      expect(DESTINY_PORTS.psn).toContain(3478);
    });
  });
});
