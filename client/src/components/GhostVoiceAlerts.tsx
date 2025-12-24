import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Volume2, VolumeX, Settings2, Ghost } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Ghost voice phrases for different events
const GHOST_PHRASES = {
  // Connection quality changes
  connectionExcellent: [
    "Guardian, your Light flows strong. Connection is flawless.",
    "Excellent connection established. Shaxx would be proud.",
    "Your signal burns bright, Guardian. Ascendant-level connection.",
  ],
  connectionGood: [
    "Connection stable, Guardian. Light stream is strong.",
    "Good connection. You're ready for the Crucible.",
    "Network integrity confirmed. Fight well, Guardian.",
  ],
  connectionFair: [
    "Guardian, connection degraded to Fair. Stay vigilant.",
    "Warning: Light stream weakening. Connection quality reduced.",
    "Network instability detected. Proceed with caution.",
  ],
  connectionPoor: [
    "Guardian! Connection critical. Packet loss detected.",
    "Alert: Poor connection quality. Your Light flickers.",
    "Warning: Severe network degradation. Enemies may have the advantage.",
  ],
  connectionCritical: [
    "Guardian down! Connection lost. Darkness encroaches.",
    "Critical failure! Network collapse imminent.",
    "Mayday! Connection critical. Retreat recommended.",
  ],

  // Lag spikes
  lagSpikeMinor: [
    "Minor turbulence detected. Brief lag spike.",
    "Small hiccup in the Light stream. Stay focused.",
  ],
  lagSpikeMajor: [
    "Guardian! Major lag spike detected. {latency} milliseconds.",
    "Warning: Significant latency spike. {latency}ms delay.",
    "Caution: Heavy lag detected. The Darkness interferes.",
  ],
  lagSpikeCritical: [
    "Critical lag spike! {latency} milliseconds. Take cover!",
    "Guardian, we're losing you! {latency}ms spike detected.",
    "Emergency: Catastrophic latency. {latency}ms. Brace yourself!",
  ],

  // Peer events
  peerJoined: [
    "New Guardian detected in the arena.",
    "Another warrior joins the fray.",
    "Peer connection established. {count} Guardians in match.",
  ],
  peerLeft: [
    "Guardian has left the battlefield.",
    "Peer disconnected. {count} Guardians remaining.",
    "A warrior falls... or retreats.",
  ],

  // Match events
  matchStart: [
    "Eyes up, Guardian. Match monitoring initiated.",
    "Crucible match detected. Shaxx is watching.",
    "Match started. May your Light guide you to victory.",
  ],
  matchEnd: [
    "Match complete. Analyzing performance data.",
    "The battle ends. Reviewing your Light stream.",
    "Match concluded. PCAP data available for review.",
  ],

  // Packet loss
  packetLossWarning: [
    "Packet loss detected. {loss}% of your Light scattered.",
    "Warning: {loss}% packet loss. Data integrity compromised.",
  ],
  packetLossCritical: [
    "Critical packet loss! {loss}% of transmissions lost.",
    "Guardian, we're losing {loss}% of all packets. Connection failing.",
  ],
};

// Alert thresholds configuration
interface AlertThresholds {
  latencyWarning: number;      // ms
  latencyDanger: number;       // ms
  latencyCritical: number;     // ms
  packetLossWarning: number;   // %
  packetLossCritical: number;  // %
  jitterWarning: number;       // ms
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  latencyWarning: 80,
  latencyDanger: 150,
  latencyCritical: 300,
  packetLossWarning: 2,
  packetLossCritical: 5,
  jitterWarning: 30,
};

interface GhostVoiceAlertsProps {
  // Real-time metrics to monitor
  currentLatency?: number;
  currentJitter?: number;
  currentPacketLoss?: number;
  connectionQuality?: string;
  peerCount?: number;
  isMatchActive?: boolean;
  matchState?: string;
  // Callbacks
  onAlert?: (message: string, severity: "info" | "warning" | "critical") => void;
}

