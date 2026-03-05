const RAPIDAPI_HOST = "cricket-api-free-data.p.rapidapi.com";
const LOGO_TTL_MS = 1000 * 60 * 60 * 12;
const PLAYER_TTL_MS = 1000 * 60 * 60 * 6;
const TEAM_LOGO_CACHE = new Map();
const TEAM_PLAYERS_CACHE = new Map();

function normalizeMatchIdParam(raw) {
  if (!raw) return "";
  if (Array.isArray(raw)) return String(raw[0] || "");
  return String(raw);
}

function flattenSchedules(raw) {
  const schedules = raw?.response?.schedules || [];
  const fixtures = [];

  for (const dayBlock of schedules) {
    const wrapper = dayBlock?.scheduleAdWrapper;
    const dateLabel = wrapper?.date || "";
    const matchScheduleList = wrapper?.matchScheduleList || [];

    for (const seriesBlock of matchScheduleList) {
      const seriesName = seriesBlock?.seriesName || "";
      const seriesCategory = seriesBlock?.seriesCategory || "";
      const matchInfo = seriesBlock?.matchInfo || [];

      for (const match of matchInfo) {
        const matchId = String(match?.matchId || "");
        const startDate = Number(match?.startDate || 0);
        fixtures.push({
          // Keep a unique row id because some long-format matches appear across multiple days.
          id: `${matchId}-${startDate}`,
          matchId,
          seriesId: match?.seriesId || null,
          seriesName,
          seriesCategory,
          matchDesc: match?.matchDesc || "",
          matchFormat: match?.matchFormat || "T20",
          startDate,
          endDate: Number(match?.endDate || 0),
          dateLabel,
          team1: {
            teamId: match?.team1?.teamId || null,
            teamName: match?.team1?.teamName || "Team 1",
            teamSName: match?.team1?.teamSName || "T1",
            logoUrl: null,
          },
          team2: {
            teamId: match?.team2?.teamId || null,
            teamName: match?.team2?.teamName || "Team 2",
            teamSName: match?.team2?.teamSName || "T2",
            logoUrl: null,
          },
          venueInfo: {
            ground: match?.venueInfo?.ground || "Unknown Ground",
            city: match?.venueInfo?.city || "",
            country: match?.venueInfo?.country || "",
          },
        });
      }
    }
  }

  return fixtures;
}

async function apiFetch(path, apiKey) {
  const response = await fetch(`https://${RAPIDAPI_HOST}${path}`, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    throw new Error(`RapidAPI ${path} failed with status ${response.status}`);
  }

  return response.json();
}

function findFirstImageUrl(node) {
  if (!node) return "";

  if (typeof node === "string") {
    const value = node.trim();
    if (
      /^https?:\/\//i.test(value) &&
      /\.(png|jpg|jpeg|webp|svg)(\?|$)/i.test(value)
    ) {
      return value;
    }
    return "";
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findFirstImageUrl(item);
      if (found) return found;
    }
    return "";
  }

  if (typeof node === "object") {
    const preferredKeys = [
      "logo",
      "image",
      "imageUrl",
      "img",
      "teamLogo",
      "teamlogo",
      "url",
    ];
    for (const key of preferredKeys) {
      if (key in node) {
        const found = findFirstImageUrl(node[key]);
        if (found) return found;
      }
    }

    for (const value of Object.values(node)) {
      const found = findFirstImageUrl(value);
      if (found) return found;
    }
  }

  return "";
}

async function getTeamLogo(teamId, apiKey) {
  if (!teamId) return "";

  const cacheKey = String(teamId);
  const cached = TEAM_LOGO_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < LOGO_TTL_MS) {
    return cached.url;
  }

  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/cricket-teamlogo?teamid=${encodeURIComponent(String(teamId))}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      },
    );

    if (!response.ok) {
      TEAM_LOGO_CACHE.set(cacheKey, { url: "", ts: Date.now() });
      return "";
    }

    const data = await response.json();
    const logoUrl = findFirstImageUrl(data) || "";
    TEAM_LOGO_CACHE.set(cacheKey, { url: logoUrl, ts: Date.now() });
    return logoUrl;
  } catch {
    TEAM_LOGO_CACHE.set(cacheKey, { url: "", ts: Date.now() });
    return "";
  }
}

