export async function POST(request) {
  const { trend, niche, platform } = await request.json();

  const fmt = n => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n||0);

  const ctx = trend.source === 'tiktok'
    ? `LIVE TikTok trending video:\nTitle: "${trend.title}"\nViews: ${fmt(trend.views)} | Likes: ${fmt(trend.likes)} | Shares: ${fmt(trend.shares)} | Comments: ${fmt(trend.comments)}\nCreator: ${trend.creator} | Posted: ${trend.videoAge}\nHashtags: ${trend.hashtags?.join(', ')}`
    : trend.source === 'google_trends'
    ? `LIVE Google Trends official data:\nTopic: "${trend.title}"\nSearch traffic: ${trend.trafficText || trend.relativeVolume} searches | Direction: ${trend.trend} | Timeframe: ${trend.timeframe}\nRelated searches: ${trend.relatedQueries?.join(', ')}`
    : `LIVE Trendly trending topic:\nTopic: "${trend.title}"\nSearch interest: ${trend.relativeVolume}/100 | Direction: ${trend.trend} | Timeframe: ${trend.timeframe}\nRelated searches: ${trend.relatedQueries?.join(', ')}`;

  const platformDuration = platform === 'TikTok' ? '21–34 seconds' : platform === 'Instagram Reels' ? '15–30 seconds' : '45–60 seconds';

  const prompt = `You are a world-class viral content strategist who has created multiple videos that hit 1M+ views on ${platform}.

LIVE TREND DATA:
${ctx}

NICHE: ${niche}
PLATFORM: ${platform}
OPTIMAL DURATION: ${platformDuration}
VIRAL SCORE: ${trend.viralScore}/99

Write a complete, HeyGen-ready video script that rides this exact live trend. First-person, punchy, authentic — write like a top creator, not a marketer. No fluff.

## 🎬 HOOK (0–3 sec)
One sentence max. Stops the scroll cold. Reference the trend directly.

## ⚡ SETUP (3–10 sec)
2–3 short sentences. Agitate the pain point or curiosity gap. Make viewer feel deeply understood.

## 💡 VALUE CORE (10–30 sec)
Exactly 3 punchy points. Max 8 words each. Put a blank line between each point.

## 📲 CTA (last 3–5 sec)
One specific action only. Follow, comment one word, or share. Be direct and urgent.

## 🎭 HEYGEN AVATAR DIRECTION
Specific instructions: tone, energy level (1-10), hand gestures, facial expression for each section.

## 🎥 B-ROLL & TEXT OVERLAYS
Exact visuals and text overlays for each section. Be very specific.

## 📝 CAPTION + HASHTAG STACK
Full caption copy (2-3 sentences) + tiered hashtag stack optimized for ${platform}.
Tier 1 (broad, 1-2): massive reach
Tier 2 (niche, 3-4): targeted audience
Tier 3 (micro, 2-3): fast ranking

## 🔁 HOOK A/B VARIANT
One completely different opening hook to split test.

## ⏰ POSTING STRATEGY
Best day + time to post this specific content on ${platform} for maximum reach.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || '').join('') || 'Script generation failed.';
    return Response.json({ script: text });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
