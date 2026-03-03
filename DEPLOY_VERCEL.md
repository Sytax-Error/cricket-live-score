# 🚀 Deploy to Vercel - Step by Step

## 📋 **Prerequisites**
- ✅ Your app code (already built)
- ✅ GitHub account (free)
- ✅ Vercel account (free)

---

## 🎯 **Quick Deploy (5 Minutes)**

### **Step 1: Push to GitHub**

```bash
# In your project folder
git init
git add .
git commit -m "Cricket live score app with API"
git branch -M main

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### **Step 2: Deploy on Vercel**

1. Go to **https://vercel.com**
2. Sign in with **GitHub**
3. Click **"Add New Project"**
4. Select your repo
5. Click **"Deploy"**

**Done!** 🎉 Your app is live!

---

## 🔑 **Add API Key (Optional)**

### **For Real Live Data:**

1. **Get API Key:**
   - Go to: https://api-sports.io
   - Sign up FREE
   - Get Cricket API key

2. **Add to Vercel:**
   - Go to your Vercel project
   - Settings → Environment Variables
   - Add:
     - **Key:** `VITE_CRICKET_API_KEY`
     - **Value:** `your_api_key_here`
   - Click **"Save"**

3. **Redeploy:**
   - Go to Deployments
   - Click **"Redeploy"**

---

## 🎮 **Features**

### **Without API Key:**
- ✅ Demo data works
- ✅ All features functional
- ✅ Perfect for testing

### **With API Key:**
- ✅ Real live scores
- ✅ Auto-refresh (1 min)
- ✅ Manual refresh (🔄 button)
- ✅ API usage counter

---

## 📱 **Your Live URL**

After deployment, you'll get:
```
https://your-project-name.vercel.app
```

**Share this link and enjoy!** 🏏

---

## 🔄 **Update Your App**

Whenever you make changes:

```bash
# Make changes to code
git add .
git commit -m "Your changes"
git push
```

**Vercel auto-deploys!** ✨

---

## 🎉 **You're Live!**

Your cricket live score app is now:
- ✅ **Live on the internet**
- ✅ **Accessible from any device**
- ✅ **Free hosting forever**
- ✅ **Auto-updates on code changes**

**Enjoy!** 🏏✨
