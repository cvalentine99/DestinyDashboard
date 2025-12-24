/**
 * Bungie API Integration Service
 * 
 * Provides access to Destiny 2 match data including:
 * - Player search by Bungie name
 * - Activity history (Crucible matches)
 * - Post Game Carnage Reports (PGCR) with K/D, map, game mode
 * 
 * API Documentation: https://bungie-net.github.io/
 * API Root: https://www.bungie.net/Platform
 */

import axios, { AxiosInstance } from 'axios';

// Bungie API base URL
const BUNGIE_API_BASE = 'https://www.bungie.net/Platform';
const BUNGIE_ROOT = 'https://www.bungie.net';

// Membership types
export const MembershipType = {
  None: 0,
  Xbox: 1,
  PSN: 2,
  Steam: 3,
  Blizzard: 4,
  Stadia: 5,
  EpicGames: 6,
  All: -1,
  BungieNext: 254,
} as const;

// Activity modes for filtering
export const DestinyActivityModeType = {
  None: 0,
  Story: 2,
  Strike: 3,
  Raid: 4,
  AllPvP: 5,
  Patrol: 6,
  AllPvE: 7,
  Control: 10,
  Clash: 12,
  CrimsonDoubles: 15,
  Nightfall: 16,
  HeroicNightfall: 17,
  AllStrikes: 18,
  IronBanner: 19,
  AllMayhem: 25,
  Supremacy: 31,
  PrivateMatchesAll: 32,
  Survival: 37,
  Countdown: 38,
  TrialsOfTheNine: 39,
  Social: 40,
  TrialsCountdown: 41,
  TrialsSurvival: 42,
  IronBannerControl: 43,
  IronBannerClash: 44,
  IronBannerSupremacy: 45,
  ScoredNightfall: 46,
  ScoredHeroicNightfall: 47,
  Rumble: 48,
  AllDoubles: 49,
  Doubles: 50,
  PrivateMatchesClash: 51,
  PrivateMatchesControl: 52,
  PrivateMatchesSupremacy: 53,
  PrivateMatchesCountdown: 54,
  PrivateMatchesSurvival: 55,
  PrivateMatchesMayhem: 56,
  PrivateMatchesRumble: 57,
  HeroicAdventure: 58,
  Showdown: 59,
  Lockdown: 60,
  Scorched: 61,
  ScorchedTeam: 62,
  Gambit: 63,
  AllPvECompetitive: 64,
  Breakthrough: 65,
  BlackArmoryRun: 66,
  Salvage: 67,
  IronBannerSalvage: 68,
  PvPCompetitive: 69,
  PvPQuickplay: 70,
  ClashQuickplay: 71,
  ClashCompetitive: 72,
  ControlQuickplay: 73,
  ControlCompetitive: 74,
  GambitPrime: 75,
  Reckoning: 76,
  Menagerie: 77,
  VexOffensive: 78,
  NightmareHunt: 79,
  Elimination: 80,
  Momentum: 81,
  Dungeon: 82,
  Sundial: 83,
  TrialsOfOsiris: 84,
  Dares: 85,
  Offensive: 86,
  LostSector: 87,
  Rift: 88,
  ZoneControl: 89,
  IronBannerRift: 90,
  IronBannerZoneControl: 91,
  Relic: 92,
} as const;

// Helper function to parse activity mode to name
export function parseActivityMode(mode: number): string {
  return activityModeToDestinyName[mode] || 'Crucible';
}

// Helper function to calculate efficiency
export function calculateEfficiency(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists;
  return Math.round(((kills + assists) / deaths) * 100) / 100;
}

// Helper function to format Bungie name
export function formatBungieName(name: string, code: string): string {
  return `${name}#${code}`;
}

