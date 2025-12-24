import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  Server, 
  Bell, 
  Mic, 
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  Save
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

// Destiny Tricorn SVG Logo
const TricornLogo = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8" fill="currentColor">
    <path d="M50 5 L95 85 L50 65 L5 85 Z" />
    <path d="M50 25 L75 70 L50 55 L25 70 Z" opacity="0.6" />
  </svg>
);

export default function Settings() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // ExtraHop config state
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [applianceName, setApplianceName] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  // Notification preferences state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [alertSeverities, setAlertSeverities] = useState(["critical", "high"]);

  // Fetch existing config
  const { data: existingConfig } = trpc.extrahop.getConfig.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: notifPrefs } = trpc.notifications.getPreferences.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const saveConfigMutation = trpc.extrahop.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("ExtraHop configuration saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    },
  });

  const testConnectionMutation = trpc.extrahop.testConnection.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setTestStatus("success");
        toast.success("Connection successful!");
        if (data.appliance?.hostname) {
          setApplianceName(data.appliance.hostname);
        }
      } else {
        setTestStatus("error");
        toast.error(`Connection failed: ${data.error}`);
      }
    },
    onError: (error) => {
      setTestStatus("error");
      toast.error(`Connection test failed: ${error.message}`);
    },
  });

  const saveNotifMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved");
    },
    onError: (error) => {
      toast.error(`Failed to save preferences: ${error.message}`);
    },
  });

  // Load existing config
  useEffect(() => {
    if (existingConfig) {
      setApiUrl(existingConfig.apiUrl || "");
      setApplianceName(existingConfig.applianceName || "");
    }
  }, [existingConfig]);

  useEffect(() => {
    if (notifPrefs) {
      setPushEnabled(notifPrefs.pushEnabled ?? true);
      setVoiceEnabled(notifPrefs.voiceEnabled ?? false);
      setAlertSeverities((notifPrefs.alertSeverity as string[]) || ["critical", "high"]);
    }
  }, [notifPrefs]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const handleTestConnection = () => {
    if (!apiUrl || !apiKey) {
      toast.error("Please enter both API URL and API Key");
      return;
    }
    setTestStatus("testing");
    testConnectionMutation.mutate({ apiUrl, apiKey });
  };

  const handleSaveConfig = () => {
    if (!apiUrl || !apiKey) {
      toast.error("Please enter both API URL and API Key");
      return;
    }
    saveConfigMutation.mutate({ apiUrl, apiKey, applianceName });
  };

  const handleSaveNotifications = () => {
    saveNotifMutation.mutate({
      pushEnabled,
      voiceEnabled,
      alertSeverity: alertSeverities,
    });
  };

  const toggleSeverity = (severity: string) => {
    setAlertSeverities(prev => 
      prev.includes(severity) 
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
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
            <div className="flex items-center gap-2 text-primary">
              <TricornLogo />
              <span className="font-bold tracking-wider text-sm">SETTINGS</span>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="text-primary">{user?.name || "Guardian"}</span>
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="container max-w-4xl">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: "Command Center", href: "/dashboard" },
            { label: "Settings" }
          ]} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-wider text-gradient-destiny mb-2">
              CONFIGURATION
            </h1>
            <p className="text-muted-foreground">
              Configure your ExtraHop connection and notification preferences
            </p>
          </div>

          <Tabs defaultValue="extrahop" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="extrahop" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Server className="h-4 w-4 mr-2" />
                ExtraHop
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="voice" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </TabsTrigger>
            </TabsList>

            {/* ExtraHop Configuration */}
            <TabsContent value="extrahop">
              <Card className="destiny-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    ExtraHop Connection
                  </CardTitle>
                  <CardDescription>
                    Connect to your ExtraHop appliance to enable real-time network monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl">API URL</Label>
                    <Input
                      id="apiUrl"
                      placeholder="https://your-extrahop.example.com"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="bg-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      The base URL of your ExtraHop appliance (e.g., https://extrahop.company.com)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your ExtraHop API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Generate an API key from ExtraHop Admin → API Access
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applianceName">Appliance Name (Optional)</Label>
                    <Input
                      id="applianceName"
                      placeholder="My ExtraHop Appliance"
                      value={applianceName}
                      onChange={(e) => setApplianceName(e.target.value)}
                      className="bg-input"
                    />
                  </div>

                  {/* Connection Status */}
                  {testStatus !== "idle" && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      testStatus === "success" ? "bg-green-500/10 text-green-500" :
                      testStatus === "error" ? "bg-destructive/10 text-destructive" :
                      "bg-muted"
                    }`}>
                      {testStatus === "testing" && <Loader2 className="h-4 w-4 animate-spin" />}
                      {testStatus === "success" && <CheckCircle className="h-4 w-4" />}
                      {testStatus === "error" && <XCircle className="h-4 w-4" />}
                      <span className="text-sm">
                        {testStatus === "testing" && "Testing connection..."}
                        {testStatus === "success" && "Connection successful!"}
                        {testStatus === "error" && "Connection failed"}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleTestConnection}
                      disabled={testConnectionMutation.isPending}
                    >
                      {testConnectionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                    <Button 
                      onClick={handleSaveConfig}
                      disabled={saveConfigMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {saveConfigMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Preferences */}
            <TabsContent value="notifications">
              <Card className="destiny-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-secondary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure how you receive alerts about network events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive browser notifications for critical alerts
                      </p>
                    </div>
                    <Switch
                      checked={pushEnabled}
                      onCheckedChange={setPushEnabled}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Alert Severities to Notify</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "critical", label: "Extinction-Level", color: "destructive" },
                        { id: "high", label: "Darkness Incursion", color: "orange" },
                        { id: "medium", label: "Fallen Raid", color: "yellow" },
                        { id: "low", label: "Minor Skirmish", color: "blue" },
                      ].map((severity) => (
                        <div 
                          key={severity.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            alertSeverities.includes(severity.id) 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-muted-foreground"
                          }`}
                          onClick={() => toggleSeverity(severity.id)}
                        >
                          <div className={`w-3 h-3 rounded-full ${
                            severity.color === "destructive" ? "bg-destructive" :
                            severity.color === "orange" ? "bg-[oklch(0.70_0.20_45)]" :
                            severity.color === "yellow" ? "bg-[oklch(0.85_0.15_90)]" :
                            "bg-[oklch(0.65_0.18_220)]"
                          }`} />
                          <span className="text-sm">{severity.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveNotifications}
                    disabled={saveNotifMutation.isPending}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    {saveNotifMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice Settings */}
            <TabsContent value="voice">
              <Card className="destiny-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-[oklch(0.65_0.18_220)]" />
                    Ghost Voice Protocol
                  </CardTitle>
                  <CardDescription>
                    Configure voice-to-text and text-to-speech features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Voice Alerts</Label>
                      <p className="text-xs text-muted-foreground">
                        Ghost will read critical alerts aloud
                      </p>
                    </div>
                    <Switch
                      checked={voiceEnabled}
                      onCheckedChange={setVoiceEnabled}
                    />
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Voice Commands</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>"Ghost, status report" - Get network summary</li>
                      <li>"Ghost, show threats" - List active alerts</li>
                      <li>"Ghost, guardian count" - Device count</li>
                      <li>"Ghost, tell me about [topic]" - Lore query</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleSaveNotifications}
                    disabled={saveNotifMutation.isPending}
                    className="bg-[oklch(0.65_0.18_220)] hover:bg-[oklch(0.65_0.18_220)]/90 text-white"
                  >
                    {saveNotifMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Voice Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
