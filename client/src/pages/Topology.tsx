import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RefreshCw,
  Sparkles,
  Shield,
  Crosshair,
  Zap,
  Eye,
  Flame,
  Globe
} from "lucide-react";

// Destiny 2 Element Colors
type ElementType = "solar" | "arc" | "void" | "stasis" | "strand";
type FactionType = "vanguard" | "crucible" | "gambit" | "tower" | "darkness";

const ELEMENT_COLORS: Record<ElementType, { primary: string; secondary: string; glow: string; name: string }> = {
  solar: { primary: "#FF6B00", secondary: "#FFB347", glow: "rgba(255, 107, 0, 0.6)", name: "Solar" },
  arc: { primary: "#00BFFF", secondary: "#87CEEB", glow: "rgba(0, 191, 255, 0.6)", name: "Arc" },
  void: { primary: "#9B30FF", secondary: "#DA70D6", glow: "rgba(155, 48, 255, 0.6)", name: "Void" },
  stasis: { primary: "#4169E1", secondary: "#B0E0E6", glow: "rgba(65, 105, 225, 0.6)", name: "Stasis" },
  strand: { primary: "#32CD32", secondary: "#98FB98", glow: "rgba(50, 205, 50, 0.6)", name: "Strand" },
};

const FACTION_COLORS: Record<FactionType, { primary: string; secondary: string; icon: string; name: string }> = {
  vanguard: { primary: "#00CED1", secondary: "#20B2AA", icon: "🛡️", name: "Vanguard" },
  crucible: { primary: "#DC143C", secondary: "#FF6347", icon: "⚔️", name: "Crucible" },
  gambit: { primary: "#228B22", secondary: "#32CD32", icon: "🎲", name: "Gambit" },
  tower: { primary: "#FFD700", secondary: "#FFA500", icon: "🏰", name: "Tower" },
  darkness: { primary: "#2F4F4F", secondary: "#696969", icon: "👁️", name: "Darkness Zone" },
};

// Destiny character names for demo nodes
const GUARDIAN_NAMES = [
  "Commander Zavala", "Ikora Rey", "Cayde-6", "Saint-14", "Lord Shaxx",
  "The Drifter", "Eris Morn", "Ana Bray", "Osiris", "Crow",
  "Amanda Holliday", "Banshee-44", "Ada-1", "Hawthorne", "Devrim Kay"
];

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
  element: ElementType;
  faction: FactionType;
  lightLevel: number;
  isActive: boolean;
  pulsePhase: number;
}

interface TopologyEdge {
  from?: number;
  to?: number;
  source?: number;
  target?: number;
  element: ElementType;
  flowPhase: number;
}

// Traveler Icon SVG
const TravelerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="currentColor">
    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" fill="currentColor" opacity="0.8" />
    <circle cx="50" cy="50" r="15" fill="currentColor" />
  </svg>
);

// Legend Item
const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2 text-xs">
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-muted-foreground">{label}</span>
  </div>
);

// Loading skeleton
const TopologySkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <TravelerIcon className="h-16 w-16 text-primary animate-pulse mx-auto" />
      <p className="text-muted-foreground">Connecting to the Light Network...</p>
    </div>
  </div>
);