// Map activity mode to Destiny-themed name
export const activityModeToDestinyName: Record<number, string> = {
  [DestinyActivityModeType.AllPvP]: 'Crucible',
  [DestinyActivityModeType.Control]: 'Control',
  [DestinyActivityModeType.Clash]: 'Clash',
  [DestinyActivityModeType.Rumble]: 'Rumble',
  [DestinyActivityModeType.Survival]: 'Survival',
  [DestinyActivityModeType.Elimination]: 'Elimination',
  [DestinyActivityModeType.TrialsOfOsiris]: 'Trials of Osiris',
  [DestinyActivityModeType.IronBanner]: 'Iron Banner',
  [DestinyActivityModeType.IronBannerControl]: 'Iron Banner Control',
  [DestinyActivityModeType.IronBannerClash]: 'Iron Banner Clash',
  [DestinyActivityModeType.IronBannerRift]: 'Iron Banner Rift',
  [DestinyActivityModeType.Momentum]: 'Momentum Control',
  [DestinyActivityModeType.Showdown]: 'Showdown',
  [DestinyActivityModeType.Rift]: 'Rift',
  [DestinyActivityModeType.ZoneControl]: 'Zone Control',
};

// Types for API responses
export interface BungieResponse<T> {
  Response: T;
  ErrorCode: number;
  ThrottleSeconds: number;
  ErrorStatus: string;
  Message: string;
  MessageData: Record<string, string>;
}

export interface UserInfoCard {
  supplementalDisplayName?: string;
  iconPath?: string;
  crossSaveOverride: number;
  applicableMembershipTypes: number[];
  isPublic: boolean;
  membershipType: number;
  membershipId: string;
  displayName: string;
  bungieGlobalDisplayName?: string;
  bungieGlobalDisplayNameCode?: number;
}

export interface DestinyProfileResponse {
  profile?: {
    data?: {
      userInfo: UserInfoCard;
      dateLastPlayed: string;
      characterIds: string[];
    };
  };
  characters?: {
    data?: Record<string, DestinyCharacter>;
  };
}

export interface DestinyCharacter {
  characterId: string;
  dateLastPlayed: string;
  minutesPlayedTotal: string;
  light: number;
  classType: number; // 0=Titan, 1=Hunter, 2=Warlock
  raceType: number;
  genderType: number;
  emblemPath?: string;
  emblemBackgroundPath?: string;
}

export interface DestinyActivityHistoryResults {
  activities?: DestinyHistoricalStatsPeriodGroup[];
}

export interface DestinyHistoricalStatsPeriodGroup {
  period: string;
  activityDetails: DestinyHistoricalStatsActivity;
  values: Record<string, DestinyHistoricalStatsValue>;
}

export interface DestinyHistoricalStatsActivity {
  referenceId: number;
  directorActivityHash: number;
  instanceId: string;
  mode: number;
  modes: number[];
  isPrivate: boolean;
  membershipType: number;
}

export interface DestinyHistoricalStatsValue {
  statId: string;
  basic: {
    value: number;
    displayValue: string;
  };
}

export interface DestinyPostGameCarnageReportData {
  period: string;
  startingPhaseIndex?: number;
  activityWasStartedFromBeginning?: boolean;
  activityDetails: DestinyHistoricalStatsActivity;
  entries: DestinyPostGameCarnageReportEntry[];
  teams: DestinyPostGameCarnageReportTeamEntry[];
}

export interface DestinyPostGameCarnageReportEntry {
  standing: number;
  score: DestinyHistoricalStatsValue;
  player: {
    destinyUserInfo: UserInfoCard;
    characterClass?: string;
    classHash: number;
    raceHash: number;
    genderHash: number;
    characterLevel: number;
    lightLevel: number;
    emblemHash: number;
  };
  characterId: string;
  values: Record<string, DestinyHistoricalStatsValue>;
  extended?: {
    weapons?: Array<{
      referenceId: number;
      values: Record<string, DestinyHistoricalStatsValue>;
    }>;
  };
}

export interface DestinyPostGameCarnageReportTeamEntry {
  teamId: number;
  standing: DestinyHistoricalStatsValue;
  score: DestinyHistoricalStatsValue;
  teamName?: string;
}

// Processed match data for our app
export interface ProcessedMatchData {
  activityId: string;
  period: string;
  mode: number;
  modeName: string;
  mapHash: number;
  mapName?: string;
  duration: number; // seconds
  isPrivate: boolean;
  
