import { useAuth } from "@/_core/hooks/useAuth";
import { TricornLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { 
  Shield, 
  Activity, 
  Network, 
  AlertTriangle,
  Users,
  Zap,
  Radio,
  Settings,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  Gamepad2,
  Menu,
  X,
  Home,
  Target,
  Map,
  Crosshair,
  Trophy
} from "lucide-react";
import { useState, useEffect } from "react";
import LoreChatbot from "@/components/LoreChatbot";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance for gesture detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isRightSwipe && !mobileMenuOpen) {
      setMobileMenuOpen(true);
    }
    if (isLeftSwipe && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = trpc.extrahop.getDashboardSummary.useQuery(
    undefined,
    { 
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 15000, // Consider data fresh for 15 seconds to reduce refetches
    }
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Rotating status messages
  useEffect(() => {
    const messages = [
      "Vanguard Operations: All systems nominal",
      "Ghost Protocol: Scanning for anomalies...",
      "Light Stream: Stable flow detected",
      "Fireteam Status: 189 Guardians active",
      "Threat Level: Elevated - Stay vigilant",
    ];
    
    const interval = setInterval(() => {
      setStatusMessages(prev => {
        const next = [...prev, messages[Math.floor(Math.random() * messages.length)]];
        return next.slice(-5);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const data = dashboardData || {
    configured: false,
    guardians: { total: 0, active: 0, idle: 0, offline: 0 },
    threats: { critical: 0, high: 0, medium: 0, low: 0 },
    lightStream: { inbound: "0 B", outbound: "0 B", peak: "0 bps" },
    powerLevel: 0,
    recentActivity: [],
  };

  return (
    <div 
      className="min-h-screen bg-background"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <TricornLogo />
              <span className="font-bold tracking-wider text-sm">VANGUARD OPS</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard" active={location === "/dashboard"}>Command Center</NavLink>
              <NavLink href="/crucible" active={location === "/crucible"}>Crucible Ops</NavLink>
              <NavLink href="/topology" active={location === "/topology"}>Topology</NavLink>
              <NavLink href="/game" active={location === "/game"}>Mini-Game</NavLink>
              <NavLink href="/settings" active={location === "/settings"}>Settings</NavLink>
              <NavLink href="/triumphs" active={location === "/triumphs"}>Triumphs</NavLink>
            </div>
            
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="hidden sm:flex">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:block">
              <span className="text-primary">{user?.name || "Guardian"}</span>
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <nav className="fixed top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-2">
            <MobileNavLink href="/dashboard" icon={<Shield className="h-4 w-4" />} active={location === "/dashboard"} onClick={() => setMobileMenuOpen(false)}>
              Command Center
            </MobileNavLink>
            <MobileNavLink href="/crucible" icon={<Crosshair className="h-4 w-4" />} active={location === "/crucible"} onClick={() => setMobileMenuOpen(false)}>
              Crucible Ops
            </MobileNavLink>
            <MobileNavLink href="/topology" icon={<Map className="h-4 w-4" />} active={location === "/topology"} onClick={() => setMobileMenuOpen(false)}>
              Topology
            </MobileNavLink>
            <MobileNavLink href="/game" icon={<Gamepad2 className="h-4 w-4" />} active={location === "/game"} onClick={() => setMobileMenuOpen(false)}>
              Mini-Game
            </MobileNavLink>
            <MobileNavLink href="/settings" icon={<Settings className="h-4 w-4" />} active={location === "/settings"} onClick={() => setMobileMenuOpen(false)}>
              Settings
            </MobileNavLink>
            <MobileNavLink href="/triumphs" icon={<Trophy className="h-4 w-4" />} active={location === "/triumphs"} onClick={() => setMobileMenuOpen(false)}>
              Triumphs
            </MobileNavLink>
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground px-3 py-2">
                Logged in as <span className="text-primary">{user?.name || "Guardian"}</span>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Status Ticker */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border py-1 overflow-hidden">
        <div className="container">
          <div className="flex items-center gap-4 text-xs text-muted-foreground animate-pulse">
            <Radio className="h-3 w-3 text-primary" />
            <span className="text-primary tracking-wider">VANGUARD BROADCAST:</span>
            <span>{statusMessages[statusMessages.length - 1] || "Initializing systems..."}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-28 pb-8">
        <div className="container">
          {/* Configuration Warning */}
          {!data.configured && (
            <Card className="mb-6 border-secondary/50 bg-secondary/10">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-secondary" />
                  <span className="text-sm">ExtraHop not configured. Showing demo data.</span>
                </div>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                    Configure Now
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Power Level Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-wider text-gradient-destiny">
                COMMAND CENTER
              </h1>
              <p className="text-muted-foreground text-sm tracking-wide">
                Network Forensics Dashboard • Year of Prophecy
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground tracking-wider uppercase mb-1">
                Network Power Level
              </div>
              <div className="text-4xl font-bold text-primary">
                {data.powerLevel}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Guardians Online"
              value={data.guardians.active}
              subValue={`${data.guardians.total} total`}
              color="teal"
            />
            <StatCard
              icon={<Activity className="h-5 w-5" />}
              label="Light Stream In"
              value={data.lightStream.inbound}
              subValue={`Peak: ${data.lightStream.peak}`}
              color="amber"
              trend="up"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Threat Detections"
              value={data.threats.critical + data.threats.high}
              subValue={`${data.threats.critical} critical`}
              color="destructive"
            />
            <StatCard
              icon={<Zap className="h-5 w-5" />}
              label="Light Stream Out"
              value={data.lightStream.outbound}
              subValue="Stable flow"
              color="void"
              trend="up"
            />
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Guardian Status */}
            <Card className="destiny-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Guardian Roster
                </CardTitle>
                <CardDescription>Network device status overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <StatusBar 
                    label="Active (In Combat)" 
                    value={data.guardians.active} 
                    max={data.guardians.total}
                    color="primary"
                  />
                  <StatusBar 
                    label="Idle (At Tower)" 
                    value={data.guardians.idle} 
                    max={data.guardians.total}
                    color="secondary"
                  />
                  <StatusBar 
                    label="Offline (Ghost Dormant)" 
                    value={data.guardians.offline} 
                    max={data.guardians.total}
                    color="muted"
                  />
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{data.guardians.active}</div>
                      <div className="text-xs text-muted-foreground">Titans</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-secondary">{Math.floor(data.guardians.active * 0.4)}</div>
                      <div className="text-xs text-muted-foreground">Hunters</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[oklch(0.65_0.18_280)]">{Math.floor(data.guardians.active * 0.3)}</div>
                      <div className="text-xs text-muted-foreground">Warlocks</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Threat Detection Panel */}
            <Card className="destiny-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Threat Detections
                </CardTitle>
                <CardDescription>Active security alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ThreatLevel 
                    level="Extinction-Level" 
                    count={data.threats.critical} 
                    color="destructive"
                  />
                  <ThreatLevel 
                    level="Darkness Incursion" 
                    count={data.threats.high} 
                    color="orange"
                  />
                  <ThreatLevel 
                    level="Fallen Raid" 
                    count={data.threats.medium} 
                    color="yellow"
                  />
                  <ThreatLevel 
                    level="Minor Skirmish" 
                    count={data.threats.low} 
                    color="blue"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="destiny-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Vanguard Activity Log
                </CardTitle>
                <CardDescription>Recent network events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {data.recentActivity.map((activity, i) => (
                      <ActivityItem key={i} activity={activity} />
                    ))}
                    {data.recentActivity.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No recent activity detected
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="destiny-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-secondary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/topology" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Network className="mr-2 h-4 w-4" />
                    View Topology Map
                  </Button>
                </Link>
                <Link href="/settings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure ExtraHop
                  </Button>
                </Link>
                <Link href="/game" className="block">
                  <Button variant="outline" className="w-full justify-start border-secondary/50 hover:border-secondary">
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Play Engram Hunter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Lore Chatbot */}
      <LoreChatbot />
    </div>
  );
}

// Navigation Link Component
function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href}>
      <Button 
        variant="ghost" 
        size="sm" 
        className={`text-xs tracking-wider ${active ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
      >
        {children}
      </Button>
    </Link>
  );
}

// Mobile Navigation Link Component
function MobileNavLink({ 
  href, 
  children, 
  icon, 
  active,
  onClick 
}: { 
  href: string; 
  children: React.ReactNode; 
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}>
        {icon}
        <span className="text-sm font-medium tracking-wider">{children}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
      </div>
    </Link>
  );
}

// Breadcrumb Component
function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
      <Link href="/" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  subValue, 
  color,
  trend 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  subValue: string;
  color: "teal" | "amber" | "destructive" | "void";
  trend?: "up" | "down";
}) {
  const colorClasses = {
    teal: "text-primary border-primary/30",
    amber: "text-secondary border-secondary/30",
    destructive: "text-destructive border-destructive/30",
    void: "text-[oklch(0.65_0.18_280)] border-[oklch(0.65_0.18_280)]/30",
  };

  return (
    <Card className={`destiny-card border ${colorClasses[color]}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className={colorClasses[color]}>{icon}</div>
          {trend && (
            trend === "up" 
              ? <TrendingUp className="h-4 w-4 text-green-500" />
              : <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xs text-muted-foreground mt-1">{subValue}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Status Bar Component
function StatusBar({ 
  label, 
  value, 
  max, 
  color 
}: { 
  label: string; 
  value: number; 
  max: number;
  color: "primary" | "secondary" | "muted";
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <Progress value={percentage} className={`h-2 bg-${color}/20`} />
    </div>
  );
}

// Threat Level Component
function ThreatLevel({ 
  level, 
  count, 
  color 
}: { 
  level: string; 
  count: number;
  color: "destructive" | "orange" | "yellow" | "blue";
}) {
  const colorClasses = {
    destructive: "bg-destructive text-destructive-foreground",
    orange: "bg-[oklch(0.70_0.20_45)] text-black",
    yellow: "bg-[oklch(0.85_0.15_90)] text-black",
    blue: "bg-[oklch(0.65_0.18_220)] text-white",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{level}</span>
      <Badge className={colorClasses[color]}>{count}</Badge>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: { type: string; message: string; time: string; severity: string } }) {
  const severityColors = {
    high: "text-destructive",
    medium: "text-secondary",
    low: "text-primary",
    info: "text-muted-foreground",
  };

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`mt-1 ${severityColors[activity.severity as keyof typeof severityColors] || severityColors.info}`}>
        {activity.type === "alert" && <AlertTriangle className="h-4 w-4" />}
        {activity.type === "device" && <Users className="h-4 w-4" />}
        {activity.type === "metric" && <Activity className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{activity.message}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Clock className="h-3 w-3" />
          {activity.time}
        </div>
      </div>
    </div>
  );
}

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
