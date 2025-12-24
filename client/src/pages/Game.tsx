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
  Trophy,
  Zap,
  Heart,
  Star,
  Shield,
  Crosshair,
  Flame,
  Skull
} from "lucide-react";
import LoreChatbot from "@/components/LoreChatbot";
import VirtualJoystick from "@/components/VirtualJoystick";
import LoadoutSelector from "@/components/LoadoutSelector";

// ============================================================================
// GAME CONSTANTS
// ============================================================================

// Guardian Classes
const GUARDIAN_CLASSES = {
  titan: {
    name: "Titan",
    color: "#FF6B35",
    ability: "Barricade",
    abilityDesc: "Deploy a protective shield",
    abilityCooldown: 8000,
    abilityDuration: 3000,
  },
  hunter: {
    name: "Hunter",
    color: "#7B68EE",
    ability: "Dodge",
    abilityDesc: "Quick dodge with i-frames",
    abilityCooldown: 6000,
    abilityDuration: 500,
  },
  warlock: {
    name: "Warlock",
    color: "#FFD700",
    ability: "Blink",
    abilityDesc: "Teleport a short distance",
    abilityCooldown: 5000,
    abilityDuration: 200,
  },
} as const;

type GuardianClass = keyof typeof GUARDIAN_CLASSES;

// Engram types with colors
const ENGRAM_TYPES = [
  { type: "common", color: "#FFFFFF", points: 10, size: 20 },
  { type: "uncommon", color: "#4ADE80", points: 25, size: 22 },
  { type: "rare", color: "#60A5FA", points: 50, size: 24 },
  { type: "legendary", color: "#A855F7", points: 100, size: 26 },
  { type: "exotic", color: "#FBBF24", points: 250, size: 30 },
];

// Weapon types
const WEAPONS = {
  autoRifle: {
    name: "Auto Rifle",
    color: "#4ADE80",
    fireRate: 100,
    damage: 10,
    projectileSpeed: 15,
    spread: 0.1,
  },
  handCannon: {
    name: "Hand Cannon",
    color: "#FBBF24",
    fireRate: 400,
    damage: 35,
    projectileSpeed: 20,
    spread: 0,
  },
  pulseRifle: {
    name: "Pulse Rifle",
    color: "#60A5FA",
    fireRate: 150,
    damage: 15,
    projectileSpeed: 18,
    burst: 3,
    spread: 0.05,
  },
  rocketLauncher: {
    name: "Rocket Launcher",
    color: "#FF6B35",
    fireRate: 1500,
    damage: 150,
    projectileSpeed: 8,
    explosive: true,
    explosionRadius: 60,
  },
} as const;

type WeaponType = keyof typeof WEAPONS;

// Enemy types
const ENEMY_TYPES = {
  // Fallen
  dreg: { name: "Dreg", faction: "fallen", health: 30, speed: 1.5, damage: 10, points: 50, size: 25, color: "#4A90A4", fireRate: 2000 },
  vandal: { name: "Vandal", faction: "fallen", health: 50, speed: 1.2, damage: 15, points: 100, size: 30, color: "#3D7A8C", fireRate: 1500 },
  captain: { name: "Captain", faction: "fallen", health: 100, speed: 1, damage: 25, points: 200, size: 40, color: "#2D5A6A", fireRate: 1000, shield: 50 },
  // Hive
  thrall: { name: "Thrall", faction: "hive", health: 20, speed: 2.5, damage: 15, points: 40, size: 22, color: "#5C4033", fireRate: 0, melee: true },
  acolyte: { name: "Acolyte", faction: "hive", health: 40, speed: 1, damage: 12, points: 80, size: 28, color: "#4A3728", fireRate: 1800 },
  knight: { name: "Knight", faction: "hive", health: 120, speed: 0.8, damage: 30, points: 250, size: 45, color: "#3D2D20", fireRate: 2000, shield: 30 },
  // Vex
  goblin: { name: "Goblin", faction: "vex", health: 35, speed: 1.3, damage: 12, points: 60, size: 26, color: "#C0C0C0", fireRate: 1600 },
  hobgoblin: { name: "Hobgoblin", faction: "vex", health: 45, speed: 0.9, damage: 20, points: 120, size: 30, color: "#A0A0A0", fireRate: 2500, sniper: true },
  minotaur: { name: "Minotaur", faction: "vex", health: 150, speed: 0.7, damage: 35, points: 300, size: 50, color: "#808080", fireRate: 1200, teleport: true },
} as const;

type EnemyType = keyof typeof ENEMY_TYPES;

// Boss types
const BOSS_TYPES = {
  ogre: { 
    name: "Phogoth the Untamed", 
    faction: "hive", 
    health: 1000, 
    speed: 0.5, 
    damage: 50, 
    points: 2000, 
    size: 100, 
    color: "#2D1F15",
    attacks: ["groundSlam", "eyeBlast"],
  },
  servitor: { 
    name: "Sepiks Prime", 
    faction: "fallen", 
    health: 800, 
    speed: 0.6, 
    damage: 40, 
    points: 1800, 
    size: 90, 
    color: "#1A3A4A",
    attacks: ["voidBlast", "teleport", "shieldDrones"],
  },
  hydra: { 
    name: "Argos, Planetary Core", 
    faction: "vex", 
    health: 1200, 
    speed: 0.4, 
    damage: 45, 
    points: 2500, 
    size: 110, 
    color: "#606060",
    attacks: ["rotatingShield", "voidCannon", "detainment"],
  },
} as const;

type BossType = keyof typeof BOSS_TYPES;

// Power-up types
const POWERUP_TYPES = {
  overshield: { name: "Overshield", color: "#60A5FA", duration: 10000, effect: "shield" },
  heavyAmmo: { name: "Heavy Ammo", color: "#A855F7", duration: 0, effect: "rocket" },
  superCharge: { name: "Super Charge", color: "#FBBF24", duration: 0, effect: "super" },
  healthPack: { name: "Health Pack", color: "#4ADE80", duration: 0, effect: "heal" },
} as const;

type PowerupType = keyof typeof POWERUP_TYPES;

// Level environments
const LEVELS = {
  cosmodrome: {
    name: "Cosmodrome",
    background: "oklch(0.15 0.02 220)",
    hazards: ["fallingDebris"],
    enemies: ["dreg", "vandal", "captain", "thrall", "acolyte"],
    boss: "servitor",
    music: "cosmodrome",
  },
  europa: {
    name: "Europa",
    background: "oklch(0.18 0.03 240)",
    hazards: ["blizzard", "icePatch"],
    enemies: ["goblin", "hobgoblin", "minotaur", "dreg", "vandal"],
    boss: "hydra",
    music: "europa",
  },
  dreamingCity: {
    name: "Dreaming City",
    background: "oklch(0.12 0.05 280)",
    hazards: ["takenBlight", "corruption"],
    enemies: ["thrall", "acolyte", "knight", "goblin", "hobgoblin"],
    boss: "ogre",
    music: "dreamingCity",
  },
} as const;