  // Player stats
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  kda: number;
  efficiency: number;
  score: number;
  standing: number; // 0 = victory, 1 = defeat
  
  // Team info
  teamScore?: number;
  opponentScore?: number;
  
  // Additional stats
  precisionKills?: number;
  superKills?: number;
  grenadeKills?: number;
  meleeKills?: number;
  abilityKills?: number;
  weaponKillsMostUsed?: number;
  longestKillSpree?: number;
  averageLifespan?: number;
  
  // Raw data for correlation
  raw: {
    pgcr?: DestinyPostGameCarnageReportData;
    activity?: DestinyHistoricalStatsPeriodGroup;
  };
}

/**
 * Bungie API Client
 */
export class BungieClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: BUNGIE_API_BASE,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Search for a Destiny player by Bungie name (name#code format)
   */
  async searchPlayerByBungieName(
    displayName: string,
    displayNameCode: number,
    membershipType: number = MembershipType.All
  ): Promise<UserInfoCard[]> {
    const response = await this.client.post<BungieResponse<UserInfoCard[]>>(
      `/Destiny2/SearchDestinyPlayerByBungieName/${membershipType}/`,
      {
        displayName,
        displayNameCode,
      }
    );
    
    if (response.data.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${response.data.Message}`);
    }
    
    return response.data.Response;
  }

  /**
   * Parse a Bungie name string (e.g., "Guardian#1234") into components
   */
  parseBungieName(fullName: string): { displayName: string; displayNameCode: number } {
    const parts = fullName.split('#');
    if (parts.length !== 2) {
      throw new Error('Invalid Bungie name format. Expected "Name#Code" (e.g., "Guardian#1234")');
    }
    
    const displayName = parts[0];
    const displayNameCode = parseInt(parts[1], 10);
    
    if (isNaN(displayNameCode)) {
      throw new Error('Invalid Bungie name code. Must be a number.');
    }
    
    return { displayName, displayNameCode };
  }

  /**
   * Get a player's Destiny 2 profile with characters
   */
  async getProfile(
    membershipType: number,
    membershipId: string,
    components: number[] = [100, 200] // Profiles, Characters
  ): Promise<DestinyProfileResponse> {
    const response = await this.client.get<BungieResponse<DestinyProfileResponse>>(
      `/Destiny2/${membershipType}/Profile/${membershipId}/`,
      {
        params: {
          components: components.join(','),
        },
      }
    );
    
    if (response.data.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${response.data.Message}`);
    }
    
    return response.data.Response;
  }

  /**
   * Get activity history for a character
   */
  async getActivityHistory(
    membershipType: number,
    membershipId: string,
    characterId: string,
    options: {
      mode?: number;
      count?: number;
      page?: number;
    } = {}
  ): Promise<DestinyActivityHistoryResults> {
    const { mode = DestinyActivityModeType.AllPvP, count = 25, page = 0 } = options;
    
    const response = await this.client.get<BungieResponse<DestinyActivityHistoryResults>>(
      `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/`,
      {
        params: {
          mode,
          count,
          page,
        },
      }
    );
    
    if (response.data.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${response.data.Message}`);
    }
    
    return response.data.Response;
  }

  /**
   * Get Post Game Carnage Report for a specific activity
   */
  async getPostGameCarnageReport(activityId: string): Promise<DestinyPostGameCarnageReportData> {
    const response = await this.client.get<BungieResponse<DestinyPostGameCarnageReportData>>(
      `/Destiny2/Stats/PostGameCarnageReport/${activityId}/`
    );
    
    if (response.data.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${response.data.Message}`);
    }
    
    return response.data.Response;
  }

  /**
   * Get recent Crucible matches for a player
   */
  async getRecentCrucibleMatches(
    membershipType: number,
    membershipId: string,
    characterId: string,
    count: number = 10
  ): Promise<ProcessedMatchData[]> {
    const history = await this.getActivityHistory(
      membershipType,
      membershipId,
      characterId,
      { mode: DestinyActivityModeType.AllPvP, count }
    );

    if (!history.activities || history.activities.length === 0) {
      return [];
    }

    const matches: ProcessedMatchData[] = [];

    for (const activity of history.activities) {
      try {
        const pgcr = await this.getPostGameCarnageReport(activity.activityDetails.instanceId);
        const processed = this.processMatchData(activity, pgcr, membershipId);
        matches.push(processed);
      } catch (error) {
        // PGCR might not be available for very old matches
        console.warn(`Failed to get PGCR for activity ${activity.activityDetails.instanceId}:`, error);
        
        // Still add basic match data without PGCR
        matches.push(this.processMatchDataBasic(activity));
      }
    }

    return matches;
  }

  /**
   * Process match data from activity history and PGCR
   */
  private processMatchData(
    activity: DestinyHistoricalStatsPeriodGroup,
    pgcr: DestinyPostGameCarnageReportData,
    membershipId: string
  ): ProcessedMatchData {
    const values = activity.values;
    const mode = activity.activityDetails.mode;
    
    // Find the player's entry in the PGCR
    const playerEntry = pgcr.entries.find(
      e => e.player.destinyUserInfo.membershipId === membershipId
    );

    // Get team scores if available
    let teamScore: number | undefined;
    let opponentScore: number | undefined;
    
    if (playerEntry && pgcr.teams && pgcr.teams.length >= 2) {
      const playerTeam = pgcr.teams.find(t => 
        pgcr.entries.some(e => 
          e.player.destinyUserInfo.membershipId === membershipId && 
          e.values.team?.basic.value === t.teamId
        )
      );
      
      if (playerTeam) {
        teamScore = playerTeam.score.basic.value;
        const opponent = pgcr.teams.find(t => t.teamId !== playerTeam.teamId);
        opponentScore = opponent?.score.basic.value;
      }
    }

    // Extract extended stats from PGCR
    const extendedValues = playerEntry?.values || {};

    return {
      activityId: activity.activityDetails.instanceId,
      period: activity.period,
      mode,
      modeName: activityModeToDestinyName[mode] || `Mode ${mode}`,
      mapHash: activity.activityDetails.directorActivityHash,
      duration: values.activityDurationSeconds?.basic.value || 0,
      isPrivate: activity.activityDetails.isPrivate,
      
      kills: values.kills?.basic.value || 0,
      deaths: values.deaths?.basic.value || 0,
      assists: values.assists?.basic.value || 0,
      kd: values.killsDeathsRatio?.basic.value || 0,
      kda: values.killsDeathsAssists?.basic.value || 0,
      efficiency: values.efficiency?.basic.value || 0,
      score: values.score?.basic.value || 0,
      standing: values.standing?.basic.value || 0,
      
      teamScore,
      opponentScore,
      
      precisionKills: extendedValues.precisionKills?.basic.value,
      superKills: extendedValues.weaponKillsSuper?.basic.value,
      grenadeKills: extendedValues.weaponKillsGrenade?.basic.value,
      meleeKills: extendedValues.weaponKillsMelee?.basic.value,
      abilityKills: extendedValues.weaponKillsAbility?.basic.value,
      longestKillSpree: extendedValues.longestKillSpree?.basic.value,
      averageLifespan: extendedValues.averageScorePerLife?.basic.value,
      
      raw: {
        pgcr,
        activity,
      },
    };
  }

  /**
   * Process basic match data when PGCR is unavailable
   */
  private processMatchDataBasic(activity: DestinyHistoricalStatsPeriodGroup): ProcessedMatchData {
    const values = activity.values;
    const mode = activity.activityDetails.mode;

    return {
      activityId: activity.activityDetails.instanceId,
      period: activity.period,
      mode,
      modeName: activityModeToDestinyName[mode] || `Mode ${mode}`,
      mapHash: activity.activityDetails.directorActivityHash,
      duration: values.activityDurationSeconds?.basic.value || 0,
      isPrivate: activity.activityDetails.isPrivate,
      
      kills: values.kills?.basic.value || 0,
      deaths: values.deaths?.basic.value || 0,
      assists: values.assists?.basic.value || 0,
      kd: values.killsDeathsRatio?.basic.value || 0,
      kda: values.killsDeathsAssists?.basic.value || 0,
      efficiency: values.efficiency?.basic.value || 0,
      score: values.score?.basic.value || 0,
      standing: values.standing?.basic.value || 0,
      
      raw: {
        activity,
      },
    };
  }

  /**
   * Get full Bungie.net asset URL
   */
  getAssetUrl(path: string): string {
    if (!path) return '';
    return `${BUNGIE_ROOT}${path}`;
  }

  /**
   * Get character class name
   */
  getClassName(classType: number): string {
    switch (classType) {
      case 0: return 'Titan';
      case 1: return 'Hunter';
      case 2: return 'Warlock';
      default: return 'Unknown';
    }
  }
}

