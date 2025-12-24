# Second Sight Forensics for ExtraHop - Project TODO

## Core Infrastructure
- [x] Configure Destiny 2 Year of Prophecy theme (warm orange/amber + cool teal/cyan)
- [x] Set up database schema for network data, lore, and user preferences
- [x] Create ExtraHop API integration service layer

## Dashboard Features
- [x] Main landing dashboard with Destiny 2 frontier aesthetic
- [x] Real-time device status display (Guardians)
- [x] Traffic flow visualization (Light Stream)
- [x] Alert/detection panels (Threat Detections)
- [x] Performance metrics cards (Power Level)
- [x] Dynamic status ticker with Destiny 2 terminology

## Network Topology
- [x] Interactive network topology map (2D force-directed)
- [x] Device relationship visualization
- [x] Protocol activity display
- [x] ExtraHop activity maps API integration

## RAG Lore Chatbot
- [x] Pop-out chatbot UI in lower right corner
- [x] Destiny 2 lore knowledge base (comprehensive lore data)
- [x] Keyword-based semantic search for lore retrieval
- [x] LLM integration for lore Q&A
- [x] Books of Sorrow, Guardians, The Nine, and other lore categories

## Mini-Game
- [x] Mobile-responsive game container
- [x] Engram Hunter collection game with canvas rendering
- [x] Destiny 2 themed visuals (engram types, Guardian player)
- [x] Score tracking and leaderboard
- [x] Level progression system

## Notifications & Voice
- [x] Notification preferences settings
- [x] Voice interface component with Web Speech API
- [x] Ghost Voice Assistant for alert readouts (text-to-speech)
- [x] Voice-to-text for hands-free queries

## Settings & Configuration
- [x] ExtraHop API configuration page
- [x] Connection testing functionality
- [x] Notification preferences management
- [x] Voice settings

## UI/UX Polish
- [x] Destiny terminology mapping (device -> Guardian, etc.)
- [x] Responsive design for all screen sizes
- [x] Loading states and skeletons
- [x] Error handling and fallbacks
- [x] Translation matrix display on landing page
- [x] Glow effects and Destiny-themed animations

## Testing
- [x] Lore search tests (17 tests)
- [x] Destiny terminology mapping tests
- [x] Auth logout tests
- [x] TypeScript compilation check


## Urgent Fix
- [x] Remove all "Second Sight" branding from the application
- [x] Rename to "Vanguard Ops" / "Vanguard Network Operations"

## Crucible Operations Center (PvP Match Monitoring)
- [x] PS5 device configuration (Sony Interactive Entertainment BCD278)
- [x] Bungie server traffic pattern detection
- [x] Real-time PvP match state detection (orbit, matchmaking, in-match, post-game)
- [x] Connection quality monitoring (latency, packet loss, jitter)
- [x] Real-time latency graph during matches
- [x] Peer-to-peer connection analysis (hybrid P2P networking)
- [x] Peer count and connection quality per peer
- [x] Match timeline event logging
- [x] Post-game match review with network events overlay
- [x] Lag spike detection and alerting
- [x] Crucible Operations Center dashboard UI

## Critical Fix - Use Real ExtraHop API
- [x] Remove fake device registration - ExtraHop discovers devices automatically
- [x] Rewrite extrahop.ts to use actual API spec endpoints (/devices/search, /metrics, /records/search, /activitymaps/query, /detections/search)
- [x] Update Crucible page to search for PS5 by vendor "Sony Interactive Entertainment" 
- [x] Use /metrics endpoint with proper metric_category, metric_specs, object_ids
- [x] Use /records/search for flow records and connection data
- [x] Use /activitymaps/query for peer topology
- [x] Remove all simulated/fake data generation

## Real-time Metric Polling & PCAP Download
- [x] Implement 1-second polling for live metrics during Crucible matches
- [x] Add real-time latency/jitter/packet loss graphs with 1-second updates
- [x] Create getRealtimeDeviceMetrics and getRealtimePeers endpoints
- [x] Add PCAP download feature using /packets/search endpoint
- [x] Build PCAP capture UI with time range selection (last 5 min button)
- [x] Add downloadPcap and downloadMatchPcap mutations
- [x] Add download button to post-game match review

## Ghost Voice Alerts
- [x] Implement Ghost voice announcements for lag spikes during matches
- [x] Add voice alerts for connection quality changes (Excellent → Fair, etc.)
- [x] Create configurable alert thresholds (latency > 100ms, packet loss > 2%)
- [x] Use Web Speech API with Destiny-themed phrases ("Guardian, connection degraded")
- [x] Add mute/unmute toggle for voice alerts

## Nanosecond Precision Timestamps
- [x] Upgrade timeline event timestamps to nanosecond precision
- [x] Update database schema for BigInt nanosecond storage (already had timestampNs)
- [x] Implement high-resolution time formatting in UI (nanoseconds.ts utility)
- [x] Add nanosecond precision to PCAP correlation
- [x] Update match timeline display with ns-level accuracy (HH:MM:SS.ms.μs.ns)

## BPF Filter Builder
- [x] Create BPF filter builder UI component
- [x] Add preset filters for Destiny 2 traffic (UDP 3074, STUN 3478-3480, Bungie API)
- [x] Implement custom filter input with syntax validation
- [x] Add filter preview showing expected traffic types
- [x] Integrate BPF filters with PCAP download feature
