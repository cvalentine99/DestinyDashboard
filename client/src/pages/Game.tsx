import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { 
  Gamepad2, 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Trophy,
  Zap,
  Heart,
  Star
} from "lucide-react";
import LoreChatbot from "@/components/LoreChatbot";

// Destiny Tricorn SVG Logo
const TricornLogo = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8" fill="currentColor">
    <path d="M50 5 L95 85 L50 65 L5 85 Z" />
    <path d="M50 25 L75 70 L50 55 L25 70 Z" opacity="0.6" />
  </svg>
);

// Engram types with colors
const ENGRAM_TYPES = [
  { type: "common", color: "#FFFFFF", points: 10, size: 20 },
  { type: "uncommon", color: "#4ADE80", points: 25, size: 22 },
  { type: "rare", color: "#60A5FA", points: 50, size: 24 },
  { type: "legendary", color: "#A855F7", points: 100, size: 26 },
  { type: "exotic", color: "#FBBF24", points: 250, size: 30 },
];

interface Engram {
  id: number;
  x: number;
  y: number;
  type: typeof ENGRAM_TYPES[number];
  vx: number;
  vy: number;
}

interface Guardian {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Game() {
  const { user, isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const engramsRef = useRef<Engram[]>([]);
  const guardianRef = useRef<Guardian>({ x: 0, y: 0, width: 50, height: 50 });
  
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const engramIdRef = useRef(0);
  const [combo, setCombo] = useState(0);

  // Fetch leaderboard
  const { data: leaderboard } = trpc.game.getLeaderboard.useQuery(
    { gameType: "engram-hunter", limit: 5 },
    { enabled: true }
  );

  // Fetch user's high score
  const { data: userHighScore } = trpc.game.getHighScore.useQuery(
    { gameType: "engram-hunter" },
    { enabled: isAuthenticated }
  );

  // Save score mutation
  const saveScoreMutation = trpc.game.saveScore.useMutation({
    onSuccess: () => {
      toast.success("Score saved to leaderboard!");
    },
  });

  useEffect(() => {
    if (userHighScore?.score) {
      setHighScore(userHighScore.score);
    }
  }, [userHighScore]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        guardianRef.current.x = canvas.width / 2 - 25;
        guardianRef.current.y = canvas.height - 80;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Mouse/touch movement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - guardianRef.current.width / 2;
      guardianRef.current.x = Math.max(0, Math.min(canvas.width - guardianRef.current.width, x));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState === "playing") {
        handleMove(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState === "playing" && e.touches[0]) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [gameState]);

  // Spawn engrams
  const spawnEngram = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Weighted random selection based on level
    const weights = [50, 30, 15, 4, 1].map((w, i) => w + (level > 3 && i > 2 ? level : 0));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let typeIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        typeIndex = i;
        break;
      }
    }

    const type = ENGRAM_TYPES[typeIndex];
    const engram: Engram = {
      id: Date.now() + Math.random(),
      x: Math.random() * (canvas.width - type.size),
      y: -type.size,
      type,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + level * 0.5 + Math.random() * 2,
    };

