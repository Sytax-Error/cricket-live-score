import { useState, useEffect } from "react";
import {
  Trophy,
  Volume2,
  VolumeX,
  Circle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useMatchStore } from "./store/matchStore";

function App() {
  const {
    matches,
    currentMatch,
    selectMatch,
    isLive,
    toggleLive,
    manualRefresh,
    isLoading,
    lastUpdated,
    cacheStats,
    apiMeta,
    hasApiKey,
    dataSource,
    fallbackReason,
  } = useMatchStore();

  const [muted, setMuted] = useState(false);
  const [expandedCommentary, setExpandedCommentary] = useState(true);
  const [activeTab, setActiveTab] = useState<"commentary" | "stats">(
    "commentary",
  );
  const [lastTenBalls, setLastTenBalls] = useState<string[]>([
    "1",
    "4",
    "W",
    "0",
    "2",
    "6",
    "1",
    "0",
    "4",
    "1",
  ]);
  const [showDataModal, setShowDataModal] = useState(false);

  useEffect(() => {
    if (isLive && currentMatch?.status === "LIVE") {
      const interval = setInterval(() => {
        const balls = ["0", "1", "2", "3", "4", "6", "W"];
        const randomBall = balls[Math.floor(Math.random() * balls.length)];
        setLastTenBalls((prev) => [...prev.slice(1), randomBall]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLive, currentMatch?.status]);

  useEffect(() => {
    if (dataSource === "fallback") {
      setShowDataModal(true);
    }
  }, [dataSource, fallbackReason]);

  const toggleMute = () => setMuted(!muted);

  const isDemoMode = dataSource === "fallback";
  const hasLiveRows = (apiMeta?.liveRows ?? 0) > 0;
  const liveIndicatorActive =
    isLive && hasLiveRows && dataSource !== "fallback";

  const getFriendlyDemoReason = (reason?: string) => {
    if (!reason) return "Live score updates are not available at the moment.";

    const normalized = reason.toLowerCase();

    if (normalized.includes("no api key")) {
      return "Live score connection is not set up yet.";
    }

    if (normalized.includes("network") || normalized.includes("fetch")) {
      return "We could not connect to live scores due to a network issue.";
    }

    if (
      normalized.includes("no usable matches") ||
      normalized.includes("no matches")
    ) {
      return "No live match feed is available right now from the provider.";
    }

    return "Live score updates are temporarily unavailable.";
  };

  const getBallColor = (ball: string) => {
    switch (ball) {
      case "W":
        return "bg-red-500";
      case "6":
        return "bg-gradient-to-br from-purple-500 to-pink-500";
      case "4":
        return "bg-gradient-to-br from-green-500 to-emerald-500";
      case "0":
        return "bg-slate-700";
      default:
        return "bg-blue-500";
    }
  };

  const getCommentaryIcon = (item: (typeof currentMatch.commentary)[0]) => {
    if (item.wicket) return "⚡";
    if (item.six) return "🔥";
    if (item.four) return "💥";
    return "⚪";
  };

  const renderTeamBadge = (
    team: typeof currentMatch.battingTeam | undefined,
    fallbackClass: string,
  ) => {
    if (!team) return null;

    if (team.logoUrl) {
      return (
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shadow-lg">
          <img
            src={team.logoUrl}
            alt={team.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${fallbackClass}`}
      >
        {team.short}
      </div>
    );
  };

  // Get striker and non-striker
  const striker =
    currentMatch?.batsmen?.find((b) => b.status === "batting") ||
    currentMatch?.batsmen?.[0];
  const nonStriker =
    currentMatch?.batsmen?.find(
      (b) => b.status === "batting" && b.id !== striker?.id,
    ) || currentMatch?.batsmen?.[1];
  const currentBowler =
    currentMatch?.bowlers?.find((b) => b.status === "bowling") ||
    currentMatch?.bowlers?.[0];
  const otherMatches = matches.filter((m) => m.id !== currentMatch?.id);
  const matchesForList = otherMatches.length ? otherMatches : matches;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/50">
        <div className="w-full px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Cricket Live
              </h1>
              <p className="text-[10px] text-slate-400">Real-time Score</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Data source badge: shows if we're on API, cache or demo data */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] sm:text-[10px] border ${
                !hasApiKey || dataSource === "fallback"
                  ? "bg-slate-800/80 border-slate-700 text-slate-300"
                  : dataSource === "api"
                    ? "bg-emerald-500/10 border-emerald-400/60 text-emerald-300"
                    : "bg-blue-500/10 border-blue-400/60 text-blue-300"
              }`}
              title={
                !hasApiKey
                  ? "Using demo data (no API key configured)"
                  : dataSource === "api"
                    ? "Live data from RapidAPI"
                    : dataSource === "cache"
                      ? "Using cached API data"
                      : "Demo fallback data"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  !hasApiKey || dataSource === "fallback"
                    ? "bg-slate-400"
                    : dataSource === "api"
                      ? "bg-emerald-400"
                      : "bg-blue-400"
                }`}
              />
              <span>
                {!hasApiKey || dataSource === "fallback"
                  ? "DEMO DATA"
                  : dataSource === "api"
                    ? "LIVE API"
                    : "CACHED API"}
              </span>
            </div>

            <button
              onClick={toggleLive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                !isLive
                  ? "bg-slate-800 text-slate-400 border border-slate-700"
                  : liveIndicatorActive
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
              title={
                !isLive
                  ? "Auto-refresh paused"
                  : liveIndicatorActive
                    ? "Live match feed is active"
                    : "No live match feed currently available"
              }
            >
              <Circle
                className={`w-2 h-2 ${
                  !isLive
                    ? ""
                    : liveIndicatorActive
                      ? "fill-green-400 animate-pulse"
                      : "fill-amber-300"
                }`}
              />
              {!isLive ? "PAUSED" : liveIndicatorActive ? "LIVE" : "NO LIVE"}
            </button>
            <button
              onClick={manualRefresh}
              disabled={isLoading}
              className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data (saves API calls)"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 lg:px-8 py-4">
        {/* Desktop: Full width grid layout */}
        <div className="hidden lg:grid grid-cols-12 gap-6 max-w-[1800px] mx-auto">
          {/* Left: Score & Stats (8 columns) */}
          <div className="col-span-8 space-y-4">
            {/* Main Score Card */}
            <section className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
              {/* Match Info Bar */}
              <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-700/50 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-md font-semibold text-white">
                    {currentMatch?.format}
                  </span>
                  <span className="text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {currentMatch?.venue}
                  </span>
                </div>
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {currentMatch?.date}
                </span>
              </div>

              {/* Teams & Score */}
              <div className="p-6">
                {/* Batting Team */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {renderTeamBadge(
                      currentMatch?.battingTeam,
                      "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30",
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {currentMatch?.battingTeam?.name}
                      </h2>
                      <span className="text-sm text-green-400 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Batting
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                      {currentMatch?.battingTeam?.score}
                      <span className="text-2xl text-slate-500">
                        /{currentMatch?.battingTeam?.wickets}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      ({currentMatch?.battingTeam?.overs} ov)
                    </div>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="flex items-center gap-6 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                  <span className="text-sm font-bold text-slate-500">VS</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                </div>

                {/* Bowling Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {renderTeamBadge(
                      currentMatch?.bowlingTeam,
                      "bg-gradient-to-br from-yellow-500 to-yellow-600 text-slate-900 shadow-yellow-500/30",
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {currentMatch?.bowlingTeam?.name}
                      </h2>
                      <span className="text-sm text-blue-400">Bowling</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {currentMatch?.bowlingTeam?.score > 0 ? (
                      <div>
                        <div className="text-3xl font-bold text-slate-300">
                          {currentMatch?.bowlingTeam?.score}/
                          {currentMatch?.bowlingTeam?.wickets}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          ({currentMatch?.bowlingTeam?.overs} ov)
                        </div>
                      </div>
                    ) : (
                      <span className="text-base text-slate-500">
                        Yet to bat
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Target / Need */}
              {currentMatch?.target && (
                <div className="px-6 py-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-base mb-3">
                    <span className="text-slate-400">
                      Target:{" "}
                      <span className="text-slate-200 font-semibold">
                        {currentMatch?.target} runs
                      </span>
                    </span>
                    <span className="text-orange-400 font-bold text-lg">
                      Need{" "}
                      {Math.max(
                        0,
                        currentMatch?.target - currentMatch?.battingTeam?.score,
                      )}{" "}
                      runs
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (currentMatch?.battingTeam?.score / currentMatch?.target) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Batsmen & Bowler Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Striker */}
              {striker && (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-orange-400 font-semibold flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" /> STRIKER
                    </span>
                    <span className="text-xs text-slate-500">
                      {striker.strikeRate.toFixed(1)} SR
                    </span>
                  </div>
                  <div className="text-base font-bold text-white mb-2">
                    {striker.name}
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-orange-400">
                      {striker.runs}
                    </span>
                    <span className="text-sm text-slate-400">
                      ({striker.balls})
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                      {striker.fours}×4s
                    </span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                      {striker.sixes}×6s
                    </span>
                  </div>
                </div>
              )}

              {/* Non-Striker */}
              {nonStriker && (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-semibold">
                      NON-STRIKER
                    </span>
                    <span className="text-xs text-slate-500">
                      {nonStriker.strikeRate.toFixed(1)} SR
                    </span>
                  </div>
                  <div className="text-base font-bold text-white mb-2">
                    {nonStriker.name}
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-slate-200">
                      {nonStriker.runs}
                    </span>
                    <span className="text-sm text-slate-400">
                      ({nonStriker.balls})
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                      {nonStriker.fours}×4s
                    </span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                      {nonStriker.sixes}×6s
                    </span>
                  </div>
                </div>
              )}

              {/* Bowler */}
              {currentBowler && (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-400 font-semibold">
                      BOWLER
                    </span>
                    <span className="text-xs text-slate-500">
                      Econ: {currentBowler.economy.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white mb-2">
                    {currentBowler.name}
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-blue-400">
                      {currentBowler.wickets}/{currentBowler.runs}
                    </span>
                    <span className="text-sm text-slate-400">
                      ({currentBowler.overs} ov)
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {currentBowler.economy.toFixed(2)} econ
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700/30">
                <div className="text-xs text-slate-400 mb-2">CRR</div>
                <div className="text-2xl font-bold text-green-400">
                  {currentMatch?.crr?.toFixed(2) || "0.00"}
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700/30">
                <div className="text-xs text-slate-400 mb-2">RRR</div>
                <div className="text-2xl font-bold text-orange-400">
                  {currentMatch?.rrr?.toFixed(2) || "0.00"}
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700/30">
                <div className="text-xs text-slate-400 mb-2">BALLS</div>
                <div className="text-2xl font-bold text-blue-400">
                  {currentMatch?.ballsRemaining || 0}
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700/30">
                <div className="text-xs text-slate-400 mb-2">WKTS</div>
                <div className="text-2xl font-bold text-red-400">
                  {currentMatch?.wicketsLeft || 0}
                </div>
              </div>
            </div>

            {/* Last 10 Balls */}
            <div className="bg-slate-800/30 backdrop-blur rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-300">
                  Last 10 Balls
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {lastTenBalls.map((ball, index) => (
                  <div
                    key={index}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${getBallColor(ball)} shadow-lg`}
                  >
                    {ball}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Commentary & Other Matches (4 columns) */}
          <div className="col-span-4 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("commentary")}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "commentary"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50"
                }`}
              >
                Commentary
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "stats"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50"
                }`}
              >
                Statistics
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "commentary" ? (
              <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 overflow-hidden">
                <button
                  onClick={() => setExpandedCommentary(!expandedCommentary)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50"
                >
                  <span className="text-sm font-semibold text-slate-200">
                    Live Commentary
                  </span>
                  {expandedCommentary ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {expandedCommentary && (
                  <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                    {currentMatch?.commentary
                      ?.slice(0, 15)
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg text-sm ${index === 0 ? "bg-orange-500/10 border border-orange-500/30" : "bg-slate-800/50"}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl">
                              {getCommentaryIcon(item)}
                            </span>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-200 mb-1">
                                {item.over}.{item.ball}
                              </div>
                              <div className="text-slate-400 leading-relaxed">
                                {item.text}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 p-6 space-y-6">
                {/* Batting Stats */}
                <div>
                  <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    Batting Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="text-slate-400 mb-2 text-sm">
                        Total Runs
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {currentMatch?.battingTeam?.score}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="text-slate-400 mb-2 text-sm">
                        Boundaries
                      </div>
                      <div className="text-lg font-bold text-white">
                        {currentMatch?.batsmen?.reduce(
                          (acc, b) => acc + b.fours,
                          0,
                        ) || 0}
                        ×4s,
                        {currentMatch?.batsmen?.reduce(
                          (acc, b) => acc + b.sixes,
                          0,
                        ) || 0}
                        ×6s
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bowling Stats */}
                <div>
                  <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Bowling Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="text-slate-400 mb-2 text-sm">
                        Current Over
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {currentBowler?.runs || 0} runs
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="text-slate-400 mb-2 text-sm">Wickets</div>
                      <div className="text-2xl font-bold text-white">
                        {currentBowler?.wickets || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Matches */}
            <div className="bg-slate-800/30 backdrop-blur rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-slate-300">
                    Other Matches
                  </h3>
                </div>
              </div>
              <div className="max-h-100 overflow-y-auto pr-1 space-y-2">
                {matches
                  .filter((m) => m.id !== currentMatch?.id)
                  .map((match) => (
                    <button
                      key={match.id}
                      onClick={() => selectMatch(match.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-colors ${
                        match.id === currentMatch?.id
                          ? "border-amber-400/80 bg-slate-900/80"
                          : "border-slate-700/50 bg-slate-800/40 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            match.status === "LIVE"
                              ? "bg-green-500/20 text-green-400"
                              : match.status === "UPCOMING"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {match.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-white truncate">
                        {match.battingTeam.name} vs {match.bowlingTeam.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {match.format} • {match.venue}
                      </div>
                      {match.battingTeam.score > 0 && (
                        <div className="text-xs text-slate-300 mt-1 font-mono">
                          {match.battingTeam.score}/{match.battingTeam.wickets}{" "}
                          ({match.battingTeam.overs} ov)
                        </div>
                      )}
                    </button>
                  ))}

                {matches.filter((m) => m.id !== currentMatch?.id).length ===
                  0 && (
                  <p className="text-xs text-slate-500">
                    No other matches available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Compact single-column layout */}
        <div className="lg:hidden max-w-md mx-auto space-y-3">
          {/* Main Score Card */}
          <section className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
            {/* Match Info Bar */}
            <div className="px-3 py-2 bg-slate-950/50 border-b border-slate-700/50 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-md font-semibold text-white">
                  {currentMatch?.format}
                </span>
                <span className="text-slate-400 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[100px]">
                    {currentMatch?.venue?.split(",")[0]}
                  </span>
                </span>
              </div>
              <span className="text-slate-400 flex items-center gap-1 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                {currentMatch?.date}
              </span>
            </div>

            {/* Teams & Score */}
            <div className="p-4">
              {/* Batting Team */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30 flex-shrink-0">
                    {currentMatch?.battingTeam?.short}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white truncate">
                      {currentMatch?.battingTeam?.name}
                    </h2>
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Batting
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    {currentMatch?.battingTeam?.score}
                    <span className="text-lg text-slate-500">
                      /{currentMatch?.battingTeam?.wickets}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    ({currentMatch?.battingTeam?.overs} ov)
                  </div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                <span className="text-xs font-bold text-slate-500">VS</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              </div>

              {/* Bowling Team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg shadow-yellow-500/30 flex-shrink-0">
                    {currentMatch?.bowlingTeam?.short}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white truncate">
                      {currentMatch?.bowlingTeam?.name}
                    </h2>
                    <span className="text-xs text-blue-400">Bowling</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {currentMatch?.bowlingTeam?.score > 0 ? (
                    <div>
                      <div className="text-xl font-bold text-slate-300">
                        {currentMatch?.bowlingTeam?.score}/
                        {currentMatch?.bowlingTeam?.wickets}
                      </div>
                      <div className="text-xs text-slate-500">
                        ({currentMatch?.bowlingTeam?.overs} ov)
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">Yet to bat</span>
                  )}
                </div>
              </div>
            </div>

            {/* Target / Need */}
            {currentMatch?.target && (
              <div className="px-4 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">
                    Target:{" "}
                    <span className="text-slate-200 font-semibold">
                      {currentMatch?.target} runs
                    </span>
                  </span>
                  <span className="text-orange-400 font-bold">
                    Need{" "}
                    {Math.max(
                      0,
                      currentMatch?.target - currentMatch?.battingTeam?.score,
                    )}{" "}
                    runs
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (currentMatch?.battingTeam?.score / currentMatch?.target) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Batsmen & Bowler Grid - Compact for mobile */}
          <div className="grid grid-cols-2 gap-2">
            {/* Striker */}
            {striker && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-orange-400 font-semibold flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> STRIKER
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {striker.strikeRate.toFixed(1)} SR
                  </span>
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {striker.name}
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-orange-400">
                    {striker.runs}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({striker.balls})
                  </span>
                </div>
                <div className="flex gap-1.5 mt-2 text-[10px]">
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                    {striker.fours}×4s
                  </span>
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                    {striker.sixes}×6s
                  </span>
                </div>
              </div>
            )}

            {/* Non-Striker */}
            {nonStriker && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">
                    NON-STRIKER
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {nonStriker.strikeRate.toFixed(1)} SR
                  </span>
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {nonStriker.name}
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-200">
                    {nonStriker.runs}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({nonStriker.balls})
                  </span>
                </div>
                <div className="flex gap-1.5 mt-2 text-[10px]">
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                    {nonStriker.fours}×4s
                  </span>
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                    {nonStriker.sixes}×6s
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bowler - Full Width */}
          {currentBowler && (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] text-blue-400 font-semibold px-2 py-0.5 bg-blue-500/10 rounded flex-shrink-0">
                    BOWLER
                  </span>
                  <span className="text-sm font-bold text-white truncate">
                    {currentBowler.name}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-black text-blue-400">
                    {currentBowler.wickets}/{currentBowler.runs}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentBowler.overs} ov | Econ:{" "}
                    {currentBowler.economy.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-800/30 rounded-lg p-2 text-center border border-slate-700/30">
              <div className="text-[10px] text-slate-400 mb-0.5">CRR</div>
              <div className="text-sm font-bold text-green-400">
                {currentMatch?.crr?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-2 text-center border border-slate-700/30">
              <div className="text-[10px] text-slate-400 mb-0.5">RRR</div>
              <div className="text-sm font-bold text-orange-400">
                {currentMatch?.rrr?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-2 text-center border border-slate-700/30">
              <div className="text-[10px] text-slate-400 mb-0.5">BALLS</div>
              <div className="text-sm font-bold text-blue-400">
                {currentMatch?.ballsRemaining || 0}
              </div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-2 text-center border border-slate-700/30">
              <div className="text-[10px] text-slate-400 mb-0.5">WKTS</div>
              <div className="text-sm font-bold text-red-400">
                {currentMatch?.wicketsLeft || 0}
              </div>
            </div>
          </div>

          {/* Last 10 Balls */}
          <div className="bg-slate-800/30 backdrop-blur rounded-xl p-3 border border-slate-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Last 10 Balls
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {lastTenBalls.map((ball, index) => (
                <div
                  key={index}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${getBallColor(ball)} shadow-lg`}
                >
                  {ball}
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("commentary")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "commentary"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                  : "bg-slate-800/50 text-slate-400 border border-slate-700/50"
              }`}
            >
              Commentary
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "stats"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                  : "bg-slate-800/50 text-slate-400 border border-slate-700/50"
              }`}
            >
              Statistics
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "commentary" ? (
            <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 overflow-hidden">
              <button
                onClick={() => setExpandedCommentary(!expandedCommentary)}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50"
              >
                <span className="text-sm font-semibold text-slate-200">
                  Live Commentary
                </span>
                {expandedCommentary ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {expandedCommentary && (
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                  {currentMatch?.commentary?.slice(0, 10).map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg text-xs ${index === 0 ? "bg-orange-500/10 border border-orange-500/30" : "bg-slate-800/50"}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base">
                          {getCommentaryIcon(item)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-200 mb-0.5">
                            {item.over}.{item.ball}
                          </div>
                          <div className="text-slate-400 leading-relaxed">
                            {item.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/30 p-4 space-y-4">
              {/* Batting Stats */}
              <div>
                <h4 className="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  Batting Analysis
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <div className="text-slate-400 mb-0.5">Total Runs</div>
                    <div className="text-base font-bold text-white">
                      {currentMatch?.battingTeam?.score}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <div className="text-slate-400 mb-0.5">Boundaries</div>
                    <div className="text-base font-bold text-white">
                      {currentMatch?.batsmen?.reduce(
                        (acc, b) => acc + b.fours,
                        0,
                      ) || 0}
                      ×4s,
                      {currentMatch?.batsmen?.reduce(
                        (acc, b) => acc + b.sixes,
                        0,
                      ) || 0}
                      ×6s
                    </div>
                  </div>
                </div>
              </div>

              {/* Bowling Stats */}
              <div>
                <h4 className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Bowling Analysis
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <div className="text-slate-400 mb-0.5">Current Over</div>
                    <div className="text-base font-bold text-white">
                      {currentBowler?.runs || 0} runs
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <div className="text-slate-400 mb-0.5">Wickets</div>
                    <div className="text-base font-bold text-white">
                      {currentBowler?.wickets || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Matches */}
          <div className="bg-slate-800/30 backdrop-blur rounded-xl p-3 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-3">
              <Circle className="w-3 h-3 text-orange-400" />
              <h3 className="text-xs font-semibold text-slate-300">
                Other Matches
              </h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {matchesForList.map((match) => (
                <button
                  key={match.id}
                  onClick={() => selectMatch(match.id)}
                  className="flex-shrink-0 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 min-w-[150px] text-left hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        match.status === "LIVE"
                          ? "bg-green-500/20 text-green-400"
                          : match.status === "UPCOMING"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">
                    {match.battingTeam.name} vs {match.bowlingTeam.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {match.format}
                  </div>
                  {match.battingTeam.score > 0 && (
                    <div className="text-xs text-slate-300 mt-1 font-mono">
                      {match.battingTeam.score}/{match.battingTeam.wickets}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 lg:px-8 py-3 text-center border-t border-slate-800/50 bg-slate-950/50 space-y-1">
        {/* Mobile-only quick data source indicator */}
        <div className="sm:hidden text-[10px] text-slate-400">
          Data source:
          <span
            className={`ml-1 font-semibold ${
              !hasApiKey || dataSource === "fallback"
                ? "text-slate-200"
                : dataSource === "api"
                  ? "text-emerald-400"
                  : "text-blue-300"
            }`}
          >
            {!hasApiKey || dataSource === "fallback"
              ? "DEMO DATA"
              : dataSource === "api"
                ? "LIVE API"
                : "CACHED API"}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-4">
            <span>Cricket Live Score • Real-time updates</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            {cacheStats && (
              <>
                <span className="text-blue-400">
                  API calls: {cacheStats.totalCalls}
                </span>
                <span className="text-green-400">
                  Cache hits: {cacheStats.cacheHits}
                </span>
                <span className="text-orange-400">
                  Data:{" "}
                  {!hasApiKey
                    ? "DEMO (no API key)"
                    : dataSource === "api"
                      ? "LIVE API"
                      : dataSource === "cache"
                        ? "CACHED API"
                        : "DEMO"}
                </span>
              </>
            )}
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-4">
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-green-400">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <span className="text-slate-400">
                Next: {cacheStats?.lastCall || "N/A"}
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span
                className={`${apiMeta?.liveRows > 0 ? "text-emerald-400" : "text-amber-300"}`}
              >
                Live rows: {apiMeta?.liveRows ?? 0}
              </span>
            </div>
          )}
        </div>
      </footer>

      {/* Demo-data detail popup (user-close only) */}
      {showDataModal && isDemoMode && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/70 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-orange-300">
                  Showing Sample Scores
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-amber-300">
                    Live scores are not available
                  </span>{" "}
                  right now, so we are showing{" "}
                  <span className="font-semibold text-sky-300">
                    sample scores
                  </span>
                  .
                </p>
              </div>
              <button
                onClick={() => setShowDataModal(false)}
                className="px-2 py-1 text-xs rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs sm:text-sm">
              <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                <p className="text-slate-200 font-semibold mb-1">
                  Why you are seeing this
                </p>
                <p className="text-slate-300">
                  <span className="font-semibold text-amber-300">Reason:</span>{" "}
                  {getFriendlyDemoReason(fallbackReason)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                <p className="text-slate-200 font-semibold mb-1">
                  What you are seeing now
                </p>
                <p className="text-slate-300">
                  <span className="font-semibold text-sky-300">
                    Current mode:
                  </span>{" "}
                  Sample match data is being shown so the app continues to work
                  smoothly.
                </p>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                <p className="text-slate-200 font-semibold mb-1">
                  How to get live scores
                </p>
                <ul className="list-disc ml-5 text-slate-300 space-y-1">
                  <li>
                    <span className="font-semibold text-emerald-300">
                      Step 1:
                    </span>{" "}
                    Connect your live cricket data source in app settings.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-300">
                      Step 2:
                    </span>{" "}
                    Refresh the app after setup is complete.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-300">
                      Step 3:
                    </span>{" "}
                    Tap refresh to load the latest match updates.
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-3">
                <p className="text-sky-200 font-semibold">
                  You are currently viewing:{" "}
                  <span className="text-white">SAMPLE DATA</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
