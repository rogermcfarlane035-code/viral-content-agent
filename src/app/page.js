'use client';
import { useState, useCallback } from 'react';

const PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts'];

const NICHES = [
  { label: 'Finance',       gTerm: 'personal finance money',    ttTag: 'finance',        emoji: '💰' },
  { label: 'Fitness',       gTerm: 'workout fitness',           ttTag: 'fitness',        emoji: '💪' },
  { label: 'AI & Tech',     gTerm: 'artificial intelligence',   ttTag: 'artificialintelligence', emoji: '🤖' },
  { label: 'Motivation',    gTerm: 'self improvement mindset',  ttTag: 'motivation',     emoji: '🔥' },
  { label: 'Beauty',        gTerm: 'makeup skincare beauty',    ttTag: 'beauty',         emoji: '💄' },
  { label: 'Food',          gTerm: 'recipe cooking food',       ttTag: 'foodtiktok',     emoji: '🍽️' },
  { label: 'Travel',        gTerm: 'travel destinations',       ttTag: 'travel',         emoji: '✈️' },
  { label: 'Relationships', gTerm: 'relationship dating advice',ttTag: 'relationship',   emoji: '❤️' },
  { label: 'Productivity',  gTerm: 'productivity habits',       ttTag: 'productivity',   emoji: '⚡' },
  { label: 'Comedy',        gTerm: 'funny comedy viral',        ttTag: 'funny',          emoji: '😂' },
  { label: 'Business',      gTerm: 'entrepreneurship business', ttTag: 'entrepreneur',   emoji: '💼' },
  { label: 'Crypto',        gTerm: 'cryptocurrency bitcoin',    ttTag: 'crypto',         emoji: '🪙' },
  { label: 'Real Estate',   gTerm: 'real estate investing',     ttTag: 'realestate',     emoji: '🏠' },
  { label: 'Mental Health', gTerm: 'mental health anxiety',     ttTag: 'mentalhealth',   emoji: '🧠' },
  { label: 'Fashion',       gTerm: 'fashion style outfit',      ttTag: 'fashion',        emoji: '👗' },
  { label: 'Sports',        gTerm: 'sports highlights',         ttTag: 'sports',         emoji: '🏆' },
  { label: 'Parenting',     gTerm: 'parenting kids tips',       ttTag: 'parenting',      emoji: '👨‍👩‍👧' },
  { label: 'Gaming',        gTerm: 'gaming video games',        ttTag: 'gaming',         emoji: '🎮' },
  { label: 'Music',         gTerm: 'music trending songs',      ttTag: 'music',          emoji: '🎵' },
  { label: 'Education',     gTerm: 'learning education tips',   ttTag: 'learnontiktok',  emoji: '📚' },
];

function calcViralScore(trend) {
  if (trend.source === 'tiktok') {
    const eng = ((trend.likes + trend.shares * 3 + trend.comments * 2) / Math.max(trend.views, 1)) * 100;
    return Math.min(Math.round(Math.min(trend.views / 100000, 40) + Math.min(eng * 10, 40) + (trend.shares > 50000 ? 20 : trend.shares > 20000 ? 12 : 5)), 99);
  }
  if (trend.source === 'google_trends') {
    const bonus = trend.trend === 'breakout' ? 25 : 15;
    return Math.min(Math.round((trend.relativeVolume || 70) * 0.55 + bonus), 99);
  }
  const bonus = trend.trend === 'breakout' ? 25 : trend.trend === 'rising' ? 15 : 5;
  return Math.min(Math.round((trend.relativeVolume || 60) * 0.6 + bonus), 99);
}

const fmt = n => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n||0);

