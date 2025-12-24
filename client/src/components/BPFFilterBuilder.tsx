import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Filter, 
  Plus, 
  X, 
  Copy, 
  Check, 
  AlertCircle, 
  Gamepad2,
  Globe,
  Server,
  Wifi,
  Shield,
  Zap
} from "lucide-react";
import { toast } from "sonner";

// Destiny 2 / Bungie specific presets
const DESTINY_PRESETS = [
  {
    id: "destiny_all",
    name: "All Destiny 2 Traffic",
    description: "Capture all Destiny 2 game traffic (UDP 3074, 3097, 3478-3480)",
    filter: "udp port 3074 or udp port 3097 or udp portrange 3478-3480",
    icon: Gamepad2,
    color: "text-primary",
  },
  {
    id: "destiny_p2p",
    name: "P2P Crucible Traffic",
    description: "Peer-to-peer connections during PvP matches (UDP 3074)",
    filter: "udp port 3074",
    icon: Wifi,
    color: "text-amber-400",
  },
  {
    id: "destiny_stun",
    name: "STUN/NAT Traversal",
    description: "NAT traversal and STUN traffic (UDP 3478-3480)",
    filter: "udp portrange 3478-3480",
    icon: Globe,
    color: "text-teal-400",
  },
  {
    id: "bungie_api",
    name: "Bungie API Traffic",
    description: "HTTPS traffic to Bungie servers (TCP 443 to bungie.net)",
    filter: "tcp port 443 and host bungie.net",
    icon: Server,
    color: "text-blue-400",
  },
  {
    id: "psn_traffic",
    name: "PlayStation Network",
    description: "PSN authentication and services traffic",
    filter: "tcp port 443 and (host playstation.net or host playstation.com)",
    icon: Shield,
    color: "text-indigo-400",
  },
  {
    id: "high_latency",
    name: "Large Packets Only",
    description: "Capture only packets larger than 1000 bytes (potential game state)",
    filter: "greater 1000",
    icon: Zap,
    color: "text-orange-400",
  },
];

// Protocol options
const PROTOCOLS = [
  { value: "tcp", label: "TCP" },
  { value: "udp", label: "UDP" },
  { value: "icmp", label: "ICMP" },
  { value: "ip", label: "IP (any)" },
];

// Direction options
const DIRECTIONS = [
  { value: "", label: "Both" },
  { value: "src", label: "Source" },
  { value: "dst", label: "Destination" },
];

interface FilterRule {
  id: string;
  protocol: string;
  direction: string;
  type: "host" | "port" | "portrange" | "net";
  value: string;
  enabled: boolean;
}

interface BPFFilterBuilderProps {
  onFilterChange?: (filter: string) => void;
  initialFilter?: string;
  deviceIp?: string;
}

