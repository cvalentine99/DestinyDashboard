import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Trophy, Star, Shield, Crosshair, Target, Heart, 
  Gem, Sparkles, Crown, Medal, Loader2, Lock, Check, Award
} from "lucide-react";
import { getLoginUrl } from "@/const";
import LoreChatbot from "@/components/LoreChatbot";
import Breadcrumbs from "@/components/Breadcrumbs";

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  combat: <Crosshair className="w-5 h-5" />,
  boss: <Target className="w-5 h-5" />,
  flawless: <Sparkles className="w-5 h-5" />,
  score: <Trophy className="w-5 h-5" />,
  class: <Shield className="w-5 h-5" />,
  weapon: <Crosshair className="w-5 h-5" />,
  survival: <Heart className="w-5 h-5" />,
  collection: <Gem className="w-5 h-5" />,
  special: <Star className="w-5 h-5" />,
};

// Tier colors
const tierColors: Record<string, string> = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-300 to-gray-500",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-gray-100 to-gray-300",
  exotic: "from-yellow-300 to-amber-500",
};

const tierBorders: Record<string, string> = {
  bronze: "border-amber-700",
  silver: "border-gray-400",
  gold: "border-yellow-500",
  platinum: "border-gray-200",
  exotic: "border-yellow-400",
};

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  targetValue: number;
  rewardType: string;
  rewardValue?: string;
  triumphPoints: number;
  tierColor: string;
  categoryIcon: string;
  currentValue: number;
  isCompleted: boolean;
  progressPercent: number;
  completedAt?: Date;
  claimedReward: boolean;
}

export default function Triumphs() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  // Queries
  const { data: progressData, isLoading: progressLoading } = trpc.achievements.getProgress.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: notifications } = trpc.achievements.getNotifications.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 5000 }
  );
  
  const dismissMutation = trpc.achievements.dismissNotification.useMutation();

  // Filter achievements
  const filteredAchievements = progressData?.progress.filter(a => {
    if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
    if (selectedTier !== "all" && a.tier !== selectedTier) return false;
    return true;
  }) || [];

  // Sort: completed last, then by progress percent
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return b.progressPercent - a.progressPercent;
  });

  // Group by category for display
  const categories = ["combat", "boss", "flawless", "score", "class", "weapon", "survival", "collection", "special"];

  // Handle notification popup
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const notification = notifications[0];
      if (notification.achievement) {
        // Show achievement popup
        setSelectedAchievement(notification.achievement as unknown as Achievement);
        // Dismiss after showing
        dismissMutation.mutate({ notificationId: notification.id });
      }
    }
  }, [notifications]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Lock className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="text-muted-foreground">Sign in to view your Triumphs</p>
        <Button asChild>
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </div>
    );
  }

  const completedCount = progressData?.totalCompleted || 0;
  const totalCount = progressData?.progress.length || 0;
  const totalPoints = progressData?.totalPoints || 0;
  const totalPointsAvailable = progressData?.totalPointsAvailable || 0;
  const titles = progressData?.titlesEarned || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-slate-900/50">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold font-orbitron tracking-wider text-primary">
                  TRIUMPHS
                </h1>
                <p className="text-sm text-muted-foreground">Track your legendary achievements</p>
              </div>
            </div>
            
            {/* Triumph Score */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Triumph Score</div>
                <div className="text-2xl font-bold text-yellow-400">{totalPoints.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold">{completedCount} / {totalCount}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: "Command Center", href: "/dashboard" },
          { label: "Triumphs" }
        ]} />

        {/* Titles Earned */}
        {titles.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-yellow-600/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Titles Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {titles.map((title, i) => (
                  <Badge key={i} variant="outline" className="bg-yellow-900/30 border-yellow-600 text-yellow-400 px-3 py-1">
                    {title}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Progress</span>
              <span className="text-sm font-medium">{Math.round((completedCount / totalCount) * 100)}%</span>
            </div>
            <Progress value={(completedCount / totalCount) * 100} className="h-3" />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{totalPoints} / {totalPointsAvailable} Triumph Points</span>
              <span>{completedCount} achievements completed</span>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize"
                >
                  {categoryIcons[cat]}
                  <span className="ml-1">{cat}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Tier</label>
            <div className="flex gap-2">
              <Button
                variant={selectedTier === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTier("all")}
              >
                All
              </Button>
              {["bronze", "silver", "gold", "platinum", "exotic"].map(tier => (
                <Button
                  key={tier}
                  variant={selectedTier === tier ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTier(tier)}
                  className="capitalize"
                >
                  {tier}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        {progressLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAchievements.map(achievement => (
              <Card
                key={achievement.id}
                className={`cursor-pointer transition-all hover:scale-[1.02] ${
                  achievement.isCompleted 
                    ? `border-2 ${tierBorders[achievement.tier]} bg-gradient-to-br ${tierColors[achievement.tier]}/10` 
                    : "border-border/50 hover:border-primary/50"
                }`}
                onClick={() => setSelectedAchievement(achievement as Achievement)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      achievement.isCompleted 
                        ? `bg-gradient-to-br ${tierColors[achievement.tier]}` 
                        : "bg-muted"
                    }`}>
                      {achievement.isCompleted ? (
                        <Check className="w-6 h-6 text-background" />
                      ) : (
                        categoryIcons[achievement.category]
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold truncate ${
                          achievement.isCompleted ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {achievement.name}
                        </h3>
                        <Badge variant="outline" className="text-xs capitalize shrink-0">
                          {achievement.tier}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {achievement.description}
                      </p>
                      
                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>{achievement.currentValue} / {achievement.targetValue}</span>
                          <span className="text-yellow-400">+{achievement.triumphPoints} pts</span>
                        </div>
                        <Progress 
                          value={achievement.progressPercent} 
                          className={`h-2 ${achievement.isCompleted ? "bg-muted" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Achievement Detail Dialog */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="max-w-md">
          {selectedAchievement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                    selectedAchievement.isCompleted 
                      ? `bg-gradient-to-br ${tierColors[selectedAchievement.tier]}` 
                      : "bg-muted"
                  }`}>
                    {selectedAchievement.isCompleted ? (
                      <Trophy className="w-8 h-8 text-background" />
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center">
                        {categoryIcons[selectedAchievement.category]}
                      </div>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedAchievement.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">{selectedAchievement.tier}</Badge>
                      <Badge variant="outline" className="capitalize">{selectedAchievement.category}</Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <p className="text-muted-foreground">{selectedAchievement.description}</p>
                
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-medium">
                      {selectedAchievement.currentValue} / {selectedAchievement.targetValue}
                    </span>
                  </div>
                  <Progress value={selectedAchievement.progressPercent} className="h-3" />
                </div>
                
                {/* Reward */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm">Reward</span>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-medium">+{selectedAchievement.triumphPoints} pts</div>
                    {selectedAchievement.rewardType === "title" && selectedAchievement.rewardValue && (
                      <div className="text-xs text-muted-foreground">
                        Title: "{selectedAchievement.rewardValue}"
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Completion status */}
                {selectedAchievement.isCompleted && (
                  <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Completed!</span>
                    {selectedAchievement.completedAt && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(selectedAchievement.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lore Chatbot */}
      <LoreChatbot />
    </div>
  );
}
