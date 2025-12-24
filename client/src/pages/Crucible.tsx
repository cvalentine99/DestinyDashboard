import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { 
  Activity, 
  AlertTriangle, 
  ChevronLeft, 
  Clock, 
  Gamepad2, 
  Globe, 
  Monitor, 
  Play, 
  Plus, 
  RefreshCw, 
  Shield, 
  Signal, 
  Square, 
  Target, 
  Timer, 
  Trophy, 
  Users, 
  Wifi, 
  WifiOff,
  Zap
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";
import LoreChatbot from "@/components/LoreChatbot";

// Tricorn Logo Component
function TricornLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <path d="M50 5 L95 90 L50 70 L5 90 Z" />
    </svg>
  );
}

// Connection quality indicator
function ConnectionQualityIndicator({ rating, score, destinyTerm }: { 
  rating: string; 
  score: number; 
  destinyTerm: string;
}) {
  const getColor = () => {
    switch (rating) {
      case "excellent": return "text-green-400";
      case "good": return "text-teal-400";
      case "fair": return "text-yellow-400";
      case "poor": return "text-orange-400";
      case "critical": return "text-red-400";
      default: return "text-muted-foreground";
    }
  };

  const getIcon = () => {
    switch (rating) {
      case "excellent": return <Signal className="h-5 w-5" />;
      case "good": return <Wifi className="h-5 w-5" />;
      case "fair": return <Activity className="h-5 w-5" />;
      case "poor": return <AlertTriangle className="h-5 w-5" />;
      case "critical": return <WifiOff className="h-5 w-5" />;
      default: return <Wifi className="h-5 w-5" />;
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-2 ${getColor()}`}>
          {getIcon()}
          <span className="font-semibold">{destinyTerm}</span>
          <Badge variant="outline" className={getColor()}>
            {score}/100
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Connection Quality: {rating.toUpperCase()}</p>
        <p className="text-xs text-muted-foreground">Score based on latency, packet loss, and jitter</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Match state badge
function MatchStateBadge({ state, destinyTerm }: { state: string; destinyTerm: string }) {
  const getVariant = () => {
    switch (state) {
      case "in_match": return "default";
      case "matchmaking": return "secondary";
      case "loading": return "outline";
      case "post_game": return "secondary";
      default: return "outline";
    }
  };

  const getIcon = () => {
    switch (state) {
      case "in_match": return <Target className="h-3 w-3 mr-1" />;
      case "matchmaking": return <Users className="h-3 w-3 mr-1" />;
      case "loading": return <RefreshCw className="h-3 w-3 mr-1 animate-spin" />;
      case "post_game": return <Trophy className="h-3 w-3 mr-1" />;
      default: return <Globe className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <Badge variant={getVariant()} className="flex items-center">
      {getIcon()}
      {destinyTerm}
    </Badge>
  );
}

// Live metrics chart
function LiveMetricsChart({ metrics }: { metrics: any[] }) {
  const chartData = useMemo(() => {
    return metrics.slice().reverse().map((m, i) => ({
      time: i,
      latency: m.latencyMs || 0,
      jitter: m.jitterMs || 0,
    }));
  }, [metrics]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.72 0.15 185)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="oklch(0.72 0.15 185)" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="jitterGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.75 0.15 70)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="oklch(0.75 0.15 70)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
        <XAxis dataKey="time" stroke="oklch(0.5 0 0)" tick={false} />
        <YAxis stroke="oklch(0.5 0 0)" />
        <Area 
          type="monotone" 
          dataKey="latency" 
          stroke="oklch(0.72 0.15 185)" 
          fill="url(#latencyGradient)"
          strokeWidth={2}
          name="Latency (ms)"
        />
        <Area 
          type="monotone" 
          dataKey="jitter" 
          stroke="oklch(0.75 0.15 70)" 
          fill="url(#jitterGradient)"
          strokeWidth={2}
          name="Jitter (ms)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Peer connection card
function PeerCard({ peer }: { peer: any }) {
  const latencyColor = peer.avgLatencyMs < 50 ? "text-green-400" : 
                       peer.avgLatencyMs < 100 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">
            {peer.geoCity || peer.geoCountry || "Unknown Location"}
          </p>
          <p className="text-xs text-muted-foreground">
            {peer.isp || peer.peerIp}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-mono text-sm ${latencyColor}`}>
          {peer.avgLatencyMs || "?"} ms
        </p>
        <p className="text-xs text-muted-foreground">
          {peer.bytesSent ? `${(peer.bytesSent / 1024).toFixed(1)} KB` : "—"}
        </p>
      </div>
    </div>
  );
}