/**
 * Correlate network performance with match results
 */
export interface MatchNetworkCorrelation {
  matchId: string;
  bungieActivityId: string;
  
  // Match results
  kd: number;
  kills: number;
  deaths: number;
  standing: number; // 0 = win, 1 = loss
  modeName: string;
  
  // Network metrics during match
  avgLatency: number;
  maxLatency: number;
  minLatency: number;
  avgJitter: number;
  maxJitter: number;
  packetLoss: number;
  lagSpikeCount: number;
  
  // Correlation insights
  performanceImpact: 'positive' | 'neutral' | 'negative';
  insights: string[];
}

/**
 * Analyze correlation between network performance and match results
 */
export function analyzeNetworkMatchCorrelation(
  matchData: ProcessedMatchData,
  networkMetrics: {
    avgLatency: number;
    maxLatency: number;
    minLatency: number;
    avgJitter: number;
    maxJitter: number;
    packetLoss: number;
    lagSpikeCount: number;
  }
): MatchNetworkCorrelation {
  const insights: string[] = [];
  let performanceImpact: 'positive' | 'neutral' | 'negative' = 'neutral';

  // Analyze latency impact
  if (networkMetrics.avgLatency > 100) {
    insights.push(`High average latency (${networkMetrics.avgLatency.toFixed(0)}ms) may have affected reaction time`);
    performanceImpact = 'negative';
  } else if (networkMetrics.avgLatency < 30) {
    insights.push(`Excellent latency (${networkMetrics.avgLatency.toFixed(0)}ms) provided optimal responsiveness`);
    if (matchData.kd > 1.5) {
      performanceImpact = 'positive';
    }
  }

  // Analyze jitter impact
  if (networkMetrics.avgJitter > 20) {
    insights.push(`High jitter (${networkMetrics.avgJitter.toFixed(0)}ms) caused inconsistent hit registration`);
    performanceImpact = 'negative';
  }

  // Analyze packet loss
  if (networkMetrics.packetLoss > 2) {
    insights.push(`Packet loss (${networkMetrics.packetLoss.toFixed(1)}%) resulted in missed inputs and ghost bullets`);
    performanceImpact = 'negative';
  }

  // Analyze lag spikes
  if (networkMetrics.lagSpikeCount > 5) {
    insights.push(`${networkMetrics.lagSpikeCount} lag spikes detected during match - likely caused deaths`);
    performanceImpact = 'negative';
  }

  // Correlate with K/D
  if (matchData.kd < 1.0 && networkMetrics.avgLatency > 80) {
    insights.push('Poor K/D correlates with high latency - network issues likely contributed to deaths');
  } else if (matchData.kd > 2.0 && networkMetrics.avgLatency < 40) {
    insights.push('Strong K/D achieved with stable connection - optimal conditions for competitive play');
  }

  // Win/loss correlation
  if (matchData.standing === 1 && networkMetrics.lagSpikeCount > 3) {
    insights.push('Match loss occurred with multiple lag spikes - network stability may have been a factor');
  }

  return {
    matchId: '', // To be filled by caller
    bungieActivityId: matchData.activityId,
    kd: matchData.kd,
    kills: matchData.kills,
    deaths: matchData.deaths,
    standing: matchData.standing,
    modeName: matchData.modeName,
    ...networkMetrics,
    performanceImpact,
    insights,
  };
}
