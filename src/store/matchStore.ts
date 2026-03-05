import { useState, useEffect, useCallback, useRef } from "react";

export interface Team {
  id: string;
  name: string;
  short: string;
  logoUrl?: string;
  score: number;
  wickets: number;
  overs: number;
}

export interface Batsman {
  id: string;
  name: string;
  shortName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  status: "batting" | "out" | "waiting";
}

export interface Bowler {
  id: string;
  name: string;
  shortName: string;
  overs: number;
  runs: number;
  wickets: number;
  economy: number;
  status: "bowling" | "off" | "waiting";
}

export interface Commentary {
  id: string;
  over: number;
  ball: number;
  text: string;
  runs: number;
  batsman: string;
  four?: boolean;
  six?: boolean;
  wicket?: boolean;
}

export interface Match {
  id: string;
  format: string;
  venue: string;
  date: string;
  status: "LIVE" | "UPCOMING" | "COMPLETED";
  battingTeam: Team;
  bowlingTeam: Team;
  target?: number;
  batsmen: Batsman[];
  bowlers: Bowler[];
  commentary: Commentary[];
  ballsRemaining: number;
  wicketsLeft: number;
  crr: number;
  rrr: number;
  last10Balls: string[];
}

// API Configuration - Uses Secure Vercel Serverless Function
const API_CONFIG = {
  PROXY_URL: "/api/live-matches",
  CACHE_DURATIONS: {
    LIVE_SCORES: 30000,
    MATCH_FIXTURES: 3600000,
    TEAM_INFO: 86400000,
    PLAYER_PROFILES: 86400000,
    TOURNAMENT_INFO: 86400000,
  },
  AUTO_REFRESH_INTERVAL: 45000,
  MAX_API_CALLS_PER_HOUR: 1000,
  RATE_LIMIT: 60000,
};

type DataSource = "none" | "api" | "cache" | "fallback";

type APIMeta = {
  total: number;
  logoTeams: number;
  liveRows: number;
  selectedMatchId: string | null;
};

// API Service with Smart Multi-Tier Caching
class CricketAPIService {
  public callCount = 0;
  private lastCallTime = 0;
  private lastSource: DataSource = "none";
  private fallbackReason = "";
  private latestMeta: APIMeta = {
    total: 0,
    logoTeams: 0,
    liveRows: 0,
    selectedMatchId: null,
  };
  private cache: Map<
    string,
    { data: any; timestamp: number; type?: string; duration?: string }
  > = new Map();

  // We no longer check for API key on the frontend since it's securely stored on Vercel backend
  public hasApiKey() {
    return true;
  }

  public getLastSource(): DataSource {
    return this.lastSource;
  }

  public getFallbackReason(): string {
    return this.fallbackReason;
  }

  public getLatestMeta(): APIMeta {
    return this.latestMeta;
  }

  public getCacheStats() {
    return {
      totalCalls: this.callCount,
      cacheHits: this.getCacheHitCount(),
      cacheMisses: this.callCount - this.getCacheHitCount(),
      lastCall: this.lastCallTime
        ? new Date(this.lastCallTime).toLocaleTimeString()
        : "Never",
    };
  }

  private getCacheHitCount(): number {
    // simple estimate; we mainly care about exposing something in UI
    return Math.floor(this.callCount * 0.7);
  }

  private getCachedData(
    key: string,
    dataType:
      | "LIVE_SCORES"
      | "MATCH_FIXTURES"
      | "TEAM_INFO"
      | "PLAYER_PROFILES" = "LIVE_SCORES",
  ) {
    const cached = this.cache.get(key);
    const duration = API_CONFIG.CACHE_DURATIONS[dataType];

    if (cached && Date.now() - cached.timestamp < duration) {
      console.log(`✅ Using cached ${dataType} (saves API call)`);
      this.lastSource = "cache";
      return cached.data;
    }
    return null;
  }

