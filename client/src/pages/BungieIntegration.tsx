import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Trophy, 
  Skull, 
  Target, 
  Zap, 
  Wifi, 
  WifiOff,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Settings,
  User,
  Swords,
  Shield,
  Crosshair,
  Clock,
  Activity,
  BarChart3,
  Download,
  ExternalLink
} from "lucide-react";
import LoreChatbot from "@/components/LoreChatbot";

// Destiny 2 class icons
const ClassIcon = ({ className }: { className: string }) => {
  switch (className?.toLowerCase()) {
    case 'titan':
      return <Shield className="h-5 w-5 text-[#f97316]" />;
    case 'hunter':
      return <Crosshair className="h-5 w-5 text-[#06b6d4]" />;
    case 'warlock':
      return <Zap className="h-5 w-5 text-[#a855f7]" />;
    default:
      return <User className="h-5 w-5" />;
  }
};

// Performance impact indicator
const PerformanceImpact = ({ impact }: { impact: string }) => {
  switch (impact) {
    case 'positive':
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <TrendingUp className="h-3 w-3 mr-1" />
          Positive
        </Badge>
      );
    case 'negative':
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <TrendingDown className="h-3 w-3 mr-1" />
          Negative
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
          <Minus className="h-3 w-3 mr-1" />
          Neutral
        </Badge>
      );
  }
};

// K/D color coding
const getKdColor = (kd: number) => {
  if (kd >= 2.0) return "text-yellow-400"; // Legendary
  if (kd >= 1.5) return "text-purple-400"; // Epic
  if (kd >= 1.0) return "text-blue-400"; // Rare
  if (kd >= 0.8) return "text-green-400"; // Uncommon
  return "text-gray-400"; // Common
};

// Standing badge
const StandingBadge = ({ standing }: { standing: number }) => {
  if (standing === 0) {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Trophy className="h-3 w-3 mr-1" />
        Victory
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
      <Skull className="h-3 w-3 mr-1" />
      Defeat
    </Badge>
  );
};

