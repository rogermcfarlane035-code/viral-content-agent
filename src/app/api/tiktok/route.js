export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "viral";
  const apiKey = request.headers.get("x-rapidapi-key");

  if (!apiKey) {
    return Response.json({ error: "No API key provided" }, { status: 401 });
  }

  try {
    const url = `https://tiktok-scraper7.p.rapidapi.com/trending/feed?region=US&count=15&keywords=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: `TikTok API error: ${res.status}`, detail: text }, { status: res.status });
    }

    const data = await res.json();
    const videos = data?.data || [];

    const results = videos.slice(0, 8).map((v, i) => ({
      id: `tt_${i}_${v.aweme_id || i}`,
      source: "tiktok",
      title: v.desc || v.title || "Trending TikTok",
      views: v.statistics?.play_count || v.play_count || 0,
      likes: v.statistics?.digg_count || v.digg_count || 0,
      shares: v.statistics?.share_count || v.share_count || 0,
      comments: v.statistics?.comment_count || v.comment_count || 0,
      hashtags: (v.text_extra || []).filter(t => t.hashtag_name).map(t => `#${t.hashtag_name}`).slice(0, 6),
      creator: `@${v.author?.unique_id || v.author?.nickname || "creator"}`,
      videoAge: v.create_time ? new Date(v.create_time * 1000).toLocaleDateString() : "recent",
    }));

    return Response.json({ results });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