// Rich fallback data for all 20 niches
const FALLBACKS = {
  Finance: { tt: ["I made $10k passively — here's exactly how","Stop putting money in savings, do this instead","The investing mistake costing you thousands","This credit card hack is actually legal","How I paid off $50k debt in 18 months"], gt: ["passive income ideas 2025","how to invest $1000","best high yield savings account","index fund vs ETF","credit score boost tips"] },
  Fitness: { tt: ["I tried 75 Hard for 75 days — here's what happened","This 5-minute routine replaced my entire gym","My body changed after 90 days no alcohol","The workout mistake making you weaker","How I lost 30lbs without starving"], gt: ["fastest way to lose belly fat","best home workout no equipment","how much protein per day","weight loss plateau fix","creatine benefits for women"] },
  'AI & Tech': { tt: ["This AI tool is replacing entire teams right now","I built a $5k/mo business in 48hrs using only AI","You're using ChatGPT completely wrong","The AI tool every creator needs in 2025","Google just released something insane"], gt: ["best AI tools 2025","how to use Claude AI","AI replacing jobs list","ChatGPT prompts for business","Gemini vs ChatGPT"] },
  Motivation: { tt: ["Nobody talks about this stage of success","If you're stuck, you need to see this","The one mindset shift that changes everything","Stop waiting to feel motivated — do this","What nobody tells you about discipline"], gt: ["how to stay disciplined","atomic habits tips","morning routine habits","stoic philosophy life","dopamine detox challenge"] },
  Beauty: { tt: ["This $7 dupe is literally better than the $80 original","I finally found my signature look","Dermatologist exposes the biggest skincare lie","The makeup technique going viral right now","Skin care routine that actually worked"], gt: ["glass skin routine","best drugstore foundation 2025","no makeup makeup look","retinol before and after","skincare routine order"] },
  Food: { tt: ["3-ingredient meal that tastes like a restaurant","I ate this every day for 30 days","Gordon Ramsay approved this $3 hack","The viral recipe everyone is making","High protein meal prep under $50"], gt: ["high protein meal prep","air fryer chicken recipe","5 ingredient pasta","viral food recipes 2025","healthy lunch ideas"] },
  Travel: { tt: ["This country is better than Bali and nobody goes there","I traveled Europe for $600 total","Things airlines will never tell you","The travel hack that saved me $2000","Hidden gems in Southeast Asia"], gt: ["cheapest places to travel 2025","best solo travel destinations","how to travel cheap","digital nomad visa","travel credit card rewards"] },
  Relationships: { tt: ["The green flag nobody ever talks about","Signs your attachment style is ruining relationships","This communication trick saved everything","What secure attachment actually looks like","Red flags people normalize"], gt: ["how to set boundaries","signs of secure attachment","communication in relationships","attachment style quiz","toxic relationship patterns"] },
  Productivity: { tt: ["I deleted all social media for 30 days","The scheduling method that 10x'd my output","Your to-do list is making you less productive","How I get 12 hours of work done in 6","The note-taking system that changed everything"], gt: ["deep work technique","time blocking schedule","second brain system","morning routine high performers","focus music study"] },
  Comedy: { tt: ["POV: you're the main character and it's going great","Things only chronic overthinkers understand","My toxic trait is actually just being relatable","When you finally understand adulting","Signs you grew up in the 90s"], gt: ["relatable memes 2025","gen z humor explained","adulting problems funny","introvert memes","overthinking funny"] },
  Business: { tt: ["I started a business with $0 — here's how","The business model nobody talks about","How I quit my 9-5 in 6 months","The biggest mistake new entrepreneurs make","Side hustle that made me $8k last month"], gt: ["how to start a business 2025","side hustle ideas","dropshipping vs Amazon FBA","passive income business","LLC vs sole proprietor"] },
  Crypto: { tt: ["Bitcoin just did something nobody expected","The crypto mistake costing you everything","How I turned $1k into $20k in crypto","The altcoin everyone is sleeping on","Why most crypto investors lose money"], gt: ["bitcoin price prediction 2025","best crypto to buy now","ethereum vs bitcoin","crypto tax tips","defi explained simply"] },
  'Real Estate': { tt: ["How I bought my first house at 24 with no money","The real estate trick banks don't tell you","House hacking explained simply","Why renting is actually smart right now","How to invest in real estate with $10k"], gt: ["house hacking strategy","real estate investing beginners","rental property calculator","how to buy investment property","real estate market 2025"] },
  'Mental Health': { tt: ["Signs you have high functioning anxiety","The therapy technique that actually works","What burnout feels like vs being tired","How to stop overthinking in 5 minutes","Signs you need to rest not quit"], gt: ["anxiety relief techniques","burnout symptoms","therapy types explained","mindfulness for beginners","how to stop overthinking"] },
  Fashion: { tt: ["The outfit formula that always works","Fast fashion dupes that look expensive","How to build a capsule wardrobe","The style mistake making you look older","Thrift flip that went viral"], gt: ["capsule wardrobe essentials","how to dress well on a budget","minimalist style guide","fashion trends 2025","thrift shopping tips"] },
  Sports: { tt: ["The sports moment nobody saw coming","Training secrets of elite athletes","Why this athlete is different from everyone","The play that broke the internet","Sports science hack most athletes ignore"], gt: ["sports news today","athlete training tips","sports betting strategy","fantasy sports picks","sports nutrition tips"] },
  Parenting: { tt: ["The parenting hack I wish I knew sooner","What gentle parenting actually looks like","Stop saying this to your kids — say this instead","The toddler trick that actually works","Signs your kid is gifted"], gt: ["gentle parenting tips","toddler activities at home","how to raise confident kids","screen time guidelines kids","picky eater solutions"] },
  Gaming: { tt: ["This gaming setup is under $500","The game mechanic nobody explains","How I went from bronze to diamond","The upcoming game everyone will play","Gaming trick pros use that nobody talks about"], gt: ["best games 2025","gaming setup budget","gaming chair vs regular chair","streaming setup for beginners","gaming laptop vs desktop"] },
  Music: { tt: ["This song is about to blow up — save this","The music theory trick every producer needs","How this artist went from 0 to 1M streams","The sample flip that's everywhere right now","How to find your sound as an artist"], gt: ["music production tips beginners","how to get on spotify playlists","music theory basics","home recording studio setup","how to promote music 2025"] },
  Education: { tt: ["The study technique that 10x'd my grades","How to learn anything in 20 hours","The note-taking method top students use","Why you forget everything you study","Learn a language in 3 months — here's how"], gt: ["best way to study","feynman technique explained","how to memorize faster","online courses worth it","learn coding free 2025"] },
};