export default function Topology() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<TopologyNode[]>([]);
  const edgesRef = useRef<TopologyEdge[]>([]);
  const timeRef = useRef<number>(0);
  const initializedRef = useRef(false);
  
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showParticles, setShowParticles] = useState(true);
  const [nodeCount, setNodeCount] = useState(0);

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

  // Initialize canvas and nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || initializedRef.current) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;
    const elements: ElementType[] = ["solar", "arc", "void", "stasis", "strand"];
    const factions: FactionType[] = ["vanguard", "crucible", "gambit", "tower", "darkness"];

    // Create demo nodes if no real data
    if (!topologyData || !topologyData.nodes?.length) {
      const demoNodes: TopologyNode[] = [];
      const demoEdges: TopologyEdge[] = [];
      
      // Create central Traveler node
      demoNodes.push({
        id: 0,
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
        name: "THE TRAVELER",
        type: "server",
        ipaddr: "10.0.1.1",
        connections: 0,
        element: "arc",
        faction: "tower",
        lightLevel: 2000,
        isActive: true,
        pulsePhase: 0,
      });

      // Create Guardian nodes in orbital rings
      const nodeCount = 15;
      for (let i = 0; i < nodeCount; i++) {
        const ring = Math.floor(i / 5);
        const angleOffset = (i % 5) * (Math.PI * 2 / 5) + ring * 0.3;
        const radius = 120 + ring * 80;
        
        demoNodes.push({
          id: i + 1,
          x: width / 2 + Math.cos(angleOffset) * radius,
          y: height / 2 + Math.sin(angleOffset) * radius,
          vx: 0,
          vy: 0,
          name: GUARDIAN_NAMES[i] || `GUARDIAN-${i + 1}`,
          type: ["server", "client", "gateway", "firewall", "device"][i % 5],
          ipaddr: `10.0.${Math.floor(i / 5) + 1}.${(i % 255) + 1}`,
          connections: Math.floor(Math.random() * 5) + 1,
          element: elements[i % elements.length],
          faction: factions[Math.floor(i / 3) % factions.length],
          lightLevel: 1800 + Math.floor(Math.random() * 200),
          isActive: Math.random() > 0.1,
          pulsePhase: Math.random() * Math.PI * 2,
        });

        // Connect to Traveler
        demoEdges.push({
          from: 0,
          to: i + 1,
          element: elements[i % elements.length],
          flowPhase: Math.random() * Math.PI * 2,
        });

        // Some inter-node connections
        if (i > 0 && Math.random() > 0.6) {
          const targetId = Math.floor(Math.random() * i) + 1;
          demoEdges.push({
            from: i + 1,
            to: targetId,
            element: elements[Math.floor(Math.random() * elements.length)],
            flowPhase: Math.random() * Math.PI * 2,
          });
        }
      }

      nodesRef.current = demoNodes;
      edgesRef.current = demoEdges;
      setNodeCount(demoNodes.length);
    } else {
      // Use real data
      nodesRef.current = topologyData.nodes.map((n, i) => ({
        id: n.id,
        x: width / 2 + (Math.random() - 0.5) * 400,
        y: height / 2 + (Math.random() - 0.5) * 400,
        vx: 0,
        vy: 0,
        name: n.name || `GUARDIAN-${n.id}`,
        type: n.object_type || "device",
        ipaddr: n.ipaddr,
        connections: 0,
        element: elements[i % elements.length],
        faction: factions[Math.floor(i / 5) % factions.length],
        lightLevel: 1800 + Math.floor(Math.random() * 200),
        isActive: true,
        pulsePhase: Math.random() * Math.PI * 2,
      }));
      edgesRef.current = (topologyData.edges || []).map((e, i) => ({
        ...e,
        element: elements[i % elements.length],
        flowPhase: Math.random() * Math.PI * 2,
      }));
      setNodeCount(nodesRef.current.length);
    }

    initializedRef.current = true;
  }, [topologyData, authLoading, isAuthenticated]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      if (!canvas || !container || nodes.length === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      timeRef.current += 0.016;
      const time = timeRef.current;

      // Reset transform for this frame
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Clear canvas with dark background
      ctx.fillStyle = "oklch(0.15 0.02 240)";
      ctx.fillRect(0, 0, width, height);

      // Apply zoom and offset
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(zoom, zoom);

      // Draw starfield background
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      for (let i = 0; i < 100; i++) {
        const x = (i * 137.5) % width;
        const y = (i * 97.3) % height;
        const size = 0.5 + Math.sin(time + i) * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update physics
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === 0) continue; // Keep Traveler centered

        // Repulsion from other nodes
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          node.vx += (dx / dist) * force * 0.02;
          node.vy += (dy / dist) * force * 0.02;
        }

        // Attraction to center
        const centerDx = width / 2 - node.x;
        const centerDy = height / 2 - node.y;
        node.vx += centerDx * 0.00003;
        node.vy += centerDy * 0.00003;

        // Update position with damping
        node.vx *= 0.95;
        node.vy *= 0.95;
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(60, Math.min(width - 60, node.x));
        node.y = Math.max(60, Math.min(height - 60, node.y));
        node.pulsePhase += 0.02;
      }

      // Draw edges
      for (const edge of edges) {
        const sourceId = edge.from ?? edge.source;
        const targetId = edge.to ?? edge.target;
        const source = nodes.find(n => n.id === sourceId);
        const target = nodes.find(n => n.id === targetId);
        if (!source || !target) continue;

        const elementColor = ELEMENT_COLORS[edge.element];
        edge.flowPhase += 0.02;

        // Draw edge line
        ctx.strokeStyle = elementColor.primary;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Draw flowing particles along edge
        if (showParticles) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const particleCount = Math.floor(dist / 40);

          for (let p = 0; p < particleCount; p++) {
            const t = ((edge.flowPhase + p / particleCount) % 1);
            const px = source.x + dx * t;
            const py = source.y + dy * t;
            const size = 2 + Math.sin(t * Math.PI) * 1;

            ctx.fillStyle = elementColor.secondary;
            ctx.globalAlpha = 0.8 * Math.sin(t * Math.PI);
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const isTraveler = node.id === 0;
        const elementColor = ELEMENT_COLORS[node.element];
        const factionColor = FACTION_COLORS[node.faction];
        const radius = isTraveler ? 35 : 18;
        const pulse = Math.sin(node.pulsePhase) * 0.15 + 1;

        // Outer glow
        ctx.shadowColor = elementColor.glow;
        ctx.shadowBlur = isTraveler ? 30 : 15;

        // Pulse ring
        if (node.isActive) {
          ctx.strokeStyle = elementColor.primary;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.3 * (1 - (pulse - 0.85) / 0.3);
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius * pulse * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Main node
        if (isTraveler) {
          const travelerGradient = ctx.createRadialGradient(
            node.x, node.y, 0, 
            node.x, node.y, radius
          );
          travelerGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
          travelerGradient.addColorStop(0.5, "rgba(200, 220, 255, 0.9)");
          travelerGradient.addColorStop(1, "rgba(150, 180, 220, 0.7)");
          ctx.fillStyle = travelerGradient;
        } else {
          const nodeGradient = ctx.createRadialGradient(
            node.x - radius * 0.3, node.y - radius * 0.3, 0,
            node.x, node.y, radius
          );
          nodeGradient.addColorStop(0, elementColor.primary);
          nodeGradient.addColorStop(1, factionColor.secondary);
          ctx.fillStyle = nodeGradient;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(node.x - radius * 0.25, node.y - radius * 0.25, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Status indicator
        if (node.isActive && !isTraveler) {
          ctx.fillStyle = "#32CD32";
          ctx.beginPath();
          ctx.arc(node.x + radius * 0.7, node.y - radius * 0.7, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node label
        ctx.fillStyle = "white";
        ctx.font = isTraveler ? "bold 11px sans-serif" : "9px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(node.name, node.x, node.y + radius + 16);
        
        // Light level for non-Traveler nodes
        if (!isTraveler) {
          ctx.font = "8px sans-serif";
          ctx.fillStyle = elementColor.primary;
          ctx.fillText(`⚡${node.lightLevel}`, node.x, node.y + radius + 26);
        }
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // Draw title
      ctx.fillStyle = "white";
      ctx.font = "bold 14px sans-serif";
      ctx.shadowColor = "rgba(0, 200, 255, 0.5)";
      ctx.shadowBlur = 10;
      ctx.fillText("TRAVELER'S LIGHT NETWORK", 24, 34);
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#00CED1";
      ctx.fillText("Real-time Guardian Constellation Map", 24, 50);
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [zoom, offset, showParticles]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    const nodes = nodesRef.current;
    for (const node of nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = node.id === 0 ? 35 : 18;
      if (dist < radius) {
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
            <div className="flex items-center gap-2 text-primary">
              <TravelerIcon className="h-6 w-6" />
              <span className="font-bold tracking-wider text-sm">LIGHT NETWORK</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={showParticles ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setShowParticles(!showParticles)}
              title="Toggle particles"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
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
        <div ref={containerRef} className="flex-1 relative">
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 cursor-move"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
          />

          {/* Element Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
            <div className="text-xs font-medium mb-2 flex items-center gap-2">
              <Flame className="h-3 w-3 text-orange-400" />
              Light Elements
            </div>
            <div className="space-y-1">
              {Object.entries(ELEMENT_COLORS).map(([key, value]) => (
                <LegendItem key={key} color={value.primary} label={value.name} />
              ))}
            </div>
          </div>

          {/* Faction Legend */}
          <div className="absolute bottom-4 left-36 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
            <div className="text-xs font-medium mb-2 flex items-center gap-2">
              <Globe className="h-3 w-3 text-primary" />
              Factions
            </div>
            <div className="space-y-1">
              {Object.entries(FACTION_COLORS).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: value.primary }} />
                  <span className="text-muted-foreground">{value.icon} {value.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-80 border-l border-border bg-card/50 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <h2 className="font-bold text-lg">Traveler's Light Network</h2>
              </div>
              <p className="text-sm text-muted-foreground">Guardian Constellation Map</p>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Click on any Guardian node to view their Light signature and network details.</p>
              <p>Drag to navigate the constellation. Use zoom controls to adjust your view of the system.</p>
              <p>Light streams represent active paracausal connections between Guardians and the Traveler.</p>
            </div>

            {/* Network Summary */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Network Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Guardians</span>
                  <span className="text-primary font-medium">{nodeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Light Streams</span>
                  <span className="text-primary font-medium">{edgesRef.current.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Nodes</span>
                  <span className="text-primary font-medium">
                    {nodesRef.current.filter(n => n.isActive).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Node Info */}
            {selectedNode && (
              <div className="space-y-3 p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: ELEMENT_COLORS[selectedNode.element].primary }}
                  />
                  <h3 className="font-bold">{selectedNode.name}</h3>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Light Level</span>
                    <span className="text-yellow-400">⚡ {selectedNode.lightLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Element</span>
                    <span style={{ color: ELEMENT_COLORS[selectedNode.element].primary }}>
                      {ELEMENT_COLORS[selectedNode.element].name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Faction</span>
                    <span>{FACTION_COLORS[selectedNode.faction].icon} {FACTION_COLORS[selectedNode.faction].name}</span>
                  </div>
                  {selectedNode.ipaddr && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network ID</span>
                      <span className="font-mono text-xs">{selectedNode.ipaddr}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={selectedNode.isActive ? "text-green-400" : "text-red-400"}>
                      {selectedNode.isActive ? "● Online" : "○ Offline"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Controls</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Click node to select</li>
                <li>• Drag to pan view</li>
                <li>• Scroll or buttons to zoom</li>
                <li>• Toggle particles for performance</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
