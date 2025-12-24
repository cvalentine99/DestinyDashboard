// ExtraHop REST API Client - Based on actual API spec v1
// Endpoints: /devices/search, /metrics, /records/search, /activitymaps/query, /detections/search

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { extrahopRateLimiter } from "./_core/rateLimiter";

export interface ExtrahopCredentials {
  apiUrl: string;
  apiKey: string;
}

export interface DeviceSearchFilter {
  field?: string;
  operator: string;
  operand?: string | number | object | string[];
  rules?: DeviceSearchFilter[];
}

export interface DeviceSearchParams {
  filter?: DeviceSearchFilter;
  limit?: number;
  offset?: number;
  active_from?: number | string;
  active_until?: number | string;
  result_fields?: string[];
}

export interface MetricSpec {
  name: string;
  key1?: string;
  key2?: string;
  calc_type?: "mean" | "percentiles";
  percentiles?: number[];
}

export interface MetricQuery {
  cycle: "auto" | "1sec" | "30sec" | "5min" | "1hr" | "24hr";
  from: number | string;
  until: number | string;
  metric_category: string;
  metric_specs: MetricSpec[];
  object_ids: number[];
  object_type: "network" | "device" | "application" | "vlan" | "device_group" | "system";
}

export interface RecordFilter {
  field?: string;
  operator: string;
  operand?: string | number | object;
  rules?: RecordFilter[];
}

export interface RecordQuery {
  from: number | string;
  until?: number | string;
  limit?: number;
  offset?: number;
  filter?: RecordFilter;
  sort?: { field: string; direction: "asc" | "desc" }[];
  types?: string[];
  context_ttl?: number;
}

export interface TopologySource {
  object_id: number;
  object_type: "all_devices" | "device_group" | "device";
}

export interface TopologyRelationship {
  protocol?: string;
  role?: "client" | "server" | "any";
}

export interface TopologyStep {
  peer_in?: TopologySource[];
  peer_not_in?: TopologySource[];
  relationships?: TopologyRelationship[];
}

export interface TopologyWalk {
  origins: TopologySource[];
  steps: TopologyStep[];
}

export interface TopologyQuery {
  from: number | string;
  until?: number | string;
  walks: TopologyWalk[];
  edge_annotations?: ("protocols" | "appearances")[];
  weighting?: "bytes" | "connections" | "turns";
}

export interface DetectionSearchFilter {
  assignee?: string[];
  categories?: string[];
  recommended?: boolean;
  resolution?: ("action_taken" | "no_action_taken")[];
  risk_score_min?: number;
  status?: ("new" | "in_progress" | "closed" | "acknowledged")[];
  ticket_id?: string[];
  types?: string[];
}

export interface DetectionSearchParams {
  filter?: DetectionSearchFilter;
  from?: number;
  until?: number;
  limit?: number;
  offset?: number;
  sort?: { field: string; direction: "asc" | "desc" }[];
  update_time?: number;
}

// ExtraHop Device from API response
export interface Device {
  id: number;
  extrahop_id?: string;
  display_name?: string;
  default_name?: string;
  custom_name?: string;
  description?: string;
  ipaddr4?: string;
  ipaddr6?: string;
  macaddr?: string;
  vendor?: string;
  device_class?: string;
  role?: string;
  auto_role?: string;
  analysis_level?: number;
  analysis?: string;
  is_l3?: boolean;
  vlanid?: number;
  activity?: string[];
  last_seen_time?: number;
  discover_time?: number;
  mod_time?: number;
  on_watchlist?: boolean;
  critical?: boolean;
  model?: string;
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
  cycle: string;
  from: number;
  until: number;
  stats: {
    oid: number;
    time: number;
    duration: number;
    values: number[][];
  }[];
}

export interface TopologyNode {
  id: number;
  object_type: string;
  name?: string;
  ipaddr?: string;
  macaddr?: string;
}

export interface TopologyEdge {
  from: number;
  to: number;
  weight: number;
  protocols?: string[];
  appearances?: number;
}

export interface TopologyResponse {
  edges: TopologyEdge[];
  nodes: TopologyNode[];
}

/**
 * ExtraHop API Client
 *
 * All API calls are rate-limited to prevent hitting appliance limits.
 * Current limit: 100 requests per minute.
 */
