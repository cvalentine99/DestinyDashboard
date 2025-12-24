// Crucible Operations Center - PS5 Destiny 2 PvP Match Monitoring
import { ExtrahopClient } from "./extrahop";

// Known Bungie/Destiny 2 server IP ranges and ports
export const BUNGIE_IP_RANGES = [
  // Bungie API servers
  { range: "34.196.0.0/16", type: "api", region: "us-east" },
  { range: "52.0.0.0/8", type: "api", region: "aws" },
  // Game servers (common ranges)
  { range: "35.0.0.0/8", type: "game", region: "gcp" },
  { range: "104.196.0.0/16", type: "game", region: "gcp" },
  // Steam relay servers (for PC, but may appear in traffic)
  { range: "162.254.0.0/16", type: "relay", region: "valve" },
];

// Destiny 2 uses these ports for game traffic
export const DESTINY_PORTS = {
  game: [3074, 3478, 3479, 3480], // Primary game ports
  psn: [3478, 3479, 3480], // PSN ports
  stun: [3478], // STUN for NAT traversal
  voice: [3074], // Voice chat
};

// Traffic patterns that indicate different game states
export const TRAFFIC_PATTERNS = {
  orbit: {
    description: "Low, steady traffic to Bungie API servers",
    bytesPerSecondRange: [1000, 50000],
    peerConnections: 0,
  },
  matchmaking: {
    description: "Burst traffic to matchmaking servers, increasing peer discovery",
    bytesPerSecondRange: [10000, 100000],
    peerConnections: [0, 5],
  },
  loading: {
    description: "High burst traffic, asset streaming, peer connections establishing",
    bytesPerSecondRange: [100000, 5000000],
    peerConnections: [1, 12],
  },
  in_match: {
    description: "Steady high-frequency P2P traffic with game server heartbeats",
    bytesPerSecondRange: [50000, 500000],
    peerConnections: [3, 12],
    packetFrequency: "high", // 30-60 packets/second typical
  },
  post_game: {
    description: "Declining traffic, stats upload, peer disconnections",
    bytesPerSecondRange: [10000, 100000],
    peerConnections: "declining",
  },
};

// Match state detection thresholds
export const MATCH_DETECTION = {
  // Minimum P2P connections to consider "in match"
  minPeersForMatch: 3,
  // Traffic threshold to detect matchmaking (bytes/sec)
  matchmakingTrafficThreshold: 20000,
  // Sustained traffic duration to confirm match start (ms)
  matchConfirmationDuration: 5000,
  // Lag spike threshold (ms)
  lagSpikeThreshold: 150,
  // Severe lag threshold (ms)
  severeLagThreshold: 300,
  // Packet loss threshold to trigger alert (percentage)
  packetLossAlertThreshold: 2,
  // Jitter threshold (ms)
  jitterAlertThreshold: 50,
};

// Destiny 2 Crucible terminology mapping
export const crucibleTerminology = {
  matchStates: {
    orbit: "In Orbit",
    matchmaking: "Searching for Guardians",
    loading: "Transmatting",
    in_match: "Shaxx is Watching",
    post_game: "Fight Complete",
    unknown: "Ghost Scanning",
  },
  connectionQuality: {
    excellent: "Flawless Connection",
    good: "Stable Light",
    fair: "Interference Detected",
    poor: "Darkness Encroaching",
    critical: "Guardian Down Risk",
  },
  events: {
    match_start: "Match Initiated",
    match_end: "Victory/Defeat",
    lag_spike: "Temporal Anomaly",
    packet_loss_spike: "Light Disruption",
    peer_joined: "Guardian Joined",
    peer_left: "Guardian Departed",
    connection_degraded: "Shields Weakening",
    connection_recovered: "Shields Restored",
    bungie_server_switch: "Server Migration",
    network_anomaly: "Vex Interference",
    high_jitter: "Unstable Rift",
    disconnect: "Guardian Down",
    reconnect: "Ghost Revive",
  },
};