// Event timeline item
function EventItem({ event }: { event: any }) {
  const getSeverityColor = () => {
    switch (event.severity) {
      case "critical": return "border-red-500 bg-red-500/10";
      case "warning": return "border-yellow-500 bg-yellow-500/10";
      default: return "border-primary/50 bg-primary/5";
    }
  };

  const getEventIcon = () => {
    switch (event.eventType) {
      case "lag_spike": return <Zap className="h-4 w-4 text-yellow-400" />;
      case "peer_joined": return <Users className="h-4 w-4 text-green-400" />;
      case "peer_left": return <Users className="h-4 w-4 text-red-400" />;
      case "match_start": return <Play className="h-4 w-4 text-primary" />;
      case "match_end": return <Square className="h-4 w-4 text-primary" />;
      case "connection_degraded": return <WifiOff className="h-4 w-4 text-orange-400" />;
      case "connection_recovered": return <Wifi className="h-4 w-4 text-green-400" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const timestamp = new Date(Number(event.timestampNs) / 1000000);

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border-l-2 ${getSeverityColor()}`}>
      <div className="mt-0.5">{getEventIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{event.description}</p>
        <p className="text-xs text-muted-foreground">
          {timestamp.toLocaleTimeString()}
          {event.latencyMs && ` • ${event.latencyMs}ms`}
        </p>
      </div>
    </div>
  );
}

// Find PS5 Dialog - searches ExtraHop for Sony devices
function FindPS5Dialog({ onDeviceFound }: { onDeviceFound: (device: any) => void }) {
  const [open, setOpen] = useState(false);
  const [searchPattern, setSearchPattern] = useState("Sony");

  const { data: config } = trpc.extrahop.getConfig.useQuery();
  
  // Search for PS5 using ExtraHop /devices/search API
  const { data: foundDevices, isLoading: searching, refetch: searchDevices } = trpc.extrahop.searchDevices.useQuery(
    { namePattern: searchPattern },
    { enabled: false } // Manual trigger only
  );

  const handleSearch = () => {
    if (!config) {
      toast.error("Please configure ExtraHop connection first in Settings");
      return;
    }
    searchDevices();
  };

  const handleSelectDevice = (device: any) => {
    onDeviceFound(device);
    setOpen(false);
    toast.success(`PS5 found: ${device.display_name || device.default_name}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="destiny-btn">
          <Monitor className="h-4 w-4 mr-2" />
          Find PS5
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gradient-destiny">Find PlayStation 5 on Network</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Search ExtraHop for your PS5 using the /devices/search API. 
            The device will be discovered automatically by ExtraHop.
          </p>
          <div className="flex gap-2">
            <Input 
              value={searchPattern}
              onChange={(e) => setSearchPattern(e.target.value)}
              placeholder="Sony, PlayStation, PS5..."
              className="bg-background flex-1"
            />
            <Button 
              onClick={handleSearch} 
              className="destiny-btn"
              disabled={searching || !config}
            >
              {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          
          {foundDevices && foundDevices.length > 0 && (
            <div className="space-y-2">
              <Label>Found Devices ({foundDevices.length})</Label>
              <ScrollArea className="h-48 rounded border border-border">
                <div className="p-2 space-y-2">
                  {foundDevices.map((device: any) => (
                    <div 
                      key={device.id}
                      className="p-3 rounded bg-background hover:bg-primary/10 cursor-pointer transition-colors border border-border"
                      onClick={() => handleSelectDevice(device)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{device.display_name || device.default_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {device.ipaddr4} • {device.macaddr}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-primary border-primary">
                          {device.vendor || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {foundDevices && foundDevices.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No devices found matching "{searchPattern}". Try a different search term.
            </p>
          )}
          
          {!config && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">
                ExtraHop not configured. Go to Settings to connect your ExtraHop appliance.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Crucible page
export default function Crucible() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<any>(null); // ExtraHop device object
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState("control");

  // Queries - use real ExtraHop device metrics
  const { data: config } = trpc.extrahop.getConfig.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: terminology } = trpc.crucible.getTerminology.useQuery();
  const { data: matchHistory } = trpc.crucible.getMatchHistory.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );
  const { data: stats } = trpc.crucible.getStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: activeMatch } = trpc.crucible.getActiveMatch.useQuery(
    { deviceId: selectedDevice! },
    { enabled: !!selectedDevice, refetchInterval: 5000 }
  );
  const { data: liveMetrics, refetch: refetchLiveMetrics } = trpc.crucible.getLiveMetrics.useQuery(
    { matchId: activeMatchId!, limit: 60 },
    { enabled: !!activeMatchId, refetchInterval: 2000 }
  );

  // Mutations
  const startMatchMutation = trpc.crucible.startMatch.useMutation({
    onSuccess: (data) => {
      if (data.success && data.matchId) {
        setActiveMatchId(data.matchId);
        toast.success("Match monitoring started - Shaxx is watching!");
      } else {
        toast.error(data.error || "Failed to start match");
      }
    },
  });
  const endMatchMutation = trpc.crucible.endMatch.useMutation({
    onSuccess: () => {
      setActiveMatchId(null);
      toast.success("Match monitoring ended");
    },
  });

  // Set active match from query
  useEffect(() => {
    if (activeMatch?.id) {
      setActiveMatchId(activeMatch.id);
    }
  }, [activeMatch]);

  // Device is now set via FindPS5Dialog

  const handleStartMatch = () => {
    if (!selectedDevice) {
      toast.error("Please find your PS5 first");
      return;
    }
    startMatchMutation.mutate({
      deviceId: selectedDevice.id, // ExtraHop device ID
      gameMode: selectedGameMode,
    });
  };

  const handleEndMatch = () => {
    if (!activeMatchId) return;
    endMatchMutation.mutate({ matchId: activeMatchId });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background destiny-bg-pattern flex items-center justify-center">
        <Card className="bg-card/80 backdrop-blur border-border">
          <CardContent className="p-8 text-center">
            <TricornLogo className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Crucible Operations Center</h2>
            <p className="text-muted-foreground mb-4">Sign in to monitor your PvP matches</p>
            <Link href="/">
              <Button className="destiny-btn">Return to Base</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background destiny-bg-pattern">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Command Center
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <TricornLogo className="h-6 w-6 text-primary" />
              <span className="font-bold tracking-wider text-gradient-destiny">CRUCIBLE OPS</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {liveMetrics?.connectionQuality && (
              <ConnectionQualityIndicator 
                rating={liveMetrics.connectionQuality.rating}
                score={liveMetrics.connectionQuality.score}
                destinyTerm={liveMetrics.connectionQuality.destinyTerm}
              />
            )}
            <span className="text-sm text-muted-foreground">
              <span className="text-primary">{user?.name || "Guardian"}</span>
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-gradient-destiny">Crucible Operations Center</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time PvP match monitoring for your PS5
            </p>
          </div>
          <div className="flex items-center gap-3">
            <FindPS5Dialog onDeviceFound={(device) => setSelectedDevice(device)} />
          </div>
        </div>

        {/* Device Selection & Match Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Device Selection */}
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-primary" />
                PlayStation 5
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDevice ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{selectedDevice.display_name || selectedDevice.default_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedDevice.ipaddr4} • ID: {selectedDevice.id}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Connected
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedDevice(null)}
                  >
                    Change Device
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click "Find PS5" to search ExtraHop for your PlayStation</p>
              )}
            </CardContent>
          </Card>

          {/* Game Mode Selection */}
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Game Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedGameMode} onValueChange={setSelectedGameMode}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="control">Control</SelectItem>
                  <SelectItem value="clash">Clash</SelectItem>
                  <SelectItem value="trials">Trials of Osiris</SelectItem>
                  <SelectItem value="iron_banner">Iron Banner</SelectItem>
                  <SelectItem value="competitive">Competitive</SelectItem>
                  <SelectItem value="rumble">Rumble</SelectItem>
                  <SelectItem value="mayhem">Mayhem</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Match Controls */}
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Match Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeMatchId ? (
                <div className="flex items-center gap-3">
                  <MatchStateBadge 
                    state={activeMatch?.matchState || "in_match"} 
                    destinyTerm={terminology?.matchStates[activeMatch?.matchState as keyof typeof terminology.matchStates] || "In Match"}
                  />
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleEndMatch}
                    disabled={endMatchMutation.isPending}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    End
                  </Button>
                </div>
              ) : (
                <Button 
                  className="destiny-btn w-full"
                  onClick={handleStartMatch}
                  disabled={!selectedDevice || startMatchMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Monitoring
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats?.totalMatches || 0}</p>
              <p className="text-xs text-muted-foreground tracking-wider">MATCHES TRACKED</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{stats?.victories || 0}</p>
              <p className="text-xs text-muted-foreground tracking-wider">VICTORIES</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-400">{Math.round(stats?.avgLatency || 0)} ms</p>
              <p className="text-xs text-muted-foreground tracking-wider">AVG LATENCY</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-teal-400">{liveMetrics?.peerCount || 0}</p>
              <p className="text-xs text-muted-foreground tracking-wider">GUARDIANS CONNECTED</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="bg-card/50 border border-border">
            <TabsTrigger value="live">Live Monitor</TabsTrigger>
            <TabsTrigger value="peers">Peer Analysis</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="history">Match History</TabsTrigger>
          </TabsList>

          {/* Live Monitor Tab */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latency Chart */}
              <Card className="bg-card/50 backdrop-blur border-border">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Connection Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {liveMetrics?.metrics?.length ? (
                    <LiveMetricsChart metrics={liveMetrics.metrics} />
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <p>Start a match to see live metrics</p>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>Latency (ms)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-400" />
                      <span>Jitter (ms)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Stats */}
              <Card className="bg-card/50 backdrop-blur border-border">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    Current Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {liveMetrics?.metrics?.[0] ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">LATENCY</p>
                          <p className="text-2xl font-mono font-bold text-primary">
                            {liveMetrics.metrics[0].latencyMs || 0} ms
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">JITTER</p>
                          <p className="text-2xl font-mono font-bold text-amber-400">
                            {liveMetrics.metrics[0].jitterMs || 0} ms
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">PACKETS SENT</p>
                          <p className="text-lg font-mono">
                            {liveMetrics.metrics[0].packetsSent?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">PACKETS LOST</p>
                          <p className="text-lg font-mono text-red-400">
                            {liveMetrics.metrics[0].packetsLost || 0}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">DATA TRANSFERRED</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">↑ Sent</p>
                            <p className="font-mono">
                              {((liveMetrics.metrics[0].bytesSent || 0) / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">↓ Received</p>
                            <p className="font-mono">
                              {((liveMetrics.metrics[0].bytesReceived || 0) / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <p>No active session data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Peer Analysis Tab */}
          <TabsContent value="peers">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Connected Guardians ({liveMetrics?.peers?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liveMetrics?.peers?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {liveMetrics.peers.map((peer, i) => (
                      <PeerCard key={i} peer={peer} />
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <p>No peers connected - start a match to see peer analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Match Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {liveMetrics?.events?.length ? (
                    <div className="space-y-2">
                      {liveMetrics.events.map((event, i) => (
                        <EventItem key={i} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <p>No events recorded yet</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Match History Tab */}
          <TabsContent value="history">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Recent Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchHistory?.length ? (
                  <div className="space-y-3">
                    {matchHistory.map((match) => (
                      <div 
                        key={match.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            match.result === "victory" ? "bg-green-500/20" : 
                            match.result === "defeat" ? "bg-red-500/20" : "bg-muted"
                          }`}>
                            {match.result === "victory" ? (
                              <Trophy className="h-5 w-5 text-green-400" />
                            ) : match.result === "defeat" ? (
                              <Shield className="h-5 w-5 text-red-400" />
                            ) : (
                              <Target className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{match.gameMode || "Unknown Mode"}</p>
                            <p className="text-xs text-muted-foreground">
                              {match.startTime ? new Date(match.startTime).toLocaleDateString() : "—"}
                              {match.durationMs && ` • ${Math.floor(Number(match.durationMs) / 60000)}m`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm">
                            {match.avgLatencyMs || "—"} ms avg
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {match.peerCount || 0} peers
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <p>No match history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Lore Chatbot */}
      <LoreChatbot />
    </div>
  );
}
