// Cricket API Service
// Using free CricAPI (cricapi.com) - Best free cricket data API

export interface CricketMatch {
  id: string;
  teams: string[];
  status: string;
  format: string;
  venue?: string;
  score?: Array<{
    runs: number;
    wickets: number;
    overs: string;
  }>;
  matchType?: string;
}

// You can get a free API key from: https://cricapi.com/
// For this demo, using test_key which has limited requests
const API_KEY = "test_key"; // Replace with your free API key from cricapi.com
const BASE_URL = "https://api.cricapi.com/v1";

export const cricketApi = {
  // Get current live matches
  getCurrentMatches: async (): Promise<CricketMatch[]> => {
    try {
      const response = await fetch(
        `${BASE_URL}/currentMatches?apikey=${API_KEY}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching current matches:", error);
      return [];
    }
  },

  // Get match details by ID
  getMatchDetails: async (matchId: string): Promise<CricketMatch | null> => {
    try {
      const response = await fetch(
        `${BASE_URL}/matchInfo?matchId=${matchId}&apikey=${API_KEY}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch match details");
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error("Error fetching match details:", error);
      return null;
    }
  },

  // Get series data
  getSeries: async (): Promise<any[]> => {
    try {
      const response = await fetch(`${BASE_URL}/series?apikey=${API_KEY}`);

      if (!response.ok) {
        throw new Error("Failed to fetch series");
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching series:", error);
      return [];
    }
  },
};

// Note: For better results, sign up for a free account at cricapi.com
// Free tier includes:
// - Current matches (real-time updates)
// - Match information
// - Series data
// - Limited to 300 requests/month

// Alternative free APIs to consider:
// 1. ESPN Cricinfo (unofficial, web scraping)
// 2. CricketData.org API
// 3. Sportradar (requires registration)
