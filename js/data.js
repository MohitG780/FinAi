/* ============================================================
   data.js — Mock financial data for FinAI demo
   ============================================================ */
const DATA = {

  recentDocs: [
    {
      id: 1,
      name: "Reliance Industries AR 2024",
      type: "Annual Report",
      sector: "Energy",
      date: "Mar 28, 2025",
      sentiment: "positive",
      sentimentScore: 78,
      confidence: 0.91,
      icon: "📊",
      summary: "Strong diversified revenue growth, particularly in Jio and retail segments. EBITDA margins remain robust despite global headwinds.",
      xaiText: "Despite strong revenue growth of 15%, we are cautious due to unprecedented market volatility and significant delays in our supply chain which could negatively impact future earnings.",
      xaiHighlights: [
        { text: "strong revenue growth of 15%", type: "pos" },
        { text: "unprecedented market volatility", type: "neg" },
        { text: "significant delays in our supply chain", type: "neg" },
        { text: "negatively impact future earnings", type: "neg" }
      ],
      keyPoints: [
        "Revenue up 18.2% YoY to ₹9,74,532 Cr",
        "Jio platforms crossed 500 million subscribers",
        "New Energy initiatives scaling rapidly",
        "Global crude oil volatility poses margin risk"
      ],
      risks: [
        { level: "high", text: "Global crude oil price volatility may compress refining margins by 4-6% in upcoming quarters." },
        { level: "medium", text: "Regulatory headwinds in telecom sector may slow 5G monetization timeline." },
        { level: "low", text: "Currency depreciation risk on dollar-denominated debt." }
      ],
      tags: ["FY24", "Large Cap", "India"]
    },
    {
      id: 2,
      name: "HDFC Bank Q3 Results",
      type: "Quarterly Report",
      sector: "Banking",
      date: "Mar 15, 2025",
      sentiment: "neutral",
      sentimentScore: 52,
      confidence: 0.84,
      icon: "🏦",
      summary: "Net interest margins slightly compressed amid liquidity management post-merger. Asset quality holding steady with benign credit costs.",
      xaiText: "Net interest margins have compressed moderately following the merger, though asset quality remains stable. Forward guidance is cautiously optimistic contingent on RBI policy trajectory.",
      xaiHighlights: [
        { text: "margins have compressed moderately", type: "neg" },
        { text: "asset quality remains stable", type: "pos" },
        { text: "contingent on RBI policy trajectory", type: "neg" }
      ],
      keyPoints: [
        "NIM compressed 14bps to 3.4%",
        "GNPA ratio improved to 1.24%",
        "Advances grew 7.3% QoQ",
        "CASA ratio at 37.7%, under pressure"
      ],
      risks: [
        { level: "medium", text: "Deposit growth lagging advances growth, creating potential liquidity constraints." },
        { level: "medium", text: "Integration costs from HDFC merger still flowing through P&L." },
        { level: "low", text: "Unsecured lending book growth attracting regulatory scrutiny." }
      ],
      tags: ["Q3 FY25", "Banking", "Large Cap"]
    },
    {
      id: 3,
      name: "Adani Ports Risk Disclosure",
      type: "Risk Filing",
      sector: "Infrastructure",
      date: "Feb 20, 2025",
      sentiment: "negative",
      sentimentScore: 29,
      confidence: 0.88,
      icon: "⚠️",
      summary: "Elevated risk disclosures relating to geopolitical exposure and debt refinancing concerns weigh on near-term outlook.",
      xaiText: "We face significant geopolitical risks in our international operations. Debt refinancing at elevated interest rates represents a significant headwind to free cash flow generation over the next 24 months.",
      xaiHighlights: [
        { text: "significant geopolitical risks", type: "neg" },
        { text: "elevated interest rates", type: "neg" },
        { text: "significant headwind to free cash flow", type: "neg" }
      ],
      keyPoints: [
        "Geopolitical exposure in Myanmar and Israel ports flagged",
        "Debt-to-EBITDA at 4.8x, above comfort zone",
        "₹12,000 Cr refinancing due in 18 months",
        "Cargo volume growth remains solid at 11%"
      ],
      risks: [
        { level: "high", text: "Debt refinancing at elevated interest rates may substantially increase interest burden." },
        { level: "high", text: "Geopolitical disruption at international port concessions poses revenue risk." },
        { level: "medium", text: "Currency mismatch between USD debt and INR revenues." }
      ],
      tags: ["Risk Filing", "Infrastructure", "Mid Cap"]
    }
  ],

  sectors: [
    { name: "Technology", value: "+72%", direction: "up", fill: 72, color: "#3b82f6" },
    { name: "Banking & Finance", value: "+51%", direction: "up", fill: 51, color: "#8b5cf6" },
    { name: "Energy", value: "-38%", direction: "down", fill: 38, color: "#ef4444" },
    { name: "Infrastructure", value: "~44%", direction: "flat", fill: 44, color: "#f59e0b" },
    { name: "FMCG", value: "+65%", direction: "up", fill: 65, color: "#22c55e" },
    { name: "Pharma", value: "-22%", direction: "down", fill: 22, color: "#f43f5e" }
  ],

  templates: [
    "Infosys Annual Report 2024",
    "SEBI Risk Disclosure Template",
    "TCS Q4 Earnings Call",
    "Wipro Press Release",
    "Nifty 50 Analysis"
  ],

  analysisOptions: [
    { id: "sentiment", icon: "💬", label: "Sentiment Analysis" },
    { id: "summary", icon: "📝", label: "Summarisation" },
    { id: "risk", icon: "⚠️", label: "Risk Detection" },
    { id: "xai", icon: "🔍", label: "XAI Explain" }
  ],

  riskBars: [
    { label: "Market Risk", val: "High", pct: 82, color: "#ef4444" },
    { label: "Operational Risk", val: "Medium", pct: 56, color: "#f59e0b" },
    { label: "Regulatory Risk", val: "Medium", pct: 48, color: "#f59e0b" },
    { label: "Liquidity Risk", val: "Low", pct: 31, color: "#22c55e" },
    { label: "Credit Risk", val: "Low", pct: 24, color: "#3b82f6" }
  ],

  keywords: [
    { word: "headwinds", weight: 3, color: "rgba(239,68,68,0.2)", textColor: "#fca5a5" },
    { word: "EBITDA", weight: 2, color: "rgba(59,130,246,0.15)", textColor: "#93c5fd" },
    { word: "volatile", weight: 3, color: "rgba(239,68,68,0.2)", textColor: "#fca5a5" },
    { word: "growth", weight: 5, color: "rgba(34,197,94,0.2)", textColor: "#86efac" },
    { word: "margin", weight: 2, color: "rgba(245,158,11,0.2)", textColor: "#fcd34d" },
    { word: "revenue", weight: 5, color: "rgba(34,197,94,0.2)", textColor: "#86efac" },
    { word: "risk", weight: 4, color: "rgba(239,68,68,0.2)", textColor: "#fca5a5" },
    { word: "forward-looking", weight: 1, color: "rgba(139,92,246,0.2)", textColor: "#c4b5fd" },
    { word: "liquidity", weight: 2, color: "rgba(245,158,11,0.2)", textColor: "#fcd34d" },
    { word: "supply chain", weight: 3, color: "rgba(239,68,68,0.2)", textColor: "#fca5a5" },
    { word: "NIM", weight: 2, color: "rgba(59,130,246,0.15)", textColor: "#93c5fd" },
    { word: "optimistic", weight: 2, color: "rgba(34,197,94,0.2)", textColor: "#86efac" }
  ],

  companies: [
    { name: "Infosys Ltd.", ticker: "INFY", score: 74, cls: "positive", barColor: "#22c55e" },
    { name: "HDFC Bank", ticker: "HDFCBANK", score: 52, cls: "neutral", barColor: "#f59e0b" },
    { name: "Adani Ports", ticker: "ADANIPORTS", score: 29, cls: "negative", barColor: "#ef4444" },
    { name: "Reliance Ind.", ticker: "RELIANCE", score: 78, cls: "positive", barColor: "#22c55e" }
  ],

  sentimentTimeline: {
    labels: ["Mar 1","Mar 5","Mar 9","Mar 13","Mar 17","Mar 21","Mar 25","Mar 28"],
    positive: [45, 55, 60, 52, 68, 72, 65, 71],
    negative: [30, 28, 20, 35, 18, 15, 22, 18]
  },

  analysisSteps: [
    { label: "Tokenizing text with FinBERT…", icon: "T" },
    { label: "Running transformer inference…", icon: "⚙" },
    { label: "Generating sentiment scores…", icon: "💬" },
    { label: "Extracting risk entities…", icon: "⚠" },
    { label: "Building XAI explanations…", icon: "🔍" },
    { label: "Compiling results…", icon: "✓" }
  ],

  sampleAnalysisResult: {
    docName: "Pasted Financial Text",
    sentiment: "negative",
    sentimentScore: 32,
    confidence: 0.87,
    xaiText: "Despite strong revenue growth of 15%, we are cautious due to unprecedented market volatility and significant delays in our supply chain which could negatively impact future earnings.",
    xaiHighlights: [
      { text: "strong revenue growth of 15%", type: "pos" },
      { text: "unprecedented market volatility", type: "neg" },
      { text: "significant delays in our supply chain", type: "neg" },
      { text: "negatively impact future earnings", type: "neg" }
    ],
    keyPoints: [
      "Revenue growth of 15% outperforms sector average",
      "Market volatility identified as primary near-term risk",
      "Supply chain delays may affect next 2–3 quarters",
      "Management tone is cautiously bearish overall"
    ],
    risks: [
      { level: "high", text: "Unprecedented market volatility may significantly impact revenue forecasts." },
      { level: "high", text: "Supply chain delays likely to reduce gross margin by 2-4% in upcoming quarters." },
      { level: "medium", text: "Forward-looking guidance appears overly optimistic relative to disclosed risk factors." }
    ]
  }
};
