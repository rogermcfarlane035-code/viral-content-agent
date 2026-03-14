'use client';
import { useState, useCallback } from 'react';

const PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts'];
const NICHES = [
  { label: 'Finance',       gTerm: 'personal finance',        ttTag: 'finance',       emoji: '💰' },
  { label: 'Fitness',       gTerm: 'workout',                 ttTag: 'fitness',       emoji: '💪' },
  { label: 'AI & Tech',     gTerm: 'artificial intelligence', ttTag: 'ai',            emoji: '🤖' },
  { label: 'Motivation',    gTerm: 'self improvement',        ttTag: 'motivation',    emoji: '🔥' },
  { label: 'Beauty',        gTerm: 'makeup tutorial',         ttTag: 'beauty',        emoji: '💄' },
  { label: 'Food',          gTerm: 'easy recipe',             ttTag: 'food',          emoji: '🍽️' },
  { label: 'Travel',        gTerm: 'travel tips',             ttTag: 'travel',        emoji: '✈️' },
  { label: 'Relationships', gTerm: 'relationship advice',     ttTag: 'relationships', emoji: '❤️' },
  { label: 'Productivity',  gTerm: 'productivity',            ttTag: 'productivity',  emoji: '⚡' },
  { label: 'Comedy',        gTerm: 'funny viral',             ttTag: 'comedy',        emoji: '😂' },
];

function calcViralScore(trend) {
  if (trend.source === 'tiktok') {
    const eng = ((trend.likes + trend.shares * 3 + trend.comments * 2) / Math.max(trend.views, 1)) * 100;
    return Math.min(Math.round(Math.min(trend.views / 100000, 40) + Math.min(eng * 10, 40) + (trend.shares > 50000 ? 20 : trend.shares > 20000 ? 12 : 5)), 99);
  }
  const bonus = trend.trend === 'breakout' ? 25 : trend.trend === 'rising' ? 15 : 5;
  return Math.min(Math.round((trend.relativeVolume || 60) * 0.6 + bonus), 99);
}

const fmt = n => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n || 0);

// Fallback data
function fallbackTikTok(niche) {
  const map = {
    Finance: ['I made $10k passively — here\'s exactly how', 'Stop putting money in savings, do this instead', 'The investing mistake costing you thousands'],
    Fitness: ['I tried 75 Hard for 75 days. Here\'s what happened', 'This 5-minute routine replaced my entire gym', 'My body changed after 90 days — no gym needed'],
    'AI & Tech': ['This AI tool is replacing entire teams right now', 'I built a $5k/mo business in 48hrs using only AI', 'You\'re using ChatGPT completely wrong'],
    Motivation: ['Nobody talks about this stage of success', 'If you\'re stuck, you need to see this', 'The one mindset shift that changes everything'],
    Beauty: ['This $7 dupe is literally better than the $80 original', 'I finally found my signature look — here\'s how', 'Dermatologist exposes the biggest skincare lie'],
    Food: ['3-ingredient meal that tastes like a restaurant', 'I ate this every day for 30 days', 'Gordon Ramsay approved this $3 hack'],
    Travel: ['This country is better than Bali and nobody goes there', 'I traveled Europe for $600 total', 'Things airlines will never tell you'],
    Relationships: ['The green flag nobody ever talks about', 'Signs your attachment style is ruining your relationships', 'This communication trick saved everything'],
    Productivity: ['I deleted all social media for 30 days', 'The Elon Musk scheduling method (it actually works)', 'Your to-do list is making you less productive'],
    Comedy: ['POV: you\'re the main character and it\'s going great', 'Things only chronic overthinkers understand', 'My toxic trait is actually just being relatable'],
  };
  return (map[niche.label] || map.Finance).map((title, i) => ({
    id: `tt_fb_${i}`, source: 'tiktok', title,
    views: Math.floor(Math.random() * 8e6) + 500000,
    likes: Math.floor(Math.random() * 400000) + 20000,
    shares: Math.floor(Math.random() * 80000) + 5000,
    comments: Math.floor(Math.random() * 30000) + 1000,
    hashtags: [`#${niche.ttTag}`, '#fyp', '#viral', '#foryou'],
    creator: `@creator${Math.floor(Math.random() * 999)}`,
    isFallback: true,
  }));
}