type LevelType = keyof typeof LEVELS;

// ============================================================================
// GAME INTERFACES
// ============================================================================

interface Vector2 {
  x: number;
  y: number;
}

interface Engram {
  id: number;
  x: number;
  y: number;
  type: typeof ENGRAM_TYPES[number];
  vx: number;
  vy: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  isEnemy: boolean;
  explosive?: boolean;
  explosionRadius?: number;
  size: number;
}

interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  shield?: number;
  maxShield?: number;
  lastFire: number;
  vx: number;
  vy: number;
  targetX?: number;
  targetY?: number;
}

interface Boss {
  id: number;
  type: BossType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  phase: number;
  lastAttack: number;
  currentAttack?: string;
  attackTimer: number;
  shieldAngle?: number;
}

interface Powerup {
  id: number;
  type: PowerupType;
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface Guardian {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  shield: number;
  superMeter: number;
  class: GuardianClass;
  weapon: WeaponType;
  abilityActive: boolean;
  abilityCooldown: number;
  invincible: boolean;
  invincibleTimer: number;
  heavyAmmo: number;
}

interface GameState {
  state: "idle" | "classSelect" | "playing" | "paused" | "gameover" | "victory";
  score: number;
  lives: number;
  level: number;
  wave: number;
  combo: number;
  currentLevel: LevelType;
  bossActive: boolean;
}

// ============================================================================
// GAME COMPONENT
// ============================================================================

export default function Game() {
  const { user, isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastFireRef = useRef<number>(0);
  const mouseDownRef = useRef<boolean>(false);
  
  // Game entity refs
  const engramsRef = useRef<Engram[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const bossRef = useRef<Boss | null>(null);
  const guardianRef = useRef<Guardian>({
    x: 0, y: 0, width: 50, height: 50,
    health: 100, maxHealth: 100, shield: 0,
    superMeter: 0, class: "hunter", weapon: "autoRifle",
    abilityActive: false, abilityCooldown: 0,
    invincible: false, invincibleTimer: 0, heavyAmmo: 0,
  });
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    state: "idle",
    score: 0,
    lives: 3,
    level: 1,
    wave: 1,
    combo: 0,
    currentLevel: "cosmodrome",
    bossActive: false,
  });
  
  const [selectedClass, setSelectedClass] = useState<GuardianClass>("hunter");
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>("autoRifle");
  const [highScore, setHighScore] = useState(0);
  const idCounterRef = useRef(0);
  
  // Touch control state
  const touchMoveRef = useRef({ dx: 0, dy: 0 });
  const touchFiringRef = useRef(false);
  
  // Game stats tracking for achievements
  const gameStatsRef = useRef({
    dregKills: 0, vandalKills: 0, captainKills: 0,
    thrallKills: 0, acolyteKills: 0, knightKills: 0,
    goblinKills: 0, hobgoblinKills: 0, minotaurKills: 0,
    ogreKills: 0, servitorKills: 0, hydraKills: 0,
    flawlessOgre: 0, flawlessServitor: 0, flawlessHydra: 0,
    autoRifleKills: 0, handCannonKills: 0, pulseRifleKills: 0, rocketLauncherKills: 0,
    commonEngrams: 0, uncommonEngrams: 0, rareEngrams: 0, legendaryEngrams: 0, exoticEngrams: 0,
    abilitiesUsed: 0, supersUsed: 0,
    clearedCosmodrome: false, clearedEuropa: false, clearedDreamingCity: false,
    bossHealthAtStart: 0, // For tracking flawless boss kills
  });

  // tRPC queries
  const { data: leaderboard } = trpc.game.getLeaderboard.useQuery(
    { gameType: "engram-hunter-combat", limit: 10 },
    { enabled: true }
  );

  const { data: userHighScore } = trpc.game.getHighScore.useQuery(
    { gameType: "engram-hunter-combat" },
    { enabled: isAuthenticated }
  );

  const saveScoreMutation = trpc.game.saveScore.useMutation({
    onSuccess: () => toast.success("Score saved to leaderboard!"),
  });

  useEffect(() => {
    if (userHighScore?.score) setHighScore(userHighScore.score);
  }, [userHighScore]);

  // ============================================================================
  // CANVAS SETUP
  // ============================================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        guardianRef.current.x = canvas.width / 2 - 25;
        guardianRef.current.y = canvas.height - 100;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // ============================================================================
  // INPUT HANDLING
  // ============================================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - guardianRef.current.width / 2;
      guardianRef.current.x = Math.max(0, Math.min(canvas.width - guardianRef.current.width, x));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState.state === "playing") handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState.state === "playing" && e.touches[0]) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    };

    const handleMouseDown = () => { mouseDownRef.current = true; };
    const handleMouseUp = () => { mouseDownRef.current = false; };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.state !== "playing") return;
      
      // Ability activation
      if (e.code === "Space" || e.code === "ShiftLeft") {
        activateAbility();
      }
      // Super activation
      if (e.code === "KeyQ" && guardianRef.current.superMeter >= 100) {
        activateSuper();
      }
      // Weapon switch
      if (e.code === "Digit1") guardianRef.current.weapon = "autoRifle";
      if (e.code === "Digit2") guardianRef.current.weapon = "handCannon";
      if (e.code === "Digit3") guardianRef.current.weapon = "pulseRifle";
      if (e.code === "Digit4" && guardianRef.current.heavyAmmo > 0) guardianRef.current.weapon = "rocketLauncher";
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleMouseDown);
    canvas.addEventListener("touchend", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleMouseDown);
      canvas.removeEventListener("touchend", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState.state]);

  // ============================================================================
  // ABILITY SYSTEM
  // ============================================================================

  const activateAbility = useCallback(() => {
    const guardian = guardianRef.current;
    if (guardian.abilityCooldown > 0 || guardian.abilityActive) return;

    const classData = GUARDIAN_CLASSES[guardian.class];
    guardian.abilityActive = true;
    guardian.abilityCooldown = classData.abilityCooldown;
    
    // Track ability usage for achievements
    gameStatsRef.current.abilitiesUsed++;

    if (guardian.class === "hunter") {
      // Dodge - brief invincibility
      guardian.invincible = true;
      guardian.invincibleTimer = classData.abilityDuration;
      // Quick dash
      guardian.x += 100 * (Math.random() > 0.5 ? 1 : -1);
    } else if (guardian.class === "titan") {
      // Barricade - shield boost
      guardian.shield = 100;
    } else if (guardian.class === "warlock") {
      // Blink - teleport
      const canvas = canvasRef.current;
      if (canvas) {
        guardian.y = Math.max(100, guardian.y - 150);
        guardian.invincible = true;
        guardian.invincibleTimer = classData.abilityDuration;
      }
    }

    setTimeout(() => {
      guardian.abilityActive = false;
      if (guardian.class === "titan") {
        // Shield persists
      }
    }, classData.abilityDuration);
  }, []);

  const activateSuper = useCallback(() => {
    const guardian = guardianRef.current;
    if (guardian.superMeter < 100) return;

    guardian.superMeter = 0;
    
    // Track super usage for achievements
    gameStatsRef.current.supersUsed++;
    
    // Super attack - damage all enemies on screen
    const enemies = enemiesRef.current;
    const boss = bossRef.current;
    
    for (const enemy of enemies) {
      enemy.health -= 200;
      spawnParticles(enemy.x, enemy.y, GUARDIAN_CLASSES[guardian.class].color, 20);
    }
    
    if (boss) {
      boss.health -= 300;
      spawnParticles(boss.x, boss.y, GUARDIAN_CLASSES[guardian.class].color, 50);
    }

    toast.success("SUPER ACTIVATED!");
  }, []);

  // ============================================================================
  // PARTICLE SYSTEM
  // ============================================================================

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        id: idCounterRef.current++,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 4,
      });
    }
  }, []);

  // ============================================================================
  // SPAWNING SYSTEMS
  // ============================================================================

  const spawnEngram = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const weights = [50, 30, 15, 4, 1].map((w, i) => w + (gameState.level > 3 && i > 2 ? gameState.level : 0));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let typeIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) { typeIndex = i; break; }
    }

    const type = ENGRAM_TYPES[typeIndex];
    engramsRef.current.push({
      id: idCounterRef.current++,
      x: Math.random() * (canvas.width - type.size),
      y: -type.size,
      type,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + gameState.level * 0.3 + Math.random() * 2,
    });
  }, [gameState.level]);

  const spawnEnemy = useCallback((type?: EnemyType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const levelData = LEVELS[gameState.currentLevel];
    const availableEnemies = levelData.enemies as readonly EnemyType[];
    const enemyType = type || availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
    const enemyData = ENEMY_TYPES[enemyType];

    enemiesRef.current.push({
      id: idCounterRef.current++,
      type: enemyType,
      x: Math.random() * (canvas.width - enemyData.size),
      y: -enemyData.size,
      health: enemyData.health * (1 + gameState.level * 0.1),
      maxHealth: enemyData.health * (1 + gameState.level * 0.1),
      shield: (enemyData as any).shield,
      maxShield: (enemyData as any).shield,
      lastFire: 0,
      vx: (Math.random() - 0.5) * enemyData.speed,
      vy: enemyData.speed,
    });
  }, [gameState.currentLevel, gameState.level]);

  const spawnBoss = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const levelData = LEVELS[gameState.currentLevel];
    const bossType = levelData.boss;
    const bossData = BOSS_TYPES[bossType];

    bossRef.current = {
      id: idCounterRef.current++,
      type: bossType,
      x: canvas.width / 2 - bossData.size / 2,
      y: 50,
      health: bossData.health * (1 + gameState.level * 0.2),
      maxHealth: bossData.health * (1 + gameState.level * 0.2),
      phase: 1,
      lastAttack: 0,
      attackTimer: 0,
      shieldAngle: 0,
    };

    setGameState(prev => ({ ...prev, bossActive: true }));
    toast.warning(`BOSS: ${bossData.name} has appeared!`);
  }, [gameState.currentLevel, gameState.level]);

  const spawnPowerup = useCallback((type?: PowerupType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const types = Object.keys(POWERUP_TYPES) as PowerupType[];
    const powerupType = type || types[Math.floor(Math.random() * types.length)];

    powerupsRef.current.push({
      id: idCounterRef.current++,
      type: powerupType,
      x: Math.random() * (canvas.width - 30),
      y: -30,
      vy: 2,
    });
  }, []);

  // ============================================================================
  // COMBAT SYSTEM
  // ============================================================================

  const fireWeapon = useCallback(() => {
    const guardian = guardianRef.current;
    const now = Date.now();
    const weapon = WEAPONS[guardian.weapon];

    if (now - lastFireRef.current < weapon.fireRate) return;
    
    // Check heavy ammo for rocket launcher
    if (guardian.weapon === "rocketLauncher") {
      if (guardian.heavyAmmo <= 0) {
        guardian.weapon = "autoRifle";
        return;
      }
      guardian.heavyAmmo--;
    }

    lastFireRef.current = now;

    const createProjectile = (offsetX: number = 0, offsetY: number = 0) => {
      const spread = (Math.random() - 0.5) * ((weapon as any).spread || 0);
      projectilesRef.current.push({
        id: idCounterRef.current++,
        x: guardian.x + guardian.width / 2 + offsetX,
        y: guardian.y + offsetY,
        vx: spread * 10,
        vy: -weapon.projectileSpeed,
        damage: weapon.damage,
        color: weapon.color,
        isEnemy: false,
        explosive: (weapon as any).explosive,
        explosionRadius: (weapon as any).explosionRadius,
        size: guardian.weapon === "rocketLauncher" ? 8 : 4,
      });
    };

    if (guardian.weapon === "pulseRifle") {
      // Burst fire
      createProjectile(0, 0);
      setTimeout(() => createProjectile(0, 5), 50);
      setTimeout(() => createProjectile(0, 10), 100);
    } else {
      createProjectile();
    }
  }, []);

  const enemyFire = useCallback((enemy: Enemy) => {
    const guardian = guardianRef.current;
    const enemyData = ENEMY_TYPES[enemy.type];
    
    if ((enemyData as any).melee) return; // Melee enemies don't shoot

    const dx = guardian.x + guardian.width / 2 - enemy.x;
    const dy = guardian.y + guardian.height / 2 - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = (enemyData as any).sniper ? 12 : 6;

    projectilesRef.current.push({
      id: idCounterRef.current++,
      x: enemy.x + ENEMY_TYPES[enemy.type].size / 2,
      y: enemy.y + ENEMY_TYPES[enemy.type].size,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      damage: enemyData.damage,
      color: enemyData.faction === "fallen" ? "#4A90A4" : 
             enemyData.faction === "hive" ? "#5C4033" : "#C0C0C0",
      isEnemy: true,
      size: 5,
    });
  }, []);

  const bossAttack = useCallback((boss: Boss) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bossData = BOSS_TYPES[boss.type];
    const attacks = bossData.attacks;
    const attack = attacks[Math.floor(Math.random() * attacks.length)];

    boss.currentAttack = attack;
    boss.attackTimer = 2000;

    if (attack === "groundSlam") {
      // Area damage
      const guardian = guardianRef.current;
      const dist = Math.abs(guardian.x - boss.x);
      if (dist < 200) {
        takeDamage(bossData.damage);
      }
      spawnParticles(boss.x + bossData.size / 2, boss.y + bossData.size, "#5C4033", 30);
    } else if (attack === "eyeBlast" || attack === "voidBlast" || attack === "voidCannon") {
      // Projectile barrage
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const guardian = guardianRef.current;
          const dx = guardian.x - boss.x;
          const dy = guardian.y - boss.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          projectilesRef.current.push({
            id: idCounterRef.current++,
            x: boss.x + bossData.size / 2,
            y: boss.y + bossData.size,
            vx: (dx / dist) * 8,
            vy: (dy / dist) * 8,
            damage: bossData.damage / 2,
            color: boss.type === "ogre" ? "#8B0000" : 
                   boss.type === "servitor" ? "#4B0082" : "#800080",
            isEnemy: true,
            size: 10,
          });
        }, i * 200);
      }
    } else if (attack === "rotatingShield") {
      boss.shieldAngle = (boss.shieldAngle || 0) + Math.PI / 4;
    }
  }, []);

  const takeDamage = useCallback((damage: number) => {
    const guardian = guardianRef.current;
    
    if (guardian.invincible) return;
    
    // Shield absorbs damage first
    if (guardian.shield > 0) {
      const shieldDamage = Math.min(guardian.shield, damage);
      guardian.shield -= shieldDamage;
      damage -= shieldDamage;
    }
    
    if (damage > 0) {
      guardian.health -= damage;
      guardian.invincible = true;
      guardian.invincibleTimer = 1000;
      
      spawnParticles(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2, "#FF0000", 10);
      
      if (guardian.health <= 0) {
        setGameState(prev => {
          const newLives = prev.lives - 1;
          if (newLives <= 0) {
            return { ...prev, lives: 0, state: "gameover" };
          }
          guardian.health = guardian.maxHealth;
          return { ...prev, lives: newLives };
        });
      }
    }
  }, []);

  // ============================================================================
  // GAME LOOP
  // ============================================================================

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const guardian = guardianRef.current;
    const levelData = LEVELS[gameState.currentLevel];

    // Update cooldowns
    if (guardian.abilityCooldown > 0) guardian.abilityCooldown -= deltaTime;
    if (guardian.invincibleTimer > 0) {
      guardian.invincibleTimer -= deltaTime;
      if (guardian.invincibleTimer <= 0) guardian.invincible = false;
    }

    // Handle touch movement from virtual joystick
    const touchMove = touchMoveRef.current;
    if (touchMove.dx !== 0 || touchMove.dy !== 0) {
      const moveSpeed = 8;
      guardian.x += touchMove.dx * moveSpeed;
      guardian.y += touchMove.dy * moveSpeed;
      // Clamp to canvas bounds
      guardian.x = Math.max(0, Math.min(canvas.width - guardian.width, guardian.x));
      guardian.y = Math.max(100, Math.min(canvas.height - guardian.height - 20, guardian.y));
    }

    // Auto-fire when mouse is down or touch firing
    if (mouseDownRef.current || touchFiringRef.current) fireWeapon();

    // Clear and draw background
    ctx.fillStyle = levelData.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background stars/particles
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < 100; i++) {
      const x = (i * 37 + timestamp * 0.01) % canvas.width;
      const y = (i * 53 + timestamp * 0.02) % canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ========== UPDATE & DRAW ENTITIES ==========

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime / 1000;
      
      if (p.life <= 0) return false;
      
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      
      return true;
    });

    // Update and draw engrams
    let pointsGained = 0;
    let comboIncrement = 0;

    engramsRef.current = engramsRef.current.filter(engram => {
      engram.x += engram.vx;
      engram.y += engram.vy;

      if (engram.x <= 0 || engram.x >= canvas.width - engram.type.size) engram.vx *= -1;

      // Collision with guardian
      const dx = engram.x + engram.type.size / 2 - (guardian.x + guardian.width / 2);
      const dy = engram.y + engram.type.size / 2 - (guardian.y + guardian.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < engram.type.size / 2 + guardian.width / 2) {
        pointsGained += engram.type.points * (1 + gameState.combo * 0.1);
        comboIncrement++;
        spawnParticles(engram.x, engram.y, engram.type.color, 8);
        
        // Track engram for achievements
        const stats = gameStatsRef.current;
        switch (engram.type.type) {
          case 'common': stats.commonEngrams++; break;
          case 'uncommon': stats.uncommonEngrams++; break;
          case 'rare': stats.rareEngrams++; break;
          case 'legendary': stats.legendaryEngrams++; break;
          case 'exotic': stats.exoticEngrams++; break;
        }
        
        return false;
      }

      if (engram.y > canvas.height) return false;

      // Draw engram
      ctx.fillStyle = engram.type.color;
      ctx.shadowColor = engram.type.color;
      ctx.shadowBlur = 15;
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

      return true;
    });

    // Update and draw enemies
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      const enemyData = ENEMY_TYPES[enemy.type];
      
      // Movement
      enemy.y += enemy.vy;
      enemy.x += enemy.vx;
      
      // Bounce off walls
      if (enemy.x <= 0 || enemy.x >= canvas.width - enemyData.size) enemy.vx *= -1;
      
      // Enemy AI - move toward player for melee
      if ((enemyData as any).melee) {
        const dx = guardian.x - enemy.x;
        enemy.vx = Math.sign(dx) * enemyData.speed * 2;
        
        // Melee attack
        const dist = Math.sqrt(
          Math.pow(enemy.x - guardian.x, 2) + 
          Math.pow(enemy.y - guardian.y, 2)
        );
        if (dist < enemyData.size + guardian.width / 2) {
          takeDamage(enemyData.damage);
          enemy.health = 0;
        }
      } else {
        // Ranged attack
        const now = Date.now();
        if (now - enemy.lastFire > enemyData.fireRate && enemy.y > 50) {
          enemy.lastFire = now;
          enemyFire(enemy);
        }
      }
      
      // Check if dead
      if (enemy.health <= 0) {
        pointsGained += enemyData.points;
        guardian.superMeter = Math.min(100, guardian.superMeter + 5);
        spawnParticles(enemy.x + enemyData.size / 2, enemy.y + enemyData.size / 2, enemyData.color, 15);
        
        // Track kill for achievements
        const stats = gameStatsRef.current;
        switch (enemy.type) {
          case 'dreg': stats.dregKills++; break;
          case 'vandal': stats.vandalKills++; break;
          case 'captain': stats.captainKills++; break;
          case 'thrall': stats.thrallKills++; break;
          case 'acolyte': stats.acolyteKills++; break;
          case 'knight': stats.knightKills++; break;
          case 'goblin': stats.goblinKills++; break;
          case 'hobgoblin': stats.hobgoblinKills++; break;
          case 'minotaur': stats.minotaurKills++; break;
        }
        
        // Chance to drop powerup
        if (Math.random() < 0.1) spawnPowerup();
        
        return false;
      }
      
      // Off screen
      if (enemy.y > canvas.height + 50) return false;

      // Draw enemy
      ctx.fillStyle = enemyData.color;
      ctx.shadowColor = enemyData.color;
      ctx.shadowBlur = 10;
      
      // Different shapes for different factions
      if (enemyData.faction === "fallen") {
        // Triangle shape
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemyData.size / 2, enemy.y);
        ctx.lineTo(enemy.x + enemyData.size, enemy.y + enemyData.size);
        ctx.lineTo(enemy.x, enemy.y + enemyData.size);
        ctx.closePath();
        ctx.fill();
      } else if (enemyData.faction === "hive") {
        // Jagged shape
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemyData.size / 2, enemy.y);
        ctx.lineTo(enemy.x + enemyData.size, enemy.y + enemyData.size * 0.4);
        ctx.lineTo(enemy.x + enemyData.size * 0.8, enemy.y + enemyData.size);
        ctx.lineTo(enemy.x + enemyData.size * 0.2, enemy.y + enemyData.size);
        ctx.lineTo(enemy.x, enemy.y + enemyData.size * 0.4);
        ctx.closePath();
        ctx.fill();
      } else {
        // Vex - geometric
        ctx.fillRect(enemy.x, enemy.y, enemyData.size, enemyData.size);
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(enemy.x + enemyData.size / 2, enemy.y + enemyData.size * 0.3, enemyData.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Health bar
      if (enemy.health < enemy.maxHealth) {
        ctx.fillStyle = "#333";
        ctx.fillRect(enemy.x, enemy.y - 8, enemyData.size, 4);
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(enemy.x, enemy.y - 8, enemyData.size * (enemy.health / enemy.maxHealth), 4);
      }

      return true;
    });

    // Update and draw boss
    const boss = bossRef.current;
    if (boss) {
      const bossData = BOSS_TYPES[boss.type];
      
      // Boss movement
      boss.x += Math.sin(timestamp * 0.001) * 2;
      
      // Boss attacks
      const now = Date.now();
      if (now - boss.lastAttack > 3000) {
        boss.lastAttack = now;
        bossAttack(boss);
      }
      
      // Check if dead
      if (boss.health <= 0) {
        pointsGained += bossData.points;
        spawnParticles(boss.x + bossData.size / 2, boss.y + bossData.size / 2, bossData.color, 100);
        toast.success(`BOSS DEFEATED: ${bossData.name}!`);
        
        // Track boss kill for achievements
        const stats = gameStatsRef.current;
        const guardian = guardianRef.current;
        switch (boss.type) {
          case 'ogre': 
            stats.ogreKills++; 
            if (guardian.health === guardian.maxHealth) stats.flawlessOgre++;
            break;
          case 'servitor': 
            stats.servitorKills++; 
            if (guardian.health === guardian.maxHealth) stats.flawlessServitor++;
            break;
          case 'hydra': 
            stats.hydraKills++; 
            if (guardian.health === guardian.maxHealth) stats.flawlessHydra++;
            break;
        }
        bossRef.current = null;
        setGameState(prev => ({ 
          ...prev, 
          bossActive: false,
          wave: prev.wave + 1,
        }));
        
        // Progress to next level
        if (gameState.wave >= 5) {
          const levels = Object.keys(LEVELS) as LevelType[];
          const currentIndex = levels.indexOf(gameState.currentLevel);
          
          // Track level completion for achievements
          const stats = gameStatsRef.current;
          switch (gameState.currentLevel) {
            case 'cosmodrome': stats.clearedCosmodrome = true; break;
            case 'europa': stats.clearedEuropa = true; break;
            case 'dreamingCity': stats.clearedDreamingCity = true; break;
          }
          
          if (currentIndex < levels.length - 1) {
            setGameState(prev => ({
              ...prev,
              currentLevel: levels[currentIndex + 1],
              level: prev.level + 1,
              wave: 1,
            }));
            toast.success(`LEVEL UP: ${LEVELS[levels[currentIndex + 1]].name}!`);
          } else {
            setGameState(prev => ({ ...prev, state: "victory" }));
          }
        }
      } else {
        // Draw boss
        ctx.fillStyle = bossData.color;
        ctx.shadowColor = bossData.color;
        ctx.shadowBlur = 20;
        
        if (boss.type === "ogre") {
          // Large hulking shape
          ctx.beginPath();
          ctx.ellipse(boss.x + bossData.size / 2, boss.y + bossData.size / 2, 
                      bossData.size / 2, bossData.size / 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          // Eye
          ctx.fillStyle = "#8B0000";
          ctx.beginPath();
          ctx.arc(boss.x + bossData.size / 2, boss.y + bossData.size * 0.3, 15, 0, Math.PI * 2);
          ctx.fill();
        } else if (boss.type === "servitor") {
          // Spherical
          ctx.beginPath();
          ctx.arc(boss.x + bossData.size / 2, boss.y + bossData.size / 2, bossData.size / 2, 0, Math.PI * 2);
          ctx.fill();
          // Eye
          ctx.fillStyle = "#4B0082";
          ctx.beginPath();
          ctx.arc(boss.x + bossData.size / 2, boss.y + bossData.size / 2, 20, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Hydra - with rotating shields
          ctx.fillRect(boss.x, boss.y, bossData.size, bossData.size * 0.8);
          // Rotating shield segments
          if (boss.shieldAngle !== undefined) {
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 5;
            for (let i = 0; i < 3; i++) {
              const angle = boss.shieldAngle + (i * Math.PI * 2 / 3);
              ctx.beginPath();
              ctx.arc(boss.x + bossData.size / 2, boss.y + bossData.size / 2, 
                      bossData.size / 2 + 20, angle - 0.5, angle + 0.5);
              ctx.stroke();
            }
          }
        }
        ctx.shadowBlur = 0;

        // Boss health bar
        ctx.fillStyle = "#333";
        ctx.fillRect(canvas.width / 2 - 150, 20, 300, 20);
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(canvas.width / 2 - 150, 20, 300 * (boss.health / boss.maxHealth), 20);
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 12px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText(bossData.name, canvas.width / 2, 35);
        ctx.textAlign = "left";
      }
    }

    // Update and draw projectiles
    projectilesRef.current = projectilesRef.current.filter(proj => {
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Off screen
      if (proj.y < -10 || proj.y > canvas.height + 10 || 
          proj.x < -10 || proj.x > canvas.width + 10) return false;

      // Collision detection
      if (proj.isEnemy) {
        // Enemy projectile hitting guardian
        const dx = proj.x - (guardian.x + guardian.width / 2);
        const dy = proj.y - (guardian.y + guardian.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < guardian.width / 2 + proj.size) {
          takeDamage(proj.damage);
          spawnParticles(proj.x, proj.y, proj.color, 5);
          return false;
        }
      } else {
        // Player projectile hitting enemies
        for (const enemy of enemiesRef.current) {
          const enemyData = ENEMY_TYPES[enemy.type];
          const dx = proj.x - (enemy.x + enemyData.size / 2);
          const dy = proj.y - (enemy.y + enemyData.size / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < enemyData.size / 2 + proj.size) {
            if (proj.explosive && proj.explosionRadius) {
              // Explosive damage to all nearby
              for (const e of enemiesRef.current) {
                const ed = ENEMY_TYPES[e.type];
                const edx = proj.x - (e.x + ed.size / 2);
                const edy = proj.y - (e.y + ed.size / 2);
                const edist = Math.sqrt(edx * edx + edy * edy);
                if (edist < proj.explosionRadius) {
                  e.health -= proj.damage * (1 - edist / proj.explosionRadius);
                }
              }
              spawnParticles(proj.x, proj.y, "#FF6B35", 30);
            } else {
              enemy.health -= proj.damage;
              spawnParticles(proj.x, proj.y, proj.color, 5);
            }
            return false;
          }
        }
        
        // Player projectile hitting boss
        if (boss) {
          const bossData = BOSS_TYPES[boss.type];
          const dx = proj.x - (boss.x + bossData.size / 2);
          const dy = proj.y - (boss.y + bossData.size / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bossData.size / 2 + proj.size) {
            boss.health -= proj.damage;
            spawnParticles(proj.x, proj.y, proj.color, 5);
            return false;
          }
        }
      }

      // Draw projectile
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      return true;
    });

    // Update and draw powerups
    powerupsRef.current = powerupsRef.current.filter(powerup => {
      powerup.y += powerup.vy;

      if (powerup.y > canvas.height) return false;

      // Collision with guardian
      const dx = powerup.x + 15 - (guardian.x + guardian.width / 2);
      const dy = powerup.y + 15 - (guardian.y + guardian.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30) {
        const powerupData = POWERUP_TYPES[powerup.type];
        
        if (powerup.type === "overshield") {
          guardian.shield = 50;
        } else if (powerup.type === "heavyAmmo") {
          guardian.heavyAmmo += 3;
          toast.success("Heavy Ammo acquired!");
        } else if (powerup.type === "superCharge") {
          guardian.superMeter = Math.min(100, guardian.superMeter + 50);
        } else if (powerup.type === "healthPack") {
          guardian.health = Math.min(guardian.maxHealth, guardian.health + 30);
        }
        
        spawnParticles(powerup.x, powerup.y, powerupData.color, 10);
        return false;
      }

      // Draw powerup
      const powerupData = POWERUP_TYPES[powerup.type];
      ctx.fillStyle = powerupData.color;
      ctx.shadowColor = powerupData.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(powerup.x + 15, powerup.y + 15, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Icon
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        powerup.type === "overshield" ? "S" :
        powerup.type === "heavyAmmo" ? "H" :
        powerup.type === "superCharge" ? "⚡" : "+",
        powerup.x + 15, powerup.y + 20
      );
      ctx.textAlign = "left";

      return true;
    });

    // Draw guardian
    const classData = GUARDIAN_CLASSES[guardian.class];
    
    // Invincibility flash
    if (!guardian.invincible || Math.floor(timestamp / 100) % 2 === 0) {
      ctx.fillStyle = classData.color;
      ctx.shadowColor = classData.color;
      ctx.shadowBlur = 20;
      
      // Ship shape
      ctx.beginPath();
      ctx.moveTo(guardian.x + guardian.width / 2, guardian.y);
      ctx.lineTo(guardian.x + guardian.width, guardian.y + guardian.height);
      ctx.lineTo(guardian.x + guardian.width / 2, guardian.y + guardian.height * 0.7);
      ctx.lineTo(guardian.x, guardian.y + guardian.height);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Shield visual
    if (guardian.shield > 0) {
      ctx.strokeStyle = "rgba(96, 165, 250, 0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2, 
              guardian.width * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ability active visual
    if (guardian.abilityActive && guardian.class === "titan") {
      ctx.fillStyle = "rgba(255, 107, 53, 0.3)";
      ctx.fillRect(guardian.x - 20, guardian.y - 30, guardian.width + 40, 20);
    }

    // ========== DRAW UI ==========

    // Score and level
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 18px Orbitron";
    ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);
    ctx.fillText(`WAVE: ${gameState.wave}`, 20, 55);
    ctx.fillText(`LEVEL: ${LEVELS[gameState.currentLevel].name}`, 20, 80);

    // Combo
    if (gameState.combo > 1) {
      ctx.fillStyle = "#FBBF24";
      ctx.fillText(`COMBO x${gameState.combo}`, canvas.width - 150, 30);
    }

    // Health bar
    ctx.fillStyle = "#333";
    ctx.fillRect(20, canvas.height - 40, 200, 15);
    ctx.fillStyle = "#4ADE80";
    ctx.fillRect(20, canvas.height - 40, 200 * (guardian.health / guardian.maxHealth), 15);
    if (guardian.shield > 0) {
      ctx.fillStyle = "#60A5FA";
      ctx.fillRect(20, canvas.height - 40, 200 * (guardian.shield / 100), 15);
    }

    // Super meter
    ctx.fillStyle = "#333";
    ctx.fillRect(20, canvas.height - 60, 200, 10);
    ctx.fillStyle = "#FBBF24";
    ctx.fillRect(20, canvas.height - 60, 200 * (guardian.superMeter / 100), 10);
    if (guardian.superMeter >= 100) {
      ctx.fillStyle = "#FBBF24";
      ctx.font = "bold 12px Orbitron";
      ctx.fillText("SUPER READY [Q]", 20, canvas.height - 70);
    }

    // Ability cooldown
    const abilityCooldownPercent = Math.max(0, guardian.abilityCooldown / classData.abilityCooldown);
    ctx.fillStyle = "#333";
    ctx.fillRect(230, canvas.height - 40, 80, 15);
    ctx.fillStyle = abilityCooldownPercent > 0 ? "#666" : classData.color;
    ctx.fillRect(230, canvas.height - 40, 80 * (1 - abilityCooldownPercent), 15);
    ctx.fillStyle = "#FFF";
    ctx.font = "10px Orbitron";
    ctx.fillText(classData.ability + " [SPACE]", 235, canvas.height - 30);

    // Weapon indicator
    ctx.fillStyle = WEAPONS[guardian.weapon].color;
    ctx.font = "bold 12px Orbitron";
    ctx.fillText(`WEAPON: ${WEAPONS[guardian.weapon].name}`, canvas.width - 200, canvas.height - 40);
    if (guardian.weapon === "rocketLauncher") {
      ctx.fillText(`AMMO: ${guardian.heavyAmmo}`, canvas.width - 200, canvas.height - 25);
    }

    // Lives
    for (let i = 0; i < gameState.lives; i++) {
      ctx.fillStyle = "#FF6B35";
      ctx.beginPath();
      ctx.arc(canvas.width - 30 - i * 25, 60, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update score
    if (pointsGained > 0) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + Math.floor(pointsGained),
        combo: prev.combo + comboIncrement,
      }));
    } else if (comboIncrement === 0 && gameState.combo > 0) {
      setGameState(prev => ({ ...prev, combo: 0 }));
    }

    // Continue loop
    if (gameState.state === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, fireWeapon, enemyFire, bossAttack, takeDamage, spawnPowerup]);

  // ============================================================================
  // GAME MANAGEMENT
  // ============================================================================

  useEffect(() => {
    if (gameState.state === "playing") {
      lastTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);

      // Spawn engrams
      const engramInterval = setInterval(() => {
        if (gameState.state === "playing" && !gameState.bossActive) {
          spawnEngram();
        }
      }, Math.max(800, 2000 - gameState.level * 100));

      // Spawn enemies
      const enemyInterval = setInterval(() => {
        if (gameState.state === "playing" && !gameState.bossActive) {
          spawnEnemy();
        }
      }, Math.max(1000, 3000 - gameState.wave * 200));

      // Boss spawn check
      const bossCheck = setInterval(() => {
        if (gameState.state === "playing" && !gameState.bossActive && 
            gameState.score > 0 && gameState.score % 2000 < 100) {
          spawnBoss();
        }
      }, 5000);

      // Powerup spawns
      const powerupInterval = setInterval(() => {
        if (gameState.state === "playing" && Math.random() < 0.3) {
          spawnPowerup();
        }
      }, 10000);

      return () => {
        cancelAnimationFrame(gameLoopRef.current);
        clearInterval(engramInterval);
        clearInterval(enemyInterval);
        clearInterval(bossCheck);
        clearInterval(powerupInterval);
      };
    }
  }, [gameState.state, gameState.level, gameState.wave, gameState.bossActive, gameLoop, spawnEngram, spawnEnemy, spawnBoss, spawnPowerup]);

  // Submit achievements mutation
  const submitAchievementsMutation = trpc.achievements.submitGameStats.useMutation({
    onSuccess: (data) => {
      if (data.newlyCompleted.length > 0) {
        data.newlyCompleted.forEach(ach => {
          toast.success(`TRIUMPH UNLOCKED: ${ach.name}`, {
            description: `+${ach.triumphPoints} Triumph Points`,
            duration: 5000,
          });
        });
      }
    },
  });

  // Handle game over
  useEffect(() => {
    if (gameState.state === "gameover" || gameState.state === "victory") {
      if (gameState.score > highScore) {
        setHighScore(gameState.score);
        if (isAuthenticated) {
          saveScoreMutation.mutate({
            gameType: "engram-hunter-combat",
            score: gameState.score,
            level: gameState.level,
          });
        }
      }
      
      // Submit game stats for achievements
      if (isAuthenticated) {
        const stats = gameStatsRef.current;
        submitAchievementsMutation.mutate({
          dregKills: stats.dregKills || 0,
          vandalKills: stats.vandalKills || 0,
          captainKills: stats.captainKills || 0,
          thrallKills: stats.thrallKills || 0,
          acolyteKills: stats.acolyteKills || 0,
          knightKills: stats.knightKills || 0,
          goblinKills: stats.goblinKills || 0,
          hobgoblinKills: stats.hobgoblinKills || 0,
          minotaurKills: stats.minotaurKills || 0,
          ogreKills: stats.ogreKills || 0,
          servitorKills: stats.servitorKills || 0,
          hydraKills: stats.hydraKills || 0,
          flawlessOgre: stats.flawlessOgre || 0,
          flawlessServitor: stats.flawlessServitor || 0,
          flawlessHydra: stats.flawlessHydra || 0,
          autoRifleKills: stats.autoRifleKills || 0,
          handCannonKills: stats.handCannonKills || 0,
          pulseRifleKills: stats.pulseRifleKills || 0,
          rocketLauncherKills: stats.rocketLauncherKills || 0,
          guardianClass: selectedClass,
          score: gameState.score,
          wave: gameState.wave,
          level: gameState.level,
          won: gameState.state === "victory",
          commonEngrams: stats.commonEngrams || 0,
          uncommonEngrams: stats.uncommonEngrams || 0,
          rareEngrams: stats.rareEngrams || 0,
          legendaryEngrams: stats.legendaryEngrams || 0,
          exoticEngrams: stats.exoticEngrams || 0,
          abilitiesUsed: stats.abilitiesUsed || 0,
          supersUsed: stats.supersUsed || 0,
          clearedCosmodrome: stats.clearedCosmodrome || false,
          clearedEuropa: stats.clearedEuropa || false,
          clearedDreamingCity: stats.clearedDreamingCity || false,
        });
      }
    }
  }, [gameState.state, gameState.score, gameState.level, gameState.wave, highScore, isAuthenticated, saveScoreMutation, selectedClass, submitAchievementsMutation]);

  const startGame = () => {
    const guardian = guardianRef.current;
    guardian.health = 100;
    guardian.maxHealth = 100;
    guardian.shield = 0;
    guardian.superMeter = 0;
    guardian.class = selectedClass;
    guardian.weapon = selectedWeapon;
    guardian.abilityCooldown = 0;
    guardian.abilityActive = false;
    guardian.invincible = false;
    guardian.heavyAmmo = 0;

    engramsRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    powerupsRef.current = [];
    particlesRef.current = [];
    bossRef.current = null;
    
    // Reset game stats for achievements
    gameStatsRef.current = {
      dregKills: 0, vandalKills: 0, captainKills: 0,
      thrallKills: 0, acolyteKills: 0, knightKills: 0,
      goblinKills: 0, hobgoblinKills: 0, minotaurKills: 0,
      ogreKills: 0, servitorKills: 0, hydraKills: 0,
      flawlessOgre: 0, flawlessServitor: 0, flawlessHydra: 0,
      autoRifleKills: 0, handCannonKills: 0, pulseRifleKills: 0, rocketLauncherKills: 0,
      commonEngrams: 0, uncommonEngrams: 0, rareEngrams: 0, legendaryEngrams: 0, exoticEngrams: 0,
      abilitiesUsed: 0, supersUsed: 0,
      clearedCosmodrome: false, clearedEuropa: false, clearedDreamingCity: false,
      bossHealthAtStart: 0,
    };

    setGameState({
      state: "playing",
      score: 0,
      lives: 3,
      level: 1,
      wave: 1,
      combo: 0,
      currentLevel: "cosmodrome",
      bossActive: false,
    });
  };

  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      state: prev.state === "playing" ? "paused" : "playing",
    }));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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
              <span className="font-bold tracking-wider text-sm">ENGRAM HUNTER: COMBAT EDITION</span>
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
              <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
              
              {/* Loadout Selection Overlay */}
              {gameState.state === "idle" && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
                  <LoadoutSelector
                    selectedClass={selectedClass}
                    selectedWeapon={selectedWeapon}
                    onSelectClass={setSelectedClass}
                    onSelectWeapon={setSelectedWeapon}
                    onStartGame={startGame}
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              )}

              {/* Paused Overlay */}
              {gameState.state === "paused" && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <Card className="destiny-card w-80">
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">PAUSED</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button onClick={togglePause} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                      <Button onClick={() => setGameState(prev => ({ ...prev, state: "idle" }))} variant="outline" className="w-full">
                        Main Menu
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Game Over Overlay */}
              {(gameState.state === "gameover" || gameState.state === "victory") && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <Card className="destiny-card w-80">
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">
                        {gameState.state === "victory" ? "VICTORY!" : "GAME OVER"}
                      </CardTitle>
                      <CardDescription>
                        Final Score: {gameState.score}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {gameState.score > highScore && (
                        <div className="text-center text-secondary font-bold">
                          <Star className="h-6 w-6 inline mr-2" />
                          NEW HIGH SCORE!
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground text-center">
                        <p>Waves Survived: {gameState.wave}</p>
                        <p>Final Level: {LEVELS[gameState.currentLevel].name}</p>
                      </div>

                      <Button onClick={() => setGameState(prev => ({ ...prev, state: "idle" }))} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Play Again
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Game controls */}
              {gameState.state === "playing" && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={togglePause}>
                    <Pause className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border p-4 hidden lg:block overflow-y-auto">
          {/* Leaderboard */}
          <Card className="destiny-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-secondary" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard?.map((entry, i) => (
                  <div 
                    key={i}
                    className={`flex items-center justify-between p-2 rounded ${
                      i === 0 ? "bg-secondary/20" : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${i === 0 ? "text-secondary" : "text-muted-foreground"}`}>
                        #{i + 1}
                      </span>
                      <span className="text-sm truncate max-w-[100px]">
                        {entry.userName || "Guardian"}
                      </span>
                    </div>
                    <span className="font-bold">{entry.score}</span>
                  </div>
                ))}
                {(!leaderboard || leaderboard.length === 0) && (
                  <div className="text-center text-muted-foreground py-4">
                    No scores yet!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enemy Guide */}
          <Card className="destiny-card mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Skull className="h-5 w-5 text-destructive" />
                Enemy Factions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium text-[#4A90A4]">Fallen</div>
                <div className="text-xs text-muted-foreground">Dreg, Vandal, Captain</div>
              </div>
              <div>
                <div className="font-medium text-[#5C4033]">Hive</div>
                <div className="text-xs text-muted-foreground">Thrall, Acolyte, Knight</div>
              </div>
              <div>
                <div className="font-medium text-[#C0C0C0]">Vex</div>
                <div className="text-xs text-muted-foreground">Goblin, Hobgoblin, Minotaur</div>
              </div>
            </CardContent>
          </Card>

          {/* Weapons */}
          <Card className="destiny-card mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crosshair className="h-5 w-5" />
                Weapons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.entries(WEAPONS) as [WeaponType, typeof WEAPONS[WeaponType]][]).map(([key, data], i) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: data.color }} />
                    <span>{data.name}</span>
                  </div>
                  <span className="text-muted-foreground">[{i + 1}]</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Power-ups */}
          <Card className="destiny-card mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                Power-ups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.entries(POWERUP_TYPES) as [PowerupType, typeof POWERUP_TYPES[PowerupType]][]).map(([key, data]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                  <span>{data.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Virtual Joystick for Mobile */}
      {gameState.state === "playing" && (
        <VirtualJoystick
          onMove={(dx, dy) => {
            touchMoveRef.current = { dx, dy };
          }}
          onFire={(firing) => {
            touchFiringRef.current = firing;
            mouseDownRef.current = firing;
          }}
          onAbility={activateAbility}
          onSuper={() => {
            if (guardianRef.current.superMeter >= 100) activateSuper();
          }}
          onWeaponSwitch={(index) => {
            const weapons: WeaponType[] = ["autoRifle", "handCannon", "pulseRifle", "rocketLauncher"];
            if (index === 3 && guardianRef.current.heavyAmmo <= 0) return;
            guardianRef.current.weapon = weapons[index];
          }}
          disabled={gameState.state !== "playing"}
          abilityCooldownPercent={Math.min(100, ((Date.now() - guardianRef.current.abilityCooldown) / GUARDIAN_CLASSES[guardianRef.current.class].abilityCooldown) * 100)}
          superMeterPercent={guardianRef.current.superMeter}
          currentWeapon={["autoRifle", "handCannon", "pulseRifle", "rocketLauncher"].indexOf(guardianRef.current.weapon)}
          heavyAmmo={guardianRef.current.heavyAmmo}
        />
      )}

      {/* Lore Chatbot */}
      <LoreChatbot />
    </div>
  );
}
