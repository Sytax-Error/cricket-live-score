# 🏏 Cricket Live Score - API Integration Guide

## 🎯 **What's New**

Your app now has **smart API integration** with:
- ✅ **Real-time data** from API-Sports Cricket
- ✅ **Smart caching** (saves API calls)
- ✅ **Manual refresh button** (🔄 icon next to LIVE)
- ✅ **Rate limiting** (respects free tier limits)
- ✅ **Auto-refresh** (every 1 minute for live matches)
- ✅ **Fallback data** (works without API key)

---

## 📋 **Step-by-Step Setup**

### **1. Get Your Free API Key**

#### **Option A: API-Sports Cricket** (Recommended)
1. Go to: **https://api-sports.io**
2. Sign up for **FREE account**
3. Choose **Cricket** API
4. Get your **API Key** from dashboard
5. Free tier: **100 requests/month**

#### **Option B: RapidAPI - Cricket Data**
1. Go to: **https://rapidapi.com/search/cricket**
2. Choose any cricket API
3. Subscribe to **FREE plan**
4. Get your **X-RapidAPI-Key**

---

### **2. Add API Key to Your App**

#### **For Local Development:**
Create a `.env` file in your project root:

```env
VITE_CRICKET_API_KEY=your_actual_api_key_here
```

#### **For Vercel Deployment:**
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   - **Key:** `VITE_CRICKET_API_KEY`
   - **Value:** `your_actual_api_key_here`
4. Redeploy

---

### **3. How It Works**

#### **Smart API Management:**
```typescript
// Auto-refresh: Every 60 seconds (respects free tier)
// Manual refresh: Click 🔄 button (when you want latest data)
// Cache: 30 seconds (reduces API calls)
// Rate limit: Min 1 minute between API calls
```

#### **When API is NOT configured:**
- ✅ App uses **fallback/demo data**
- ✅ All features work normally
- ✅ You can still deploy and test

#### **When API IS configured:**
- ✅ Fetches **real live matches**
- ✅ Updates **every 60 seconds** automatically
- ✅ **Manual refresh** available (🔄 button)
- ✅ Shows **API call count** in footer

---

## 🎮 **How to Use**

### **Manual Refresh (Saves API Calls!)**
1. Look for the **🔄 icon** in the header (next to LIVE button)
2. Click it to **fetch latest data**
3. Only use when you need **fresh data**
4. **Don't spam** - respects API limits!

### **Auto-Refresh**
- **Live matches:** Updates every **60 seconds**
- **Completed matches:** No auto-refresh
- **Paused:** Click "LIVE" button to pause/resume

### **API Call Counter**
- Check footer for **API Calls: X**
- Shows how many API calls made
- Free tier: **100 calls/month**
- **Monitor usage** to avoid limits!

---

## 💡 **Tips to Save API Calls**

1. **Use Manual Refresh** instead of auto-refresh
2. **Pause** when not watching (click LIVE button)
3. **Check cache** - data cached for 30 seconds
4. **Don't refresh** too frequently
5. **Use fallback data** for testing

---

## 🔧 **Configuration Options**

Edit `src/store/matchStore.ts`:

```typescript
const API_CONFIG = {
  BASE_URL: 'https://v2.proballwin.com/api',
  API_KEY: import.meta.env.VITE_CRICKET_API_KEY || '',
  CACHE_DURATION: 30000,        // 30 seconds
  AUTO_REFRESH_INTERVAL: 60000, // 1 minute (change to 300000 for 5 min)
  MAX_API_CALLS_PER_HOUR: 100,  // Your API limit
};
```

### **Recommended Settings:**

| Setting | Development | Production |
|---------|-------------|------------|
| **Cache Duration** | 10000 (10s) | 30000 (30s) |
| **Auto Refresh** | 30000 (30s) | 60000 (1 min) |
| **Manual Refresh** | Always | When needed |

---

## 🚨 **Troubleshooting**

### **Problem: "No API key configured"**
**Solution:** Add API key to `.env` file or Vercel environment variables

### **Problem: "Rate limit exceeded"**
**Solution:** 
- Wait 1 minute between calls
- Use manual refresh less frequently
- Increase `AUTO_REFRESH_INTERVAL`

### **Problem: "API call failed"**
**Solution:**
- Check API key is correct
- Check internet connection
- App will use fallback data automatically

### **Problem: "Data not updating"**
**Solution:**
- Click 🔄 manual refresh button
- Check if match is LIVE
- Check API call count in footer

---

## 📊 **API Usage Monitoring**

### **Free Tier Limits:**

| API | Free Limit | Your Usage |
|-----|------------|------------|
| **API-Sports** | 100/month | Check footer counter |
| **RapidAPI** | 500/month | Check footer counter |

### **Estimate:**
- **Auto-refresh (1 min):** ~43,200 calls/month (❌ Too many!)
- **Auto-refresh (5 min):** ~8,640 calls/month (❌ Too many!)
- **Manual refresh (10x/day):** ~300 calls/month (⚠️ Close to limit)
- **Manual refresh (3x/day):** ~90 calls/month (✅ Safe!)

**Recommendation:** Use **manual refresh** only when needed!

---

## 🎯 **Next Steps**

1. ✅ **Get API key** from API-Sports or RapidAPI
2. ✅ **Add to `.env` file** (local) or **Vercel** (production)
3. ✅ **Deploy** your app
4. ✅ **Test** with manual refresh (🔄 button)
5. ✅ **Monitor** API usage in footer

---

## 🆘 **Need Help?**

### **Check These First:**
1. ✅ API key added correctly?
2. ✅ Internet connection working?
3. ✅ Match is LIVE (not completed)?
4. ✅ API call count < 100?

### **Still Not Working?**
- App will **automatically use fallback data**
- All features still work
- Add API key later when ready

---

## 🎉 **You're Ready!**

Your app now has:
- ✅ **Smart API integration**
- ✅ **Manual refresh** to save calls
- ✅ **Auto-refresh** for live matches
- ✅ **Fallback data** if API fails
- ✅ **Usage monitoring** in footer

**Deploy and enjoy real cricket scores!** 🏏✨
