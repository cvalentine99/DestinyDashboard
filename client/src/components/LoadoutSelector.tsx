import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Save, 
  Trash2, 
  Star, 
  Plus, 
  Shield, 
  Crosshair,
  Zap,
  Loader2,
  Play
} from "lucide-react";

// Guardian class definitions (matching Game.tsx)
const GUARDIAN_CLASSES = {
  titan: { name: "Titan", color: "#FF6B35", ability: "Barricade" },
  hunter: { name: "Hunter", color: "#7B68EE", ability: "Dodge" },
  warlock: { name: "Warlock", color: "#FFD700", ability: "Blink" },
} as const;

// Weapon definitions (matching Game.tsx weapon keys)
// Database stores: auto_rifle, hand_cannon, pulse_rifle, rocket_launcher
// Game uses: autoRifle, handCannon, pulseRifle, rocketLauncher
const WEAPONS = {
  autoRifle: { name: "Auto Rifle", color: "#4ADE80", icon: "⚡", dbKey: "auto_rifle" },
  handCannon: { name: "Hand Cannon", color: "#FBBF24", icon: "🎯", dbKey: "hand_cannon" },
  pulseRifle: { name: "Pulse Rifle", color: "#60A5FA", icon: "💫", dbKey: "pulse_rifle" },
  rocketLauncher: { name: "Rocket Launcher", color: "#FF6B35", icon: "🚀", dbKey: "rocket_launcher" },
} as const;

// Map database weapon keys to game weapon keys
const DB_TO_GAME_WEAPON: Record<string, string> = {
  auto_rifle: "autoRifle",
  hand_cannon: "handCannon",
  pulse_rifle: "pulseRifle",
  rocket_launcher: "rocketLauncher",
};

const GAME_TO_DB_WEAPON: Record<string, string> = {
  autoRifle: "auto_rifle",
  handCannon: "hand_cannon",
  pulseRifle: "pulse_rifle",
  rocketLauncher: "rocket_launcher",
};

type GuardianClass = keyof typeof GUARDIAN_CLASSES;
type WeaponType = keyof typeof WEAPONS;

interface LoadoutSelectorProps {
  selectedClass: GuardianClass;
  selectedWeapon: WeaponType;
  onSelectClass: (guardianClass: GuardianClass) => void;
  onSelectWeapon: (weapon: WeaponType) => void;
  onStartGame: () => void;
  isAuthenticated: boolean;
}

