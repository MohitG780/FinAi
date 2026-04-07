/* ============================================================
   data.js — FinAI Dynamic Data Layer
   All market-linked data is DERIVED from live market.js events.
   Static data (UI options, templates, steps) remains here.
   ============================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     SECTOR → STOCK MAPPING (maps to MARKET.STOCKS symbols)
  ══════════════════════════════════════════════════════════ */
  const SECTOR_MAP = [
    { name: 'Technology',        symbols: ['INFY.NS', 'TCS.NS', 'WIPRO.NS'],           color: '#3b82f6' },
    { name: 'Banking & Finance', symbols: ['HDFCBANK.NS', 'ICICIBANK.NS'],              color: '#8b5cf6' },
    { name: 'Energy',            symbols: ['RELIANCE.NS'],                              color: '#ef4444' },
    { name: 'Infrastructure',    symbols: ['ADANIPORTS.NS'],                            color: '#f59e0b' },
    { name: 'Telecom',           symbols: ['BHARTIARTL.NS'],                            color: '#22c55e' },
    { name: 'Diversified',       symbols: ['RELIANCE.NS', 'INFY.NS', 'TCS.NS'],        color: '#f43f5e' },
  ];

  /* ── COMPANY → STOCK MAPPING ─────────────────────────────── */
  const COMPANY_MAP = [
    { name: 'Reliance Ind.', ticker: 'RELIANCE',   symbol: 'RELIANCE.NS' },
    { name: 'HDFC Bank',     ticker: 'HDFCBANK',   symbol: 'HDFCBANK.NS' },
    { name: 'Infosys Ltd.',  ticker: 'INFY',        symbol: 'INFY.NS'     },
    { name: 'TCS',           ticker: 'TCS',         symbol: 'TCS.NS'      },
    { name: 'Adani Ports',   ticker: 'ADANIPORTS',  symbol: 'ADANIPORTS.NS'},
    { name: 'Wipro',         ticker: 'WIPRO',       symbol: 'WIPRO.NS'    },
    { name: 'ICICI Bank',    ticker: 'ICICIBANK',   symbol: 'ICICIBANK.NS'},
    { name: 'Bharti Airtel', ticker: 'BHARTIARTL',  symbol: 'BHARTIARTL.NS'},
  ];

  /* ══════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════ */

  /** Convert stock % change into a 0–100 sentiment score */
  function pctToScore(changePct) {
    // ±3% change maps to roughly 20–80 score range around 50
    return Math.max(5, Math.min(99, Math.round(50 + changePct * 10)));
  }

  function scoreToClass(score) {
    if (score >= 60) return 'positive';
    if (score <= 40) return 'negative';
    return 'neutral';
  }

  function scoreToBarColor(score) {
    if (score >= 60) return '#22c55e';
    if (score <= 40) return '#ef4444';
    return '#f59e0b';
  }

  /** Build sentiment direction string from average % change */
  function avgPctToDirection(avgPct) {
    if (avgPct > 0.3)  return 'up';
    if (avgPct < -0.3) return 'down';
    return 'flat';
  }

  /** Pick top keywords from current market state */
  function buildKeywords(stocks, indices) {
    const all = [...stocks, ...indices];
    const gainers    = all.filter(s => s.changePct > 1);
    const decliners  = all.filter(s => s.changePct < -1);
    const volatile   = all.filter(s => Math.abs(s.changePct) > 1.5);
    const avgChange  = all.reduce((s, x) => s + x.changePct, 0) / (all.length || 1);

    // Dynamic weight based on how many stocks fall in category
    const keywords = [
      { word: 'growth',       weight: Math.min(5, 2 + gainers.length),    color: 'rgba(34,197,94,0.2)',   textColor: '#86efac' },
      { word: 'bullish',      weight: gainers.length > 3 ? 4 : 2,          color: 'rgba(34,197,94,0.15)',  textColor: '#86efac' },
      { word: 'volatile',     weight: Math.min(5, 1 + volatile.length),    color: 'rgba(239,68,68,0.2)',   textColor: '#fca5a5' },
      { word: 'headwinds',    weight: Math.min(5, 1 + decliners.length),   color: 'rgba(239,68,68,0.2)',   textColor: '#fca5a5' },
      { word: 'EBITDA',       weight: 2,                                    color: 'rgba(59,130,246,0.15)', textColor: '#93c5fd' },
      { word: 'revenue',      weight: avgChange > 0 ? 5 : 3,               color: 'rgba(34,197,94,0.2)',   textColor: '#86efac' },
      { word: 'risk',         weight: Math.min(5, 1 + decliners.length),   color: 'rgba(239,68,68,0.2)',   textColor: '#fca5a5' },
      { word: 'margin',       weight: 2,                                    color: 'rgba(245,158,11,0.2)',  textColor: '#fcd34d' },
      { word: 'NIM',          weight: 2,                                    color: 'rgba(59,130,246,0.15)', textColor: '#93c5fd' },
      { word: 'liquidity',    weight: volatile.length > 2 ? 3 : 2,         color: 'rgba(245,158,11,0.2)',  textColor: '#fcd34d' },
      { word: 'supply chain', weight: decliners.length > 2 ? 3 : 1,        color: 'rgba(239,68,68,0.2)',   textColor: '#fca5a5' },
      { word: 'optimistic',   weight: gainers.length > 3 ? 3 : 2,          color: 'rgba(34,197,94,0.2)',   textColor: '#86efac' },
    ];

    return keywords;
  }

  /** Build risk bars from current market volatility */
  function buildRiskBars(stocks, indices) {
    const all = [...stocks, ...indices];
    const avgAbsChange = all.reduce((s, x) => s + Math.abs(x.changePct), 0) / (all.length || 1);
    const declinePct   = all.filter(s => s.changePct < 0).length / (all.length || 1);
    const maxVolatility = Math.min(99, Math.round(40 + avgAbsChange * 20));
    const marketRisk   = Math.min(99, Math.round(35 + avgAbsChange * 25 + declinePct * 20));
    const opRisk       = Math.min(99, Math.round(30 + avgAbsChange * 10 + declinePct * 15));
    const regRisk      = Math.min(99, Math.round(35 + declinePct * 25));
    const liqRisk      = Math.min(99, Math.round(20 + avgAbsChange * 8));
    const creditRisk   = Math.min(99, Math.round(18 + declinePct * 20));

    return [
      { label: 'Market Risk',      val: marketRisk  > 65 ? 'High' : marketRisk  > 40 ? 'Medium' : 'Low', pct: marketRisk,  color: marketRisk  > 65 ? '#ef4444' : marketRisk  > 40 ? '#f59e0b' : '#22c55e' },
      { label: 'Operational Risk', val: opRisk      > 65 ? 'High' : opRisk      > 40 ? 'Medium' : 'Low', pct: opRisk,      color: opRisk      > 65 ? '#ef4444' : opRisk      > 40 ? '#f59e0b' : '#22c55e' },
      { label: 'Regulatory Risk',  val: regRisk     > 65 ? 'High' : regRisk     > 40 ? 'Medium' : 'Low', pct: regRisk,     color: regRisk     > 65 ? '#ef4444' : regRisk     > 40 ? '#f59e0b' : '#22c55e' },
      { label: 'Liquidity Risk',   val: liqRisk     > 65 ? 'High' : liqRisk     > 40 ? 'Medium' : 'Low', pct: liqRisk,     color: liqRisk     > 65 ? '#ef4444' : liqRisk     > 40 ? '#f59e0b' : '#22c55e' },
      { label: 'Credit Risk',      val: creditRisk  > 65 ? 'High' : creditRisk  > 40 ? 'Medium' : 'Low', pct: creditRisk,  color: creditRisk  > 65 ? '#ef4444' : creditRisk  > 40 ? '#f59e0b' : '#22c55e' },
    ];
  }

  /* ══════════════════════════════════════════════════════════
     SENTIMENT TIMELINE — rolling 8-point history
  ══════════════════════════════════════════════════════════ */
  const _timelineHistory = {
    labels:   [],
    positive: [],
    negative: [],
  };
  const TIMELINE_MAX = 12; // keep last N readings

  function _pushTimeline(stocks, indices) {
    const all = [...stocks, ...indices];
    const posCount  = all.filter(s => s.changePct > 0).length;
    const negCount  = all.filter(s => s.changePct < 0).length;
    const total     = all.length || 1;
    const posScore  = Math.round((posCount / total) * 100);
    const negScore  = Math.round((negCount / total) * 100);

    const now = new Date();
    const label = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

    _timelineHistory.labels.push(label);
    _timelineHistory.positive.push(posScore);
    _timelineHistory.negative.push(negScore);

    // Keep only last N points
    if (_timelineHistory.labels.length > TIMELINE_MAX) {
      _timelineHistory.labels.shift();
      _timelineHistory.positive.shift();
      _timelineHistory.negative.shift();
    }
  }

  /* ══════════════════════════════════════════════════════════
     MAIN REFRESH — called on every market-data-updated event
  ══════════════════════════════════════════════════════════ */
  function _refresh(mktState) {
    const { stocks, indices } = mktState;
    const stockMap = {};
    stocks.forEach(s => { stockMap[s.symbol] = s; });

    /* ── 1. Sectors ─────────────────────────────────────── */
    window.DATA.sectors = SECTOR_MAP.map(sec => {
      const secStocks = sec.symbols.map(sym => stockMap[sym]).filter(Boolean);
      if (secStocks.length === 0) {
        return { name: sec.name, value: '~0%', direction: 'flat', fill: 50, color: sec.color };
      }
      const avgPct  = secStocks.reduce((s, x) => s + x.changePct, 0) / secStocks.length;
      const fill    = Math.max(5, Math.min(95, Math.round(50 + avgPct * 8)));
      const direction = avgPctToDirection(avgPct);
      const sign    = direction === 'up' ? '+' : direction === 'down' ? '' : '~';
      return {
        name:      sec.name,
        value:     `${sign}${avgPct.toFixed(2)}%`,
        direction,
        fill,
        color:     sec.color,
      };
    });

    /* ── 2. Companies ────────────────────────────────────── */
    window.DATA.companies = COMPANY_MAP.map(c => {
      const stock = stockMap[c.symbol];
      const score = stock ? pctToScore(stock.changePct) : 50;
      const cls   = scoreToClass(score);
      return {
        name:     c.name,
        ticker:   c.ticker,
        score,
        cls,
        barColor: scoreToBarColor(score),
        price:    stock ? MARKET.formatPrice(stock.price)   : '—',
        change:   stock ? stock.changePct.toFixed(2) + '%' : '—',
      };
    });

    /* ── 3. Risk Bars ────────────────────────────────────── */
    window.DATA.riskBars = buildRiskBars(stocks, indices);

    /* ── 4. Keywords ─────────────────────────────────────── */
    window.DATA.keywords = buildKeywords(stocks, indices);

    /* ── 5. Sentiment Timeline ───────────────────────────── */
    _pushTimeline(stocks, indices);
    window.DATA.sentimentTimeline = {
      labels:   [..._timelineHistory.labels],
      positive: [..._timelineHistory.positive],
      negative: [..._timelineHistory.negative],
    };

    // Dispatch an event so app.js can react (re-draw chart, re-render risk bars etc.)
    window.dispatchEvent(new CustomEvent('data-refreshed', { detail: window.DATA }));
  }

  /* ══════════════════════════════════════════════════════════
     STATIC DATA — never changes with market
  ══════════════════════════════════════════════════════════ */
  window.DATA = {

    /* Pre-seeded with realistic data so UI renders immediately.
       Will be overwritten with live market-derived values on first event. */
    sectors: [
      { name: 'Technology',        value: '+2.4%', direction: 'up',   fill: 72, color: '#3b82f6' },
      { name: 'Banking & Finance', value: '+0.8%', direction: 'up',   fill: 55, color: '#8b5cf6' },
      { name: 'Energy',            value: '-1.2%', direction: 'down', fill: 38, color: '#ef4444' },
      { name: 'Infrastructure',    value: '~0.1%', direction: 'flat', fill: 50, color: '#f59e0b' },
      { name: 'Telecom',           value: '+1.5%', direction: 'up',   fill: 65, color: '#22c55e' },
      { name: 'Diversified',       value: '-0.4%', direction: 'down', fill: 44, color: '#f43f5e' },
    ],

    companies: [
      { name: 'Reliance Ind.',  ticker: 'RELIANCE',   score: 68, cls: 'positive', barColor: '#22c55e', price: '₹2,845', change: '+1.2%' },
      { name: 'HDFC Bank',      ticker: 'HDFCBANK',   score: 52, cls: 'neutral',  barColor: '#f59e0b', price: '₹1,680', change: '+0.4%' },
      { name: 'Infosys Ltd.',   ticker: 'INFY',       score: 74, cls: 'positive', barColor: '#22c55e', price: '₹1,520', change: '+2.1%' },
      { name: 'TCS',            ticker: 'TCS',        score: 71, cls: 'positive', barColor: '#22c55e', price: '₹3,680', change: '+1.8%' },
      { name: 'Adani Ports',    ticker: 'ADANIPORTS', score: 38, cls: 'negative', barColor: '#ef4444', price: '₹1,190', change: '-0.9%' },
      { name: 'Wipro',          ticker: 'WIPRO',      score: 60, cls: 'positive', barColor: '#22c55e', price: '₹485',   change: '+0.7%' },
      { name: 'ICICI Bank',     ticker: 'ICICIBANK',  score: 55, cls: 'neutral',  barColor: '#f59e0b', price: '₹1,245', change: '+0.3%' },
      { name: 'Bharti Airtel',  ticker: 'BHARTIARTL', score: 65, cls: 'positive', barColor: '#22c55e', price: '₹1,680', change: '+1.5%' },
    ],

    riskBars: [
      { label: 'Market Risk',      val: 'Medium', pct: 58, color: '#f59e0b' },
      { label: 'Operational Risk', val: 'Low',    pct: 42, color: '#22c55e' },
      { label: 'Regulatory Risk',  val: 'Medium', pct: 46, color: '#f59e0b' },
      { label: 'Liquidity Risk',   val: 'Low',    pct: 30, color: '#22c55e' },
      { label: 'Credit Risk',      val: 'Low',    pct: 24, color: '#3b82f6' },
    ],

    keywords: [
      { word: 'growth',       weight: 5, color: 'rgba(34,197,94,0.2)',   textColor: '#86efac' },
      { word: 'revenue',      weight: 5, color: 'rgba(34,197,94,0.2)',   textColor: '#86efac' },
      { word: 'risk',         weight: 4, color: 'rgba(239,68,68,0.2)',   textColor: '#fca5a5' },
      { word: 'volatile',     weight: 3, color: 'rgba(239,68,68,0.2)',   textColor: '#fca5a5' },
      { word: 'headwinds',    weight: 3, color: 'rgba(239,68,68,0.2)',   textColor: '#fca5a5' },
      { word: 'supply chain', weight: 3, color: 'rgba(239,68,68,0.2)',   textColor: '#fca5a5' },
      { word: 'EBITDA',       weight: 2, color: 'rgba(59,130,246,0.15)', textColor: '#93c5fd' },
      { word: 'margin',       weight: 2, color: 'rgba(245,158,11,0.2)',  textColor: '#fcd34d' },
      { word: 'NIM',          weight: 2, color: 'rgba(59,130,246,0.15)', textColor: '#93c5fd' },
      { word: 'liquidity',    weight: 2, color: 'rgba(245,158,11,0.2)',  textColor: '#fcd34d' },
      { word: 'optimistic',   weight: 2, color: 'rgba(34,197,94,0.2)',   textColor: '#86efac' },
      { word: 'bullish',      weight: 2, color: 'rgba(34,197,94,0.15)',  textColor: '#86efac' },
    ],

    sentimentTimeline: {
      labels:   ['Mar 1','Mar 5','Mar 9','Mar 13','Mar 17','Mar 21','Mar 25','Mar 28'],
      positive: [45, 55, 60, 52, 68, 72, 65, 71],
      negative: [30, 28, 20, 35, 18, 15, 22, 18],
    },

    /* recentDocs comes from Firestore via db.js */
    recentDocs: [],

    /* Static UI data */
    templates: [
      'Infosys Annual Report 2024',
      'SEBI Risk Disclosure Template',
      'TCS Q4 Earnings Call',
      'Wipro Press Release',
      'Nifty 50 Analysis',
    ],

    analysisOptions: [
      { id: 'sentiment', icon: '💬', label: 'Sentiment Analysis' },
      { id: 'summary',   icon: '📝', label: 'Summarisation'      },
      { id: 'risk',      icon: '⚠️', label: 'Risk Detection'     },
      { id: 'xai',       icon: '🔍', label: 'XAI Explain'        },
    ],

    analysisSteps: [
      { label: 'Tokenizing text with FinBERT…',  icon: 'T' },
      { label: 'Running transformer inference…',  icon: '⚙' },
      { label: 'Generating sentiment scores…',    icon: '💬' },
      { label: 'Extracting risk entities…',       icon: '⚠' },
      { label: 'Building XAI explanations…',      icon: '🔍' },
      { label: 'Saving to database…',             icon: '💾' },
      { label: 'Compiling results…',              icon: '✓' },
    ],
  };

  /* ══════════════════════════════════════════════════════════
     LISTEN TO MARKET EVENTS
  ══════════════════════════════════════════════════════════ */
  window.addEventListener('market-data-updated', (e) => {
    // Wait until MARKET is available (loaded before data.js)
    if (window.MARKET) _refresh(e.detail);
  });

})();
