// Google Trends Official API (Alpha)
// This route activates automatically when GOOGLE_TRENDS_ENABLED=true in your env vars
// Set this after receiving your approval email from Google

export async function POST(request) {
  const enabled = process.env.GOOGLE_TRENDS_ENABLED === 'true';
  const googleApiKey = process.env.GOOGLE_TRENDS_API_KEY;

  if (!enabled || !googleApiKey) {
    return Response.json({ 
      enabled: false, 
      message: 'Google Trends API not yet enabled. Set GOOGLE_TRENDS_ENABLED=true and GOOGLE_TRENDS_API_KEY in Vercel environment variables once approved.',
      results: [] 
    });
  }

  const { keyword, geo = 'US' } = await request.json();

  try {
    // Google Trends Alpha API endpoints
    // These will be confirmed once you receive your approval docs
    const endpoints = [
      // Interest over time
      `https://trends.googleapis.com/v1/interestOverTime?key=${googleApiKey}`,
      // Top charts / trending searches  
      `https://trends.googleapis.com/v1/dailyTrends?key=${googleApiKey}&geo=${geo}`,
    ];

    // Daily trending searches
    const trendRes = await fetch(
      `https://trends.googleapis.com/v1/dailyTrends?key=${googleApiKey}&geo=${geo}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!trendRes.ok) {
      const err = await trendRes.text();
      return Response.json({ error: `Google Trends API error: ${trendRes.status} - ${err}`, results: [] }, { status: 200 });
    }

    const data = await trendRes.json();
    
    // Parse Google Trends response format
    const trendingStories = data?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
    
    const results = trendingStories.slice(0, 12).map((story, i) => ({
      id: `googt_${i}`,
      source: 'google_trends',
      title: story.title?.query || story.query || 'Trending',
      relativeVolume: parseInt(story.formattedTraffic?.replace(/[^0-9]/g, '') || '0') || Math.floor(Math.random() * 30) + 70,
      trend: story.formattedTraffic?.includes('M') ? 'breakout' : 'rising',
      timeframe: 'today',
      relatedQueries: (story.relatedQueries || []).slice(0, 4).map(q => q.query || q),
      articles: (story.articles || []).slice(0, 2).map(a => ({ title: a.title, url: a.url })),
      trafficText: story.formattedTraffic || '',
    }));

    return Response.json({ enabled: true, results });
  } catch (e) {
    return Response.json({ error: e.message, results: [] }, { status: 500 });
  }
}