export default function ViralAgent() {
  const [apiKey, setApiKey] = useState('');
  const [step, setStep] = useState('keys');
  const [platform, setPlatform] = useState('TikTok');
  const [niche, setNiche] = useState(null);
  const [trends, setTrends] = useState([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('full');
  const [sortBy, setSortBy] = useState('viral');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [savedScripts, setSavedScripts] = useState([]);
  const [apiStatus, setApiStatus] = useState({ tiktok: null, trendly: null, google: null });
  const [copied, setCopied] = useState(false);
  const [nicheSearch, setNicheSearch] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const getFallback = (n, source) => {
    const fb = FALLBACKS[n.label] || FALLBACKS.Finance;
    if (source === 'tiktok') {
      return fb.tt.map((title, i) => ({
        id: `tt_fb_${i}`, source: 'tiktok', title,
        views: Math.floor(Math.random() * 8e6) + 500000,
        likes: Math.floor(Math.random() * 400000) + 20000,
        shares: Math.floor(Math.random() * 80000) + 5000,
        comments: Math.floor(Math.random() * 30000) + 1000,
        hashtags: [`#${n.ttTag}`, '#fyp', '#viral', '#foryou'],
        creator: `@creator${Math.floor(Math.random() * 999)}`,
        isFallback: true,
      }));
    }
    return fb.gt.map((title, i) => ({
      id: `gt_fb_${i}`, source: 'trendly', title,
      relativeVolume: Math.floor(Math.random() * 25) + 65,
      trend: ['rising', 'breakout', 'steady'][i % 3],
      timeframe: 'past 7 days',
      relatedQueries: [`${title} for beginners`, `${title} 2025`, `best ${title}`],
      isFallback: true,
    }));
  };

  const loadTrends = useCallback(async (selectedNiche) => {
    setIsLoadingTrends(true);
    setTrends([]);
    setSelectedTrend(null);
    setScript('');
    const newStatus = { tiktok: null, trendly: null, google: null };
    let all = [];

    // TikTok
    try {
      const res = await fetch(`/api/tiktok?keyword=${encodeURIComponent(selectedNiche.ttTag)}`, {
        headers: { 'x-rapidapi-key': apiKey },
      });
      const data = await res.json();
      if (data.results?.length > 0) { all.push(...data.results); newStatus.tiktok = 'live'; }
      else { all.push(...getFallback(selectedNiche, 'tiktok')); newStatus.tiktok = apiKey ? 'error' : 'demo'; }
    } catch { all.push(...getFallback(selectedNiche, 'tiktok')); newStatus.tiktok = apiKey ? 'error' : 'demo'; }

    // Trendly
    try {
      const res = await fetch('/api/trendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: selectedNiche.gTerm, apiKey }),
      });
      const data = await res.json();
      if (data.results?.length > 0) { all.push(...data.results); newStatus.trendly = 'live'; }
      else { all.push(...getFallback(selectedNiche, 'trendly')); newStatus.trendly = apiKey ? 'error' : 'demo'; }
    } catch { all.push(...getFallback(selectedNiche, 'trendly')); newStatus.trendly = apiKey ? 'error' : 'demo'; }

    // Google Trends (if approved)
    try {
      const res = await fetch('/api/google-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: selectedNiche.gTerm }),
      });
      const data = await res.json();
      if (data.enabled && data.results?.length > 0) {
        all.push(...data.results);
        newStatus.google = 'live';
        setGoogleEnabled(true);
      } else {
        newStatus.google = 'pending';
      }
    } catch { newStatus.google = 'pending'; }

    const scored = all.map(t => ({ ...t, viralScore: calcViralScore(t) }));
    // Deduplicate
    const seen = new Set();
    const deduped = scored.filter(t => { if (seen.has(t.title)) return false; seen.add(t.title); return true; });
    setTrends(deduped);
    setApiStatus(newStatus);
    setIsLoadingTrends(false);
  }, [apiKey]);

  const filteredNiches = NICHES.filter(n => n.label.toLowerCase().includes(nicheSearch.toLowerCase()));

  const visible = trends
    .filter(t => sourceFilter === 'all' || t.source === sourceFilter)
    .sort((a, b) => sortBy === 'viral'
      ? b.viralScore - a.viralScore
      : (b.views || b.relativeVolume * 10000) - (a.views || a.relativeVolume * 10000));

  const generateScript = async (trend) => {
    setSelectedTrend(trend);
    setStep('result');
    setIsGenerating(true);
    setScript('');
    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trend, niche: niche?.label, platform }),
      });
      const data = await res.json();
      setScript(data.script || data.error || 'Generation failed.');
    } catch (e) { setScript('Error: ' + e.message); }
    setIsGenerating(false);
  };

  const saveScript = () => {
    if (!selectedTrend || !script) return;
    setSavedScripts(p => [{ id: Date.now(), niche: niche?.label, platform, title: selectedTrend.title, score: selectedTrend.viralScore, source: selectedTrend.source, date: new Date().toLocaleDateString(), script }, ...p]);
  };

  const copyScript = () => { navigator.clipboard?.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const C = { bg: '#07080f', card: '#0b0d16', border: '#151828', accent: '#5b8fff', accentG: '#00e5a0', text: '#d4d8f0', muted: '#3a4060', dim: '#1e2238' };

  const sourceColor = (s) => s === 'tiktok' ? { border: '#2a3a6a', color: '#7a9aff', bg: '#0a0f20' } : s === 'google_trends' ? { border: '#3a2a6a', color: '#aa7aff', bg: '#0f0a20' } : { border: '#1a4a3a', color: '#4aaa7a', bg: '#0a1a10' };
  const sourceLabel = (s) => s === 'tiktok' ? 'TikTok' : s === 'google_trends' ? '🔍 Google Trends' : 'Trendly';
  const statusColor = (s) => s === 'live' ? C.accentG : s === 'pending' ? '#ffaa00' : s === 'error' ? '#ff6b6b' : C.muted;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono','Courier New',monospace" }}>
      <div style={{ position: 'fixed', top: -200, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,143,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -150, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <style>{`
        .btn-a{background:#5b8fff;border:none;color:#fff;padding:13px 28px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-weight:700;transition:all 0.2s;}
        .btn-a:hover{background:#7aa3ff;box-shadow:0 0 20px rgba(91,143,255,0.4);}
        .btn-a:disabled{opacity:0.4;cursor:not-allowed;}
        .btn-b{background:transparent;border:1px solid #151828;color:#3a4060;padding:10px 20px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all 0.2s;}
        .btn-b:hover{border-color:#5b8fff;color:#5b8fff;}
        .tc{background:#0b0d16;border:1px solid #151828;padding:18px 20px;margin-bottom:10px;cursor:pointer;transition:all 0.15s;position:relative;overflow:hidden;}
        .tc:hover{border-color:#5b8fff;background:#0e1020;}
        .inp{background:#090b14;border:1px solid #151828;color:#d4d8f0;padding:11px 14px;font-family:'IBM Plex Mono',monospace;font-size:12px;outline:none;transition:border 0.2s;}
        .inp:focus{border-color:#5b8fff;}
        .tab{background:none;border:none;border-bottom:2px solid transparent;padding:10px 16px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;color:#3a4060;transition:all 0.2s;}
        .tab.act{border-bottom-color:#5b8fff;color:#5b8fff;}
        .nc{background:#0b0d16;border:1px solid #151828;padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:11px;cursor:pointer;transition:all 0.2s;text-align:left;color:#3a4060;width:100%;}
        .nc:hover,.nc.sel{border-color:#5b8fff;color:#5b8fff;background:#0d1022;}
        .pf{background:#0b0d16;border:1px solid #151828;padding:10px 16px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all 0.2s;color:#3a4060;width:100%;text-align:left;}
        .pf.sel{border-color:#00e5a0;color:#00e5a0;background:#091410;}
        .pf:hover{border-color:#00e5a0;color:#00e5a0;}
        select{background:#090b14;border:1px solid #151828;color:#3a4060;padding:8px 10px;font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;cursor:pointer;}
        .shimmer{background:linear-gradient(90deg,#0b0d16 25%,#1e2238 50%,#0b0d16 75%);background-size:600px 100%;animation:shimmer 1.3s infinite;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        *{box-sizing:border-box;}
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '36px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accentG, display: 'inline-block', animation: 'pulse 1.8s infinite' }} />
            <span style={{ fontSize: 10, letterSpacing: 3, color: C.accentG, textTransform: 'uppercase' }}>
              {step === 'keys' ? 'Setup' : (apiStatus.tiktok === 'live' || apiStatus.trendly === 'live' || apiStatus.google === 'live') ? 'LIVE DATA' : 'Demo Mode'}
            </span>
            {step !== 'keys' && (
              <span style={{ marginLeft: 'auto', fontSize: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>TikTok: <span style={{ color: statusColor(apiStatus.tiktok) }}>{apiStatus.tiktok || '—'}</span></span>
                <span>Trendly: <span style={{ color: statusColor(apiStatus.trendly) }}>{apiStatus.trendly || '—'}</span></span>
                <span>Google: <span style={{ color: statusColor(apiStatus.google) }}>{apiStatus.google === 'pending' ? '⏳ awaiting approval' : apiStatus.google || '—'}</span></span>
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: 700, margin: '0 0 6px', letterSpacing: -1, lineHeight: 1.1 }}>
            VIRAL CONTENT <span style={{ color: C.accent }}>AGENT</span>{' '}
            <span style={{ color: C.accentG, fontSize: '0.45em', letterSpacing: 2 }}>v3.1 · LIVE</span>
          </h1>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
            TikTok Scraper7 + Trendly + Google Trends (pending) → AI Scripts → HeyGen-Ready · 20 Niches
          </p>
        </div>

        {/* ══ KEYS ══ */}
        {step === 'keys' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: '28px 32px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: C.muted, marginBottom: 18, textTransform: 'uppercase' }}>Connect APIs</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 8, textTransform: 'uppercase' }}>RapidAPI Key</div>
              <input className="inp" type="password" placeholder="Paste your RapidAPI key here..." value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 20, lineHeight: 1.9 }}>
                ✅ TikTok Scraper7 — <span style={{ color: C.accent }}>tiktok-scraper7.p.rapidapi.com</span><br />
                ✅ Trendly — <span style={{ color: C.accent }}>trendly.p.rapidapi.com</span><br />
                ⏳ Google Trends — <span style={{ color: '#ffaa00' }}>activates automatically once approved (set GOOGLE_TRENDS_ENABLED=true in Vercel)</span>
              </div>
              <button className="btn-a" onClick={() => setStep('dashboard')}>{apiKey ? '→ CONNECT & LAUNCH' : '→ LAUNCH IN DEMO MODE'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              {[{ n: '01', t: 'Live Trend Fetch', d: 'Pulls real trending TikToks + Trendly topics + Google Trends (when approved)' }, { n: '02', t: 'Viral Score', d: 'Scores on views, shares×3, comments×2, engagement rate' }, { n: '03', t: 'AI Script', d: 'Claude writes a full HeyGen-ready script from live trend data' }, { n: '04', t: 'Post & Win', d: 'Paste into HeyGen → render → post TikTok & Instagram' }].map(s => (
                <div key={s.n} style={{ background: C.card, border: `1px solid ${C.border}`, padding: 18 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.dim, marginBottom: 8 }}>{s.n}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 6 }}>{s.t}</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {step === 'dashboard' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 24, marginBottom: 28, alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 10, textTransform: 'uppercase' }}>Platform</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PLATFORMS.map(p => <button key={p} className={`pf ${platform === p ? 'sel' : ''}`} onClick={() => setPlatform(p)}>{p}</button>)}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: 'uppercase' }}>Niche ({NICHES.length})</div>
                  <input className="inp" placeholder="Search niches..." value={nicheSearch} onChange={e => setNicheSearch(e.target.value)} style={{ width: 180, padding: '6px 10px', fontSize: 11 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                  {filteredNiches.map(n => (
                    <button key={n.label} className={`nc ${niche?.label === n.label ? 'sel' : ''}`} onClick={() => { setNiche(n); loadTrends(n); }}>
                      {n.emoji} {n.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {niche && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 11, color: isLoadingTrends ? C.accent : C.accentG, letterSpacing: 2 }}>
                    {isLoadingTrends ? '⟳  Fetching live trends...' : `${visible.length} trends · ${niche.label} · ${platform}`}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {['all', 'tiktok', 'trendly', ...(googleEnabled ? ['google_trends'] : [])].map(f => (
                      <button key={f} onClick={() => setSourceFilter(f)} style={{ background: sourceFilter === f ? C.accent : 'transparent', border: `1px solid ${sourceFilter === f ? C.accent : C.border}`, color: sourceFilter === f ? '#fff' : C.muted, padding: '5px 12px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                        {f === 'google_trends' ? 'google' : f}
                      </button>
                    ))}
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                      <option value="viral">↓ Viral Score</option>
                      <option value="views">↓ Views</option>
                    </select>
                  </div>
                </div>

                {isLoadingTrends && [...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 82, marginBottom: 10, animationDelay: `${i * 0.08}s` }} />)}

                {!isLoadingTrends && visible.map((t, i) => {
                  const sc = sourceColor(t.source);
                  return (
                    <div key={t.id} className="tc" style={{ animationDelay: `${i * 0.03}s`, animation: 'fadeUp 0.35s ease both' }} onClick={() => generateScript(t)}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${t.viralScore}%`, background: 'rgba(91,143,255,0.03)', pointerEvents: 'none' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                        <div style={{ flex: 1, marginRight: 16 }}>
                          <div style={{ fontSize: 13, color: '#c4c8e0', marginBottom: 8, lineHeight: 1.5 }}>"{t.title}"</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontSize: 10, padding: '3px 9px', border: `1px solid ${sc.border}`, color: sc.color, background: sc.bg, letterSpacing: 1, textTransform: 'uppercase' }}>
                              {sourceLabel(t.source)}{t.isFallback ? ' · demo' : ' · live'}
                            </span>
                            {t.source === 'tiktok' ? <>
                              <span style={{ fontSize: 10, color: C.muted }}>👁 {fmt(t.views)}</span>
                              <span style={{ fontSize: 10, color: C.muted }}>❤️ {fmt(t.likes)}</span>
                              <span style={{ fontSize: 10, color: C.muted }}>↗ {fmt(t.shares)}</span>
                              <span style={{ fontSize: 10, color: C.muted }}>💬 {fmt(t.comments)}</span>
                            </> : <>
                              <span style={{ fontSize: 10, color: C.muted }}>📈 {t.trend}</span>
                              <span style={{ fontSize: 10, color: C.muted }}>{t.source === 'google_trends' ? t.trafficText || `Vol ${t.relativeVolume}` : `Vol ${t.relativeVolume}/100`}</span>
                              <span style={{ fontSize: 10, color: '#2a4060' }}>{t.timeframe}</span>
                            </>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: t.viralScore > 85 ? C.accentG : t.viralScore > 70 ? C.accent : C.muted }}>{t.viralScore}</div>
                          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>VIRAL</div>
                          <div style={{ fontSize: 10, color: C.accent, marginTop: 8 }}>SCRIPT →</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!isLoadingTrends && visible.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: C.muted, fontSize: 12 }}>No trends found for this filter.</div>
                )}
              </div>
            )}

            {!niche && <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontSize: 12, letterSpacing: 2 }}>↑ SELECT A NICHE TO LOAD LIVE TRENDS</div>}

            {savedScripts.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 12, textTransform: 'uppercase' }}>Saved Scripts ({savedScripts.length})</div>
                {savedScripts.map(s => (
                  <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#8a9ac8', marginBottom: 4 }}>"{s.title}"</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{s.niche} · {s.platform} · {s.source} · {s.date}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.score > 85 ? C.accentG : C.accent }}>{s.score}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ RESULT ══ */}
        {step === 'result' && selectedTrend && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <button className="btn-b" onClick={() => setStep('dashboard')} style={{ marginBottom: 20 }}>← Back to Trends</button>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 18px', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: selectedTrend.viralScore > 85 ? C.accentG : C.accent }}>{selectedTrend.viralScore}</div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Viral Score</div>
              </div>
              {selectedTrend.source === 'tiktok' && [['Views', fmt(selectedTrend.views)], ['Likes', fmt(selectedTrend.likes)], ['Shares', fmt(selectedTrend.shares)], ['Comments', fmt(selectedTrend.comments)]].map(([l, v]) => (
                <div key={l} style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 14px', textAlign: 'center', flex: 1, minWidth: 65 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#8a9ac8' }}>{v}</div>
                  <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
                </div>
              ))}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 16px', flex: '2 1 180px' }}>
                <div style={{ fontSize: 12, color: '#8a9ac8', lineHeight: 1.5, marginBottom: 4 }}>"{selectedTrend.title}"</div>
                <div style={{ fontSize: 10, color: C.muted }}>{sourceLabel(selectedTrend.source)}{selectedTrend.isFallback ? ' · demo' : ' · live'} · {niche?.label} · {platform}</div>
              </div>
            </div>

            <div style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 20, display: 'flex' }}>
              {[['full', 'Full AI Script'], ['heygen', 'HeyGen Setup'], ['strategy', 'Strategy']].map(([id, lbl]) => (
                <button key={id} className={`tab ${activeTab === id ? 'act' : ''}`} onClick={() => setActiveTab(id)}>{lbl}</button>
              ))}
            </div>

            {activeTab === 'full' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: 24, whiteSpace: 'pre-wrap', lineHeight: 1.9, fontSize: 12.5, color: '#aab8d8', minHeight: 400, maxHeight: 620, overflowY: 'auto' }}>
                {isGenerating
                  ? <span style={{ color: C.muted }}><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: 8 }}>⟳</span>Writing script from live trend data...</span>
                  : script || <span style={{ color: C.muted }}>Script will appear here...</span>}
              </div>
            )}

            {activeTab === 'heygen' && (
              <div>
                {[
                  { t: 'Avatar & Energy', c: 'Presenter avatar. Expressiveness HIGH for hook, MEDIUM for body, HIGH for CTA. Hand gestures ON. Direct eye contact.' },
                  { t: 'Voice', c: 'Speed 1.05–1.1x. 250ms pause after hook. SSML emphasis on power words. Energetic but conversational.' },
                  { t: 'Captions', c: `Auto-captions ON. Bold high-contrast center-lower-third. 85%+ of ${platform} watched muted.` },
                  { t: 'Background', c: 'Bold solid color or clean studio. No busy backgrounds. You are the focal point.' },
                  { t: 'Export', c: '1080×1920 (9:16). 30fps min. H.264 MP4. Under 500MB. No letterboxing.' },
                  { t: 'Duration', c: platform === 'TikTok' ? '21–34 seconds sweet spot for TikTok completion rate.' : platform === 'Instagram Reels' ? '15–30 seconds. Under 15s gets the most replays.' : '45–60 seconds for YouTube Shorts.' },
                ].map((tip, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, padding: '16px 20px', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: C.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{String(i + 1).padStart(2, '0')} — {tip.t}</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>{tip.c}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'strategy' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: 22 }}>
                <div style={{ fontSize: 10, color: C.accentG, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Hashtag Strategy · {niche?.label} · {platform}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 2 }}>
                  <strong style={{ color: '#8a9ac8' }}>Tier 1 (1–2):</strong> Broad reach — gets you into the explore feed.<br />
                  <strong style={{ color: '#8a9ac8' }}>Tier 2 (3–4):</strong> Niche-specific — where your exact audience lives.<br />
                  <strong style={{ color: '#8a9ac8' }}>Tier 3 (2–3):</strong> Micro — ranks fastest, builds the most loyal followers.<br /><br />
                  <strong style={{ color: '#8a9ac8' }}>Rule:</strong> {platform === 'TikTok' ? '3–5 hashtags max. Always include #fyp or #foryou.' : platform === 'Instagram Reels' ? '8–15 hashtags in caption (not comments). Mix all tiers.' : '3 hashtags in title/description. Always include #Shorts.'}<br />
                  <strong style={{ color: '#8a9ac8' }}>Best time:</strong> {platform === 'TikTok' ? 'Tue–Thu 7–9am or 7–9pm EST' : platform === 'Instagram Reels' ? 'Mon–Fri 9am–12pm or 6–9pm EST' : 'Sat–Sun 9–11am EST'}
                </div>
                {selectedTrend.hashtags?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10, color: C.accentG, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Source Hashtags</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedTrend.hashtags.map(h => <span key={h} style={{ background: C.dim, border: `1px solid ${C.border}`, padding: '4px 12px', fontSize: 12, color: C.accent }}>{h}</span>)}
                    </div>
                  </div>
                )}
                {selectedTrend.relatedQueries?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10, color: C.accentG, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Related Searches → Use as Hooks</div>
                    {selectedTrend.relatedQueries.map(q => <div key={q} style={{ fontSize: 12, color: C.muted, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>→ {q}</div>)}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button className="btn-a" onClick={saveScript} disabled={!script}>💾 SAVE</button>
              <button className="btn-b" onClick={copyScript}>{copied ? '✅ COPIED!' : '📋 COPY SCRIPT'}</button>
              <button className="btn-b" onClick={() => selectedTrend && generateScript(selectedTrend)}>↺ REGEN</button>
              <button className="btn-b" onClick={() => setStep('dashboard')}>← TRENDS</button>
              <button className="btn-b" onClick={() => setStep('keys')} style={{ marginLeft: 'auto' }}>⚙ KEYS</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
