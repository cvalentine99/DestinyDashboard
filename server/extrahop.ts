import axios, { AxiosInstance } from "axios";

// ExtraHop API client for network monitoring
export interface ExtrahopCredentials {
  apiUrl: string;
  apiKey: string;
}

export interface Device {
  id: number;
  display_name: string;
  ipaddr4: string;
  macaddr: string;
  device_class: string;
  role: string;
  vendor: string;
  is_l3: boolean;
  activity: string[];
  analysis_level: number;
  mod_time: number;
}

export interface Alert {
  id: number;
  severity: number;
  type: string;
  name: string;
  description: string;
  mod_time: number;
  stat_name: string;
  object_type: string;
}

export interface Detection {
  id: number;
  title: string;
  description: string;
  risk_score: number;
  type: string;
  categories: string[];
  participants: {
    role: string;
    object_type: string;
    object_id: number;
  }[];
  start_time: number;
  end_time: number;
  mod_time: number;
}

export interface MetricResult {
  stats: {
    time: number;
    values: { key: { str?: string; addr?: string }; value: number }[];
  }[];
}

export interface TopologyNode {
  id: number;
  object_type: string;
  name: string;
  ipaddr?: string;
}

export interface TopologyEdge {
  source: number;
  target: number;
  protocol: string;
  weight: number;
}

export interface TopologyResponse {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export class ExtrahopClient {
  private client: AxiosInstance;