export default function GhostVoiceAlerts({
  currentLatency = 0,
  currentJitter = 0,
  currentPacketLoss = 0,
  connectionQuality = "unknown",
  peerCount = 0,
  isMatchActive = false,
  matchState,
  onAlert,
}: GhostVoiceAlertsProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [lastAlertTime, setLastAlertTime] = useState<Record<string, number>>({});
  const [recentAlerts, setRecentAlerts] = useState<Array<{ message: string; time: Date; severity: string }>>([]);
  
  // Track previous values to detect changes
  const prevConnectionQuality = useRef(connectionQuality);
  const prevPeerCount = useRef(peerCount);
  const prevMatchState = useRef(matchState);
  const prevLatency = useRef(currentLatency);

  // Cooldown between same alert types (ms)
  const ALERT_COOLDOWN = 10000; // 10 seconds

  // Get random phrase from category
  const getPhrase = useCallback((category: keyof typeof GHOST_PHRASES, replacements?: Record<string, string | number>) => {
    const phrases = GHOST_PHRASES[category];
    let phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    if (replacements) {
      Object.entries(replacements).forEach(([key, value]) => {
        phrase = phrase.replace(`{${key}}`, String(value));
      });
    }
    
    return phrase;
  }, []);

  // Check if we can send an alert (cooldown)
  const canAlert = useCallback((alertType: string) => {
    const now = Date.now();
    const lastTime = lastAlertTime[alertType] || 0;
    return now - lastTime > ALERT_COOLDOWN;
  }, [lastAlertTime]);

  // Speak a message using Web Speech API
  const speak = useCallback((message: string, severity: "info" | "warning" | "critical" = "info") => {
    if (!isEnabled || isMuted || !("speechSynthesis" in window)) {
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.volume = volume / 100;
    utterance.rate = severity === "critical" ? 1.1 : 0.95;
    utterance.pitch = severity === "critical" ? 1.2 : 1.0;

    // Try to use a suitable voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes("Samantha") || 
      v.name.includes("Google UK English Female") ||
      v.name.includes("Microsoft Zira") ||
      v.name.includes("Karen") ||
      (v.lang === "en-US" && v.name.includes("Female"))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    speechSynthesis.speak(utterance);

    // Add to recent alerts
    setRecentAlerts(prev => [
      { message, time: new Date(), severity },
      ...prev.slice(0, 4), // Keep last 5
    ]);

    // Callback
    onAlert?.(message, severity);
  }, [isEnabled, isMuted, volume, onAlert]);

  // Send alert with cooldown check
  const sendAlert = useCallback((
    alertType: string, 
    category: keyof typeof GHOST_PHRASES, 
    severity: "info" | "warning" | "critical",
    replacements?: Record<string, string | number>
  ) => {
    if (!canAlert(alertType)) return;
    
    const message = getPhrase(category, replacements);
    speak(message, severity);
    setLastAlertTime(prev => ({ ...prev, [alertType]: Date.now() }));
  }, [canAlert, getPhrase, speak]);

  // Monitor connection quality changes
  useEffect(() => {
    if (connectionQuality !== prevConnectionQuality.current && connectionQuality !== "unknown") {
      const qualityMap: Record<string, { category: keyof typeof GHOST_PHRASES; severity: "info" | "warning" | "critical" }> = {
        excellent: { category: "connectionExcellent", severity: "info" },
        good: { category: "connectionGood", severity: "info" },
        fair: { category: "connectionFair", severity: "warning" },
        poor: { category: "connectionPoor", severity: "warning" },
        critical: { category: "connectionCritical", severity: "critical" },
      };

      const config = qualityMap[connectionQuality];
      if (config) {
        sendAlert(`connection_${connectionQuality}`, config.category, config.severity);
      }
    }
    prevConnectionQuality.current = connectionQuality;
  }, [connectionQuality, sendAlert]);

  // Monitor peer count changes
  useEffect(() => {
    if (isMatchActive && peerCount !== prevPeerCount.current) {
      if (peerCount > prevPeerCount.current) {
        sendAlert("peer_joined", "peerJoined", "info", { count: peerCount });
      } else if (peerCount < prevPeerCount.current && prevPeerCount.current > 0) {
        sendAlert("peer_left", "peerLeft", "info", { count: peerCount });
      }
    }
    prevPeerCount.current = peerCount;
  }, [peerCount, isMatchActive, sendAlert]);

  // Monitor match state changes
  useEffect(() => {
    if (matchState !== prevMatchState.current) {
      if (matchState === "in_match" && prevMatchState.current !== "in_match") {
        sendAlert("match_start", "matchStart", "info");
      } else if (matchState === "post_game" && prevMatchState.current === "in_match") {
        sendAlert("match_end", "matchEnd", "info");
      }
    }
    prevMatchState.current = matchState;
  }, [matchState, sendAlert]);

  // Monitor latency spikes
  useEffect(() => {
    if (!isMatchActive) return;

    const latencyDelta = currentLatency - prevLatency.current;
    
    // Detect sudden spikes (increase of 50ms+ in one second)
    if (latencyDelta > 50) {
      if (currentLatency >= thresholds.latencyCritical) {
        sendAlert("lag_critical", "lagSpikeCritical", "critical", { latency: Math.round(currentLatency) });
      } else if (currentLatency >= thresholds.latencyDanger) {
        sendAlert("lag_major", "lagSpikeMajor", "warning", { latency: Math.round(currentLatency) });
      } else if (currentLatency >= thresholds.latencyWarning) {
        sendAlert("lag_minor", "lagSpikeMinor", "info");
      }
    }

    prevLatency.current = currentLatency;
  }, [currentLatency, isMatchActive, thresholds, sendAlert]);

  // Monitor packet loss
  useEffect(() => {
    if (!isMatchActive) return;

    if (currentPacketLoss >= thresholds.packetLossCritical) {
      sendAlert("packet_loss_critical", "packetLossCritical", "critical", { loss: currentPacketLoss.toFixed(1) });
    } else if (currentPacketLoss >= thresholds.packetLossWarning) {
      sendAlert("packet_loss_warning", "packetLossWarning", "warning", { loss: currentPacketLoss.toFixed(1) });
    }
  }, [currentPacketLoss, isMatchActive, thresholds, sendAlert]);

  return (
    <div className="flex items-center gap-2">
      {/* Main toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMuted(!isMuted)}
        className={`relative ${isMuted ? "text-muted-foreground" : "text-primary"}`}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <>
            <Volume2 className="h-5 w-5" />
            {isEnabled && isMatchActive && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </>
        )}
      </Button>

      {/* Settings popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Ghost className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-card border-border" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ghost className="h-4 w-4 text-primary" />
                <span className="font-medium">Ghost Voice Alerts</span>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Volume</Label>
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                max={100}
                step={5}
                disabled={!isEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Latency Warning (ms)</Label>
              <Slider
                value={[thresholds.latencyWarning]}
                onValueChange={([v]) => setThresholds(t => ({ ...t, latencyWarning: v }))}
                min={50}
                max={200}
                step={10}
                disabled={!isEnabled}
              />
              <span className="text-xs text-muted-foreground">{thresholds.latencyWarning}ms</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Packet Loss Warning (%)</Label>
              <Slider
                value={[thresholds.packetLossWarning]}
                onValueChange={([v]) => setThresholds(t => ({ ...t, packetLossWarning: v }))}
                min={1}
                max={10}
                step={0.5}
                disabled={!isEnabled}
              />
              <span className="text-xs text-muted-foreground">{thresholds.packetLossWarning}%</span>
            </div>

            {/* Recent alerts */}
            {recentAlerts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-xs text-muted-foreground">Recent Alerts</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {recentAlerts.map((alert, i) => (
                    <div key={i} className="text-xs flex items-start gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1 ${
                          alert.severity === "critical" ? "border-red-500 text-red-400" :
                          alert.severity === "warning" ? "border-amber-500 text-amber-400" :
                          "border-primary text-primary"
                        }`}
                      >
                        {alert.time.toLocaleTimeString()}
                      </Badge>
                      <span className="text-muted-foreground line-clamp-1">{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => speak("Eyes up, Guardian. Ghost voice alerts are operational.", "info")}
              disabled={!isEnabled || isMuted}
            >
              Test Ghost Voice
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