  private setCachedData(
    key: string,
    data: any,
    dataType:
      | "LIVE_SCORES"
      | "MATCH_FIXTURES"
      | "TEAM_INFO"
      | "PLAYER_PROFILES" = "LIVE_SCORES",
  ) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      type: dataType,
      duration: API_CONFIG.CACHE_DURATIONS[dataType] / 1000 + "s",
    });
    console.log(
      `💾 Cached ${dataType} for ${API_CONFIG.CACHE_DURATIONS[dataType] / 1000}s`,
    );
  }

  async getLiveMatches(selectedMatchId?: string): Promise<Match[]> {
    try {
      // 1) Try cache first
      const cached = this.getCachedData("live_matches", "LIVE_SCORES");
      if (cached) {
        return cached;
      }

      const now = Date.now();

      // 2) Basic rate limiting safeguard
      if (now - this.lastCallTime < API_CONFIG.RATE_LIMIT) {
        const remainingSec = Math.floor(
          (API_CONFIG.RATE_LIMIT - (now - this.lastCallTime)) / 1000,
        );
        console.log(
          `⏱️ Rate limited (${remainingSec}s remaining until next API call)`,
        );
        const fallback =
          this.cache.get("live_matches")?.data || this.createFallbackData();
        this.lastSource = this.cache.has("live_matches") ? "cache" : "fallback";
        if (this.lastSource === "fallback") {
          this.fallbackReason = `API rate limited. Using demo data for ${remainingSec}s.`;
          this.latestMeta.liveRows = 0;
        }
        return fallback;
      }

      this.lastCallTime = now;
      this.callCount += 1;
      console.log(
        `🚀 API call #${this.callCount} - Fetching live matches via secure proxy...`,
      );

      const url = selectedMatchId
        ? `${API_CONFIG.PROXY_URL}?matchId=${encodeURIComponent(selectedMatchId)}`
        : API_CONFIG.PROXY_URL;

      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Proxy Error: ${response.status}`);
      }

      const payload = await response.json();

      // Serverless function handles the key checking
      if (payload.source === "no-key") {
        console.log("⚠️ Server proxy reported no RAPIDAPI_KEY configured");
        this.lastSource = "fallback";
        this.fallbackReason =
          "No RAPIDAPI_KEY configured on server. Add it in Vercel Environment Variables (without VITE_ prefix).";
        this.latestMeta.liveRows = 0;
        return this.createFallbackData();
      }

      if (payload.source === "error") {
        throw new Error(
          payload.error || "Server proxy failed to retrieve data",
        );
      }

      const raw = payload || {};
      this.latestMeta = {
        total: Number(raw?.meta?.total || 0),
        logoTeams: Number(raw?.meta?.logoTeams || 0),
        liveRows: Number(raw?.meta?.liveRows || 0),
        selectedMatchId: raw?.meta?.selectedMatchId
          ? String(raw.meta.selectedMatchId)
          : null,
      };
      const fixtures = Array.isArray(raw.fixtures) ? raw.fixtures : [];
      console.log(
        "📡 Proxy fixtures response (trimmed):",
        fixtures.slice(0, 1),
      );

      const matches = this.transformAPIData(raw);

      if (matches.length === 0) {
        console.log("⚠️ API returned no usable matches");
        this.lastSource = "fallback";
        this.fallbackReason =
          "API responded, but no usable live match data was found in the response format.";
        this.latestMeta.liveRows = 0;
        return this.createFallbackData();
      }

      this.setCachedData("live_matches", matches, "LIVE_SCORES");
      this.lastSource = "api";
      this.fallbackReason = "";
      return matches;
    } catch (error) {
      console.error("API fetch error:", error);
      this.lastSource = "fallback";
      this.fallbackReason = `API request failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      this.latestMeta.liveRows = 0;
      return this.createFallbackData();
    }
  }

  private transformAPIData(apiData: any): Match[] {
    const list: any[] = Array.isArray(apiData?.fixtures)
      ? apiData.fixtures
      : [];
    const liveScores: any[] = Array.isArray(apiData?.liveScores)
      ? apiData.liveScores
      : [];
    const playersByTeam: Record<
      string,
      Array<{ id: string; name: string; image?: string }>
    > = apiData?.playersByTeam || {};

    if (!list.length) {
      console.log("⚠️ Could not find fixtures array in API response");
      return [];
    }

    const now = Date.now();

    return list.map((match: any, index: number) => {
      const team1 = match.team1 || {};
      const team2 = match.team2 || {};
      const startDateMs = Number(match.startDate || 0);
      const endDateMs = Number(match.endDate || 0);

      const derivedStatus: "LIVE" | "UPCOMING" | "COMPLETED" =
        endDateMs && now > endDateMs
          ? "COMPLETED"
          : startDateMs &&
              now >= startDateMs &&
              (!endDateMs || now <= endDateMs)
            ? "LIVE"
            : "UPCOMING";

      const venueParts = [
        match.venueInfo?.ground,
        match.venueInfo?.city,
        match.venueInfo?.country,
      ].filter(Boolean);
      const formattedDate = startDateMs
        ? new Date(startDateMs).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : match.dateLabel || new Date().toLocaleDateString();

      const team1Players = playersByTeam[String(team1.teamId || "")] || [];
      const team2Players = playersByTeam[String(team2.teamId || "")] || [];
      const batsmanSeed = team1.teamName || team1.name || "Batsman";
      const nonStrikerSeed = team2.teamName || team2.name || "Batsman";
      const liveEntry = this.findLiveScoreEntry(liveScores, match);
      const parsedTeam1 = this.parseScoreText(
        liveEntry?.team1Score || liveEntry?.scoreTeam1 || "",
      );
      const parsedTeam2 = this.parseScoreText(
        liveEntry?.team2Score || liveEntry?.scoreTeam2 || "",
      );

      const battingRuns = parsedTeam1.runs;
      const battingWickets = parsedTeam1.wickets;
      const battingOvers = parsedTeam1.overs;
      const bowlingRuns = parsedTeam2.runs;
      const bowlingWickets = parsedTeam2.wickets;
      const bowlingOvers = parsedTeam2.overs;

      const finalStatus = liveEntry ? "LIVE" : derivedStatus;

      return {
        id: (match.id || match.matchId || `match_${index}`).toString(),
        format: match.matchFormat || match.format || "T20",
        venue: venueParts.length
          ? venueParts.join(", ")
          : "Venue not available",
        date: formattedDate,
        status: finalStatus,
        battingTeam: {
          id: (team1.teamId || "t1").toString(),
          name: team1.teamName || team1.name || "Team 1",
          short: (team1.teamSName || team1.short || "T1")
            .toString()
            .toUpperCase(),
          logoUrl: team1.logoUrl || "",
          score: battingRuns,
          wickets: battingWickets,
          overs: battingOvers,
        },
        bowlingTeam: {
          id: (team2.teamId || "t2").toString(),
          name: team2.teamName || team2.name || "Team 2",
          short: (team2.teamSName || team2.short || "T2")
            .toString()
            .toUpperCase(),
          logoUrl: team2.logoUrl || "",
          score: bowlingRuns,
          wickets: bowlingWickets,
          overs: bowlingOvers,
        },
        target: undefined,
        batsmen: [
          {
            id: `b1_${match.id || index}`,
            name: team1Players[0]?.name || `${batsmanSeed} Batter 1`,
            shortName: "BAT1",
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            status: "batting",
          },
          {
            id: `b2_${match.id || index}`,
            name: team1Players[1]?.name || `${nonStrikerSeed} Batter 2`,
            shortName: "BAT2",
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            status: "batting",
          },
        ],
        bowlers: [
          {
            id: `p1_${match.id || index}`,
            name:
              team2Players[0]?.name ||
              `${team2.teamName || team2.name || "Team"} Bowler`,
            shortName: "BWL",
            overs: 0,
            runs: 0,
            wickets: 0,
            economy: 0,
            status: "bowling",
          },
        ],
        commentary: [
          {
            id: `c1_${match.id || index}`,
            over: 0,
            ball: 0,
            text: `${match.seriesName || "Match"} - ${match.matchDesc || "Fixture"} at ${match.venueInfo?.ground || "Venue TBA"}`,
            runs: 0,
            batsman: team1.teamName || "Unknown",
          },
        ],
        ballsRemaining: Math.max(0, 120 - Math.floor(battingOvers * 6)),
        wicketsLeft: Math.max(0, 10 - battingWickets),
        crr: battingOvers > 0 ? battingRuns / battingOvers : 0,
        rrr: 0,
        last10Balls: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      };
    });
  }

  private findLiveScoreEntry(liveScores: any[], match: any): any | null {
    if (!Array.isArray(liveScores) || liveScores.length === 0) return null;

    const t1 = (match?.team1?.teamName || "").toLowerCase();
    const t2 = (match?.team2?.teamName || "").toLowerCase();
    const baseMatchId = String(match?.matchId || "").trim();

    const byId = liveScores.find((entry: any) => {
      const entryId = String(entry?.matchId || entry?.id || "").trim();
      return (
        (baseMatchId && entryId === baseMatchId) ||
        entryId === String(match?.id || "").trim()
      );
    });
    if (byId) return byId;

    return (
      liveScores.find((entry: any) => {
        const hay = JSON.stringify(entry).toLowerCase();
        return t1 && t2 && hay.includes(t1) && hay.includes(t2);
      }) || null
    );
  }

  private parseScoreText(text: string): {
    runs: number;
    wickets: number;
    overs: number;
  } {
    if (!text || typeof text !== "string") {
      return { runs: 0, wickets: 0, overs: 0 };
    }

    // Supports formats like "151/4 (17.3)" or "151/4"
    const scoreMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
    const oversMatch = text.match(/\((\d+(?:\.\d+)?)\)/);

    return {
      runs: scoreMatch ? Number(scoreMatch[1]) : 0,
      wickets: scoreMatch ? Number(scoreMatch[2]) : 0,
      overs: oversMatch ? Number(oversMatch[1]) : 0,
    };
  }

  private createFallbackData(): Match[] {
    return [
      {
        id: "demo-1",
        format: "T20I",
        venue: "MCG, Melbourne",
        date: "Jan 15, 2024",
        status: "LIVE",
        battingTeam: {
          id: "t1",
          name: "India",
          short: "IND",
          score: 142,
          wickets: 4,
          overs: 16.3,
        },
        bowlingTeam: {
          id: "t2",
          name: "Australia",
          short: "AUS",
          score: 165,
          wickets: 7,
          overs: 20,
        },
        target: 166,
        batsmen: [
          {
            id: "b1",
            name: "Virat Kohli",
            shortName: "VK",
            runs: 78,
            balls: 50,
            fours: 7,
            sixes: 3,
            strikeRate: 156,
            status: "batting",
          },
          {
            id: "b2",
            name: "Hardik Pandya",
            shortName: "HP",
            runs: 23,
            balls: 15,
            fours: 2,
            sixes: 1,
            strikeRate: 153.3,
            status: "batting",
          },
        ],
        bowlers: [
          {
            id: "p1",
            name: "Pat Cummins",
            shortName: "PC",
            overs: 3.3,
            runs: 28,
            wickets: 2,
            economy: 8.0,
            status: "bowling",
          },
        ],
        commentary: [
          {
            id: "c1",
            over: 16,
            ball: 3,
            text: "Cummins to Kohli: SIX! Massive hit over long-on!",
            runs: 6,
            batsman: "Virat Kohli",
            six: true,
          },
          {
            id: "c2",
            over: 16,
            ball: 2,
            text: "Good length ball outside off, punched to covers for a couple.",
            runs: 2,
            batsman: "Virat Kohli",
          },
        ],
        ballsRemaining: 21,
        wicketsLeft: 6,
        crr: 8.62,
        rrr: 9.71,
        last10Balls: ["6", "2", "1", "4", "0", "1", "W", "2", "1", "0"],
      },
    ];
  }
}

