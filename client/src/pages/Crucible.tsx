import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  AlertTriangle, 
  ChevronLeft, 
  Eye,
  Gamepad2, 
  Globe, 
  Monitor, 
  Phone,
  Plus, 
  RefreshCw, 
  Shield, 
  Signal, 
  Skull,
  Target, 
  Timer, 
  Trophy, 
  Users, 
  Wifi, 
  WifiOff,
  Zap,
  Radio,
  Search,
  Flag
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import LoreChatbot from "@/components/LoreChatbot";
import GhostVoiceAlerts from "@/components/GhostVoiceAlerts";
import BPFFilterBuilder from "@/components/BPFFilterBuilder";
import Breadcrumbs from "@/components/Breadcrumbs";

// The Nine Logo - Mysterious symbol
function TheNineLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
      <path d="M50 15 L50 35" stroke="currentColor" strokeWidth="2" />
      <path d="M50 65 L50 85" stroke="currentColor" strokeWidth="2" />
      <path d="M15 50 L35 50" stroke="currentColor" strokeWidth="2" />
      <path d="M65 50 L85 50" stroke="currentColor" strokeWidth="2" />
      <path d="M25 25 L38 38" stroke="currentColor" strokeWidth="1.5" />
      <path d="M62 62 L75 75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M75 25 L62 38" stroke="currentColor" strokeWidth="1.5" />
      <path d="M38 62 L25 75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Animated line chart component for telemetry