// Connection quality rating based on metrics
export function rateConnectionQuality(latencyMs: number, packetLossPercent: number, jitterMs: number): {
  rating: keyof typeof crucibleTerminology.connectionQuality;
  score: number;
  destinyTerm: string;
} {
  // Score from 0-100, higher is better
  let score = 100;
  
  // Latency scoring (ideal < 30ms, acceptable < 80ms)
  if (latencyMs > 200) score -= 40;
  else if (latencyMs > 150) score -= 30;
  else if (latencyMs > 100) score -= 20;
  else if (latencyMs > 80) score -= 10;
  else if (latencyMs > 50) score -= 5;
  
  // Packet loss scoring (any loss is bad in FPS)
  if (packetLossPercent > 5) score -= 35;
  else if (packetLossPercent > 3) score -= 25;
  else if (packetLossPercent > 2) score -= 15;
  else if (packetLossPercent > 1) score -= 10;
  else if (packetLossPercent > 0.5) score -= 5;
  
  // Jitter scoring (consistency matters)
  if (jitterMs > 100) score -= 25;
  else if (jitterMs > 50) score -= 15;
  else if (jitterMs > 30) score -= 10;
  else if (jitterMs > 20) score -= 5;
  
  // Determine rating
  let rating: keyof typeof crucibleTerminology.connectionQuality;
  if (score >= 90) rating = "excellent";
  else if (score >= 70) rating = "good";
  else if (score >= 50) rating = "fair";
  else if (score >= 30) rating = "poor";
  else rating = "critical";
  
  return {
    rating,
    score: Math.max(0, score),
    destinyTerm: crucibleTerminology.connectionQuality[rating],
  };
}

// Detect match state from traffic metrics
export function detectMatchState(metrics: {
  bytesPerSecond: number;
  peerCount: number;
  bungieTrafficPercent: number;
  p2pTrafficPercent: number;
  previousState?: string;
}): {
  state: keyof typeof TRAFFIC_PATTERNS;
  confidence: number;
  destinyTerm: string;
} {
  const { bytesPerSecond, peerCount, bungieTrafficPercent, p2pTrafficPercent, previousState } = metrics;
  
  let state: keyof typeof TRAFFIC_PATTERNS = "orbit";
  let confidence = 0;
  
  // In-match detection (highest priority)
  if (peerCount >= MATCH_DETECTION.minPeersForMatch && p2pTrafficPercent > 30) {
    state = "in_match";
    confidence = Math.min(95, 60 + peerCount * 3 + p2pTrafficPercent * 0.3);
  }
  // Loading detection
  else if (bytesPerSecond > 500000 && peerCount > 0) {
    state = "loading";
    confidence = Math.min(90, 50 + (bytesPerSecond / 100000));
  }
  // Matchmaking detection
  else if (bytesPerSecond > MATCH_DETECTION.matchmakingTrafficThreshold && bungieTrafficPercent > 50) {
    state = "matchmaking";
    confidence = Math.min(85, 40 + bungieTrafficPercent * 0.4);
  }
  // Post-game detection (transition from in_match)
  else if (previousState === "in_match" && peerCount < MATCH_DETECTION.minPeersForMatch) {
    state = "post_game";
    confidence = 70;
  }
  // Default to orbit
  else {
    state = "orbit";
    confidence = bytesPerSecond < 50000 ? 80 : 50;
  }
  
  return {
    state,
    confidence,
    destinyTerm: crucibleTerminology.matchStates[state],
  };
}

// Check if an IP is likely a Bungie server
export function isBungieServer(ip: string): boolean {
  // Simple check - in production would use proper CIDR matching
  const bungiePatterns = [
    /^34\.196\./,
    /^52\./,
    /^35\./,
    /^104\.196\./,
  ];
  return bungiePatterns.some(pattern => pattern.test(ip));
}

// Check if traffic is likely Destiny 2 related
export function isDestinyTraffic(port: number): boolean {
  const allPorts = [
    ...DESTINY_PORTS.game,
    ...DESTINY_PORTS.psn,
  ];
  return allPorts.includes(port);
}

// Generate ExtraHop metric query for PS5 device
export function buildPS5MetricQuery(deviceId: number, metricCategory: string = "net"): object {
  return {
    cycle: "auto",
    from: -300000, // Last 5 minutes
    until: 0,
    metric_category: metricCategory,
    object_type: "device",
    object_ids: [deviceId],
    metric_specs: [
      { name: "bytes_in" },
      { name: "bytes_out" },
      { name: "pkts_in" },
      { name: "pkts_out" },
      { name: "rto_in" },
      { name: "rto_out" },
      { name: "network_latency_avg" },
      { name: "network_latency_max" },
    ],
  };
}

