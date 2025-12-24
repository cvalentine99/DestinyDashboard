import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  Shield, 
  Activity, 
  Network, 
  MessageSquare, 
  Gamepad2, 
  Settings,
  ChevronRight,
  Zap,
  AlertTriangle,
  Users,
  Radio,
  Target,
  Trophy
} from "lucide-react";

// Destiny Tricorn SVG Logo
const TricornLogo = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 tricorn-glow" fill="currentColor">
    <path d="M50 5 L95 85 L50 65 L5 85 Z" />
    <path d="M50 25 L75 70 L50 55 L25 70 Z" opacity="0.6" />
  </svg>
);

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background destiny-bg-pattern constellation-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <TricornLogo />
            <div>
              <h1 className="text-lg font-bold tracking-wider text-gradient-destiny">
                VANGUARD OPS
              </h1>
              <p className="text-xs text-muted-foreground tracking-widest">
                NETWORK FORENSICS FOR EXTRAHOP
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, <span className="text-primary">{user?.name || "Guardian"}</span>
                </span>
                <Link href="/dashboard">
                  <Button className="destiny-btn">
                    Enter Command Center
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="destiny-btn">
                  Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.72_0.15_185/0.1)] via-transparent to-[oklch(0.75_0.15_70/0.1)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
                <TricornLogo />
              </div>
            </div>
            
            <p className="text-primary tracking-[0.3em] text-sm mb-4 uppercase">
              Year of Prophecy • Network Forensics
            </p>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="text-gradient-destiny">VANGUARD OPS</span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Rule the Frontier of your network. Navigate a world of data streams and 
              threat detections. Become the force that tips the balance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="destiny-btn text-lg px-8 py-6">
                    <Shield className="mr-2 h-5 w-5" />
                    Access Command Center
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="destiny-btn text-lg px-8 py-6">
                    <Shield className="mr-2 h-5 w-5" />
                    Begin Your Watch
                  </Button>
                </a>
              )}
              <Link href="/game">
                <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground text-lg px-8 py-6">
                  <Gamepad2 className="mr-2 h-5 w-5" />
                  Play Engram Hunter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 border-y border-border bg-card/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">247</div>
              <div className="text-sm text-muted-foreground tracking-wider uppercase">Guardians Online</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">1.24 TB</div>
              <div className="text-sm text-muted-foreground tracking-wider uppercase">Light Stream</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-destructive mb-1">9</div>
              <div className="text-sm text-muted-foreground tracking-wider uppercase">Threat Detections</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[oklch(0.65_0.18_280)] mb-1">1847</div>
              <div className="text-sm text-muted-foreground tracking-wider uppercase">Power Level</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-primary tracking-[0.3em] text-sm mb-4 uppercase">Capabilities</p>
            <h3 className="text-4xl font-bold text-gradient-destiny mb-4">
              VANGUARD OPERATIONS
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Advanced network monitoring tools translated into the language of Guardians.
              Every metric, every alert, every connection—reimagined.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Activity className="h-8 w-8" />}
              title="Real-Time Monitoring"
              description="Track your network's Light Stream in real-time. Watch as data flows through your infrastructure like Light through a Guardian."
              destinyTerm="Light Stream Analytics"
              color="teal"
            />
            <FeatureCard
              icon={<AlertTriangle className="h-8 w-8" />}
              title="Threat Detection"
              description="Identify Darkness Incursions before they compromise your network. AI-powered anomaly detection keeps you one step ahead."
              destinyTerm="Darkness Incursion Alerts"
              color="amber"
            />
            <FeatureCard
              icon={<Network className="h-8 w-8" />}
              title="Network Topology"
              description="Visualize your entire network as an interactive 3D map. See how your Guardians connect and communicate."
              destinyTerm="Fireteam Constellation Map"
              color="void"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Device Management"
              description="Monitor all network endpoints as Guardians in your fireteam. Track their status, activity, and power levels."
              destinyTerm="Guardian Roster"
              color="solar"
            />
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8" />}
              title="Lore Chatbot"
              description="Your personal Ghost companion with complete knowledge of Destiny lore. Ask anything about the universe."
              destinyTerm="Ghost AI Assistant"
              color="arc"
            />
            <FeatureCard
              icon={<Radio className="h-8 w-8" />}
              title="Voice Interface"
              description="Query your network status hands-free. Your Ghost will read critical alerts and respond to voice commands."
              destinyTerm="Ghost Voice Protocol"
              color="stasis"
            />
            <Link href="/crucible">
              <FeatureCard
                icon={<Target className="h-8 w-8" />}
                title="Crucible Operations"
                description="Real-time PvP match monitoring for your PS5. Track latency, peers, and connection quality during Crucible matches."
                destinyTerm="Crucible Ops Center"
                color="solar"
              />
            </Link>
            <Link href="/bungie">
              <FeatureCard
                icon={<Trophy className="h-8 w-8" />}
                title="Bungie API"
                description="Connect to Bungie.net to pull Crucible match results. Correlate K/D, maps, and game modes with network performance."
                destinyTerm="Guardian Records"
                color="void"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Terminology Section */}
      <section className="py-20 bg-card/30 border-y border-border">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-secondary tracking-[0.3em] text-sm mb-4 uppercase">Translation Matrix</p>
            <h3 className="text-4xl font-bold text-gradient-amber mb-4">
              SPEAK THE LANGUAGE
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Network terminology translated into the language of the Last City.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <TermCard network="Devices" destiny="Guardians" />
            <TermCard network="Alerts" destiny="Threat Detections" />
            <TermCard network="Traffic" destiny="Light Stream" />
            <TermCard network="Bandwidth" destiny="Power Level" />
            <TermCard network="Packets" destiny="Engrams" />
            <TermCard network="Firewall" destiny="Ward of Dawn" />
            <TermCard network="Latency" destiny="Warp Speed" />
            <TermCard network="DNS" destiny="Ghost Protocol" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="destiny-card p-12 text-center max-w-4xl mx-auto">
            <Zap className="h-16 w-16 text-primary mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-4">Ready to Become Legend?</h3>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Connect your ExtraHop appliance and transform your network monitoring 
              experience into something truly extraordinary.
            </p>
            {isAuthenticated ? (
              <Link href="/settings">
                <Button size="lg" className="destiny-btn">
                  <Settings className="mr-2 h-5 w-5" />
                  Configure ExtraHop Connection
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="destiny-btn">
                  Sign In to Get Started
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TricornLogo />
              <span className="text-sm text-muted-foreground">
                Vanguard Network Operations • Powered by ExtraHop
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link href="/topology" className="hover:text-primary transition-colors">Topology</Link>
              <Link href="/game" className="hover:text-primary transition-colors">Mini-Game</Link>
              <Link href="/settings" className="hover:text-primary transition-colors">Settings</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  icon, 
  title, 
  description, 
  destinyTerm,
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  destinyTerm: string;
  color: "teal" | "amber" | "void" | "solar" | "arc" | "stasis";
}) {
  const colorClasses = {
    teal: "text-primary glow-teal",
    amber: "text-secondary glow-amber",
    void: "text-[oklch(0.55_0.20_280)] glow-void",
    solar: "text-[oklch(0.70_0.20_45)] glow-solar",
    arc: "text-[oklch(0.65_0.18_220)] glow-arc",
    stasis: "text-[oklch(0.70_0.12_230)]",
  };

  return (
    <Card className="destiny-card group hover:scale-[1.02] transition-all duration-300">
      <CardHeader>
        <div className={`mb-4 ${colorClasses[color]}`}>
          {icon}
        </div>
        <CardTitle className="text-xl tracking-wide">{title}</CardTitle>
        <CardDescription className="text-xs text-primary tracking-widest uppercase">
          {destinyTerm}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

// Terminology Card Component
function TermCard({ network, destiny }: { network: string; destiny: string }) {
  return (
    <div className="destiny-card p-4 text-center group hover:border-primary/50 transition-colors">
      <div className="text-sm text-muted-foreground mb-1">{network}</div>
      <div className="text-primary font-semibold tracking-wide">{destiny}</div>
    </div>
  );
}