  constructor(credentials: ExtrahopCredentials) {
    this.client = axios.create({
      baseURL: `${credentials.apiUrl}/api/v1`,
      headers: {
        Authorization: `ExtraHop apikey=${credentials.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });
  }

  // Get appliance info
  async getApplianceInfo() {
    const response = await this.client.get("/extrahop");
    return response.data;
  }

  // Get all devices
  async getDevices(params?: {
    limit?: number;
    offset?: number;
    search_type?: string;
    value?: string;
  }): Promise<Device[]> {
    const response = await this.client.get("/devices", { params });
    return response.data;
  }

  // Get device by ID
  async getDevice(id: number): Promise<Device> {
    const response = await this.client.get(`/devices/${id}`);
    return response.data;
  }

  // Search devices
  async searchDevices(filter: {
    field: string;
    operator: string;
    operand: string | number;
  }[]): Promise<Device[]> {
    const response = await this.client.post("/devices/search", {
      filter: { rules: filter, operator: "and" },
    });
    return response.data;
  }

  // Get all alerts
  async getAlerts(): Promise<Alert[]> {
    const response = await this.client.get("/alerts");
    return response.data;
  }

  // Get alert by ID
  async getAlert(id: number): Promise<Alert> {
    const response = await this.client.get(`/alerts/${id}`);
    return response.data;
  }

  // Get detections
  async getDetections(params?: {
    from?: number;
    until?: number;
    limit?: number;
    offset?: number;
    filter?: object;
  }): Promise<{ detections: Detection[] }> {
    const response = await this.client.get("/detections", { params });
    return response.data;
  }

  // Get detection by ID
  async getDetection(id: number): Promise<Detection> {
    const response = await this.client.get(`/detections/${id}`);
    return response.data;
  }

  // Query metrics
  async queryMetrics(params: {
    cycle: "auto" | "1sec" | "30sec" | "5min" | "1hr" | "24hr";
    from: number;
    until?: number;
    metric_category: string;
    metric_specs: { name: string; key1?: string; key2?: string }[];
    object_type: string;
    object_ids?: number[];
  }): Promise<MetricResult> {
    const response = await this.client.post("/metrics", params);
    return response.data;
  }

  // Get activity maps
  async getActivityMaps() {
    const response = await this.client.get("/activitymaps");
    return response.data;
  }

  // Query topology
  async queryTopology(params: {
    from: number;
    until?: number;
    walks: {
      origins: { object_type: string; object_id: number }[];
      steps: {
        relationships?: { protocol?: string; role?: string }[];
      }[];
    }[];
    weighting?: "bytes" | "connections" | "turns";
    edge_annotations?: string[];
  }): Promise<TopologyResponse> {
    const response = await this.client.post("/activitymaps/query", params);
    return response.data;
  }

  // Get networks
  async getNetworks() {
    const response = await this.client.get("/networks");
    return response.data;
  }

  // Get device groups
  async getDeviceGroups() {
    const response = await this.client.get("/devicegroups");
    return response.data;
  }

  // Get watchlist devices
  async getWatchlistDevices(): Promise<Device[]> {
    const response = await this.client.get("/watchlist/devices");
    return response.data;
  }

  // Get tags
  async getTags() {
    const response = await this.client.get("/tags");
    return response.data;
  }

  // Get software versions
  async getSoftware() {
    const response = await this.client.get("/software");
    return response.data;
  }

  // Get records (packet search)
  async searchRecords(params: {
    from: number;
    until?: number;
    types?: string[];
    filter?: object;
    limit?: number;
  }) {
    const response = await this.client.post("/records/search", params);
    return response.data;
  }
}

// Destiny 2 terminology mapping
export const destinyTerminology = {
  // Device types -> Guardian classes
  deviceClass: {
    server: "Titan", // Strong, defensive
    client: "Hunter", // Agile, numerous
    gateway: "Warlock", // Mystical, routing
    firewall: "Ward of Dawn",
    loadbalancer: "Well of Radiance",
    database: "Cryptarch",
    dns: "Ghost",
    proxy: "Shade",
  },
  // Alert severities -> Threat levels
  severity: {
    critical: "Extinction-Level Threat",
    high: "Darkness Incursion",
    medium: "Fallen Raid",
    low: "Minor Skirmish",
    info: "Ghost Scan",
  },
  // Metrics -> Power levels
  metrics: {
    bytes: "Light Energy",
    connections: "Fireteam Links",
    latency: "Warp Speed",
    throughput: "Glimmer Flow",
    packets: "Engrams",
    errors: "Corrupted Data",
  },
  // Protocols -> Abilities
  protocols: {
    HTTP: "Solar Strike",
    HTTPS: "Golden Gun",
    DNS: "Ghost Protocol",
    SSH: "Shadowshot",
    RDP: "Thundercrash",
    SMB: "Sentinel Shield",
    FTP: "Arc Staff",
    SMTP: "Nova Bomb",
    LDAP: "Daybreak",
    SQL: "Blade Barrage",
  },
  // Status -> Guardian status
  status: {
    active: "In Combat",
    idle: "At Tower",
    offline: "Ghost Dormant",
    warning: "Shields Low",
    critical: "Guardian Down",
  },
};

// Convert ExtraHop data to Destiny-themed display
export function toDestinyDevice(device: Device) {
  const classMap = destinyTerminology.deviceClass;
  const guardianClass = classMap[device.device_class as keyof typeof classMap] || "Unknown Guardian";
  
  return {
    id: device.id,
    name: device.display_name || `Guardian-${device.id}`,
    guardianClass,
    lightLevel: Math.floor(Math.random() * 100) + 1800, // Simulated power level
    ipAddress: device.ipaddr4,
    macAddress: device.macaddr,
    vendor: device.vendor,
    status: device.analysis_level > 0 ? "active" : "idle",
    destinyStatus: device.analysis_level > 0 
      ? destinyTerminology.status.active 
      : destinyTerminology.status.idle,
    lastSeen: new Date(device.mod_time).toISOString(),
    activities: device.activity || [],
  };
}

export function toDestinyAlert(alert: Alert) {
  const severityMap: Record<number, keyof typeof destinyTerminology.severity> = {
    0: "info",
    1: "low",
    2: "medium",
    3: "high",
    4: "critical",
  };
  const severityKey = severityMap[alert.severity] || "info";
  
  return {
    id: alert.id,
    threatLevel: destinyTerminology.severity[severityKey],
    severity: severityKey,
    type: alert.type,
    title: alert.name,
    description: alert.description,
    timestamp: new Date(alert.mod_time).toISOString(),
  };
}

export function toDestinyMetric(metricName: string, value: number) {
  const metricMap = destinyTerminology.metrics;
  const destinyName = metricMap[metricName as keyof typeof metricMap] || metricName;
  
  return {
    name: destinyName,
    originalName: metricName,
    value,
    displayValue: formatMetricValue(metricName, value),
  };
}

function formatMetricValue(metricName: string, value: number): string {
  if (metricName === "bytes") {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)} TB`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)} GB`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)} MB`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)} KB`;
    return `${value} B`;
  }
  if (metricName === "latency") {
    return `${value.toFixed(2)} ms`;
  }
  return value.toLocaleString();
}