// Build query for peer connections
export function buildPeerConnectionQuery(deviceId: number): object {
  return {
    from: -60000, // Last minute
    until: 0,
    edge_annotations: ["protocols"],
    walks: [{
      origins: [{ object_type: "device", object_id: deviceId }],
      steps: [{
        direction: "any",
        relationships: [{
          protocol: "any",
          role: "any",
        }],
      }],
    }],
  };
}

// Parse ExtraHop metrics response for Crucible monitoring
export function parseMetricsForCrucible(metricsResponse: any): {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  latencyAvg: number;
  latencyMax: number;
  retransmits: number;
  timestamp: number;
} {
  const stats = metricsResponse?.stats?.[0]?.values?.[0] || [];
  
  return {
    bytesIn: stats[0]?.[0] || 0,
    bytesOut: stats[1]?.[0] || 0,
    packetsIn: stats[2]?.[0] || 0,
    packetsOut: stats[3]?.[0] || 0,
    latencyAvg: stats[6]?.[0] || 0,
    latencyMax: stats[7]?.[0] || 0,
    retransmits: (stats[4]?.[0] || 0) + (stats[5]?.[0] || 0),
    timestamp: Date.now(),
  };
}

// Calculate packet loss from metrics
export function calculatePacketLoss(sent: number, received: number, retransmits: number): number {
  if (sent === 0) return 0;
  const expectedReceived = sent - retransmits;
  const loss = Math.max(0, expectedReceived - received);
  return (loss / sent) * 100;
}

// Detect lag spike from latency samples
export function detectLagSpike(currentLatency: number, avgLatency: number): {
  isSpike: boolean;
  severity: "warning" | "critical" | null;
  description: string;
} {
  const deviation = currentLatency - avgLatency;
  
  if (currentLatency > MATCH_DETECTION.severeLagThreshold) {
    return {
      isSpike: true,
      severity: "critical",
      description: `Severe lag spike: ${currentLatency}ms (${deviation}ms above average)`,
    };
  }
  
  if (currentLatency > MATCH_DETECTION.lagSpikeThreshold && deviation > 50) {
    return {
      isSpike: true,
      severity: "warning",
      description: `Lag spike detected: ${currentLatency}ms (${deviation}ms above average)`,
    };
  }
  
  return {
    isSpike: false,
    severity: null,
    description: "",
  };
}

// Format match duration for display
export function formatMatchDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Generate match summary
export function generateMatchSummary(match: {
  durationMs: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  packetLossPercent: number;
  avgJitterMs: number;
  peerCount: number;
  lagSpikeCount: number;
}): {
  overallRating: string;
  destinyVerdict: string;
  highlights: string[];
  issues: string[];
} {
  const quality = rateConnectionQuality(match.avgLatencyMs, match.packetLossPercent, match.avgJitterMs);
  const highlights: string[] = [];
  const issues: string[] = [];
  
  // Analyze the match
  if (match.avgLatencyMs < 50) highlights.push("Excellent average latency");
  if (match.packetLossPercent < 0.5) highlights.push("Minimal packet loss");
  if (match.lagSpikeCount === 0) highlights.push("No lag spikes detected");
  if (match.peerCount >= 6) highlights.push("Full lobby connection");
  
  if (match.maxLatencyMs > 200) issues.push(`Peak latency reached ${match.maxLatencyMs}ms`);
  if (match.packetLossPercent > 2) issues.push(`${match.packetLossPercent.toFixed(1)}% packet loss`);
  if (match.lagSpikeCount > 3) issues.push(`${match.lagSpikeCount} lag spikes during match`);
  if (match.avgJitterMs > 30) issues.push(`High jitter: ${match.avgJitterMs}ms average`);
  
  // Destiny-themed verdict
  let destinyVerdict: string;
  if (quality.score >= 90) {
    destinyVerdict = "Shaxx approves! Flawless connection, Guardian.";
  } else if (quality.score >= 70) {
    destinyVerdict = "Solid performance. The Light was with you.";
  } else if (quality.score >= 50) {
    destinyVerdict = "Connection held, but the Darkness tested you.";
  } else {
    destinyVerdict = "The Vex disrupted your timeline. Consider network optimization.";
  }
  
  return {
    overallRating: quality.rating,
    destinyVerdict,
    highlights,
    issues,
  };
}