function TelemetryGraph({ 
  data, 
  label, 
  unit, 
  color = "#00CED1", 
  maxValue = 100,
  height = 80 
}: { 
  data: number[]; 
  label: string; 
  unit: string; 
  color?: string;
  maxValue?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;

    const animate = () => {
      timeRef.current += 0.02;
      ctx.clearRect(0, 0, width, chartHeight);

      // Draw grid lines
      ctx.strokeStyle = "rgba(0, 206, 209, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw data line
      if (data.length > 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const step = width / (data.length - 1);
        data.forEach((value, i) => {
          const x = i * step;
          const normalizedValue = Math.min(value / maxValue, 1);
          const y = chartHeight - (normalizedValue * chartHeight * 0.9) - 5;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, [data, color, maxValue]);

  const currentValue = data[data.length - 1] || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="font-mono text-cyan-400">{currentValue.toFixed(0)} {unit}</span>
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full" 
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

// VoIP Quality Meter
function VoIPQualityMeter({ mos, jitter }: { mos: number; jitter: number }) {
  const getQualityLabel = (mos: number) => {
    if (mos >= 4.3) return "CRYSTAL CLEAR";
    if (mos >= 4.0) return "EXCELLENT";
    if (mos >= 3.6) return "GOOD";
    if (mos >= 3.1) return "FAIR";
    return "POOR";
  };

  const getQualityColor = (mos: number) => {
    if (mos >= 4.0) return "text-green-400";
    if (mos >= 3.6) return "text-cyan-400";
    if (mos >= 3.1) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#0a1520] rounded-lg p-4 border border-cyan-900/30">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Voice Quality (MOS)</div>
        <div className={`text-4xl font-bold font-mono ${getQualityColor(mos)}`}>
          {mos.toFixed(1)}
        </div>
        <div className={`text-xs ${getQualityColor(mos)} mt-1`}>
          {getQualityLabel(mos)}
        </div>
      </div>
      <div className="bg-[#0a1520] rounded-lg p-4 border border-cyan-900/30">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Voice Jitter</div>
        <div className="text-4xl font-bold font-mono text-cyan-400">
          {jitter.toFixed(1)} <span className="text-lg">ms</span>
        </div>
      </div>
    </div>
  );
}

// Voice Waveform Visualization
function VoiceWaveform({ data }: { data: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / data.length;

    ctx.clearRect(0, 0, width, height);

    data.forEach((value, i) => {
      const barHeight = (value / 100) * height;
      const x = i * barWidth;
      const y = height - barHeight;

      // Gradient from green to cyan
      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, "rgba(50, 205, 50, 0.8)");
      gradient.addColorStop(1, "rgba(50, 205, 50, 0.2)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  }, [data]);

  return (
    <div className="bg-[#0a1520] rounded-lg p-2 border border-cyan-900/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">LIVE VOIP HISTORY</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-16" />
    </div>
  );
}

// Lobby Player Row
function LobbyPlayerRow({ player, onReport }: { 
  player: {
    name: string;
    platform: string;
    region: string;
    latency: number;
    jitter: number;
    lossThreat: number;
    status: "host" | "speaking" | "away" | "normal";
    isSuspicious?: boolean;
  };
  onReport: () => void;
}) {
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "psn": return "🎮";
      case "xbox": return "🎮";
      case "steam": return "🖥️";
      default: return "🎮";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "host":
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">HOST</Badge>;
      case "speaking":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">SPEAKING</Badge>;
      case "away":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">AWAY</Badge>;
      default:
        return null;
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 30) return "text-green-400";
    if (latency < 60) return "text-cyan-400";
    if (latency < 100) return "text-yellow-400";
    return "text-red-400";
  };

  const getLossThreatDisplay = (loss: number) => {
    if (loss < 1) return { text: `${loss.toFixed(1)}%`, color: "text-green-400", badge: null };
    if (loss < 5) return { text: `${loss.toFixed(1)}%`, color: "text-yellow-400", badge: "ELEVATED" };
    if (loss < 10) return { text: `${loss.toFixed(1)}%`, color: "text-orange-400", badge: "LAG SWITCH PATTERN" };
    return { text: `${loss.toFixed(1)}%`, color: "text-red-400", badge: "VPN DETECTED" };
  };

  const lossThreat = getLossThreatDisplay(player.lossThreat);

  return (
    <tr className="border-b border-cyan-900/20 hover:bg-cyan-900/10 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{player.name}</span>
          {getStatusBadge(player.status)}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-muted-foreground">{getPlatformIcon(player.platform)} {player.platform}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Globe className="h-3 w-3" />
          {player.region}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`font-mono ${getLatencyColor(player.latency)}`}>{player.latency}ms</span>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-muted-foreground">{player.jitter}ms</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className={`font-mono ${lossThreat.color}`}>{lossThreat.text}</span>
          {lossThreat.badge && (
            <Badge variant="outline" className={`text-[9px] ${lossThreat.color} border-current`}>
              {lossThreat.badge}
            </Badge>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        {player.isSuspicious && (
          <Button 
            size="sm" 
            variant="destructive" 
            className="h-6 text-xs"
            onClick={onReport}
          >
            REPORT
          </Button>
        )}
      </td>
    </tr>
  );
}

// Match History Card
function MatchHistoryCard({ 
  mode, 
  kd, 
  ping, 
  map, 
  netDeaths,
  variant = "default"
}: { 
  mode: string;
  kd: string;
  ping: string;
  map: string;
  netDeaths: number;
  variant?: "default" | "victory" | "defeat";
}) {
  const getBorderColor = () => {
    switch (variant) {
      case "victory": return "border-green-500/50";
      case "defeat": return "border-red-500/50";
      default: return "border-cyan-900/30";
    }
  };

  const getButtonStyle = () => {
    switch (variant) {
      case "victory": return "bg-green-500/20 text-green-400 hover:bg-green-500/30";
      case "defeat": return "bg-red-500/20 text-red-400 hover:bg-red-500/30";
      default: return "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30";
    }
  };

  return (
    <div className={`bg-[#0a1520] rounded-lg p-4 border ${getBorderColor()} flex-1`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-foreground">{mode}</h4>
        <Button size="sm" variant="ghost" className={`h-6 text-xs ${getButtonStyle()}`}>
          {variant === "victory" ? "VICTORY" : variant === "defeat" ? "DEFEAT" : "HISTORY"}
        </Button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">K/D</span>
          <span className="font-mono text-cyan-400">{kd}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ping</span>
          <span className="font-mono text-foreground">{ping}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{map}</span>
        </div>
        <div className="flex items-center justify-end gap-1 mt-2">
          <span className="text-xs text-muted-foreground">Net Deaths</span>
          <Skull className="h-3 w-3 text-red-400" />
          <span className="font-mono text-red-400">{netDeaths}</span>
        </div>
      </div>
    </div>
  );
}

// Find PS5 Dialog
function FindPS5Dialog({ onDeviceFound }: { onDeviceFound: (device: any) => void }) {
  const [open, setOpen] = useState(false);
  const [searchPattern, setSearchPattern] = useState("Sony");

  const { data: config } = trpc.extrahop.getConfig.useQuery();
  
  const { data: foundDevices, isLoading: searching, refetch: searchDevices } = trpc.extrahop.searchDevices.useQuery(
    { namePattern: searchPattern },
    { enabled: false }
  );

  const handleSearch = () => {
    searchDevices();
  };

  const handleSelectDevice = (device: any) => {
    onDeviceFound(device);
    setOpen(false);
    toast.success(`Selected device: ${device.display_name || device.ipaddr}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
          <Search className="h-4 w-4 mr-2" />
          Find PS5
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a1520] border-cyan-900/50">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">Locate PlayStation Device</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={searchPattern}
              onChange={(e) => setSearchPattern(e.target.value)}
              placeholder="Search pattern (e.g., Sony, PlayStation)"
              className="bg-[#0d1a25] border-cyan-900/30"
            />
            <Button onClick={handleSearch} disabled={searching} className="bg-cyan-500/20 text-cyan-400">
              {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {foundDevices && (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {foundDevices.map((device: any, i: number) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-3 rounded bg-[#0d1a25] border border-cyan-900/30 cursor-pointer hover:bg-cyan-900/20"
                    onClick={() => handleSelectDevice(device)}
                  >
                    <div>
                      <p className="font-medium">{device.display_name || device.ipaddr}</p>
                      <p className="text-xs text-muted-foreground">{device.macaddr}</p>
                    </div>
                    <Gamepad2 className="h-5 w-5 text-cyan-400" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function Crucible() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [geoFencingEnabled, setGeoFencingEnabled] = useState(true);
  
  // Simulated real-time data
  const [latencyData, setLatencyData] = useState<number[]>([]);
  const [jitterData, setJitterData] = useState<number[]>([]);
  const [voipData, setVoipData] = useState<number[]>([]);
  const [packetLoss, setPacketLoss] = useState(0.06);
  const [voipMos, setVoipMos] = useState(4.3);
  const [voipJitter, setVoipJitter] = useState(1.3);

  // Fetch real data from ExtraHop
  const { data: config } = trpc.extrahop.getConfig.useQuery();
  // For live metrics we need an active match - for now we'll use simulated data
  // Real implementation would get active match first, then query live metrics
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const { data: matchHistory } = trpc.crucible.getMatchHistory.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  // Generate simulated telemetry data
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyData(prev => {
        const newData = [...prev, 30 + Math.random() * 30 + Math.sin(Date.now() / 1000) * 10];
        return newData.slice(-50);
      });
      setJitterData(prev => {
        const newData = [...prev, 0.5 + Math.random() * 1.5];
        return newData.slice(-50);
      });
      setVoipData(prev => {
        const newData = [...prev, 40 + Math.random() * 40];
        return newData.slice(-30);
      });
      setPacketLoss(0.06 + Math.random() * 0.02);
      setVoipMos(4.2 + Math.random() * 0.2);
      setVoipJitter(1.0 + Math.random() * 0.6);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Demo lobby players
  const lobbyPlayers = useMemo(() => [
    { name: "xX_Sniper_xX", platform: "PSN", region: "US-East", latency: 12, jitter: 2, lossThreat: 0, status: "host" as const, isSuspicious: false },
    { name: "TitanMain99", platform: "XBOX", region: "US-Central", latency: 45, jitter: 5, lossThreat: 0.1, status: "speaking" as const, isSuspicious: false },
    { name: "LaggyBoi", platform: "STEAM", region: "Unknown", latency: 180, jitter: 45, lossThreat: 11.5, status: "normal" as const, isSuspicious: true },
    { name: "SweatLord", platform: "STEAM", region: "US-West", latency: 25, jitter: 1, lossThreat: 0, status: "normal" as const, isSuspicious: false },
    { name: "CasualDad", platform: "PSN", region: "EU-West", latency: 65, jitter: 12, lossThreat: 1.2, status: "away" as const, isSuspicious: false },
  ], []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleReport = (playerName: string) => {
    toast.success(`Report submitted for ${playerName}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a1520] flex items-center justify-center">
        <TheNineLogo className="h-16 w-16 text-cyan-400 animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a1520] text-foreground">
      {/* Header */}
      <header className="border-b border-cyan-900/30 bg-[#0d1a25]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <TheNineLogo className="h-6 w-6 text-cyan-400" />
              <div>
                <h1 className="font-bold text-foreground tracking-wider">THE NINE</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Asset Surveillance // {config?.applianceName || "ExtraHop"} Network
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-muted-foreground">
              IP: <span className="text-cyan-400">{selectedDevice?.ipaddr || "192.168.1.105"}</span>
            </span>
            <span className="text-muted-foreground">
              MAC: <span className="text-cyan-400">{selectedDevice?.macaddr || "5F:25:F9:AB:CD:EF"}</span>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className={`border-cyan-500/30 ${isCapturing ? "bg-red-500/20 text-red-400" : "text-cyan-400"}`}
              onClick={() => setIsCapturing(!isCapturing)}
            >
              {isCapturing ? "CAPTURING" : "CAPTURE"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: "Command Center", href: "/dashboard" },
          { label: "Crucible Ops" }
        ]} />
        {/* Top Row: Telemetry + Security + VoIP */}
        <div className="grid grid-cols-12 gap-6">
          {/* Crucible Telemetry */}
          <div className="col-span-5 bg-[#0d1a25] rounded-lg p-4 border border-cyan-900/30">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Crucible Telemetry</h2>
            </div>
            
            <div className="space-y-4">
              <TelemetryGraph 
                data={latencyData} 
                label="Latency (Ping)" 
                unit="ms" 
                color="#00CED1"
                maxValue={100}
                height={70}
              />
              
              <TelemetryGraph 
                data={jitterData} 
                label="Jitter Stability" 
                unit="ms" 
                color="#00CED1"
                maxValue={5}
                height={70}
              />
              
              {/* Packet Loss Bar */}
              <div className="mt-4">
                <div className="flex items-center gap-2 bg-red-500/20 rounded px-3 py-2 border border-red-500/30">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-red-400 uppercase tracking-wider">Packet Loss: {(packetLoss * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vanguard Security Protocols + VoIP */}
          <div className="col-span-7 space-y-6">
            {/* Security Protocols */}
            <div className="bg-[#0d1a25] rounded-lg p-4 border border-cyan-900/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Vanguard Security Protocols</h2>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  DB VERSION: {new Date().toISOString().split('T')[0].replace(/-/g, '.')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between bg-[#0a1520] rounded-lg p-3 border border-cyan-900/30">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="font-medium text-sm">Geo-Fencing Protocol</p>
                      <p className="text-xs text-muted-foreground">Block matchmaking with high-latency regions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ENABLED</span>
                    <Switch 
                      checked={geoFencingEnabled} 
                      onCheckedChange={setGeoFencingEnabled}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-[#0a1520] rounded-lg p-3 border border-cyan-900/30">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="font-medium text-sm">Cheater Database</p>
                      <p className="text-xs text-muted-foreground">Auto-flag known offenders in lobby</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                    2 THREATS
                  </Badge>
                </div>
              </div>
            </div>

            {/* VoIP Comms Array */}
            <div className="bg-[#0d1a25] rounded-lg p-4 border border-cyan-900/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-400" />
                  <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider">VoIP Comms Array</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <VoIPQualityMeter mos={voipMos} jitter={voipJitter} />
                <VoiceWaveform data={voipData} />
              </div>
            </div>
          </div>
        </div>

        {/* Lobby Telemetry Table */}
        <div className="bg-[#0d1a25] rounded-lg p-4 border border-cyan-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Lobby Telemetry</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">LIVE SESSION</span>
              </div>
              <FindPS5Dialog onDeviceFound={setSelectedDevice} />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyan-900/30 text-left">
                  <th className="py-2 px-4 text-xs text-muted-foreground uppercase tracking-wider">Guardian</th>
                  <th className="py-2 px-4 text-xs text-muted-foreground uppercase tracking-wider">Platform</th>
                  <th className="py-2 px-4 text-xs text-muted-foreground uppercase tracking-wider">Region</th>
                  <th className="py-2 px-4 text-xs text-muted-foreground uppercase tracking-wider">Latency</th>
                  <th className="py-2 px-4 text-xs text-muted-foreground uppercase tracking-wider">Jitter</th>
                  <th className="py-2 px-4 text-xs text-muted-foreground uppercase tracking-wider">Loss/Threat</th>
                  <th className="py-2 px-4 text-xs text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {lobbyPlayers.map((player, i) => (
                  <LobbyPlayerRow 
                    key={i} 
                    player={player} 
                    onReport={() => handleReport(player.name)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Match History Correlation */}
        <div className="bg-[#0d1a25] rounded-lg p-4 border border-cyan-900/30">
          <div className="flex items-center gap-2 mb-4">
            <Timer className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Match History Correlation</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <MatchHistoryCard 
              mode="Trials of Osiris"
              kd="2.50"
              ping="28ms"
              map="Eternity"
              netDeaths={4}
              variant="victory"
            />
            <MatchHistoryCard 
              mode="Competitive"
              kd="0.80"
              ping="65ms"
              map="Pacifica"
              netDeaths={8}
              variant="defeat"
            />
            <MatchHistoryCard 
              mode="Iron Banner"
              kd="1.25"
              ping="45ms"
              map="Altar of Flame"
              netDeaths={5}
              variant="victory"
            />
          </div>
        </div>
      </main>

      {/* Ghost Voice Alerts */}
      <GhostVoiceAlerts 
        currentLatency={latencyData[latencyData.length - 1] || 0}
        currentPacketLoss={packetLoss * 100}
        matchState={isCapturing ? "in_match" : "idle"}
        isMatchActive={isCapturing}
      />

      {/* Lore Chatbot */}
      <LoreChatbot />
    </div>
  );
}