async function getTeamPlayers(teamId, apiKey) {
  if (!teamId) return [];

  const cacheKey = String(teamId);
  const cached = TEAM_PLAYERS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < PLAYER_TTL_MS) {
    return cached.data;
  }

  try {
    const data = await apiFetch(
      `/cricket-players?teamid=${encodeURIComponent(String(teamId))}`,
      apiKey,
    );
    const players = Array.isArray(data?.response)
      ? data.response.slice(0, 15).map((p) => ({
          id: String(p?.id || ""),
          name: p?.title || "Unknown Player",
          image: p?.image || "",
        }))
      : [];

    TEAM_PLAYERS_CACHE.set(cacheKey, { data: players, ts: Date.now() });
    return players;
  } catch {
    TEAM_PLAYERS_CACHE.set(cacheKey, { data: [], ts: Date.now() });
    return [];
  }
}

function extractLiveScores(raw) {
  // Provider currently returns: { status: 'success', response: [] }
  // Keep this parser defensive so we can use it immediately if they start returning rows.
  if (Array.isArray(raw?.response)) return raw.response;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  return [];
}

export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return res.status(200).json({ source: "no-key", fixtures: [] });
  }

  try {
    const requestedMatchId = normalizeMatchIdParam(req?.query?.matchId);

    const [scheduleData, liveScoreData] = await Promise.all([
      apiFetch("/cricket-schedule", apiKey),
      apiFetch("/cricket-livescores", apiKey).catch(() => ({ response: [] })),
    ]);

    const fixtures = flattenSchedules(scheduleData || {}).slice(0, 40);
    const liveScores = extractLiveScores(liveScoreData);

    // Optimize API usage: fetch player/logo data only for the currently selected match.
    const selectedFixture =
      fixtures.find((f) => String(f.id) === requestedMatchId) ||
      fixtures.find(
        (f) =>
          Number(f.startDate || 0) <= Date.now() &&
          Number(f.endDate || 0) >= Date.now(),
      ) ||
      fixtures[0] ||
      null;

    const selectedTeamIds = Array.from(
      new Set(
        [selectedFixture?.team1?.teamId, selectedFixture?.team2?.teamId].filter(
          Boolean,
        ),
      ),
    );

    const logoMap = {};
    const playersByTeam = {};
    await Promise.all(
      selectedTeamIds.map(async (teamId) => {
        const [logo, players] = await Promise.all([
          getTeamLogo(teamId, apiKey),
          getTeamPlayers(teamId, apiKey),
        ]);
        logoMap[String(teamId)] = logo || "";
        playersByTeam[String(teamId)] = players;
      }),
    );

    const fixturesWithLogos = fixtures.map((f) => {
      const isSelected =
        selectedFixture && String(f.id) === String(selectedFixture.id);
      return {
        ...f,
        team1: {
          ...f.team1,
          logoUrl: isSelected ? logoMap[String(f?.team1?.teamId)] || "" : "",
        },
        team2: {
          ...f.team2,
          logoUrl: isSelected ? logoMap[String(f?.team2?.teamId)] || "" : "",
        },
      };
    });

    return res.status(200).json({
      source: "api",
      fixtures: fixturesWithLogos,
      liveScores,
      playersByTeam,
      meta: {
        total: fixturesWithLogos.length,
        logoTeams: selectedTeamIds.length,
        liveRows: liveScores.length,
        selectedMatchId: selectedFixture?.id || null,
      },
    });
  } catch (error) {
    return res.status(200).json({
      source: "error",
      fixtures: [],
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
}
