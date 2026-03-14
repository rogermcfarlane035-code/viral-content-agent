# 🚀 Viral Content Agent

AI-powered viral content agent for TikTok & Instagram Reels.
Pulls live trends from TikTok Scraper7 + Trendly → generates HeyGen-ready scripts via Claude AI.

---

## Deploy to Vercel (5 minutes, free)

### Step 1 — Upload to GitHub
1. Go to github.com and sign in (or create a free account)
2. Click the **+** icon → **New repository**
3. Name it: `viral-content-agent`
4. Click **Create repository**
5. Upload all these files by dragging them into the GitHub interface

### Step 2 — Deploy on Vercel
1. Go to vercel.com and sign in with your GitHub account
2. Click **"Add New Project"**
3. Select your `viral-content-agent` repository
4. Click **"Deploy"**

### Step 3 — Add Environment Variables
In Vercel, before deploying:
1. Click **"Environment Variables"**
2. Add this variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: (get this from console.anthropic.com → API Keys)
3. Click **Deploy**

### Step 4 — Use the app
1. Vercel gives you a URL like: `viral-content-agent.vercel.app`
2. Open it in any browser
3. Paste your RapidAPI key: `ea1d305c90msh1e3250bab7aee47p133304jsn5e453faa45bb`
4. Click Connect & Launch
5. Pick your niche, load live trends, generate scripts!

---

## How it works

1. **Pick platform** — TikTok, Instagram Reels, or YouTube Shorts
2. **Pick niche** — Finance, Fitness, AI, Beauty, Food, Travel, etc.
3. **Live trends load** — pulls from TikTok Scraper7 + Trendly APIs
4. **Viral scoring** — each trend scored on views, shares (3x weight), engagement
5. **Click any trend** — Claude AI writes a full HeyGen-ready script
6. **Copy into HeyGen** — render your avatar video and post

---

## API Keys needed

| Service | Where to get it |
|---------|----------------|
| RapidAPI Key | rapidapi.com → your account → API key |
| Anthropic API Key | console.anthropic.com → API Keys |

RapidAPI subscriptions needed:
- tiktok-scraper7 (by TIKWM-Default)
- trendly (by Odlica)

---

## When Google Trends API is approved
Replace the Trendly calls in `/src/app/api/trendly/route.js` with the Google Trends API endpoints.
