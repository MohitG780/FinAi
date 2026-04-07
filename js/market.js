/* ============================================================
   market.js — Real-Time Market Data Module for FinAI
   Fetches live market data from free APIs with graceful fallback
   ============================================================ */

(function () {
  'use strict';

  const REFRESH_INTERVAL = 10000; // 10 seconds for live feel
  let refreshTimer = null;

  /* ── Indian Market Symbols ─────────────────────────────── */
  const INDICES = [
    { symbol: '^NSEI', name: 'NIFTY 50', shortName: 'NIFTY' },
    { symbol: '^BSESN', name: 'SENSEX', shortName: 'SENSEX' },
    { symbol: '^NSEBANK', name: 'BANK NIFTY', shortName: 'BANKNIFTY' },
  ];

  const STOCKS = [
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', shortName: 'TATAMOTORS' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', shortName: 'HDFCBANK' },
    { symbol: 'INFY.NS', name: 'Infosys', shortName: 'INFY' },
    { symbol: 'TCS.NS', name: 'TCS', shortName: 'TCS' },
    { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', shortName: 'ADANIPORTS' },
    { symbol: 'WIPRO.NS', name: 'Wipro', shortName: 'WIPRO' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', shortName: 'ICICIBANK' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', shortName: 'BHARTIARTL' },
  ];

  /* ── Live Data State ───────────────────────────────────── */
  const marketState = {
    indices: [],
    stocks: [],
    lastUpdated: null,
    isLive: false,
    marketOpen: false,
  };

  /* ── Check if Indian market is open ────────────────────── */
  function isMarketOpen() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
    const day = ist.getDay();
    const hours = ist.getHours();
    const minutes = ist.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    // NSE: Mon-Fri, 9:15 AM to 3:30 PM IST
    return day >= 1 && day <= 5 && totalMinutes >= 555 && totalMinutes <= 930;
  }

  /* ── Fetch from Yahoo Finance v8 API ───────────────────── */
  async function fetchYahooQuotes(symbols) {
    const symbolStr = symbols.map(s => s.symbol).join(',');
    const proxyUrls = [
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolStr}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume`,
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbolStr}`,
    ];

    for (const url of proxyUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeout);

        if (!resp.ok) continue;
        const data = await resp.json();
        if (data?.quoteResponse?.result) {
          return data.quoteResponse.result;
        }
      } catch (e) {
        console.warn('Yahoo fetch attempt failed:', e.message);
        continue;
      }
    }
    return null;
  }

  /* ── Generate realistic mock data as fallback ──────────── */
  const _prevPrices = {};
  const _basePrices = {
    '^NSEI': 23450, '^BSESN': 77200, '^NSEBANK': 49800,
    'TATAMOTORS.NS': 985, 'HDFCBANK.NS': 1680, 'INFY.NS': 1520,
    'TCS.NS': 3680, 'ADANIPORTS.NS': 1190, 'WIPRO.NS': 485,
    'ICICIBANK.NS': 1245, 'BHARTIARTL.NS': 1680,
  };
  const _nameMap = {
    '^NSEI': ['NIFTY 50','NIFTY'], '^BSESN': ['SENSEX','SENSEX'], '^NSEBANK': ['BANK NIFTY','BANKNIFTY'],
    'TATAMOTORS.NS': ['Tata Motors','TATAMOTORS'], 'HDFCBANK.NS': ['HDFC Bank','HDFCBANK'],
    'INFY.NS': ['Infosys','INFY'], 'TCS.NS': ['TCS','TCS'],
    'ADANIPORTS.NS': ['Adani Ports','ADANIPORTS'], 'WIPRO.NS': ['Wipro','WIPRO'],
    'ICICIBANK.NS': ['ICICI Bank','ICICIBANK'], 'BHARTIARTL.NS': ['Bharti Airtel','BHARTIARTL'],
  };

  function generateRealisticData() {
    const results = [];
    for (const [symbol, basePrice] of Object.entries(_basePrices)) {
      // Start from previous price or base, apply micro-tick
      const prev = _prevPrices[symbol] || basePrice;
      const tickPct = (Math.random() - 0.48) * 0.4; // small ±0.2% tick, slight positive bias
      const newPrice = prev * (1 + tickPct / 100);
      // Clamp to ±5% of base
      const clamped = Math.max(basePrice * 0.95, Math.min(basePrice * 1.05, newPrice));
      _prevPrices[symbol] = clamped;

      const change = clamped - basePrice;
      const changePct = ((clamped - basePrice) / basePrice) * 100;
      const [longName, shortName] = _nameMap[symbol];

      results.push({
        symbol,
        shortName,
        longName,
        regularMarketPrice: parseFloat(clamped.toFixed(2)),
        regularMarketChange: parseFloat(change.toFixed(2)),
        regularMarketChangePercent: parseFloat(changePct.toFixed(2)),
        regularMarketPreviousClose: basePrice,
        regularMarketOpen: parseFloat((basePrice + (Math.random() - 0.5) * basePrice * 0.003).toFixed(2)),
        regularMarketDayHigh: parseFloat((Math.max(clamped, basePrice) + Math.abs(change) * 0.2).toFixed(2)),
        regularMarketDayLow: parseFloat((Math.min(clamped, basePrice) - Math.abs(change) * 0.3).toFixed(2)),
        regularMarketVolume: Math.floor(Math.random() * 50000000) + 1000000,
      });
    }
    return results;
  }

  /* ── Process quote data ────────────────────────────────── */
  function processQuoteData(quotes) {
    const indexSymbols = INDICES.map(i => i.symbol);
    const indices = [];
    const stocks = [];

    quotes.forEach(q => {
      const entry = {
        symbol: q.symbol,
        name: q.longName || q.shortName || q.symbol,
        shortName: q.shortName || q.symbol.replace('.NS', ''),
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePct: q.regularMarketChangePercent,
        prevClose: q.regularMarketPreviousClose,
        open: q.regularMarketOpen,
        high: q.regularMarketDayHigh,
        low: q.regularMarketDayLow,
        volume: q.regularMarketVolume,
        direction: q.regularMarketChange >= 0 ? 'up' : 'down',
      };

      if (indexSymbols.includes(q.symbol)) {
        indices.push(entry);
      } else {
        stocks.push(entry);
      }
    });

    return { indices, stocks };
  }

  /* ── Format helpers ────────────────────────────────────── */
  function formatPrice(price) {
    if (price >= 100000) return '₹' + (price / 1000).toFixed(1) + 'K';
    if (price >= 10000) return '₹' + price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '₹' + price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatVolume(vol) {
    if (vol >= 10000000) return (vol / 10000000).toFixed(1) + ' Cr';
    if (vol >= 100000) return (vol / 100000).toFixed(1) + ' L';
    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
    return vol.toString();
  }

  function formatChange(change, pct) {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
  }

  /* ── Main fetch & update ───────────────────────────────── */
  async function fetchMarketData() {
    const allSymbols = [...INDICES, ...STOCKS];

    // Try live API first
    let quotes = await fetchYahooQuotes(allSymbols);

    if (quotes && quotes.length > 0) {
      marketState.isLive = true;
    } else {
      // Fallback to realistic mock data
      quotes = generateRealisticData();
      marketState.isLive = false;
    }

    const processed = processQuoteData(quotes);
    marketState.indices = processed.indices;
    marketState.stocks = processed.stocks;
    marketState.lastUpdated = new Date();
    marketState.marketOpen = isMarketOpen();

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('market-data-updated', { detail: marketState }));
    return marketState;
  }

  /* ── Auto-refresh ──────────────────────────────────────── */
  function startAutoRefresh() {
    stopAutoRefresh();
    fetchMarketData();
    refreshTimer = setInterval(fetchMarketData, REFRESH_INTERVAL);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  /* ── Public API ────────────────────────────────────────── */
  window.MARKET = {
    getState: () => marketState,
    fetch: fetchMarketData,
    startAutoRefresh,
    stopAutoRefresh,
    formatPrice,
    formatVolume,
    formatChange,
    isMarketOpen,
    INDICES,
    STOCKS,
  };

})();
