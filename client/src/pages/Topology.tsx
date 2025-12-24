import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Network, 
  ChevronLeft, 
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Server,
  Monitor,
  Router,
  Shield
} from "lucide-react";
import LoreChatbot from "@/components/LoreChatbot";

// Destiny Tricorn SVG Logo
const TricornLogo = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8" fill="currentColor">
    <path d="M50 5 L95 85 L50 65 L5 85 Z" />
    <path d="M50 25 L75 70 L50 55 L25 70 Z" opacity="0.6" />
  </svg>
);

interface TopologyNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  name: string;
  type: string;
  ipaddr?: string;
  connections: number;
}

interface TopologyEdge {
  from: number;
  to: number;
  weight: number;
  protocols?: string[];
  appearances?: number;
  // Mapped properties for rendering
  source?: number;
  target?: number;
  protocol?: string;
}

export default function Topology() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<TopologyNode[]>([]);
  const edgesRef = useRef<TopologyEdge[]>([]);
  
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Fetch topology data
  const { data: topologyData, isLoading, refetch } = trpc.extrahop.getTopology.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Initialize demo nodes if no real data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Generate demo topology if no data
    if (!topologyData || !topologyData.nodes?.length) {
      const demoNodes: TopologyNode[] = [];
      const demoEdges: TopologyEdge[] = [];
      
      // Create central server
      demoNodes.push({
        id: 0,
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
        name: "TITAN-CORE-01",
        type: "server",
        ipaddr: "10.0.1.1",
        connections: 0,
      });

      // Create surrounding nodes
      const nodeCount = 30;
      for (let i = 1; i <= nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const radius = 150 + Math.random() * 100;
        const types = ["server", "client", "gateway", "firewall"];
        const names = ["HUNTER", "WARLOCK", "TITAN", "GHOST"];
        
        demoNodes.push({
          id: i,
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          name: `${names[i % names.length]}-${String(i).padStart(2, "0")}`,
          type: types[Math.floor(Math.random() * types.length)],
          ipaddr: `10.0.${Math.floor(i / 10)}.${i % 256}`,
          connections: Math.floor(Math.random() * 5) + 1,
        });

        // Connect to center or nearby nodes
        if (Math.random() > 0.3) {
          demoEdges.push({
            from: 0,
            to: i,
            protocols: [["HTTP", "HTTPS", "SSH", "DNS"][Math.floor(Math.random() * 4)]],
            weight: Math.random() * 100,
          });
        }
        
        // Random connections between nodes
        if (i > 1 && Math.random() > 0.6) {
          demoEdges.push({
            from: Math.floor(Math.random() * (i - 1)) + 1,
            to: i,
            protocols: [["HTTP", "HTTPS", "SSH", "DNS"][Math.floor(Math.random() * 4)]],
            weight: Math.random() * 50,
          });
        }
      }

      nodesRef.current = demoNodes;
      edgesRef.current = demoEdges;
    } else {
      // Use real data
      nodesRef.current = topologyData.nodes.map((n, i) => ({
        id: n.id,
        x: width / 2 + (Math.random() - 0.5) * 400,
        y: height / 2 + (Math.random() - 0.5) * 400,
        vx: 0,
        vy: 0,
        name: n.name || `Node-${n.id}`,
        type: n.object_type || "device",
        ipaddr: n.ipaddr,
        connections: 0,
      }));
      edgesRef.current = topologyData.edges || [];
    }
  }, [topologyData]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Force-directed layout simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Apply forces
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      // Repulsion from other nodes
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const other = nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 1000 / (dist * dist);
        node.vx += (dx / dist) * force * 0.1;
        node.vy += (dy / dist) * force * 0.1;
      }

      // Attraction to center
      const centerDx = width / 2 - node.x;
      const centerDy = height / 2 - node.y;
      node.vx += centerDx * 0.0001;
      node.vy += centerDy * 0.0001;
    }

    // Edge attraction
    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 100) * 0.01;

      source.vx += (dx / dist) * force;
      source.vy += (dy / dist) * force;
      target.vx -= (dx / dist) * force;
      target.vy -= (dy / dist) * force;
    }

    // Update positions with damping
    for (const node of nodes) {
      node.vx *= 0.9;
      node.vy *= 0.9;
      node.x += node.vx;
      node.y += node.vy;

      // Keep in bounds
      node.x = Math.max(50, Math.min(width - 50, node.x));
      node.y = Math.max(50, Math.min(height - 50, node.y));
    }

    // Clear and draw
    ctx.fillStyle = "oklch(0.12 0.02 250)";
    ctx.fillRect(0, 0, width, height);

    // Apply zoom and offset
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    for (const edge of edges) {
      // Handle both API format (from/to) and legacy format (source/target)
      const sourceId = edge.from ?? edge.source;
      const targetId = edge.to ?? edge.target;
      const source = nodes.find(n => n.id === sourceId);
      const target = nodes.find(n => n.id === targetId);
      if (!source || !target) continue;

      const protocolColors: Record<string, string> = {
        HTTP: "oklch(0.70 0.20 45)",
        HTTPS: "oklch(0.72 0.15 185)",
        SSH: "oklch(0.65 0.18 280)",
        DNS: "oklch(0.75 0.15 70)",
      };

      const protocol = edge.protocols?.[0] || edge.protocol || "unknown";
      ctx.strokeStyle = protocolColors[protocol] || "oklch(0.30 0.03 250)";
      ctx.lineWidth = Math.max(1, edge.weight / 20);
      ctx.globalAlpha = 0.5;
      
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw nodes
    for (const node of nodes) {
      const isSelected = selectedNode?.id === node.id;
      const typeColors: Record<string, string> = {
        server: "oklch(0.72 0.15 185)",
        client: "oklch(0.75 0.15 70)",
        gateway: "oklch(0.65 0.18 280)",
        firewall: "oklch(0.55 0.22 25)",
        device: "oklch(0.65 0.18 220)",
      };

      const color = typeColors[node.type] || typeColors.device;
      const radius = isSelected ? 18 : 12;

      // Glow effect
      if (isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
      }

      // Node circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Node label
      ctx.fillStyle = "white";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.name, node.x, node.y + radius + 14);
    }

    ctx.restore();

    // Draw legend
    ctx.fillStyle = "white";
    ctx.font = "12px Orbitron, sans-serif";
    ctx.fillText("FIRETEAM CONSTELLATION MAP", 20, 30);

    animationRef.current = requestAnimationFrame(simulate);
  }, [zoom, offset, selectedNode]);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [simulate]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    // Find clicked node
    for (const node of nodesRef.current) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        setSelectedNode(node);
        return;
      }
    }
    setSelectedNode(null);
  };

  // Handle canvas drag
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  if (authLoading) {
    return <TopologySkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-[oklch(0.65_0.18_280)]">
              <Network className="h-6 w-6" />
              <span className="font-bold tracking-wider text-sm">TOPOLOGY</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.2))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-14 h-screen flex">
        {/* Canvas Area */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full cursor-move"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onMouseMove={handleMouseMove}
            />
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
            <div className="text-xs font-medium mb-2">Guardian Types</div>
            <div className="space-y-1">
              <LegendItem color="oklch(0.72 0.15 185)" label="Titan (Server)" />
              <LegendItem color="oklch(0.75 0.15 70)" label="Hunter (Client)" />
              <LegendItem color="oklch(0.65 0.18 280)" label="Warlock (Gateway)" />
              <LegendItem color="oklch(0.55 0.22 25)" label="Ward of Dawn (Firewall)" />
            </div>
          </div>

          {/* Protocol Legend */}
          <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
            <div className="text-xs font-medium mb-2">Light Streams</div>
            <div className="space-y-1">
              <LegendItem color="oklch(0.70 0.20 45)" label="Solar Strike (HTTP)" />
              <LegendItem color="oklch(0.72 0.15 185)" label="Golden Gun (HTTPS)" />
              <LegendItem color="oklch(0.65 0.18 280)" label="Shadowshot (SSH)" />
              <LegendItem color="oklch(0.75 0.15 70)" label="Ghost Protocol (DNS)" />
            </div>
          </div>
        </div>

        {/* Sidebar - Node Details */}
        <div className="w-80 border-l border-border p-4 hidden lg:block">
          {selectedNode ? (
            <Card className="destiny-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <NodeIcon type={selectedNode.type} />
                  {selectedNode.name}
                </CardTitle>
                <CardDescription>
                  {getGuardianClass(selectedNode.type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">IP Address</div>
                  <div className="font-mono text-sm">{selectedNode.ipaddr || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Node Type</div>
                  <Badge variant="outline" className="capitalize">{selectedNode.type}</Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Connections</div>
                  <div className="text-sm">{selectedNode.connections} active links</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-green-500">In Combat</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="destiny-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Fireteam Constellation
                </CardTitle>
                <CardDescription>
                  Interactive network topology map
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>Click on any Guardian (node) to view details.</p>
                <p>Drag to pan the view. Use zoom controls to adjust scale.</p>
                <p>Lines represent active Light Streams (connections) between Guardians.</p>
                <div className="pt-4 border-t border-border">
                  <div className="text-xs font-medium text-foreground mb-2">Network Summary</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Total Guardians</span>
                      <span className="text-primary">{nodesRef.current.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Connections</span>
                      <span className="text-secondary">{edgesRef.current.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Lore Chatbot */}
      <LoreChatbot />
    </div>
  );
}

// Legend Item Component
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

// Node Icon Component
function NodeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    server: <Server className="h-5 w-5 text-primary" />,
    client: <Monitor className="h-5 w-5 text-secondary" />,
    gateway: <Router className="h-5 w-5 text-[oklch(0.65_0.18_280)]" />,
    firewall: <Shield className="h-5 w-5 text-destructive" />,
  };
  return icons[type] || <Network className="h-5 w-5" />;
}

// Get Guardian class name
function getGuardianClass(type: string): string {
  const classes: Record<string, string> = {
    server: "Titan Class Guardian",
    client: "Hunter Class Guardian",
    gateway: "Warlock Class Guardian",
    firewall: "Ward of Dawn Sentinel",
  };
  return classes[type] || "Unknown Class";
}

// Topology Skeleton
function TopologySkeleton() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    </div>
  );
}