export default function LoadoutSelector({
  selectedClass,
  selectedWeapon,
  onSelectClass,
  onSelectWeapon,
  onStartGame,
  isAuthenticated,
}: LoadoutSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLoadoutName, setNewLoadoutName] = useState("");

  // Fetch user's loadouts (only if authenticated)
  const { data: loadouts, isLoading, refetch } = trpc.loadout.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: defaultLoadout } = trpc.loadout.getDefault.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const createLoadoutMutation = trpc.loadout.create.useMutation({
    onSuccess: () => {
      toast.success("Loadout saved!");
      setIsCreateDialogOpen(false);
      setNewLoadoutName("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteLoadoutMutation = trpc.loadout.delete.useMutation({
    onSuccess: () => {
      toast.success("Loadout deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const setDefaultMutation = trpc.loadout.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Default loadout updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const recordUsageMutation = trpc.loadout.recordUsage.useMutation();

  const handleCreateLoadout = () => {
    if (!newLoadoutName.trim()) {
      toast.error("Please enter a loadout name");
      return;
    }
    createLoadoutMutation.mutate({
      name: newLoadoutName.trim(),
      guardianClass: selectedClass,
      primaryWeapon: GAME_TO_DB_WEAPON[selectedWeapon] as "auto_rifle" | "hand_cannon" | "pulse_rifle" | "rocket_launcher",
    });
  };

  const handleSelectLoadout = (loadout: {
    id: number;
    guardianClass: string;
    primaryWeapon: string;
  }) => {
    onSelectClass(loadout.guardianClass as GuardianClass);
    // Convert database weapon key to game weapon key
    const gameWeapon = DB_TO_GAME_WEAPON[loadout.primaryWeapon] || "autoRifle";
    onSelectWeapon(gameWeapon as WeaponType);
    recordUsageMutation.mutate({ id: loadout.id });
    toast.success("Loadout equipped!");
  };

  const handleStartWithLoadout = () => {
    // If there's a default loadout, apply it
    if (defaultLoadout) {
      onSelectClass(defaultLoadout.guardianClass as GuardianClass);
      const gameWeapon = DB_TO_GAME_WEAPON[defaultLoadout.primaryWeapon] || "autoRifle";
      onSelectWeapon(gameWeapon as WeaponType);
      recordUsageMutation.mutate({ id: defaultLoadout.id });
    }
    onStartGame();
  };

  return (
    <Card className="destiny-card w-[600px] max-w-[95vw]">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl text-secondary">ENGRAM HUNTER</CardTitle>
        <CardDescription className="text-lg">COMBAT EDITION</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Guardian Class Selection */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Guardian Class</Label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(GUARDIAN_CLASSES) as [GuardianClass, typeof GUARDIAN_CLASSES[GuardianClass]][]).map(([key, data]) => (
              <button
                key={key}
                onClick={() => onSelectClass(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedClass === key 
                    ? "border-secondary bg-secondary/20" 
                    : "border-border hover:border-secondary/50"
                }`}
              >
                <div 
                  className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: data.color }}
                >
                  {key === "titan" && <Shield className="h-5 w-5 text-white" />}
                  {key === "hunter" && <Crosshair className="h-5 w-5 text-white" />}
                  {key === "warlock" && <Zap className="h-5 w-5 text-white" />}
                </div>
                <div className="font-bold text-sm">{data.name}</div>
                <div className="text-xs text-muted-foreground">{data.ability}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Weapon Selection */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Primary Weapon</Label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(WEAPONS) as [WeaponType, typeof WEAPONS[WeaponType]][]).map(([key, data]) => (
              <button
                key={key}
                onClick={() => onSelectWeapon(key)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedWeapon === key 
                    ? "border-secondary bg-secondary/20" 
                    : "border-border hover:border-secondary/50"
                }`}
              >
                <div 
                  className="w-8 h-8 mx-auto mb-1 rounded flex items-center justify-center text-lg"
                  style={{ backgroundColor: data.color + "30" }}
                >
                  {data.icon}
                </div>
                <div className="text-xs font-medium truncate">{data.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Saved Loadouts - Only show if authenticated */}
        {isAuthenticated && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-muted-foreground">Saved Loadouts</Label>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Save Current
                  </Button>
                </DialogTrigger>
                <DialogContent className="destiny-card">
                  <DialogHeader>
                    <DialogTitle>Save Loadout</DialogTitle>
                    <DialogDescription>
                      Save your current class and weapon selection for quick access.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Loadout Name</Label>
                      <Input
                        placeholder="e.g., PvP Rush, Boss Killer..."
                        value={newLoadoutName}
                        onChange={(e) => setNewLoadoutName(e.target.value)}
                        maxLength={64}
                      />
                    </div>
                    <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: GUARDIAN_CLASSES[selectedClass].color }}
                        >
                          {selectedClass === "titan" && <Shield className="h-4 w-4 text-white" />}
                          {selectedClass === "hunter" && <Crosshair className="h-4 w-4 text-white" />}
                          {selectedClass === "warlock" && <Zap className="h-4 w-4 text-white" />}
                        </div>
                        <span className="text-sm">{GUARDIAN_CLASSES[selectedClass].name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center"
                          style={{ backgroundColor: WEAPONS[selectedWeapon].color + "30" }}
                        >
                          {WEAPONS[selectedWeapon].icon}
                        </div>
                        <span className="text-sm">{WEAPONS[selectedWeapon].name}</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateLoadout}
                      disabled={createLoadoutMutation.isPending}
                    >
                      {createLoadoutMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Loadout
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[120px] rounded-lg border border-border">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : loadouts && loadouts.length > 0 ? (
                <div className="p-2 space-y-1">
                  {loadouts.map((loadout) => {
                    const gameWeapon = DB_TO_GAME_WEAPON[loadout.primaryWeapon] as WeaponType || "autoRifle";
                    return (
                      <div
                        key={loadout.id}
                        className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group ${
                          loadout.isDefault ? "bg-secondary/10 border border-secondary/30" : ""
                        }`}
                        onClick={() => handleSelectLoadout(loadout)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: loadout.iconColor || GUARDIAN_CLASSES[loadout.guardianClass as GuardianClass]?.color || "#666" }}
                          >
                            {loadout.guardianClass === "titan" && <Shield className="h-4 w-4 text-white" />}
                            {loadout.guardianClass === "hunter" && <Crosshair className="h-4 w-4 text-white" />}
                            {loadout.guardianClass === "warlock" && <Zap className="h-4 w-4 text-white" />}
                          </div>
                          <div>
                            <div className="font-medium text-sm flex items-center gap-2">
                              {loadout.name}
                              {loadout.isDefault && (
                                <Star className="h-3 w-3 text-secondary fill-secondary" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {GUARDIAN_CLASSES[loadout.guardianClass as GuardianClass]?.name} • {WEAPONS[gameWeapon]?.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!loadout.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDefaultMutation.mutate({ id: loadout.id });
                              }}
                              title="Set as default"
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLoadoutMutation.mutate({ id: loadout.id });
                            }}
                            title="Delete loadout"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <Save className="h-5 w-5 mb-2 opacity-50" />
                  <p>No saved loadouts</p>
                  <p className="text-xs">Save your favorite combinations!</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Start Button */}
        <Button 
          onClick={handleStartWithLoadout} 
          className="w-full bg-primary hover:bg-primary/90" 
          size="lg"
        >
          <Play className="h-5 w-5 mr-2" />
          START MISSION
          {defaultLoadout && (
            <span className="ml-2 text-xs opacity-70">
              ({GUARDIAN_CLASSES[defaultLoadout.guardianClass as GuardianClass]?.name})
            </span>
          )}
        </Button>

        {/* Controls */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
          <p className="font-medium text-foreground">Controls:</p>
          <p>• Mouse: Move & Aim | Click: Fire</p>
          <p>• SPACE: Class Ability | Q: Super (when charged)</p>
          <p>• 1-4: Switch Weapons</p>
        </div>
      </CardContent>
    </Card>
  );
}