export default function BPFFilterBuilder({ 
  onFilterChange, 
  initialFilter = "",
  deviceIp 
}: BPFFilterBuilderProps) {
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [customFilter, setCustomFilter] = useState(initialFilter);
  const [useCustom, setUseCustom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);

  // Generate BPF filter from rules
  const generatedFilter = useMemo(() => {
    if (useCustom) return customFilter;

    const parts: string[] = [];

    // Add preset filters
    selectedPresets.forEach(presetId => {
      const preset = DESTINY_PRESETS.find(p => p.id === presetId);
      if (preset) {
        parts.push(`(${preset.filter})`);
      }
    });

    // Add custom rules
    rules.filter(r => r.enabled).forEach(rule => {
      let part = "";
      
      if (rule.protocol && rule.protocol !== "ip") {
        part += rule.protocol + " ";
      }
      
      if (rule.direction) {
        part += rule.direction + " ";
      }
      
      switch (rule.type) {
        case "host":
          part += `host ${rule.value}`;
          break;
        case "port":
          part += `port ${rule.value}`;
          break;
        case "portrange":
          part += `portrange ${rule.value}`;
          break;
        case "net":
          part += `net ${rule.value}`;
          break;
      }
      
      if (part.trim()) {
        parts.push(`(${part.trim()})`);
      }
    });

    // Add device IP filter if provided
    if (deviceIp && parts.length > 0) {
      return `host ${deviceIp} and (${parts.join(" or ")})`;
    } else if (deviceIp) {
      return `host ${deviceIp}`;
    }

    return parts.join(" or ");
  }, [rules, selectedPresets, useCustom, customFilter, deviceIp]);

  // Validate BPF filter syntax (basic validation)
  const validateFilter = (filter: string): { valid: boolean; error?: string } => {
    if (!filter.trim()) {
      return { valid: true };
    }

    // Basic syntax checks
    const invalidPatterns = [
      { pattern: /\s{2,}/, error: "Multiple consecutive spaces" },
      { pattern: /^(and|or)\s/i, error: "Cannot start with operator" },
      { pattern: /\s(and|or)$/i, error: "Cannot end with operator" },
      { pattern: /\(\s*\)/, error: "Empty parentheses" },
    ];

    for (const { pattern, error } of invalidPatterns) {
      if (pattern.test(filter)) {
        return { valid: false, error };
      }
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

  const validation = validateFilter(generatedFilter);

  // Add new rule
  const addRule = () => {
    const newRule: FilterRule = {
      id: `rule_${Date.now()}`,
      protocol: "udp",
      direction: "",
      type: "port",
      value: "",
      enabled: true,
    };
    setRules([...rules, newRule]);
  };

  // Update rule
  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  // Remove rule
  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  // Toggle preset
  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev => 
      prev.includes(presetId) 
        ? prev.filter(p => p !== presetId)
        : [...prev, presetId]
    );
  };

  // Copy filter to clipboard
  const copyFilter = async () => {
    try {
      await navigator.clipboard.writeText(generatedFilter);
      setCopied(true);
      toast.success("BPF filter copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy filter");
    }
  };

  // Apply filter
  const applyFilter = () => {
    if (!validation.valid) {
      toast.error(`Invalid filter: ${validation.error}`);
      return;
    }
    onFilterChange?.(generatedFilter);
    toast.success("BPF filter applied");
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          BPF Filter Builder
          <Badge variant="outline" className="ml-auto text-xs">
            Berkeley Packet Filter
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets">Destiny 2 Presets</TabsTrigger>
            <TabsTrigger value="builder">Rule Builder</TabsTrigger>
            <TabsTrigger value="custom">Custom Filter</TabsTrigger>
          </TabsList>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Quick filters optimized for Destiny 2 network traffic analysis
            </p>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {DESTINY_PRESETS.map(preset => {
                  const Icon = preset.icon;
                  const isSelected = selectedPresets.includes(preset.id);
                  return (
                    <div
                      key={preset.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => togglePreset(preset.id)}
                    >
                      <Icon className={`h-5 w-5 mt-0.5 ${preset.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                        <code className="text-[10px] text-primary/80 font-mono mt-1 block truncate">
                          {preset.filter}
                        </code>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Rule Builder Tab */}
          <TabsContent value="builder" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Build custom filter rules
              </p>
              <Button variant="outline" size="sm" onClick={addRule}>
                <Plus className="h-3 w-3 mr-1" />
                Add Rule
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              {rules.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No rules added. Click "Add Rule" to start.
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map(rule => (
                    <div 
                      key={rule.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                        rule.enabled ? "border-border" : "border-border/50 opacity-50"
                      }`}
                    >
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => updateRule(rule.id, { enabled })}
                      />
                      <select
                        value={rule.protocol}
                        onChange={(e) => updateRule(rule.id, { protocol: e.target.value })}
                        className="bg-background border border-border rounded px-2 py-1 text-xs"
                      >
                        {PROTOCOLS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      <select
                        value={rule.direction}
                        onChange={(e) => updateRule(rule.id, { direction: e.target.value })}
                        className="bg-background border border-border rounded px-2 py-1 text-xs"
                      >
                        {DIRECTIONS.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                      <select
                        value={rule.type}
                        onChange={(e) => updateRule(rule.id, { type: e.target.value as FilterRule["type"] })}
                        className="bg-background border border-border rounded px-2 py-1 text-xs"
                      >
                        <option value="host">Host</option>
                        <option value="port">Port</option>
                        <option value="portrange">Port Range</option>
                        <option value="net">Network</option>
                      </select>
                      <Input
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        placeholder={
                          rule.type === "host" ? "192.168.1.1" :
                          rule.type === "port" ? "3074" :
                          rule.type === "portrange" ? "3478-3480" :
                          "192.168.1.0/24"
                        }
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeRule(rule.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Custom Filter Tab */}
          <TabsContent value="custom" className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={useCustom}
                onCheckedChange={setUseCustom}
              />
              <Label className="text-xs">Use custom filter (override presets & rules)</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">BPF Filter Expression</Label>
              <Input
                value={customFilter}
                onChange={(e) => setCustomFilter(e.target.value)}
                placeholder="e.g., udp port 3074 and host 192.168.1.100"
                className="font-mono text-xs"
                disabled={!useCustom}
              />
              <p className="text-[10px] text-muted-foreground">
                Syntax: protocol [src|dst] [host|port|net|portrange] value [and|or] ...
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generated Filter Preview */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Generated Filter</Label>
            <div className="flex items-center gap-1">
              {!validation.valid && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>{validation.error}</TooltipContent>
                </Tooltip>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={copyFilter}
                disabled={!generatedFilter}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <div className={`p-2 rounded bg-background border font-mono text-xs min-h-[40px] ${
            !validation.valid ? "border-destructive" : "border-border"
          }`}>
            {generatedFilter || <span className="text-muted-foreground">No filter configured</span>}
          </div>
          {deviceIp && (
            <p className="text-[10px] text-muted-foreground">
              Filter automatically scoped to device: {deviceIp}
            </p>
          )}
        </div>

        {/* Apply Button */}
        <Button 
          className="w-full" 
          onClick={applyFilter}
          disabled={!validation.valid || !generatedFilter}
        >
          <Filter className="h-4 w-4 mr-2" />
          Apply BPF Filter
        </Button>
      </CardContent>
    </Card>
  );
}
