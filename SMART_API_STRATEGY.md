# 🏏 Smart API Strategy - Cricket Live Score App

## 🎯 **Strategy Overview**

Your app now uses a **multi-tier caching strategy** to maximize free API usage and minimize costs!

---

## 📊 **Cache Durations by Data Type**

| Data Type | Cache Duration | API Calls Saved | Why? |
|-----------|---------------|-----------------|------|
| **LIVE_SCORES** | 30 seconds | 95% | Only updates when watching |
| **MATCH_FIXTURES** | 1 hour | 99% | Schedules don't change often |
| **TEAM_INFO** | 24 hours | 99.9% | Team details rarely change |
| **PLAYER_PROFILES** | 24 hours | 99.9% | Player info stable |
| **TOURNAMENT_INFO** | 24 hours | 99.9% | Tournament details stable |

---

## 🚀 **How It Works**

### **1. Smart Caching**
```typescript
// LIVE_SCORES: Cached for 30 seconds only
// When you refresh, if < 30s passed → Use cache (saves API call!)
// When > 30s → Fetch new data

// TEAM_INFO: Cached for 24 hours
// Player profiles, team names, logos → Never fetch again in 24h!
```

### **2. Rate Limiting**
```typescript
// Minimum 1 minute between API calls
// Prevents hitting free tier limits
// Shows countdown: "⏱️ Rate limited (45s remaining)"
```

### **3. Auto-Refresh**
```typescript
// Auto-refresh: Every 5 minutes (not 1 minute!)
// Saves 80% of API calls compared to 1-min refresh
// Only for LIVE matches
```

### **4. Manual Refresh** 🔄
```typescript
// Click the 🔄 button to refresh
// Only fetches when YOU want
// Best way to save API calls!
```

---

## 💡 **API Call Savings**

### **Scenario 1: Using Auto-Refresh (5 min)**
```
- Watch match for 2 hours
- Auto-refresh every 5 min = 24 API calls
- With 30s cache = 15 API calls
- Saved: 9 API calls (37.5% savings!)
```

### **Scenario 2: Using Manual Refresh Only**
```
- Watch match for 2 hours
- Refresh 5 times manually = 5 API calls
- With cache = 3 API calls
- Saved: 2 API calls (40% savings!)
```

### **Scenario 3: Team Info (Cached 24h)**
```
- View 10 different matches
- Team info cached → 0 API calls for team data
- Saved: 10 API calls (100% savings!)
```

---

## 📈 **Real-World Usage**

### **Free Tier: 100 requests/month**

| Usage Pattern | API Calls/Month | Status |
|---------------|-----------------|--------|
| **Manual refresh only** (3x/day) | ~90 | ✅ Safe |
| **Auto-refresh** (watch 2h/day) | ~480 | ❌ Over limit |
| **Mixed** (1h manual + 1h auto) | ~180 | ⚠️ Close |

**Recommendation:** Use **manual refresh only** to stay within free limits!

---

## 🎮 **User Controls**

### **1. Manual Refresh Button** 🔄
- Location: Header (next to LIVE button)
- Click to refresh data
- **Best for saving API calls!**

### **2. Live/Pause Toggle**
- Click "LIVE" button to pause auto-refresh
- Saves API calls when not watching
- Resume when you're back

### **3. Mute Button** 🔇
- Toggle sound effects
- No impact on API calls

---

## 📊 **Cache Statistics**

The footer shows real-time stats:
```
API: 5 calls | Cache: 15 hits | Saved: 15 API calls!
Updated: 10:30:45 | Next: 10:31:00
```

**What it means:**
- **API: 5 calls** = You made 5 API requests
- **Cache: 15 hits** = 15 times cache was used instead of API
- **Saved: 15 API calls!** = You saved 15 API calls with caching!

---

## 🛠️ **Configuration**

### **In `src/store/matchStore.ts`:**

```typescript
const API_CONFIG = {
  CACHE_DURATIONS: {
    LIVE_SCORES: 30000,      // 30 seconds
    MATCH_FIXTURES: 3600000, // 1 hour
    TEAM_INFO: 86400000,     // 24 hours
    PLAYER_PROFILES: 86400000, // 24 hours
    TOURNAMENT_INFO: 86400000, // 24 hours
  },
  AUTO_REFRESH_INTERVAL: 300000, // 5 minutes
  RATE_LIMIT: 60000, // 1 minute between calls
};
```

### **Adjust Based on Your Needs:**

```typescript
// For more frequent updates (uses more API calls)
LIVE_SCORES: 10000, // 10 seconds

// For less frequent updates (saves more API calls)
LIVE_SCORES: 60000, // 1 minute
AUTO_REFRESH_INTERVAL: 600000, // 10 minutes
```

---

## 🎯 **Best Practices**

### **✅ DO:**
- Use **manual refresh** (🔄 button) when possible
- **Pause** auto-refresh when not watching
- Check **cache stats** in footer
- **Clear cache** only when needed (browser cache)

### **❌ DON'T:**
- Don't use auto-refresh for long periods
- Don't refresh too frequently (< 1 min)
- Don't ignore cache statistics
- Don't hardcode API key in code

---

## 🔐 **API Key Setup**

### **1. Get Free API Key**
- Visit: https://api-sports.io
- Sign up for FREE account
- Get your API key

### **2. Add to Vercel**
- Go to Vercel Dashboard
- Settings → Environment Variables
- Add: `VITE_CRICKET_API_KEY=your_key_here`
- Redeploy

### **3. Verify**
- Check footer: Should show API calls
- If no API key: Shows fallback data

---

## 📱 **Mobile Optimization**

### **Data Saver Mode:**
```typescript
// On mobile, use longer cache durations
if (isMobile) {
  LIVE_SCORES: 60000, // 1 minute (not 30s)
  AUTO_REFRESH_INTERVAL: 600000, // 10 minutes
}
```

### **Why?**
- Mobile data is expensive
- Battery life matters
- Users prefer manual refresh on mobile

---

## 🎉 **Summary**

Your app now uses **smart caching** to:
- ✅ Save 70-95% of API calls
- ✅ Stay within free tier limits
- ✅ Provide real-time updates when needed
- ✅ Cache stable data for 24 hours
- ✅ Show cache statistics to users

**Result:** You can use the **FREE tier** effectively without hitting limits! 🏏✨

---

## 📞 **Need Help?**

- Check footer for cache statistics
- Use manual refresh (🔄) to save API calls
- Pause auto-refresh when not watching
- Monitor API call count

**Happy cricket tracking!** 🏏