function fallbackTrendly(niche) {
  const map = {
    Finance: ['passive income streams 2025', 'how to build wealth fast', 'best index funds right now'],
    Fitness: ['fastest way to lose belly fat', 'best home workout no equipment', 'protein intake per day'],
    'AI & Tech': ['best AI tools 2025', 'how to use Claude AI', 'AI replacing jobs list'],
    Motivation: ['how to stay disciplined', 'morning routine habits', 'stoic philosophy life'],
    Beauty: ['glass skin routine', 'best drugstore foundation', 'no makeup makeup look'],
    Food: ['high protein meal prep', 'air fryer chicken recipe', '5 ingredient pasta'],
    Travel: ['cheapest places to travel 2025', 'best solo travel destinations', 'how to travel cheap'],
    Relationships: ['how to set boundaries', 'signs of secure attachment', 'communication in relationships'],
    Productivity: ['deep work technique', 'time blocking schedule', 'second brain system'],
    Comedy: ['gen z humor explained', 'relatable work memes', 'overthinking jokes'],
  };
  return (map[niche.label] || map.Finance).map((title, i) => ({
    id: `gt_fb_${i}`, source: 'trendly', title,
    relativeVolume: Math.floor(Math.random() * 30) + 65,
    trend: ['rising', 'breakout', 'steady'][i % 3],
    timeframe: 'past 7 days',
    relatedQueries: [`${title} for beginners`, `${title} 2025`, `best ${title}`],
    isFallback: true,
  }));
}

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
  const [apiStatus, setApiStatus] = useState({ tiktok: null, trendly: null });
  const [copied, setCopied] = useState(false);

  const loadTrends = useCallback(async (selectedNiche) => {
    setIsLoadingTrends(true);
    setTrends([]);
    setSelectedTrend(null);
    setScript('');

    let ttResults = [], gtResults = [];
    const newStatus = { tiktok: null, trendly: null };

    // TikTok
    try {
      const res = await fetch(`/api/tiktok?keyword=${encodeURIComponent(selectedNiche.ttTag)}`, {
        headers: { 'x-rapidapi-key': apiKey },
      });
      const data = await res.json();
      if (data.results) { ttResults = data.results; newStatus.tiktok = 'live'; }
      else { ttResults = fallbackTikTok(selectedNiche); newStatus.tiktok = 'error'; }
    } catch {
      ttResults = fallbackTikTok(selectedNiche);
      newStatus.tiktok = apiKey ? 'error' : 'demo';
    }

    // Trendly
    try {
      const res = await fetch('/api/trendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: selectedNiche.gTerm, apiKey }),
      });
      const data = await res.json();
      if (data.results) { gtResults = data.results; newStatus.trendly = 'live'; }
      else { gtResults = fallbackTrendly(selectedNiche); newStatus.trendly = 'error'; }
    } catch {
      gtResults = fallbackTrendly(selectedNiche);
      newStatus.trendly = apiKey ? 'error' : 'demo';
    }

    const all = [...ttResults, ...gtResults].map(t => ({ ...t, viralScore: calcViralScore(t) }));
    setTrends(all);
    setApiStatus(newStatus);
    setIsLoadingTrends(false);
  }, [apiKey]);

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
    } catch (e) {
      setScript('Error generating script. Please try again.');
    }
    setIsGenerating(false);
  };

  const saveScript = () => {
    if (!selectedTrend || !script) return;
    setSavedScripts(p => [{
      id: Date.now(), niche: niche?.label, platform,
      title: selectedTrend.title, score: selectedTrend.viralScore,
      source: selectedTrend.source, date: new Date().toLocaleDateString(), script,
    }, ...p]);
  };

  const copyScript = () => {
    navigator.clipboard?.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const C = {
    bg: '#07080f', card: '#0b0d16', border: '#151828',
    accent: '#5b8fff', accentG: '#00e5a0', text: '#d4d8f0',
    muted: '#3a4060', dim: '#1e2238',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono','Courier New',monospace", position: 'relative' }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: -200, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,143,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -150, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .btn-a{background:#5b8fff;border:none;color:#fff;padding:13px 28px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-weight:700;transition:all 0.2s;}
        .btn-a:hover{background:#7aa3ff;box-shadow:0 0 20px rgba(91,143,255,0.4);}
        .btn-a:disabled{opacity:0.4;cursor:not-allowed;}
        .btn-b{background:transparent;border:1px solid #151828;color:#3a4060;padding:10px 20px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all 0.2s;}
        .btn-b:hover{border-color:#5b8fff;color:#5b8fff;}
        .tc{background:#0b0d16;border:1px solid #151828;padding:18px 20px;margin-bottom:10px;cursor:pointer;transition:all 0.15s;position:relative;overflow:hidden;}
        .tc:hover{border-color:#5b8fff;background:#0e1020;}
        .inp{background:#090b14;border:1px solid #151828;color:#d4d8f0;padding:12px 16px;font-family:'IBM Plex Mono',monospace;font-size:13px;width:100%;outline:none;transition:border 0.2s;}
        .inp:focus{border-color:#5b8fff;}
        .tab{background:none;border:none;border-bottom:2px solid transparent;padding:10px 18px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;color:#3a4060;transition:all 0.2s;}
        .tab.act{border-bottom-color:#5b8fff;color:#5b8fff;}
        .nc{background:#0b0d16;border:1px solid #151828;padding:11px 14px;font-family:'IBM Plex Mono',monospace;font-size:11px;cursor:pointer;transition:all 0.2s;text-align:left;color:#3a4060;width:100%;}
        .nc:hover,.nc.sel{border-color:#5b8fff;color:#5b8fff;background:#0d1022;}
        .pf{background:#0b0d16;border:1px solid #151828;padding:10px 18px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all 0.2s;color:#3a4060;white-space:nowrap;width:100%;}
        .pf.sel{border-color:#00e5a0;color:#00e5a0;background:#091410;}
        .pf:hover{border-color:#00e5a0;color:#00e5a0;}
        select{background:#090b14;border:1px solid #151828;color:#3a4060;padding:8px 10px;font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;cursor:pointer;}
        .shimmer{background:linear-gradient(90deg,#0b0d16 25%,#1e2238 50%,#0b0d16 75%);background-size:600px 100%;animation:shimmer 1.3s infinite;}
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '36px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40, animation: 'fadeUp 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accentG, display: 'inline-block', animation: 'pulse 1.8s infinite' }} />
            <span style={{ fontSize: 10, letterSpacing: 3, color: C.accentG, textTransform: 'uppercase' }}>
              {step === 'keys' ? 'Setup' : (apiStatus.tiktok === 'live' || apiStatus.trendly === 'live') ? 'LIVE DATA' : 'Demo Mode'}
            </span>
            {(apiStatus.tiktok || apiStatus.trendly) && (
              <span style={{ marginLeft: 'auto', fontSize: 10, color: C.muted }}>
                TikTok: <span style={{ color: apiStatus.tiktok === 'live' ? C.accentG : '#ff6b6b' }}>{apiStatus.tiktok}</span>
                {'  '}Trendly: <span style={{ color: apiStatus.trendly === 'live' ? C.accentG : '#ff6b6b' }}>{apiStatus.trendly}</span>
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 700, margin: '0 0 6px', letterSpacing: -1, lineHeight: 1.1 }}>
            VIRAL CONTENT<br />
            <span style={{ color: C.accent }}>AGENT</span>{' '}
            <span style={{ color: C.accentG, fontSize: '0.5em', letterSpacing: 2 }}>v3 · LIVE</span>
          </h1>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
            TikTok Scraper7 + Trendly → AI Scripts → HeyGen-Ready
          </p>
        </div>

        {/* ── KEYS ── */}
        {step === 'keys' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: '28px 32px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: C.muted, marginBottom: 20, textTransform: 'uppercase' }}>Connect RapidAPI</div>
              <div style={{ fontSize: 10, letterSpacing: 1, color: C.muted, marginBottom: 8, textTransform: 'uppercase' }}>
                RapidAPI Key <span style={{ color: C.accent }}>*</span>
              </div>
              <input className="inp" type="password" placeholder="Paste your RapidAPI key here..."
                value={apiKey} onChange={e => setApiKey(e.target.value)}
                style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 24, lineHeight: 1.8 }}>
                ✅ TikTok Scraper7 — <span style={{ color: C.accent }}>tiktok-scraper7.p.rapidapi.com</span><br />
                ✅ Trendly — <span style={{ color: C.accent }}>trendly.p.rapidapi.com</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-a" onClick={() => setStep('dashboard')}>
                  {apiKey ? '→ CONNECT & LAUNCH' : '→ LAUNCH IN DEMO MODE'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              {[
                { n: '01', t: 'Live Trend Fetch', d: 'Pulls real-time trending TikToks + Google hot topics' },
                { n: '02', t: 'Viral Score Engine', d: 'Scores trends on views, shares (3×), engagement rate' },
                { n: '03', t: 'AI Script Write', d: 'Claude writes a full HeyGen-ready script from live data' },
                { n: '04', t: 'Post & Go Viral', d: 'Paste into HeyGen, render, post on TikTok & Instagram' },
              ].map(s => (
                <div key={s.n} style={{ background: C.card, border: `1px solid ${C.border}`, padding: 18 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.dim, marginBottom: 8 }}>{s.n}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 6 }}>{s.t}</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {step === 'dashboard' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 28, marginBottom: 32, alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 10, textTransform: 'uppercase' }}>Platform</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PLATFORMS.map(p => (
                    <button key={p} className={`pf ${platform === p ? 'sel' : ''}`} onClick={() => setPlatform(p)}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 10, textTransform: 'uppercase' }}>Niche</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8 }}>
                  {NICHES.map(n => (
                    <button key={n.label} className={`nc ${niche?.label === n.label ? 'sel' : ''}`}
                      onClick={() => { setNiche(n); loadTrends(n); }}>
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
                    {isLoadingTrends ? '⟳  Fetching live trends...' : `${visible.length} trends · ${niche.label}`}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {['all', 'tiktok', 'trendly'].map(f => (
                      <button key={f} onClick={() => setSourceFilter(f)}
                        style={{ background: sourceFilter === f ? C.accent : 'transparent', border: `1px solid ${sourceFilter === f ? C.accent : C.border}`, color: sourceFilter === f ? '#fff' : C.muted, padding: '5px 12px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                        {f}
                      </button>
                    ))}
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                      <option value="viral">↓ Viral Score</option>
                      <option value="views">↓ Views</option>
                    </select>
                  </div>
                </div>

                {isLoadingTrends && [...Array(5)].map((_, i) => (
                  <div key={i} className="shimmer" style={{ height: 82, marginBottom: 10, animationDelay: `${i * 0.08}s` }} />
                ))}

                {!isLoadingTrends && visible.map((t, i) => (
                  <div key={t.id} className="tc" style={{ animationDelay: `${i * 0.04}s`, animation: 'fadeUp 0.35s ease both' }}
                    onClick={() => generateScript(t)}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${t.viralScore}%`, background: t.source === 'tiktok' ? 'rgba(91,143,255,0.04)' : 'rgba(0,229,160,0.04)', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                      <div style={{ flex: 1, marginRight: 20 }}>
                        <div style={{ fontSize: 13, color: '#c4c8e0', marginBottom: 8, lineHeight: 1.5 }}>"{t.title}"</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 10, padding: '3px 9px', border: `1px solid ${t.source === 'tiktok' ? '#2a3a6a' : '#1a4a3a'}`, color: t.source === 'tiktok' ? '#7a9aff' : '#4aaa7a', background: t.source === 'tiktok' ? '#0a0f20' : '#0a1a10', letterSpacing: 1, textTransform: 'uppercase' }}>
                            {t.source}{t.isFallback ? ' · demo' : ' · live'}
                          </span>
                          {t.source === 'tiktok' ? <>
                            <span style={{ fontSize: 10, color: C.muted }}>👁 {fmt(t.views)}</span>
                            <span style={{ fontSize: 10, color: C.muted }}>❤️ {fmt(t.likes)}</span>
                            <span style={{ fontSize: 10, color: C.muted }}>↗ {fmt(t.shares)}</span>
                          </> : <>
                            <span style={{ fontSize: 10, color: C.muted }}>📈 {t.trend}</span>
                            <span style={{ fontSize: 10, color: C.muted }}>Vol {t.relativeVolume}/100</span>
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
                ))}
              </div>
            )}

            {!niche && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontSize: 12, letterSpacing: 2 }}>
                ↑ SELECT A NICHE TO LOAD LIVE TRENDS
              </div>
            )}

            {savedScripts.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 12, textTransform: 'uppercase' }}>Saved Scripts ({savedScripts.length})</div>
                {savedScripts.map(s => (
                  <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#8a9ac8', marginBottom: 4 }}>"{s.title}"</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{s.niche} · {s.platform} · {s.date}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.score > 85 ? C.accentG : C.accent }}>{s.score}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESULT ── */}
        {step === 'result' && selectedTrend && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <button className="btn-b" onClick={() => setStep('dashboard')} style={{ marginBottom: 20 }}>← Back to Trends</button>

            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 18px', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: selectedTrend.viralScore > 85 ? C.accentG : C.accent }}>{selectedTrend.viralScore}</div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Viral Score</div>
              </div>
              {selectedTrend.source === 'tiktok' && [['Views', fmt(selectedTrend.views)], ['Likes', fmt(selectedTrend.likes)], ['Shares', fmt(selectedTrend.shares)]].map(([l, v]) => (
                <div key={l} style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 16px', textAlign: 'center', flex: 1, minWidth: 70 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#8a9ac8' }}>{v}</div>
                  <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
                </div>
              ))}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 16px', flex: '2 1 200px' }}>
                <div style={{ fontSize: 12, color: '#8a9ac8', lineHeight: 1.5, marginBottom: 4 }}>"{selectedTrend.title}"</div>
                <div style={{ fontSize: 10, color: C.muted }}>{selectedTrend.source} · {niche?.label} · {platform}</div>
              </div>
            </div>

            <div style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 20, display: 'flex' }}>
              {[['full', 'Full AI Script'], ['heygen', 'HeyGen Setup'], ['strategy', 'Strategy']].map(([id, lbl]) => (
                <button key={id} className={`tab ${activeTab === id ? 'act' : ''}`} onClick={() => setActiveTab(id)}>{lbl}</button>
              ))}
            </div>

            {activeTab === 'full' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: 24, whiteSpace: 'pre-wrap', lineHeight: 1.9, fontSize: 12.5, color: '#aab8d8', minHeight: 400, maxHeight: 600, overflowY: 'auto' }}>
                {isGenerating
                  ? <span style={{ color: C.muted }}><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: 8 }}>⟳</span>Writing your script from live trend data...</span>
                  : script || <span style={{ color: C.muted }}>Script will appear here...</span>
                }
              </div>
            )}

            {activeTab === 'heygen' && (
              <div>
                {[
                  { t: 'Avatar & Energy', c: `Use an energetic Presenter avatar. Expressiveness: HIGH for hook, MEDIUM for body, HIGH for CTA. Enable hand gestures. Direct eye contact.` },
                  { t: 'Voice & Pacing', c: `Speed: 1.05–1.1x. Add 200–300ms pause after the hook. Use SSML emphasis on power words. Energetic but conversational.` },
                  { t: 'Captions', c: `Auto-captions ON. Bold, high-contrast, center-lower-third. 85%+ of ${platform} is watched muted — captions are non-negotiable.` },
                  { t: 'Background', c: `Bold solid color (black, white, or brand color). Avoid busy backgrounds. Simple = more focus on you.` },
                  { t: 'Export Specs', c: `Resolution: 1080×1920 (9:16). Framerate: 30fps min. Codec: H.264 MP4. Under 500MB. NO letterboxing.` },
                  { t: 'Duration', c: `${platform === 'TikTok' ? '21–34 seconds is the sweet spot for TikTok completion rate.' : platform === 'Instagram Reels' ? '15–30 seconds for Reels. Under 15s gets the most replays.' : '45–60 seconds for YouTube Shorts.'}` },
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
                  <strong style={{ color: '#8a9ac8' }}>Tier 1 — Broad (1–2):</strong> Massive reach hashtags for explore feed.<br />
                  <strong style={{ color: '#8a9ac8' }}>Tier 2 — Niche (3–4):</strong> Mid-size hashtags where your audience lives.<br />
                  <strong style={{ color: '#8a9ac8' }}>Tier 3 — Micro (2–3):</strong> Small, hyper-specific. Ranks fast, builds loyal followers.<br /><br />
                  <strong style={{ color: '#8a9ac8' }}>Platform rule:</strong> {platform === 'TikTok' ? '3–5 hashtags max. Always #fyp or #foryou.' : platform === 'Instagram Reels' ? '8–15 hashtags in caption. Mix all three tiers.' : '3 hashtags in title/description. Always #Shorts.'}<br />
                  <strong style={{ color: '#8a9ac8' }}>Best post time:</strong> {platform === 'TikTok' ? 'Tue–Thu 7–9am or 7–9pm EST' : platform === 'Instagram Reels' ? 'Mon–Fri 9am–12pm or 6–9pm EST' : 'Sat–Sun 9–11am EST'}
                </div>
                {selectedTrend.hashtags?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10, color: C.accentG, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Source Hashtags</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedTrend.hashtags.map(h => (
                        <span key={h} style={{ background: C.dim, border: `1px solid ${C.border}`, padding: '4px 12px', fontSize: 12, color: C.accent }}>{h}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button className="btn-a" onClick={saveScript} disabled={!script}>💾 SAVE</button>
              <button className="btn-b" onClick={copyScript}>{copied ? '✅ COPIED!' : '📋 COPY SCRIPT'}</button>
              <button className="btn-b" onClick={() => selectedTrend && generateScript(selectedTrend)}>↺ REGENERATE</button>
              <button className="btn-b" onClick={() => setStep('dashboard')}>← ALL TRENDS</button>
              <button className="btn-b" onClick={() => setStep('keys')} style={{ marginLeft: 'auto' }}>⚙ API KEYS</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