    engramsRef.current.push(engram);
  }, [level]);

  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = "oklch(0.12 0.02 250)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % canvas.width;
      const y = (i * 53 + Date.now() * 0.02) % canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw guardian (player)
    const guardian = guardianRef.current;
    ctx.fillStyle = "oklch(0.72 0.15 185)";
    ctx.beginPath();
    ctx.moveTo(guardian.x + guardian.width / 2, guardian.y);
    ctx.lineTo(guardian.x + guardian.width, guardian.y + guardian.height);
    ctx.lineTo(guardian.x, guardian.y + guardian.height);
    ctx.closePath();
    ctx.fill();

    // Draw glow effect
    ctx.shadowColor = "oklch(0.72 0.15 185)";
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Update and draw engrams
    const newEngrams: Engram[] = [];
    let livesLost = 0;
    let pointsGained = 0;
    let comboIncrement = 0;

    for (const engram of engramsRef.current) {
      engram.x += engram.vx;
      engram.y += engram.vy;

      // Bounce off walls
      if (engram.x <= 0 || engram.x >= canvas.width - engram.type.size) {
        engram.vx *= -1;
      }

      // Check collision with guardian
      const dx = engram.x + engram.type.size / 2 - (guardian.x + guardian.width / 2);
      const dy = engram.y + engram.type.size / 2 - (guardian.y + guardian.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < engram.type.size / 2 + guardian.width / 2) {
        // Collected!
        pointsGained += engram.type.points * (1 + combo * 0.1);
        comboIncrement++;
        continue;
      }

      // Check if fell off screen
      if (engram.y > canvas.height) {
        if (engram.type.type !== "common") {
          livesLost++;
        }
        continue;
      }

      // Draw engram
      ctx.fillStyle = engram.type.color;
      ctx.shadowColor = engram.type.color;
      ctx.shadowBlur = 15;
      
      // Diamond shape
      ctx.beginPath();
      const cx = engram.x + engram.type.size / 2;
      const cy = engram.y + engram.type.size / 2;
      const s = engram.type.size / 2;
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - s, cy);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      newEngrams.push(engram);
    }

    engramsRef.current = newEngrams;

    // Update state
    if (pointsGained > 0) {
      setScore(prev => prev + Math.floor(pointsGained));
      setCombo(prev => prev + comboIncrement);
    } else {
      setCombo(0);
    }

    if (livesLost > 0) {
      setLives(prev => {
        const newLives = prev - livesLost;
        if (newLives <= 0) {
          setGameState("gameover");
        }
        return Math.max(0, newLives);
      });
    }

    // Draw UI
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Orbitron, sans-serif";
    ctx.fillText(`SCORE: ${score}`, 20, 30);
    ctx.fillText(`LEVEL: ${level}`, 20, 55);
    
    if (combo > 1) {
      ctx.fillStyle = "oklch(0.75 0.15 70)";
      ctx.fillText(`COMBO x${combo}`, canvas.width - 120, 30);
    }

    // Draw lives
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = "oklch(0.55 0.22 25)";
      ctx.beginPath();
      ctx.arc(canvas.width - 30 - i * 25, 50, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [score, level, lives, combo, gameState]);

  // Start game loop
  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      
      // Spawn engrams periodically
      const spawnInterval = setInterval(() => {
        if (gameState === "playing") {
          spawnEngram();
        }
      }, Math.max(500, 1500 - level * 100));

      // Level up every 30 seconds
      const levelInterval = setInterval(() => {
        if (gameState === "playing") {
          setLevel(prev => prev + 1);
          toast.success(`Level ${level + 1}!`);
        }
      }, 30000);

      return () => {
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current);
        }
        clearInterval(spawnInterval);
        clearInterval(levelInterval);
      };
    }
  }, [gameState, gameLoop, spawnEngram, level]);

  // Handle game over
  useEffect(() => {
    if (gameState === "gameover") {
      if (score > highScore) {
        setHighScore(score);
        if (isAuthenticated) {
          saveScoreMutation.mutate({
            gameType: "engram-hunter",
            score,
            level,
          });
        }
      }
    }
  }, [gameState, score, highScore, level, isAuthenticated, saveScoreMutation]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    engramsRef.current = [];
    setGameState("playing");
  };

  const togglePause = () => {
    setGameState(prev => prev === "playing" ? "paused" : "playing");
  };

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
            <div className="flex items-center gap-2 text-secondary">
              <Gamepad2 className="h-6 w-6" />
              <span className="font-bold tracking-wider text-sm">ENGRAM HUNTER</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">High Score: </span>
              <span className="text-secondary font-bold">{highScore}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-14 h-screen flex">
        {/* Game Area */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 p-4">
            <div className="relative w-full h-full rounded-lg overflow-hidden border border-border bg-card">
              <canvas ref={canvasRef} className="w-full h-full" />
              
              {/* Overlay for idle/paused/gameover */}
              {gameState !== "playing" && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <Card className="destiny-card w-80">
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">
                        {gameState === "idle" && "ENGRAM HUNTER"}
                        {gameState === "paused" && "PAUSED"}
                        {gameState === "gameover" && "GAME OVER"}
                      </CardTitle>
                      <CardDescription>
                        {gameState === "idle" && "Collect engrams to score points!"}
                        {gameState === "gameover" && `Final Score: ${score}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {gameState === "gameover" && score > highScore && (
                        <div className="text-center text-secondary font-bold">
                          <Star className="h-6 w-6 inline mr-2" />
                          NEW HIGH SCORE!
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={startGame}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {gameState === "gameover" ? "Play Again" : "Start Game"}
                        </Button>
                        
                        {gameState === "paused" && (
                          <Button 
                            onClick={togglePause}
                            variant="outline"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                        )}
                      </div>

                      {/* Instructions */}
                      {gameState === "idle" && (
                        <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t border-border">
                          <p className="font-medium text-foreground">How to Play:</p>
                          <p>• Move your Guardian to collect falling engrams</p>
                          <p>• Don't let rare engrams fall off screen!</p>
                          <p>• Build combos for bonus points</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {ENGRAM_TYPES.map(type => (
                              <div key={type.type} className="flex items-center gap-1">
                                <div 
                                  className="w-3 h-3 rotate-45" 
                                  style={{ backgroundColor: type.color }}
                                />
                                <span>{type.points}pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Game controls */}
              {gameState === "playing" && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={togglePause}>
                    <Pause className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Leaderboard */}
        <div className="w-80 border-l border-border p-4 hidden lg:block">
          <Card className="destiny-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-secondary" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard?.map((entry, i) => (
                  <div 
                    key={i}
                    className={`flex items-center justify-between p-2 rounded ${
                      i === 0 ? "bg-secondary/20" : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        i === 0 ? "text-secondary" : "text-muted-foreground"
                      }`}>
                        #{i + 1}
                      </span>
                      <span className="text-sm truncate max-w-[120px]">
                        {entry.userName || "Guardian"}
                      </span>
                    </div>
                    <span className="font-bold">{entry.score}</span>
                  </div>
                ))}
                {(!leaderboard || leaderboard.length === 0) && (
                  <div className="text-center text-muted-foreground py-4">
                    No scores yet. Be the first!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="destiny-card mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Engram Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ENGRAM_TYPES.map(type => (
                  <div key={type.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rotate-45" 
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm capitalize">{type.type}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{type.points} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Lore Chatbot */}
      <LoreChatbot />
    </div>
  );
}
