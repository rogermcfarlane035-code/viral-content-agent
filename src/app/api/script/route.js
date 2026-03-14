export async function POST(request) {
  const { trend, niche, platform } = await request.json();

  const ctx = trend.source === "tiktok"
    ? `LIVE TikTok trending video:\nTitle: "${trend.title}"\nViews: ${trend.views?.toLocaleString()} | Likes: ${trend.likes?.toLocaleString()} | Shares: ${trend.shares?.toLocaleString()} | Comments: ${trend.comments?.toLocaleString()}\nCreator: ${trend.creator}\nHashtags: ${trend.hashtags?.join(", ")}`
    : `LIVE Trendly trending topic:\nTopic: "${trend.title}"\nSearch interest: ${trend.relativeVolume}/100 | Direction: ${trend.trend} | Timeframe: ${trend.timeframe}\nRelated searches: ${trend.relatedQueries?.join(", ")}`;

  const prompt = `You are a world-class viral content strategist and scriptwriter with a track record of creating content that hits 1M+ views on ${platform}.

LIVE TREND DATA:
${ctx}

NICHE: ${niche}
PLATFORM: ${platform}
VIRAL SCORE: ${trend.viralScore}/99

Write a complete HeyGen-ready video script. Be punchy, first-person, authentic — like a top creator, not a marketer.

## 🎬 HOOK (0–3 sec)
One sentence. Stops the scroll cold.

## ⚡ SETUP (3–10 sec)
2–3 short sentences agitating the curiosity gap.

## 💡 VALUE CORE (10–30 sec)
3 punchy points max. Max 8 words each. Line break between each.

## 📲 CTA (last 3–5 sec)
One specific action: follow, comment a word, or share.

## 🎭 HEYGEN AVATAR DIRECTION
Tone, energy, gestures per section. Be specific.

## 🎥 B-ROLL & VISUAL CUES
What appears on screen per section.

## 📝 CAPTION + HASHTAG STACK
Full caption + optimized hashtags for ${platform}.

## 🔁 HOOK A/B VARIANT
One alternative opening hook to test.

## 📊 POSTING STRATEGY
Best time to post + hashtag tier strategy for ${platform}.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.map(b => b.text || "").join("") || "Script generation failed.";
    return Response.json({ script: text });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