export default function BungieIntegration() {
  const { user, loading: authLoading } = useAuth();
  const [bungieName, setBungieName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  // Queries
  const { data: bungieConfig, isLoading: configLoading, refetch: refetchConfig } = 
    trpc.bungie.getConfig.useQuery(undefined, { enabled: !!user });
  
  const { data: profile, isLoading: profileLoading } = 
    trpc.bungie.getProfile.useQuery(undefined, { enabled: !!bungieConfig });
  
  const { data: storedMatches, isLoading: matchesLoading, refetch: refetchMatches } = 
    trpc.bungie.getStoredMatches.useQuery({ limit: 25 }, { enabled: !!bungieConfig });

  const { data: matchDetails, isLoading: detailsLoading } = 
    trpc.bungie.getMatchDetails.useQuery(
      { activityId: selectedMatch! },
      { enabled: !!selectedMatch }
    );

  const { data: correlation } = 
    trpc.bungie.getCorrelation.useQuery(
      { bungieActivityId: selectedMatch! },
      { enabled: !!selectedMatch }
    );

  // Mutations
  const saveConfigMutation = trpc.bungie.saveConfig.useMutation({
    onSuccess: (data) => {
      toast.success(`Connected as ${data.player.bungieGlobalDisplayName}`, {
        description: `${data.player.characterClass} • Light ${data.player.lightLevel}`,
      });
      refetchConfig();
    },
    onError: (error) => {
      toast.error("Failed to connect", { description: error.message });
    },
  });

  const syncMatchesMutation = trpc.bungie.getRecentMatches.useQuery(
    { count: 25 },
    { enabled: false }
  );

  const handleConnect = () => {
    if (!bungieName || !apiKey) {
      toast.error("Please enter your Bungie Name and API Key");
      return;
    }
    saveConfigMutation.mutate({ bungieName, apiKey, autoSync });
  };

  const handleSync = async () => {
    toast.info("Syncing matches from Bungie...");
    await syncMatchesMutation.refetch();
    await refetchMatches();
    toast.success("Matches synced successfully");
  };

  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading Guardian data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold font-display tracking-wide">
                <span className="text-primary">BUNGIE</span> API INTEGRATION
              </h1>
              <p className="text-xs text-muted-foreground">
                Correlate network performance with match results
              </p>
            </div>
          </div>
          
          {bungieConfig && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncMatchesMutation.isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMatchesMutation.isFetching ? 'animate-spin' : ''}`} />
                Sync Matches
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                <Wifi className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">Connected</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container py-8">
        {!bungieConfig ? (
          /* Configuration Form */
          <div className="max-w-xl mx-auto">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display">Connect to Bungie</CardTitle>
                <CardDescription>
                  Link your Bungie account to pull Crucible match data and correlate with network performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bungieName">Bungie Name</Label>
                  <Input
                    id="bungieName"
                    placeholder="Guardian#1234"
                    value={bungieName}
                    onChange={(e) => setBungieName(e.target.value)}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your full Bungie Name including the # and numbers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your Bungie API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a 
                      href="https://www.bungie.net/en/Application" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      bungie.net/en/Application
                      <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Sync Matches</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically sync new matches after each session
                    </p>
                  </div>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleConnect}
                  disabled={saveConfigMutation.isPending}
                >
                  {saveConfigMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Connect Account
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Main Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Guardian Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ) : profile ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ClassIcon className={profile.characterClass || ''} />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{profile.bungieName}</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.characterClass} • ✦ {profile.lightLevel}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Characters</p>
                      {profile.characters?.map((char) => (
                        <div 
                          key={char.characterId}
                          className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                        >
                          <div className="flex items-center gap-2">
                            <ClassIcon className={char.className} />
                            <span className="text-sm">{char.className}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">✦ {char.light}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="text-xs text-muted-foreground">
                      Last synced: {profile.lastSyncAt ? new Date(profile.lastSyncAt).toLocaleString() : 'Never'}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Failed to load profile</p>
                )}
              </CardContent>
            </Card>

            {/* Match History */}
            <Card className="lg:col-span-2 bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-primary" />
                  Crucible Match History
                </CardTitle>
                <CardDescription>
                  Recent PvP matches with network correlation data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {matchesLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
                      ))}
                    </div>
                  ) : storedMatches && storedMatches.length > 0 ? (
                    <div className="space-y-3">
                      {storedMatches.map((match) => (
                        <div
                          key={match.activityId}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedMatch === match.activityId
                              ? 'bg-primary/10 border-primary/50'
                              : 'bg-background/50 border-border/50 hover:border-primary/30'
                          }`}
                          onClick={() => setSelectedMatch(match.activityId)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <StandingBadge standing={match.standing || 1} />
                              <span className="font-medium">{match.modeName || 'Crucible'}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(match.period).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">K/D</p>
                              <p className={`font-bold ${getKdColor(parseFloat(match.kd || '0'))}`}>
                                {parseFloat(match.kd || '0').toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Kills</p>
                              <p className="font-medium text-green-400">{match.kills}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Deaths</p>
                              <p className="font-medium text-red-400">{match.deaths}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Assists</p>
                              <p className="font-medium text-blue-400">{match.assists}</p>
                            </div>
                          </div>
                          
                          {match.teamScore !== null && match.opponentScore !== null && (
                            <div className="mt-2 pt-2 border-t border-border/30">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Score</span>
                                <span>
                                  <span className={match.standing === 0 ? 'text-green-400' : 'text-muted-foreground'}>
                                    {match.teamScore}
                                  </span>
                                  {' - '}
                                  <span className={match.standing === 1 ? 'text-red-400' : 'text-muted-foreground'}>
                                    {match.opponentScore}
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Swords className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No matches found</p>
                      <Button variant="outline" className="mt-4" onClick={handleSync}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Matches
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Match Details & Correlation */}
            {selectedMatch && (
              <Card className="lg:col-span-3 bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Match Analysis
                  </CardTitle>
                  <CardDescription>
                    Detailed performance breakdown with network correlation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="performance">
                    <TabsList className="mb-4">
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                      <TabsTrigger value="network">Network Correlation</TabsTrigger>
                      <TabsTrigger value="weapons">Weapon Stats</TabsTrigger>
                    </TabsList>

                    <TabsContent value="performance">
                      {detailsLoading ? (
                        <div className="animate-pulse space-y-4">
                          <div className="h-32 bg-muted rounded-lg" />
                        </div>
                      ) : matchDetails ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          <StatCard 
                            label="Kills" 
                            value={(matchDetails as any).kills || 0} 
                            icon={<Target className="h-4 w-4" />}
                            color="text-green-400"
                          />
                          <StatCard 
                            label="Deaths" 
                            value={(matchDetails as any).deaths || 0} 
                            icon={<Skull className="h-4 w-4" />}
                            color="text-red-400"
                          />
                          <StatCard 
                            label="Assists" 
                            value={(matchDetails as any).assists || 0} 
                            icon={<User className="h-4 w-4" />}
                            color="text-blue-400"
                          />
                          <StatCard 
                            label="K/D Ratio" 
                            value={parseFloat((matchDetails as any).kd || '0').toFixed(2)} 
                            icon={<Activity className="h-4 w-4" />}
                            color={getKdColor(parseFloat((matchDetails as any).kd || '0'))}
                          />
                          <StatCard 
                            label="Efficiency" 
                            value={parseFloat((matchDetails as any).efficiency || '0').toFixed(2)} 
                            icon={<TrendingUp className="h-4 w-4" />}
                            color="text-purple-400"
                          />
                          <StatCard 
                            label="Score" 
                            value={(matchDetails as any).score || 0} 
                            icon={<Trophy className="h-4 w-4" />}
                            color="text-yellow-400"
                          />
                          {(matchDetails as any).precisionKills !== undefined && (
                            <StatCard 
                              label="Precision" 
                              value={(matchDetails as any).precisionKills} 
                              icon={<Crosshair className="h-4 w-4" />}
                              color="text-orange-400"
                            />
                          )}
                          {(matchDetails as any).superKills !== undefined && (
                            <StatCard 
                              label="Super Kills" 
                              value={(matchDetails as any).superKills} 
                              icon={<Zap className="h-4 w-4" />}
                              color="text-cyan-400"
                            />
                          )}
                          {(matchDetails as any).longestKillSpree !== undefined && (
                            <StatCard 
                              label="Kill Streak" 
                              value={(matchDetails as any).longestKillSpree} 
                              icon={<Swords className="h-4 w-4" />}
                              color="text-pink-400"
                            />
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Failed to load match details</p>
                      )}
                    </TabsContent>

                    <TabsContent value="network">
                      {correlation ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <PerformanceImpact impact={correlation.performanceImpact || 'neutral'} />
                            <span className="text-sm text-muted-foreground">
                              Network conditions {correlation.performanceImpact === 'negative' ? 'may have affected' : 'did not significantly affect'} your performance
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard 
                              label="Avg Latency" 
                              value={`${parseFloat(correlation.avgLatencyMs || '0').toFixed(1)}ms`}
                              icon={<Clock className="h-4 w-4" />}
                              color={parseFloat(correlation.avgLatencyMs || '0') > 100 ? 'text-red-400' : 'text-green-400'}
                            />
                            <StatCard 
                              label="Max Latency" 
                              value={`${parseFloat(correlation.maxLatencyMs || '0').toFixed(1)}ms`}
                              icon={<TrendingUp className="h-4 w-4" />}
                              color={parseFloat(correlation.maxLatencyMs || '0') > 150 ? 'text-red-400' : 'text-yellow-400'}
                            />
                            <StatCard 
                              label="Avg Jitter" 
                              value={`${parseFloat(correlation.avgJitterMs || '0').toFixed(1)}ms`}
                              icon={<Activity className="h-4 w-4" />}
                              color={parseFloat(correlation.avgJitterMs || '0') > 30 ? 'text-red-400' : 'text-green-400'}
                            />
                            <StatCard 
                              label="Packet Loss" 
                              value={`${parseFloat(correlation.packetLossPercent || '0').toFixed(2)}%`}
                              icon={<WifiOff className="h-4 w-4" />}
                              color={parseFloat(correlation.packetLossPercent || '0') > 1 ? 'text-red-400' : 'text-green-400'}
                            />
                          </div>
                          
                          {(() => {
                            const insights = correlation.insights as string[] | null;
                            if (!insights || !Array.isArray(insights) || insights.length === 0) return null;
                            return (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Insights</p>
                                <ul className="space-y-1">
                                  {insights.map((insight, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-primary">•</span>
                                      {String(insight)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <WifiOff className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground mb-2">No network correlation data</p>
                          <p className="text-xs text-muted-foreground">
                            Enable Crucible monitoring during matches to correlate network performance
                          </p>
                          <Link href="/crucible">
                            <Button variant="outline" className="mt-4">
                              <Activity className="h-4 w-4 mr-2" />
                              Open Crucible Ops
                            </Button>
                          </Link>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="weapons">
                      <div className="text-center py-8">
                        <Crosshair className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">Weapon stats coming soon</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Detailed weapon performance breakdown will be available in a future update
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Lore Chatbot */}
      <LoreChatbot />
    </div>
  );
}

// Stat card component
function StatCard({ 
  label, 
  value, 
  icon, 
  color = "text-foreground" 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-background/50 border border-border/50">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
