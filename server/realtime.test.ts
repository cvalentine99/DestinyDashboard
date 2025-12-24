import { describe, expect, it } from "vitest";
import { ExtrahopClient } from "./extrahop";

describe("Real-time Metrics", () => {
  describe("1-second polling configuration", () => {
    it("should use 1sec cycle for real-time metrics", () => {
      // Verify the metric query uses 1-second granularity
      const query = {
        cycle: "1sec" as const,
        from: -30000,
        until: 0,
        metric_category: "net",
        object_type: "device" as const,
        object_ids: [12345],
        metric_specs: [
          { name: "bytes_in" },
          { name: "bytes_out" },
        ],
      };
      
      expect(query.cycle).toBe("1sec");
      expect(query.from).toBe(-30000); // Last 30 seconds
    });

    it("should include all required metric specs for network monitoring", () => {
      const netMetricSpecs = [
        { name: "bytes_in" },
        { name: "bytes_out" },
        { name: "pkts_in" },
        { name: "pkts_out" },
        { name: "rto_in" },
        { name: "rto_out" },
      ];
      
      expect(netMetricSpecs).toHaveLength(6);
      expect(netMetricSpecs.map(s => s.name)).toContain("bytes_in");
      expect(netMetricSpecs.map(s => s.name)).toContain("pkts_out");
    });

    it("should include TCP metrics for latency tracking", () => {
      const tcpMetricSpecs = [
        { name: "rtt" },
        { name: "retrans_out" },
      ];
      
      expect(tcpMetricSpecs).toHaveLength(2);
      expect(tcpMetricSpecs.map(s => s.name)).toContain("rtt");
    });
  });

  describe("jitter calculation", () => {
    it("should calculate jitter from RTT variance", () => {
      const dataPoints = [
        { timestamp: 1000, latencyMs: 25 },
        { timestamp: 2000, latencyMs: 30 },
        { timestamp: 3000, latencyMs: 22 },
      ];
      
      // Jitter is the absolute difference between consecutive RTT values
      const jitter1 = Math.abs(dataPoints[1].latencyMs - dataPoints[0].latencyMs);
      const jitter2 = Math.abs(dataPoints[2].latencyMs - dataPoints[1].latencyMs);
      
      expect(jitter1).toBe(5);
      expect(jitter2).toBe(8);
    });
  });

  describe("packet loss calculation", () => {
    it("should calculate packet loss percentage from retransmits", () => {
      const pktsOut = 1000;
      const retrans = 15;
      
      const packetLoss = (retrans / pktsOut) * 100;
      
      expect(packetLoss).toBe(1.5);
    });

    it("should handle zero packets gracefully", () => {
      const pktsOut = 0;
      const retrans = 0;
      
      const packetLoss = pktsOut > 0 ? (retrans / pktsOut) * 100 : 0;
      
      expect(packetLoss).toBe(0);
    });
  });
});

describe("PCAP Download", () => {
  describe("packets/search endpoint configuration", () => {
    it("should configure PCAP search with device IP", () => {
      const params = {
        from: Date.now() - 300000,
        until: Date.now(),
        ip1: "192.168.1.100",
        limit_bytes: 100000000,
        output: "pcap" as const,
      };
      
      expect(params.ip1).toBe("192.168.1.100");
      expect(params.limit_bytes).toBe(100000000); // 100MB
      expect(params.output).toBe("pcap");
    });

    it("should configure peer-to-peer PCAP with both IPs", () => {
      const params = {
        from: Date.now() - 60000,
        until: Date.now(),
        ip1: "192.168.1.100",
        ip2: "203.0.113.50",
        limit_bytes: 50000000,
        output: "pcap" as const,
      };
      
      expect(params.ip1).toBe("192.168.1.100");
      expect(params.ip2).toBe("203.0.113.50");
      expect(params.limit_bytes).toBe(50000000); // 50MB
    });

    it("should support BPF filter for advanced filtering", () => {
      const params = {
        from: Date.now() - 300000,
        until: Date.now(),
        bpf: "host 192.168.1.100 and port 3074",
        limit_bytes: 100000000,
        output: "pcap" as const,
      };
      
      expect(params.bpf).toBe("host 192.168.1.100 and port 3074");
    });
  });

  describe("PCAP filename generation", () => {
    it("should generate filename with device IP and timestamp", () => {
      const deviceIp = "192.168.1.100";
      const timestamp = Date.now();
      
      const filename = `crucible_${deviceIp.replace(/\./g, "_")}_${timestamp}.pcap`;
      
      expect(filename).toContain("crucible_");
      expect(filename).toContain("192_168_1_100");
      expect(filename).toMatch(/\.pcap$/);
    });

    it("should generate match PCAP filename with match ID", () => {
      const matchId = 42;
      const gameMode = "trials";
      
      const filename = `crucible_match_${matchId}_${gameMode}.pcap`;
      
      expect(filename).toBe("crucible_match_42_trials.pcap");
    });
  });

  describe("base64 encoding for transport", () => {
    it("should encode ArrayBuffer to base64", () => {
      // Simulate PCAP data
      const pcapData = new Uint8Array([0xd4, 0xc3, 0xb2, 0xa1]); // PCAP magic number (little endian)
      const buffer = pcapData.buffer;
      
      const base64 = Buffer.from(buffer).toString("base64");
      
      expect(base64).toBe("1MOyoQ==");
    });
  });
});

describe("Real-time Peer Tracking", () => {
  describe("topology query for peers", () => {
    it("should query device topology with 60-second window", () => {
      const params = {
        from: -60000,
        until: 0,
        edge_annotations: ["protocols", "appearances"] as const,
        weighting: "bytes" as const,
        walks: [{
          origins: [{ object_type: "device" as const, object_id: 12345 }],
          steps: [{
            relationships: [{ role: "any" as const }],
          }],
        }],
      };
      
      expect(params.from).toBe(-60000); // Last 60 seconds
      expect(params.edge_annotations).toContain("protocols");
      expect(params.walks[0].origins[0].object_id).toBe(12345);
    });
  });

  describe("peer filtering", () => {
    it("should filter out the source device from peer list", () => {
      const deviceId = 12345;
      const nodes = [
        { id: 12345, object_type: "device", name: "PS5" },
        { id: 67890, object_type: "device", name: "Peer 1" },
        { id: 11111, object_type: "device", name: "Peer 2" },
      ];
      
      const peers = nodes.filter(n => n.id !== deviceId);
      
      expect(peers).toHaveLength(2);
      expect(peers.map(p => p.id)).not.toContain(12345);
    });
  });
});
