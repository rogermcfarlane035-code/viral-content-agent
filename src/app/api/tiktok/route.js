export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const apiKey = request.headers.get('x-rapidapi-key');

  if (!apiKey) return Response.json({ error: 'No API key' }, { status: 401 });

  const headers = {
    'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
    'x-rapidapi-key': apiKey,
  };

  try {
    // Try multiple endpoints to maximize results for each niche
    const results = [];

    // 1. Trending feed (general trending)
    try {
      const trendRes = await fetch(
        `https://tiktok-scraper7.p.rapidapi.com/trending/feed?region=US&count=10`,
        { headers }
      );
      if (trendRes.ok) {
        const trendData = await trendRes.json();
        const videos = trendData?.data || [];
        // Filter by keyword relevance if provided
        const filtered = keyword
          ? videos.filter(v => {
              const desc = (v.desc || '').toLowerCase();
              const tags = (v.text_extra || []).map(t => t.hashtag_name || '').join(' ').toLowerCase();
              return desc.includes(keyword.toLowerCase()) || tags.includes(keyword.toLowerCase());
            })
          : videos;
        // If filtered gives us enough, use those; otherwise use all trending
        const toUse = filtered.length >= 3 ? filtered : videos;
        results.push(...toUse.slice(0, 8));
      }
    } catch (e) { console.warn('trending feed failed', e.message); }

    // 2. Hashtag search for the niche keyword
    if (keyword && results.length < 8) {
      try {
        const hashRes = await fetch(
          `https://tiktok-scraper7.p.rapidapi.com/challenge/posts?name=${encodeURIComponent(keyword)}&count=10&cursor=0`,
          { headers }
        );
        if (hashRes.ok) {
          const hashData = await hashRes.json();
          const videos = hashData?.data?.videos || hashData?.data || [];
          results.push(...videos.slice(0, 8 - results.length));
        }
      } catch (e) { console.warn('hashtag search failed', e.message); }
    }

    // 3. Keyword search fallback
    if (results.length < 4) {
      try {
        const searchRes = await fetch(
          `https://tiktok-scraper7.p.rapidapi.com/general/search?keywords=${encodeURIComponent(keyword || 'viral')}&count=10&cursor=0&region=US&publish_time=1&sort_type=0`,
          { headers }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const videos = searchData?.data?.videos || searchData?.data || [];
          results.push(...videos.slice(0, 10 - results.length));
        }
      } catch (e) { console.warn('keyword search failed', e.message); }
    }

    if (results.length === 0) {
      return Response.json({ error: 'No results from TikTok API', results: [] }, { status: 200 });
    }

    const mapped = results.slice(0, 10).map((v, i) => ({
      id: `tt_${i}_${v.aweme_id || v.video_id || i}`,
      source: 'tiktok',
      title: v.desc || v.title || 'Trending TikTok',
      views:    v.statistics?.play_count    || v.play_count    || v.stats?.playCount    || 0,
      likes:    v.statistics?.digg_count    || v.digg_count    || v.stats?.diggCount    || 0,
      shares:   v.statistics?.share_count   || v.share_count   || v.stats?.shareCount   || 0,
      comments: v.statistics?.comment_count || v.comment_count || v.stats?.commentCount || 0,
      hashtags: (v.text_extra || []).filter(t => t.hashtag_name).map(t => `#${t.hashtag_name}`).slice(0, 6),
      creator:  `@${v.author?.unique_id || v.author?.nickname || v.authorMeta?.name || 'creator'}`,
      videoAge: v.create_time ? new Date(v.create_time * 1000).toLocaleDateString() : 'recent',
    }));

    return Response.json({ results: mapped });
  } catch (e) {
    return Response.json({ error: e.message, results: [] }, { status: 500 });
  }
}
