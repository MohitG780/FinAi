/* ============================================================
   nlp.js — Real NLP-style Text Analysis Engine for FinAI
   Performs actual keyword-based sentiment analysis, risk detection,
   key phrase extraction, and XAI explanation on financial text.
   ============================================================ */

(function () {
  'use strict';

  /* ── Financial Sentiment Lexicons ──────────────────────── */
  const POSITIVE_WORDS = [
    'growth', 'profit', 'increase', 'revenue', 'strong', 'gain', 'positive',
    'improved', 'exceed', 'surpass', 'milestone', 'expansion', 'dividend',
    'outperform', 'bullish', 'upgrade', 'recovery', 'optimistic', 'upside',
    'robust', 'solid', 'healthy', 'momentum', 'opportunity', 'innovation',
    'breakthrough', 'efficient', 'synergy', 'strategic', 'advantage',
    'record', 'beat', 'surge', 'rally', 'boost', 'resilient', 'rebound',
    'attractive', 'stable', 'sustainable', 'accelerate', 'strengthen',
    'confident', 'favorable', 'promising', 'deliver', 'advancing',
    'upward', 'beneficial', 'rewarding', 'earnings', 'growing',
  ];

  const NEGATIVE_WORDS = [
    'loss', 'decline', 'risk', 'debt', 'volatile', 'headwind', 'negative',
    'downturn', 'recession', 'default', 'impairment', 'restructuring',
    'underperform', 'bearish', 'downgrade', 'uncertainty', 'concern',
    'challenge', 'threat', 'disruption', 'contraction', 'weak', 'slowdown',
    'adverse', 'pressure', 'deficit', 'litigation', 'regulatory',
    'penalty', 'writedown', 'layoff', 'bankrupt', 'insolvency', 'fraud',
    'crisis', 'crash', 'slump', 'deteriorate', 'exposure', 'overhaul',
    'caution', 'cautious', 'diminish', 'erode', 'supply chain',
    'geopolitical', 'inflation', 'delay', 'impact', 'negatively',
    'unprecedented', 'compressed', 'significant headwind', 'constraints',
  ];

  const RISK_PATTERNS = [
    { pattern: /(?:market|price|stock)\s*(?:risk|volatil)/gi, category: 'Market Risk', level: 'high' },
    { pattern: /(?:geopolitic|war|sanction|trade\s*war|conflict)/gi, category: 'Geopolitical Risk', level: 'high' },
    { pattern: /(?:default|insolvenc|bankrupt|credit\s*risk)/gi, category: 'Credit Risk', level: 'high' },
    { pattern: /(?:regulat|compliance|legal|litigation|penalty|fine)/gi, category: 'Regulatory Risk', level: 'medium' },
    { pattern: /(?:liquidity|cash\s*flow|refinanc|debt\s*matur)/gi, category: 'Liquidity Risk', level: 'medium' },
    { pattern: /(?:supply\s*chain|logistics|disruption|shortage)/gi, category: 'Operational Risk', level: 'medium' },
    { pattern: /(?:inflat|interest\s*rate|monetary\s*policy|rate\s*hike)/gi, category: 'Interest Rate Risk', level: 'medium' },
    { pattern: /(?:currency|forex|exchange\s*rate|depreciat)/gi, category: 'Currency Risk', level: 'low' },
    { pattern: /(?:cybersecurity|data\s*breach|hack|security\s*incident)/gi, category: 'Cyber Risk', level: 'medium' },
    { pattern: /(?:climate|environment|esg|carbon|emission)/gi, category: 'ESG Risk', level: 'low' },
    { pattern: /(?:competit|market\s*share|disrupt|obsolete)/gi, category: 'Competitive Risk', level: 'low' },
  ];

  /* ── Tokenization ──────────────────────────────────────── */
  function tokenize(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  function getSentences(text) {
    return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  }

  function getBigrams(tokens) {
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      bigrams.push(tokens[i] + ' ' + tokens[i + 1]);
    }
    return bigrams;
  }

  /* ── Sentiment Analysis ────────────────────────────────── */
  function analyzeSentiment(text) {
    const tokens = tokenize(text);
    const bigrams = getBigrams(tokens);
    const allTerms = [...tokens, ...bigrams];

    let posScore = 0;
    let negScore = 0;
    const posMatches = [];
    const negMatches = [];

    allTerms.forEach(term => {
      POSITIVE_WORDS.forEach(pw => {
        if (term === pw || term.includes(pw)) {
          posScore++;
          if (!posMatches.includes(pw)) posMatches.push(pw);
        }
      });
      NEGATIVE_WORDS.forEach(nw => {
        if (term === nw || term.includes(nw)) {
          negScore++;
          if (!negMatches.includes(nw)) negMatches.push(nw);
        }
      });
    });

    const total = posScore + negScore || 1;
    const posRatio = posScore / total;
    const negRatio = negScore / total;

    // Calculate sentiment score (0-100, where 0=very negative, 100=very positive)
    const rawScore = 50 + (posRatio - negRatio) * 50;
    const sentimentScore = Math.max(5, Math.min(95, Math.round(rawScore)));

    let sentiment;
    if (sentimentScore >= 60) sentiment = 'positive';
    else if (sentimentScore <= 40) sentiment = 'negative';
    else sentiment = 'neutral';

    // Confidence: higher when there's clear signal
    const signalStrength = Math.abs(posScore - negScore) / total;
    const confidence = Math.min(0.98, 0.55 + signalStrength * 0.4 + Math.min(total, 20) * 0.01);

    return {
      sentiment,
      sentimentScore,
      confidence: parseFloat(confidence.toFixed(2)),
      posScore,
      negScore,
      posMatches,
      negMatches,
      totalTokens: tokens.length,
    };
  }

  /* ── XAI Explanation (Highlight key phrases) ───────────── */
  function generateXAI(text, posMatches, negMatches) {
    const sentences = getSentences(text);
    const highlights = [];

    // Find positive phrases in original text
    posMatches.forEach(word => {
      const regex = new RegExp(`[^.]*\\b${escapeRegex(word)}\\b[^.]*`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(m => {
          const phrase = m.trim();
          // Find a shorter, meaningful snippet
          const snippetRegex = new RegExp(`(?:\\S+\\s+){0,3}\\S*\\b${escapeRegex(word)}\\b\\S*(?:\\s+\\S+){0,3}`, 'gi');
          const snippets = text.match(snippetRegex);
          if (snippets) {
            snippets.forEach(s => {
              const clean = s.trim();
              if (clean.length > 5 && !highlights.find(h => h.text === clean)) {
                highlights.push({ text: clean, type: 'pos', word });
              }
            });
          }
        });
      }
    });

    negMatches.forEach(word => {
      const regex = new RegExp(`(?:\\S+\\s+){0,3}\\S*\\b${escapeRegex(word)}\\b\\S*(?:\\s+\\S+){0,3}`, 'gi');
      const snippets = text.match(regex);
      if (snippets) {
        snippets.forEach(s => {
          const clean = s.trim();
          if (clean.length > 5 && !highlights.find(h => h.text === clean)) {
            highlights.push({ text: clean, type: 'neg', word });
          }
        });
      }
    });

    // Limit to top highlights
    const sorted = highlights.sort((a, b) => b.text.length - a.text.length);
    return sorted.slice(0, 8);
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ── Key Point Extraction ──────────────────────────────── */
  function extractKeyPoints(text, sentimentResult) {
    const sentences = getSentences(text);
    const keyPoints = [];

    // Score sentences by information density
    const scored = sentences.map(s => {
      const tokens = tokenize(s);
      let score = 0;

      // Numbers boost importance
      const numbers = s.match(/\d+\.?\d*%?/g);
      if (numbers) score += numbers.length * 3;

      // Financial terms boost
      const finTerms = ['revenue', 'profit', 'margin', 'growth', 'ebitda', 'earnings',
        'dividend', 'risk', 'outlook', 'guidance', 'forecast', 'quarter', 'year',
        'increase', 'decrease', 'market', 'share', 'capital', 'debt', 'investment'];
      finTerms.forEach(t => { if (s.toLowerCase().includes(t)) score += 2; });

      // Sentiment words boost
      POSITIVE_WORDS.forEach(w => { if (s.toLowerCase().includes(w)) score += 1; });
      NEGATIVE_WORDS.forEach(w => { if (s.toLowerCase().includes(w)) score += 1; });

      return { sentence: s, score };
    });

    // Sort by score, take top 4-5
    scored.sort((a, b) => b.score - a.score);
    const topSentences = scored.slice(0, Math.min(5, Math.max(3, Math.ceil(sentences.length * 0.3))));

    topSentences.forEach(({ sentence }) => {
      // Truncate if too long
      let point = sentence.length > 120 ? sentence.substring(0, 117) + '…' : sentence;
      keyPoints.push(point);
    });

    // Add summary stats
    if (sentimentResult.totalTokens > 0) {
      keyPoints.push(`Document contains ${sentimentResult.totalTokens} tokens with ${sentimentResult.posMatches.length} positive and ${sentimentResult.negMatches.length} negative signals detected`);
    }

    return keyPoints.slice(0, 5);
  }

  /* ── Risk Detection ────────────────────────────────────── */
  function detectRisks(text) {
    const risks = [];
    const seen = new Set();

    RISK_PATTERNS.forEach(({ pattern, category, level }) => {
      const matches = text.match(pattern);
      if (matches && !seen.has(category)) {
        seen.add(category);
        // Find the sentence containing the risk
        const sentences = getSentences(text);
        let bestSentence = '';
        sentences.forEach(s => {
          if (pattern.test(s) && s.length > bestSentence.length) {
            bestSentence = s;
          }
          // Reset regex lastIndex
          pattern.lastIndex = 0;
        });

        const riskText = bestSentence
          ? (bestSentence.length > 150 ? bestSentence.substring(0, 147) + '…' : bestSentence)
          : `${category} identified: "${matches[0]}" detected in document.`;

        risks.push({
          level,
          category,
          text: riskText,
          matchCount: matches.length,
        });
      }
    });

    // Sort: high > medium > low
    const order = { high: 0, medium: 1, low: 2 };
    risks.sort((a, b) => order[a.level] - order[b.level]);

    return risks.slice(0, 6);
  }

  /* ── Full Analysis Pipeline ────────────────────────────── */
  function analyzeText(text) {
    if (!text || text.trim().length < 10) {
      return null;
    }

    const cleanText = text.replace(/\[.*?\]/g, '').trim();

    // 1. Sentiment Analysis
    const sentimentResult = analyzeSentiment(cleanText);

    // 2. XAI Explanation
    const xaiHighlights = generateXAI(cleanText, sentimentResult.posMatches, sentimentResult.negMatches);

    // 3. Key Points
    const keyPoints = extractKeyPoints(cleanText, sentimentResult);

    // 4. Risk Detection
    const risks = detectRisks(cleanText);

    return {
      sentiment: sentimentResult.sentiment,
      sentimentScore: sentimentResult.sentimentScore,
      confidence: sentimentResult.confidence,
      xaiText: cleanText.length > 500 ? cleanText.substring(0, 500) + '…' : cleanText,
      xaiHighlights,
      keyPoints,
      risks,
      stats: {
        totalTokens: sentimentResult.totalTokens,
        positiveSignals: sentimentResult.posScore,
        negativeSignals: sentimentResult.negScore,
        riskFactors: risks.length,
        keyPointsFound: keyPoints.length,
      }
    };
  }

  /* ── Public API ────────────────────────────────────────── */
  window.NLP = {
    analyze: analyzeText,
    analyzeSentiment,
    detectRisks,
    extractKeyPoints,
    POSITIVE_WORDS,
    NEGATIVE_WORDS,
  };

})();