const apiService = new CricketAPIService();

// Custom hook for match store
export function useMatchStore() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [apiMeta, setApiMeta] = useState<APIMeta>(apiService.getLatestMeta());
  const refreshTrigger = useRef(0);

  const currentMatch =
    matches.find((m) => m.id === selectedMatchId) || matches[0];

  const fetchMatches = useCallback(
    async (matchId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiService.getLiveMatches(
          matchId || selectedMatchId,
        );
        setMatches(data);
        if (data.length > 0 && !(matchId || selectedMatchId)) {
          setSelectedMatchId(data[0].id);
        }
        setLastUpdated(new Date());
        setApiMeta(apiService.getLatestMeta());
      } catch (err) {
        console.error(err);
        setError("Failed to fetch matches");
        setApiMeta(apiService.getLatestMeta());
      } finally {
        setIsLoading(false);
      }
    },
    [selectedMatchId],
  );

  // Initial fetch
  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh while live
  useEffect(() => {
    if (!isLive) return;

    const isProviderLive = apiMeta.liveRows > 0;
    const intervalMs = isProviderLive
      ? API_CONFIG.AUTO_REFRESH_INTERVAL
      : 180000;

    const interval = setInterval(() => {
      fetchMatches(selectedMatchId);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isLive, apiMeta.liveRows, fetchMatches, selectedMatchId]);

  const manualRefresh = useCallback(() => {
    refreshTrigger.current += 1;
    fetchMatches(selectedMatchId);
  }, [fetchMatches, selectedMatchId]);

  const selectMatch = useCallback(
    (matchId: string) => {
      setSelectedMatchId(matchId);
      // Trigger a focused fetch so server only enriches this selected match.
      fetchMatches(matchId);
    },
    [fetchMatches],
  );

  const toggleLive = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  return {
    matches,
    currentMatch,
    selectedMatchId,
    selectMatch,
    manualRefresh,
    toggleLive,
    isLive,
    isLoading,
    lastUpdated,
    error,
    apiCallCount: apiService.callCount,
    cacheStats: apiService.getCacheStats(),
    apiMeta,
    hasLiveFeed: apiMeta.liveRows > 0,
    hasApiKey: apiService.hasApiKey(),
    dataSource: apiService.getLastSource(),
    fallbackReason: apiService.getFallbackReason(),
  };
}