export class ExtrahopClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(credentials: ExtrahopCredentials) {
    this.baseUrl = credentials.apiUrl.replace(/\/$/, "");
    this.client = axios.create({
      baseURL: `${this.baseUrl}/api/v1`,
      headers: {
        Authorization: `ExtraHop apikey=${credentials.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });
  }

  /**
   * Rate-limited GET request
   */
  private async rateLimitedGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return extrahopRateLimiter.execute(async () => {
      const response = await this.client.get<T>(url, config);
      return response.data;
    });
  }

  /**
   * Rate-limited POST request
   */
  private async rateLimitedPost<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return extrahopRateLimiter.execute(async () => {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    });
  }

  // ============ DEVICE ENDPOINTS ============

  /**
   * GET /devices - Retrieve all devices
   */
  async getDevices(params?: { limit?: number; offset?: number; search_type?: string; value?: string }): Promise<Device[]> {
    return this.rateLimitedGet<Device[]>("/devices", { params });
  }

  /**
   * POST /devices/search - Search for devices with filters
   * This is the primary way to find devices like the PS5
   */
  async searchDevices(params: DeviceSearchParams): Promise<Device[]> {
    return this.rateLimitedPost<Device[]>("/devices/search", params);
  }

  /**
   * GET /devices/{id} - Get a specific device by ID
   */
  async getDevice(id: number): Promise<Device> {
    return this.rateLimitedGet<Device>(`/devices/${id}`);
  }

  /**
   * GET /devices/{id}/activity - Get device activity (protocols used)
   */
  async getDeviceActivity(deviceId: number): Promise<{ from_time: number; until_time: number; stat_name: string }[]> {
    return this.rateLimitedGet<{ from_time: number; until_time: number; stat_name: string }[]>(`/devices/${deviceId}/activity`);
  }

  /**
   * GET /devices/{id}/ipaddrs - Get IP addresses for a device
   */
  async getDeviceIpAddresses(deviceId: number): Promise<{ ipaddr: string; from: number; until: number }[]> {
    return this.rateLimitedGet<{ ipaddr: string; from: number; until: number }[]>(`/devices/${deviceId}/ipaddrs`);
  }

  /**
   * Find PS5 device by searching for Sony vendor
   * Uses /devices/search with vendor filter
   */
  async findPS5Device(): Promise<Device | null> {
    const devices = await this.searchDevices({
      filter: {
        operator: "or",
        rules: [
          { field: "vendor", operator: "~", operand: "Sony" },
          { field: "name", operator: "~", operand: "PlayStation" },
          { field: "name", operator: "~", operand: "PS5" },
        ],
      },
      result_fields: ["id", "display_name", "default_name", "ipaddr4", "macaddr", "vendor", "device_class", "last_seen_time", "activity", "analysis_level"],
    });
    
    return devices.length > 0 ? devices[0] : null;
  }

  /**
   * Find device by name pattern (e.g., "Sony Interactive Entertainment BCD278")
   */
  async findDeviceByName(namePattern: string): Promise<Device | null> {
    const devices = await this.searchDevices({
      filter: {
        field: "name",
        operator: "~",
        operand: namePattern,
      },
      result_fields: ["id", "display_name", "default_name", "ipaddr4", "macaddr", "vendor", "device_class", "last_seen_time", "activity", "analysis_level"],
      limit: 1,
    });
    
    return devices.length > 0 ? devices[0] : null;
  }

  // ============ METRICS ENDPOINTS ============

  /**
   * POST /metrics - Query metrics for devices
   * This is the core endpoint for getting network performance data
   */
  async queryMetrics(params: MetricQuery): Promise<MetricResult> {
    return this.rateLimitedPost<MetricResult>("/metrics", params);
  }

  /**
   * Get network metrics for a device (bytes, packets, etc.)
   */
  async getDeviceNetworkMetrics(deviceId: number, fromMs: number = -300000, untilMs: number = 0): Promise<MetricResult> {
    return this.queryMetrics({
      cycle: "30sec",
      from: fromMs,
      until: untilMs,
      metric_category: "net",
      object_type: "device",
      object_ids: [deviceId],
      metric_specs: [
        { name: "bytes_in" },
        { name: "bytes_out" },
        { name: "pkts_in" },
        { name: "pkts_out" },
        { name: "rto_in" },
        { name: "rto_out" },
      ],
    });
  }

  /**
   * Get TCP metrics for a device (RTT, retransmits, etc.)
   */
  async getDeviceTcpMetrics(deviceId: number, fromMs: number = -300000, untilMs: number = 0): Promise<MetricResult> {
    return this.queryMetrics({
      cycle: "30sec",
      from: fromMs,
      until: untilMs,
      metric_category: "tcp",
      object_type: "device",
      object_ids: [deviceId],
      metric_specs: [
        { name: "rtt" },
        { name: "rtt", calc_type: "percentiles", percentiles: [50, 95, 99] },
        { name: "retrans_out" },
        { name: "zwin_in" },
        { name: "zwin_out" },
      ],
    });
  }

  /**
   * Get 1-second granularity metrics for real-time monitoring
   */
  async getDeviceRealtimeMetrics(deviceId: number): Promise<MetricResult> {
    return this.queryMetrics({
      cycle: "1sec",
      from: -60000, // Last 60 seconds
      until: 0,
      metric_category: "net",
      object_type: "device",
      object_ids: [deviceId],
      metric_specs: [
        { name: "bytes_in" },
        { name: "bytes_out" },
        { name: "pkts_in" },
        { name: "pkts_out" },
      ],
    });
  }

  // ============ RECORDS ENDPOINTS ============

  /**
   * POST /records/search - Search flow records
   * Use this for detailed connection/flow data
   */
  async searchRecords(params: RecordQuery): Promise<any> {
    return this.rateLimitedPost<any>("/records/search", params);
  }

  /**
   * Get flow records for a specific device (connections to/from)
   */
  async getDeviceFlowRecords(deviceId: number, fromMs: number = -300000, limit: number = 100): Promise<any> {
    return this.searchRecords({
      from: fromMs,
      until: 0,
      limit,
      filter: {
        operator: "or",
        rules: [
          { field: "clientId", operator: "=", operand: deviceId },
          { field: "serverId", operator: "=", operand: deviceId },
        ],
      },
      types: ["~flow"],
      sort: [{ field: "timestamp", direction: "desc" }],
    });
  }

  /**
   * Get peer connections for a device (who is it talking to)
   */
  async getDevicePeerRecords(deviceId: number, fromMs: number = -60000): Promise<any> {
    return this.searchRecords({
      from: fromMs,
      until: 0,
      limit: 500,
      filter: {
        operator: "or",
        rules: [
          { field: "clientId", operator: "=", operand: deviceId },
          { field: "serverId", operator: "=", operand: deviceId },
        ],
      },
      types: ["~flow"],
    });
  }

  // ============ ACTIVITY MAPS / TOPOLOGY ENDPOINTS ============

  /**
   * POST /activitymaps/query - Query network topology
   * Shows device relationships and communication patterns
   */
  async queryTopology(params: TopologyQuery): Promise<TopologyResponse> {
    return this.rateLimitedPost<TopologyResponse>("/activitymaps/query", params);
  }

  /**
   * Get peer topology for a device
   */
  async getDeviceTopology(deviceId: number, fromMs: number = -300000): Promise<TopologyResponse> {
    return this.queryTopology({
      from: fromMs,
      until: 0,
      edge_annotations: ["protocols", "appearances"],
      weighting: "bytes",
      walks: [{
        origins: [{ object_type: "device", object_id: deviceId }],
        steps: [{
          relationships: [{ role: "any" }],
        }],
      }],
    });
  }

  // ============ DETECTIONS ENDPOINTS ============

  /**
   * POST /detections/search - Search for security detections
   */
  async searchDetections(params: DetectionSearchParams): Promise<{ detections: Detection[] }> {
    return this.rateLimitedPost<{ detections: Detection[] }>("/detections/search", params);
  }

  /**
   * GET /detections/{id} - Get a specific detection
   */
  async getDetection(id: number): Promise<Detection> {
    return this.rateLimitedGet<Detection>(`/detections/${id}`);
  }

  /**
   * Get recent detections for monitoring
   */
  async getRecentDetections(fromMs: number = -3600000, limit: number = 50): Promise<{ detections: Detection[] }> {
    return this.searchDetections({
      from: Date.now() + fromMs,
      limit,
      sort: [{ field: "update_time", direction: "desc" }],
    });
  }

  // ============ PACKETS ENDPOINTS ============

  /**
   * POST /packets/search - Search for packets and download PCAP
   * Returns packet data that can be downloaded as PCAP file
   */
  async searchPackets(params: {
    from: number | string;
    until?: number | string;
    limit_bytes?: number;
    limit_search_duration?: number;
    always_return_body?: boolean;
    bpf?: string;
    ip1?: string;
    ip2?: string;
    port1?: number;
    port2?: number;
    output?: "pcap" | "keylog_txt" | "pcapng" | "zip";
  }): Promise<ArrayBuffer> {
    return this.rateLimitedPost<ArrayBuffer>("/packets/search", params, {
      responseType: "arraybuffer",
      headers: {
        Accept: "application/vnd.tcpdump.pcap",
      },
    });
  }

  /**
   * Download PCAP for a specific device during a time range
   * Useful for capturing Crucible match traffic
   * @param bpfFilter - Optional Berkeley Packet Filter expression for advanced filtering
   */
  async downloadDevicePcap(
    deviceIp: string, 
    fromMs: number, 
    untilMs: number = 0, 
    limitBytes: number = 100000000,
    bpfFilter?: string
  ): Promise<ArrayBuffer> {
    return this.searchPackets({
      from: fromMs,
      until: untilMs,
      ip1: deviceIp,
      limit_bytes: limitBytes,
      output: "pcap",
      bpf: bpfFilter,
    });
  }

  /**
   * Download PCAP for traffic between two IPs (e.g., PS5 and peer)
   */
  async downloadPeerPcap(ip1: string, ip2: string, fromMs: number, untilMs: number = 0): Promise<ArrayBuffer> {
    return this.searchPackets({
      from: fromMs,
      until: untilMs,
      ip1,
      ip2,
      limit_bytes: 50000000, // 50MB
      output: "pcap",
    });
  }

  /**
   * Download PCAP with BPF filter for advanced filtering
   */
  async downloadFilteredPcap(bpfFilter: string, fromMs: number, untilMs: number = 0): Promise<ArrayBuffer> {
    return this.searchPackets({
      from: fromMs,
      until: untilMs,
      bpf: bpfFilter,
      limit_bytes: 100000000,
      output: "pcap",
    });
  }

  // ============ ALERTS ENDPOINTS ============

  /**
   * GET /alerts - Get all alerts
   */
  async getAlerts(): Promise<Alert[]> {
    return this.rateLimitedGet<Alert[]>("/alerts");
  }

  /**
   * GET /alerts/{id} - Get alert by ID
   */
  async getAlert(id: number): Promise<Alert> {
    return this.rateLimitedGet<Alert>(`/alerts/${id}`);
  }

  // ============ SYSTEM ENDPOINTS ============

  /**
   * GET /extrahop - Get appliance info (for testing connection)
   */
  async getApplianceInfo(): Promise<any> {
    return this.rateLimitedGet<any>("/extrahop");
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; appliance?: any }> {
    try {
      const info = await this.getApplianceInfo();
      return {
        success: true,
        message: "Connected to ExtraHop appliance",
        appliance: info,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.error_message || error.message || "Connection failed",
      };
    }
  }
}

// Destiny 2 terminology mapping
export const destinyTerminology = {
  // Device types -> Guardian classes
  deviceClass: {
    server: "Titan",
    client: "Hunter",
    gateway: "Warlock",
    firewall: "Ward of Dawn",
    loadbalancer: "Well of Radiance",
    database: "Cryptarch",
    dns: "Ghost",
    proxy: "Shade",
    gaming: "Guardian Console",
    pc: "Tower Terminal",
    mobile: "Ghost Shell",
    iot: "Servitor",
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
    bytes_in: "Light Received",
    bytes_out: "Light Transmitted",
    connections: "Fireteam Links",
    latency: "Warp Speed",
    rtt: "Neural Delay",
    throughput: "Glimmer Flow",
    packets: "Engrams",
    pkts_in: "Engrams Received",
    pkts_out: "Engrams Sent",
    errors: "Corrupted Data",
    retrans: "Ghost Revives",
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
    SSL: "Void Shield",
    UDP: "Arc Bolt",
    TCP: "Solar Flare",
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

// Convert ExtraHop device to Destiny-themed display
export function toDestinyDevice(device: Device) {
  const classMap = destinyTerminology.deviceClass;
  const deviceClass = device.device_class || "unknown";
  const guardianClass = classMap[deviceClass as keyof typeof classMap] || "Unknown Guardian";
  
  // Calculate "power level" from analysis_level and activity
  const activityScore = (device.activity?.length || 0) * 10;
  const analysisScore = (device.analysis_level || 0) * 100;
  const powerLevel = 1800 + activityScore + analysisScore;
  
  return {
    id: device.id,
    name: device.display_name || device.default_name || `Guardian-${device.id}`,
    guardianClass,
    lightLevel: Math.min(powerLevel, 2000),
    ipAddress: device.ipaddr4,
    macAddress: device.macaddr,
    vendor: device.vendor,
    status: (device.analysis_level || 0) > 0 ? "active" : "idle",
    destinyStatus: (device.analysis_level || 0) > 0 
      ? destinyTerminology.status.active 
      : destinyTerminology.status.idle,
    lastSeen: device.last_seen_time ? new Date(device.last_seen_time).toISOString() : null,
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
  if (metricName.includes("bytes")) {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)} TB`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)} GB`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)} MB`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)} KB`;
    return `${value} B`;
  }
  if (metricName.includes("latency") || metricName === "rtt") {
    return `${value.toFixed(2)} ms`;
  }
  return value.toLocaleString();
}

// Helper to create client from stored config
export function createExtrahopClient(apiUrl: string, apiKey: string): ExtrahopClient {
  return new ExtrahopClient({ apiUrl, apiKey });
}
