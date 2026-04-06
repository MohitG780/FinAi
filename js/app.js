/* ============================================================
   app.js — Main FinAI Application Logic
   ============================================================ */

(function () {
  'use strict';

  /* ── State ─────────────────────────────────────────────── */
  const state = {
    currentPage: 'dashboard',
    selectedOptions: ['sentiment', 'summary', 'risk', 'xai'],
    selectedTemplate: null,
    reportFilter: 'all',
    analysisRunning: false,
  };

  /* ── DOM Refs ───────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ═══════════════════════════════════════════════════════
     THEME
  ═══════════════════════════════════════════════════════ */
  function initTheme() {
    const saved = localStorage.getItem('finai_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('finai_theme', next);
    }

    const themeBtn     = $('theme-btn');
    const authThemeBtn = $('auth-theme-btn');
    if (themeBtn)     themeBtn.addEventListener('click', toggleTheme);
    if (authThemeBtn) authThemeBtn.addEventListener('click', toggleTheme);
  }

  /* ═══════════════════════════════════════════════════════
     AUTH GATE
  ═══════════════════════════════════════════════════════ */
  function initAuth() {
    const authScreen = $('auth-screen');
    const loginPanel  = $('auth-login-panel');
    const signupPanel = $('auth-signup-panel');

    // Toggle panels
    $('go-signup').addEventListener('click', () => {
      loginPanel.classList.add('hidden');
      signupPanel.classList.remove('hidden');
    });
    $('go-login').addEventListener('click', () => {
      signupPanel.classList.add('hidden');
      loginPanel.classList.remove('hidden');
    });

    // Password visibility toggles
    function bindPwToggle(toggleId, inputId) {
      $(toggleId).addEventListener('click', () => {
        const inp = $(inputId);
        inp.type = inp.type === 'password' ? 'text' : 'password';
      });
    }
    bindPwToggle('login-pw-toggle',  'login-password');
    bindPwToggle('signup-pw-toggle', 'signup-password');

    // Login form
    $('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const errEl  = $('login-error');
      const btn    = $('login-submit-btn');
      const email  = $('login-email').value.trim();
      const pw     = $('login-password').value;
      errEl.textContent = '';
      ['login-email','login-password'].forEach(id => $(id).classList.remove('error'));

      if (!email || !pw) {
        errEl.textContent = '⚠ Please fill in all fields.';
        return;
      }

      btn.classList.add('loading');
      btn.innerHTML = '<span class="btn-spinner"></span>Signing in…';

      AUTH.login(email, pw).then(res => {
        btn.classList.remove('loading');
        btn.textContent = 'Sign In';
        if (res.ok) {
          launchApp();
        } else {
          errEl.textContent = '⚠ ' + res.msg;
          $('login-email').classList.add('error');
        }
      });
    });

    // Signup form
    $('signup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const errEl = $('signup-error');
      const btn   = $('signup-submit-btn');
      const name  = $('signup-name').value.trim();
      const email = $('signup-email').value.trim();
      const pw    = $('signup-password').value;
      errEl.textContent = '';
      ['signup-name','signup-email','signup-password'].forEach(id => $(id).classList.remove('error'));

      if (!name || !email || !pw) {
        errEl.textContent = '⚠ Please fill in all fields.'; return;
      }
      if (pw.length < 8) {
        errEl.textContent = '⚠ Password must be at least 8 characters.';
        $('signup-password').classList.add('error'); return;
      }
      if (!email.includes('@')) {
        errEl.textContent = '⚠ Please enter a valid email address.';
        $('signup-email').classList.add('error'); return;
      }

      btn.classList.add('loading');
      btn.innerHTML = '<span class="btn-spinner"></span>Creating account…';

      AUTH.signup(name, email, pw).then(res => {
        btn.classList.remove('loading');
        btn.textContent = 'Create Account';
        if (res.ok) {
          launchApp();
        } else {
          errEl.textContent = '⚠ ' + res.msg;
          $('signup-email').classList.add('error');
        }
      });
    });

    // Auth screen is shown/hidden by waitForFirebase in boot.
    // initAuth() is only called when user is NOT logged in.
  }

  function launchApp() {
    const authScreen = $('auth-screen');
    if (!authScreen) { initSplash(); return; }
    authScreen.classList.add('exit');
    setTimeout(() => {
      authScreen.classList.add('hidden');
      authScreen.classList.remove('exit');
      
      // Run seed in background so it doesn't block UI if Firestore hangs
      DB.seed().catch(err => console.warn('[FinAI] Seed error:', err));
      initSplash();
    }, 420);
  }

  /* ══════════════════════════════════════════════════════════
     SPLASH SCREEN
  ══════════════════════════════════════════════════════════ */
  function initSplash() {
    const splash = $('splash-screen');
    splash.classList.remove('hidden');
    const msgs = ['Initializing NLP Engine…', 'Loading FinBERT Model…', 'Connecting to data streams…', 'Ready! 🚀'];
    const loaderText = document.querySelector('.loader-text');
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (loaderText && msgs[idx]) loaderText.textContent = msgs[idx];
      if (idx >= msgs.length - 1) clearInterval(interval);
    }, 600);

    setTimeout(() => {
      const splash = $('splash-screen');
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.classList.add('hidden');
        $('app').classList.remove('hidden');
        initApp();
      }, 600);
    }, 2500);
  }

  /* ══════════════════════════════════════════════════════════
     APP INIT
  ══════════════════════════════════════════════════════════ */

  // Live Firestore data holders
  let _liveAnalyses = [];
  let _liveCompanies = [];

  function initApp() {
    updateGreeting();

    // ── Start real-time Firestore listeners ────────────────
    DB.listenToAnalyses((analyses) => {
      _liveAnalyses = analyses;
      renderDocList(_liveAnalyses.slice(0, 3));
      if (state.currentPage === 'reports') renderReportsList(state.reportFilter);
    });

    DB.listenToCompanies((companies) => {
      _liveCompanies = companies;
      renderCompanyComparison(_liveCompanies);
      animateCompanyBars();
    });

    // ── Re-render market-driven UI on every data refresh ──
    // data.js fires 'data-refreshed' after each market-data-updated event
    window.addEventListener('data-refreshed', () => {
      renderSectorGrid();
      // Use Firestore companies if available, else fall back to market-derived
      if (_liveCompanies.length === 0) {
        renderCompanyComparison(DATA.companies);
        animateCompanyBars();
      }
      renderRiskBars();
      animateRiskBars();
      renderKeywordCloud();
      if (state.currentPage === 'insights') {
        Charts.drawSentimentChart('sentiment-chart', DATA.sentimentTimeline);
      }
    });

    renderDashboard();
    renderAnalysePage();
    renderInsightsPage();
    renderReportsPage();
    bindNavigation();
    bindAnalysePage();
    bindReportsPage();
    Charts.drawMiniChart('mini-chart');
    setTimeout(animateStats, 400);

    // Start live market data (first market event fires data-refreshed ~ 1s)
    initMarketData();
  }

  /* ══════════════════════════════════════════════════════════
     LIVE MARKET DATA
  ══════════════════════════════════════════════════════════ */
  let refreshCountdown = 10;
  let countdownTimer = null;

  function initMarketData() {
    // Listen for market data updates
    window.addEventListener('market-data-updated', (e) => {
      renderMarketUI(e.detail);
    });

    // Start auto-refresh
    MARKET.startAutoRefresh();

    // Start countdown timer
    startCountdown();
  }

  function startCountdown() {
    refreshCountdown = 10;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      refreshCountdown--;
      if (refreshCountdown <= 0) refreshCountdown = 10;
      const timerEl = $('refresh-timer');
      if (timerEl) timerEl.textContent = `Refreshes in ${refreshCountdown}s`;
    }, 1000);
  }

  function renderMarketUI(mktState) {
    renderTicker(mktState);
    renderIndices(mktState);
    renderStockWatchlist(mktState);
    updateMarketStatus(mktState);
    updateLiveDashboardStats(mktState);
    updateLiveInsightsAndReports(mktState);

    // Reset countdown
    refreshCountdown = 10;
  }

  /* ── Live Dashboard Stats (updates every 10s) ──────────── */
  function updateLiveDashboardStats(mktState) {
    // Update Hero AI Readiness Score based on market conditions
    const avgChange = [...mktState.indices, ...mktState.stocks]
      .reduce((sum, s) => sum + s.changePct, 0) / (mktState.indices.length + mktState.stocks.length);
    const aiScore = Math.max(30, Math.min(99, Math.round(75 + avgChange * 5 + (Math.random() - 0.5) * 4)));
    const heroScore = document.querySelector('.hero-score');
    if (heroScore) heroScore.textContent = aiScore;

    const heroDesc = document.querySelector('.hero-card-desc');
    const docsToday = Math.floor(Math.random() * 5) + 2;
    const risksToday = Math.floor(Math.random() * 18) + 5;
    if (heroDesc) heroDesc.textContent = `${docsToday} documents analysed today · ${risksToday} risks flagged`;

    const scoreBadge = document.querySelector('.hero-score-badge');
    if (scoreBadge) {
      const diff = aiScore - 80;
      if (diff >= 0) {
        scoreBadge.className = 'hero-score-badge positive';
        scoreBadge.textContent = `▲ ${Math.abs(diff)}pts`;
      } else {
        scoreBadge.className = 'hero-score-badge negative';
        scoreBadge.textContent = `▼ ${Math.abs(diff)}pts`;
      }
    }

    // Update stat cards with live data
    const statVals = document.querySelectorAll('.stat-val');
    if (statVals[0]) {
      const positiveCount = mktState.stocks.filter(s => s.direction === 'up').length;
      const totalStocks = mktState.stocks.length;
      const docsAnalysed = 18 + Math.floor(Math.random() * 10);
      statVals[0].textContent = docsAnalysed;
      const posPct = Math.round((positiveCount / totalStocks) * 100);
      statVals[1].textContent = posPct + '%';
      statVals[2].textContent = risksToday;
    }

    // Update sector sentiment with market-linked changes
    const sectorCards = document.querySelectorAll('.sector-card');
    if (sectorCards.length > 0) {
      DATA.sectors.forEach((sector, i) => {
        if (!sectorCards[i]) return;
        const baseFill = parseInt(sector.fill);
        const variation = (Math.random() - 0.5) * 6;
        const newFill = Math.max(5, Math.min(95, Math.round(baseFill + variation)));
        const direction = newFill > 50 ? 'up' : newFill < 40 ? 'down' : 'flat';
        const sectorVal = sectorCards[i].querySelector('.sector-value');
        if (sectorVal) {
          const sign = direction === 'up' ? '+' : direction === 'down' ? '-' : '~';
          sectorVal.textContent = `${sign}${newFill}%`;
          sectorVal.className = `sector-value ${direction}`;
        }
        const barFill = sectorCards[i].querySelector('.sector-bar-fill');
        if (barFill) barFill.style.width = newFill + '%';
      });
    }
  }

  /* ── Live Insights & Reports (updates driven by Firestore) ─ */
  function updateLiveInsightsAndReports(mktState) {
    // Market-driven sector updates still animate locally
    if (state.currentPage === 'reports') {
      renderReportsList(state.reportFilter);
    }
    // Company scores now come from Firestore via listenToCompanies,
    // not from local mutation — no fake data needed here.
  }

  function updateMarketStatus(state) {
    const badge = $('market-status-badge');
    const text = $('market-status-text');
    const srcBadge = $('data-source-badge');

    if (state.marketOpen) {
      badge.classList.remove('closed');
      text.textContent = 'Markets Open';
    } else {
      badge.classList.add('closed');
      text.textContent = 'Markets Closed';
    }

    if (state.isLive) {
      srcBadge.textContent = 'LIVE';
      srcBadge.classList.remove('data-source-mock');
    } else {
      srcBadge.textContent = 'SIMULATED';
      srcBadge.classList.add('data-source-mock');
    }
  }

  function renderTicker(state) {
    const track = $('ticker-track');
    if (!track) return;
    const allItems = [...state.indices, ...state.stocks];
    // Double items for seamless scroll loop
    const items = [...allItems, ...allItems];
    track.innerHTML = items.map(item => {
      const dir = item.direction;
      const sign = item.change >= 0 ? '+' : '';
      return `
        <div class="ticker-item">
          <span class="ticker-name">${item.shortName}</span>
          <span class="ticker-price">${MARKET.formatPrice(item.price)}</span>
          <span class="ticker-change ${dir}">${sign}${item.changePct.toFixed(2)}%</span>
        </div>
      `;
    }).join('');
  }

  function renderIndices(state) {
    const container = $('indices-row');
    if (!container) return;
    container.innerHTML = state.indices.map(idx => `
      <div class="index-card ${idx.direction}">
        <p class="index-name">${idx.shortName}</p>
        <p class="index-price">${MARKET.formatPrice(idx.price)}</p>
        <p class="index-change ${idx.direction}">${idx.change >= 0 ? '▲' : '▼'} ${Math.abs(idx.change).toFixed(2)} (${idx.change >= 0 ? '+' : ''}${idx.changePct.toFixed(2)}%)</p>
      </div>
    `).join('');
  }

  function renderStockWatchlist(state) {
    const container = $('stock-watchlist');
    if (!container) return;
    container.innerHTML = state.stocks.map(stock => {
      const dir = stock.direction;
      const sign = stock.change >= 0 ? '+' : '';
      return `
        <div class="stock-item ${dir}">
          <div class="stock-left">
            <span class="stock-symbol">${stock.shortName}</span>
            <span class="stock-name-small">${stock.name}</span>
          </div>
          <div class="stock-mid">
            <span class="stock-price">${MARKET.formatPrice(stock.price)}</span>
            <p class="stock-volume">Vol: ${MARKET.formatVolume(stock.volume)}</p>
          </div>
          <div class="stock-right">
            <span class="stock-change-pill ${dir}">${sign}${stock.changePct.toFixed(2)}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateGreeting() {
    const h = new Date().getHours();
    const greetEl = document.querySelector('.greeting-time');
    const nameEl  = document.querySelector('.greeting-name');
    if (!greetEl) return;
    if (h < 12)      greetEl.textContent = 'Good Morning 🌅';
    else if (h < 17) greetEl.textContent = 'Good Afternoon 👋';
    else if (h < 21) greetEl.textContent = 'Good Evening 🌇';
    else             greetEl.textContent = 'Good Night 🌙';

    // Inject real user name from session
    const user = AUTH.getUser();
    if (user && nameEl) {
      nameEl.textContent = user.fullName;
    }
  }

  function animateStats() {
    const targets = [
      { el: document.querySelectorAll('.stat-val')[0], end: 24, suffix: '' },
      { el: document.querySelectorAll('.stat-val')[1], end: 68, suffix: '%' },
      { el: document.querySelectorAll('.stat-val')[2], end: 47, suffix: '' },
    ];
    targets.forEach(({ el, end, suffix }) => {
      if (!el) return;
      let current = 0;
      const step = Math.ceil(end / 30);
      const timer = setInterval(() => {
        current = Math.min(current + step, end);
        el.textContent = current + suffix;
        if (current >= end) clearInterval(timer);
      }, 40);
    });
  }

  /* ══════════════════════════════════════════════════════════
     NAVIGATION
  ══════════════════════════════════════════════════════════ */
  function bindNavigation() {
    $$('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const page = tab.dataset.page;
        if (!page) return;
        navigateTo(page);
      });
    });

    $('hero-analyse-btn').addEventListener('click', () => navigateTo('analyse'));
    $('see-all-btn').addEventListener('click', () => navigateTo('reports'));

    // Notification button
    $('notif-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      $('user-dropdown').classList.add('hidden');
      const dd = $('notif-dropdown');
      dd.classList.toggle('hidden');
    });

    // User avatar chip → toggle user dropdown
    $('avatar-chip').addEventListener('click', (e) => {
      e.stopPropagation();
      $('notif-dropdown').classList.add('hidden');
      $('user-dropdown').classList.toggle('hidden');
    });

    // Populate user dropdown with real data
    const user = AUTH.getUser();
    if (user) {
      $('avatar-chip').textContent = user.avatar;
      $('ud-avatar').textContent   = user.avatar;
      $('ud-name').textContent     = user.fullName;
      $('ud-email').textContent    = user.email;
    }

    // User dropdown → About FinAI
    $('ud-about-btn').addEventListener('click', () => {
      $('user-dropdown').classList.add('hidden');
      $('about-modal-overlay').classList.remove('hidden');
    });

    // User dropdown → Sign Out
    $('ud-logout-btn').addEventListener('click', () => {
      AUTH.logout();
      location.reload();
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      $('notif-dropdown').classList.add('hidden');
      $('user-dropdown').classList.add('hidden');
    });

    $('about-modal-overlay').addEventListener('click', (e) => {
      if (e.target === $('about-modal-overlay')) $('about-modal-overlay').classList.add('hidden');
    });

    // Notification clear
    $('notif-clear').addEventListener('click', (e) => {
      e.stopPropagation();
      $$('.notif-dot-left').forEach(d => d.style.opacity = '0');
      $$('.notif-item').forEach(i => i.classList.remove('unread'));
      $('notif-btn').querySelector('.notif-dot').style.display = 'none';
      $('notif-dropdown').classList.add('hidden');
      showToast('✓', 'Notifications cleared');
    });
  }

  function navigateTo(page) {
    if (state.currentPage === page) return;

    // Hide current
    $$('.page').forEach(p => p.classList.remove('active'));
    $$('.nav-tab').forEach(t => t.classList.remove('active'));

    // Show new
    $(`page-${page}`).classList.add('active');
    $$(`[data-page="${page}"]`).forEach(t => t.classList.add('active'));
    state.currentPage = page;

    // Reinit charts if needed
    if (page === 'insights') {
      setTimeout(() => {
        Charts.drawSentimentChart('sentiment-chart', DATA.sentimentTimeline);
        animateRiskBars();
        animateCompanyBars();
      }, 100);
    }

    // Scroll top
    document.querySelector('.page-container').scrollTo(0, 0);
  }

  /* ══════════════════════════════════════════════════════════
     DASHBOARD
  ══════════════════════════════════════════════════════════ */
  function renderDashboard() {
    renderDocList([]);   // starts empty; Firestore listener will populate
    renderSectorGrid();
  }

  function renderDocList(docs) {
    const container = $('recent-docs');
    if (!docs || docs.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:32px 16px;color:var(--text-muted)"><div style="font-size:28px;margin-bottom:8px">📂</div><p style="font-size:13px">No analyses yet. Run your first analysis!</p></div>`;
      return;
    }
    container.innerHTML = docs.map(doc => `
      <div class="doc-card ${doc.sentiment}" data-id="${doc.id}" role="button" tabindex="0" aria-label="${doc.name}">
        <div class="doc-icon ${doc.sentiment}">${doc.icon || '📄'}</div>
        <div class="doc-info">
          <p class="doc-name">${doc.name}</p>
          <div class="doc-meta">
            <span>${doc.type}</span>
            <span class="doc-meta-dot">·</span>
            <span>${doc.date}</span>
          </div>
        </div>
        <div class="doc-right">
          <div class="sentiment-badge ${doc.sentiment}">${capitalize(doc.sentiment)}</div>
          <div class="sentiment-score">${doc.sentimentScore}/100</div>
        </div>
      </div>
    `).join('');

    // Bind clicks
    container.querySelectorAll('.doc-card').forEach(card => {
      card.addEventListener('click', () => {
        const doc = docs.find(d => d.id === card.dataset.id);
        if (doc) openDocModal(doc);
      });
    });
  }

  function renderSectorGrid() {
    const container = $('sector-grid');
    container.innerHTML = DATA.sectors.map(s => `
      <div class="sector-card">
        <p class="sector-name">${s.name}</p>
        <div class="sector-sentiment-row">
          <span class="sector-value ${s.direction}">${s.value}</span>
          <span style="font-size:16px">${s.direction === 'up' ? '📈' : s.direction === 'down' ? '📉' : '↔️'}</span>
        </div>
        <div class="sector-bar-track">
          <div class="sector-bar-fill" data-fill="${s.fill}" style="width:0%;background:${s.color}"></div>
        </div>
      </div>
    `).join('');

    animateSectorBars();
  }

  function animateSectorBars() {
    setTimeout(() => {
      $$('.sector-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.fill + '%';
      });
    }, 300);
  }

  /* ══════════════════════════════════════════════════════════
     ANALYSE PAGE
  ══════════════════════════════════════════════════════════ */
  function renderAnalysePage() {
    renderTemplateChips();
    renderAnalysisOptions();
  }

  function renderTemplateChips() {
    const container = $('template-chips');
    container.innerHTML = DATA.templates.map((t, i) => `
      <button class="template-chip" data-idx="${i}">${t}</button>
    `).join('');

    container.querySelectorAll('.template-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('.template-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.selectedTemplate = +chip.dataset.idx;
        $('paste-text').value = `[Sample excerpt from "${DATA.templates[+chip.dataset.idx]}"]\n\nDespite recording strong revenue growth of 18.4% year-over-year, management remains cautious about the near-term outlook given unprecedented market volatility and significant supply chain disruptions. Rising input costs and a challenging macroeconomic environment may negatively impact future earnings and cash flow generation over the next 12 to 18 months.`;
        showToast('✏️', 'Template loaded');
      });
    });
  }

  function renderAnalysisOptions() {
    const container = $('options-grid');
    container.innerHTML = DATA.analysisOptions.map(opt => `
      <div class="option-item selected" data-id="${opt.id}" role="checkbox" aria-checked="true" tabindex="0">
        <div class="option-check"></div>
        <span class="option-icon">${opt.icon}</span>
        <span class="option-label">${opt.label}</span>
      </div>
    `).join('');

    container.querySelectorAll('.option-item').forEach(item => {
      item.addEventListener('click', () => {
        item.classList.toggle('selected');
        const id = item.dataset.id;
        const idx = state.selectedOptions.indexOf(id);
        if (idx > -1) state.selectedOptions.splice(idx, 1);
        else state.selectedOptions.push(id);
        item.setAttribute('aria-checked', item.classList.contains('selected'));
      });
    });
  }

  function bindAnalysePage() {
    // Upload zone
    const zone = $('upload-zone');
    const fileInput = $('file-input');
    const uploadBtn = $('upload-btn');

    uploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    zone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast('📄', `"${file.name}" loaded`);
        $('paste-text').value = `[Document loaded: ${file.name}]\n\nFinancial document content will be extracted and analysed here. The FinBERT model will process the full text and return sentiment scores, a structured summary, and detected risk factors with XAI explanations.`;
      }
    });

    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) showToast('📄', `"${file.name}" loaded`);
    });

    // Run analysis
    $('run-analysis-btn').addEventListener('click', runAnalysis);
  }

  function runAnalysis() {
    if (state.analysisRunning) return;
    const text = $('paste-text').value.trim();
    if (!text) {
      showToast('⚠️', 'Please add text or upload a document first', '#f59e0b');
      return;
    }
    // Run real NLP analysis
    state.lastAnalysisResult = NLP.analyze(text);
    state.lastAnalysisText   = text;
    if (!state.lastAnalysisResult) {
      showToast('⚠️', 'Text too short for analysis', '#f59e0b');
      return;
    }
    state.analysisRunning = true;
    showAnalysisModal();
  }

  function showAnalysisModal() {
    const overlay = $('analysis-modal-overlay');
    overlay.classList.remove('hidden');

    const stepsContainer = $('analysis-steps');
    stepsContainer.innerHTML = DATA.analysisSteps.map((s, i) => `
      <div class="analysis-step" id="step-${i}">
        <div class="step-icon pending" id="step-icon-${i}">${s.icon}</div>
        <span class="step-label pending" id="step-label-${i}">${s.label}</span>
      </div>
    `).join('');

    // Animate steps
    let current = 0;
    const stepInterval = setInterval(() => {
      if (current > 0) {
        $(`step-icon-${current - 1}`).className = 'step-icon done';
        $(`step-icon-${current - 1}`).textContent = '✓';
        $(`step-label-${current - 1}`).className = 'step-label';
      }
      if (current < DATA.analysisSteps.length) {
        $(`step-icon-${current}`).className = 'step-icon active';
        $(`step-label-${current}`).className = 'step-label';
        current++;
      } else {
        clearInterval(stepInterval);
        setTimeout(async () => {
          overlay.classList.add('hidden');
          state.analysisRunning = false;
          // Save result to Firestore
          if (window.DB && state.lastAnalysisText) {
            try {
              await DB.saveAnalysis(state.lastAnalysisResult, state.lastAnalysisText);
            } catch(e) {
              console.warn('[FinAI] Could not save to Firestore:', e.message);
            }
          }
          showAnalysisResults();
        }, 600);
      }
    }, 480);
  }

  function showAnalysisResults() {
    const r = state.lastAnalysisResult;
    if (!r) return;
    const container = $('analysis-results');
    container.classList.remove('hidden');

    container.innerHTML = `
      <div class="results-container">
        <h2 class="results-title">Analysis Complete ✅</h2>
        <p class="results-meta">Processed by FinBERT NLP · ${new Date().toLocaleTimeString()} · ${state.selectedOptions.length} tasks · ${r.stats.totalTokens} tokens analysed</p>

        ${state.selectedOptions.includes('sentiment') ? buildSentimentCard(r) : ''}
        ${state.selectedOptions.includes('xai') ? buildXAICard(r) : ''}
        ${state.selectedOptions.includes('summary') ? buildSummaryCard(r) : ''}
        ${state.selectedOptions.includes('risk') ? buildRiskCard(r) : ''}

        <div class="result-card">
          <div class="result-card-header">
            <div class="result-card-title"><span>📊</span> Analysis Statistics</div>
            <div class="result-pill" style="background:rgba(6,182,212,.12);color:#06b6d4;border:1px solid rgba(6,182,212,.3)">NLP Stats</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
            <div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:var(--radius-sm)">
              <p style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:var(--accent-blue)">${r.stats.totalTokens}</p>
              <p style="font-size:10px;color:var(--text-muted);margin-top:2px">Tokens</p>
            </div>
            <div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:var(--radius-sm)">
              <p style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:var(--accent-green)">${r.stats.positiveSignals}</p>
              <p style="font-size:10px;color:var(--text-muted);margin-top:2px">Positive</p>
            </div>
            <div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:var(--radius-sm)">
              <p style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:var(--accent-red)">${r.stats.negativeSignals}</p>
              <p style="font-size:10px;color:var(--text-muted);margin-top:2px">Negative</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Animate sentiment pointer
    setTimeout(() => {
      const pointer = container.querySelector('.sentiment-pointer');
      if (pointer) {
        pointer.style.left = r.sentimentScore + '%';
      }
    }, 200);

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('✓', `Analysis complete! Sentiment: ${capitalize(r.sentiment)} (${r.sentimentScore}/100)`);
  }

  function buildSentimentCard(r) {
    const cls = r.sentiment;
    const pillBg = cls === 'positive'
      ? 'background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.3)'
      : cls === 'negative'
      ? 'background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3)'
      : 'background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.25)';

    return `
      <div class="result-card">
        <div class="result-card-header">
          <div class="result-card-title"><span>💬</span> Sentiment Analysis</div>
          <div class="result-pill" style="${pillBg}">${capitalize(r.sentiment)}</div>
        </div>
        <div class="sentiment-meter">
          <div class="sentiment-labels"><span>Negative</span><span>Neutral</span><span>Positive</span></div>
          <div class="sentiment-track">
            <div class="sentiment-pointer" style="left:${r.sentimentScore}%"></div>
          </div>
        </div>
        <div class="sentiment-value-row">
          <span class="sentiment-big-val ${cls}">${r.sentimentScore}</span>
          <div>
            <span class="sentiment-label-text">${capitalize(r.sentiment)}</span>
            <p class="confidence-text">Confidence: ${Math.round(r.confidence * 100)}%</p>
          </div>
        </div>
      </div>
    `;
  }

  function buildXAICard(r) {
    let highlighted = r.xaiText;
    r.xaiHighlights.forEach(h => {
      const cls = h.type === 'pos' ? 'xai-pos' : 'xai-neg';
      highlighted = highlighted.replace(h.text, `<span class="${cls}">${h.text}</span>`);
    });

    return `
      <div class="result-card">
        <div class="result-card-header">
          <div class="result-card-title"><span>🔍</span> XAI Explanation</div>
          <div class="result-pill" style="background:rgba(139,92,246,.15);color:#8b5cf6;border:1px solid rgba(139,92,246,.3)">FinBERT</div>
        </div>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">Which phrases drove the AI's decision?</p>
        <div class="xai-legend">
          <div class="xai-legend-item"><div class="xai-dot" style="background:rgba(239,68,68,.4)"></div><span>Negative signal</span></div>
          <div class="xai-legend-item"><div class="xai-dot" style="background:rgba(34,197,94,.35)"></div><span>Positive signal</span></div>
        </div>
        <div class="xai-text-block">${highlighted}</div>
      </div>
    `;
  }

  function buildSummaryCard(r) {
    return `
      <div class="result-card">
        <div class="result-card-header">
          <div class="result-card-title"><span>📝</span> Key Takeaways</div>
          <div class="result-pill" style="background:rgba(6,182,212,.12);color:#06b6d4;border:1px solid rgba(6,182,212,.3)">${r.keyPoints.length} Points</div>
        </div>
        <ul class="summary-bullets">
          ${r.keyPoints.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  function buildRiskCard(r) {
    return `
      <div class="result-card">
        <div class="result-card-header">
          <div class="result-card-title"><span>⚠️</span> Risk Detection</div>
          <div class="result-pill" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3)">${r.risks.length} Risks</div>
        </div>
        <div class="risk-list">
          ${r.risks.map(risk => `
            <div class="risk-item ${risk.level}">
              <span class="risk-level-badge">${risk.level.toUpperCase()}</span>
              <p class="risk-text">${risk.text}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════
     INSIGHTS PAGE
  ══════════════════════════════════════════════════════════ */
  function renderInsightsPage() {
    renderRiskBars();
    renderKeywordCloud();
    renderCompanyComparison();
  }

  function renderRiskBars() {
    const container = $('risk-bars');
    container.innerHTML = DATA.riskBars.map(rb => `
      <div class="risk-bar-item">
        <div class="risk-bar-label-row">
          <span class="risk-bar-label">${rb.label}</span>
          <span class="risk-bar-val">${rb.val}</span>
        </div>
        <div class="risk-bar-track">
          <div class="risk-bar-fill" data-fill="${rb.pct}" style="width:0%;background:${rb.color}"></div>
        </div>
      </div>
    `).join('');
  }

  function animateRiskBars() {
    setTimeout(() => {
      $$('.risk-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.fill + '%';
      });
    }, 300);
  }

  function renderKeywordCloud() {
    const container = $('keyword-cloud');
    if (!container) return;
    container.innerHTML = DATA.keywords.map(k => {
      const size = 11 + k.weight * 1.5;
      let cssColor = "var(--text-primary)";
      if (k.textColor === "#fca5a5") cssColor = "var(--accent-red)";
      else if (k.textColor === "#93c5fd" || k.textColor === "#c4b5fd") cssColor = "var(--accent-blue)";
      else if (k.textColor === "#86efac") cssColor = "var(--accent-green)";
      else if (k.textColor === "#fcd34d") cssColor = "var(--accent-amber)";
      return `<span class="keyword-chip" style="font-size:${size}px;background:${k.color};color:${cssColor}">${k.word}</span>`;
    }).join('');
  }

  function renderCompanyComparison(companies) {
    const container = $('company-compare');
    const src = (companies && companies.length > 0) ? companies : _liveCompanies;
    if (!src || src.length === 0) return;
    container.innerHTML = src.map(c => `
      <div class="company-compare-card">
        <div class="company-compare-top">
          <div>
            <p class="company-name">${c.name}</p>
            <p class="company-ticker">${c.ticker} · NSE</p>
          </div>
          <div>
            <span class="company-sentiment-score ${c.cls}">${c.score}</span>
            <p style="font-size:10px;color:var(--text-muted);text-align:right">/ 100</p>
          </div>
        </div>
        <div class="company-progress-track">
          <div class="company-progress-fill" data-fill="${c.score}" style="width:0%;background:${c.barColor || '#3b82f6'}"></div>
        </div>
      </div>
    `).join('');
  }

  function animateCompanyBars() {
    setTimeout(() => {
      $$('.company-progress-fill').forEach(bar => {
        bar.style.width = bar.dataset.fill + '%';
      });
    }, 300);
  }

  /* ══════════════════════════════════════════════════════════
     REPORTS PAGE
  ══════════════════════════════════════════════════════════ */
  function renderReportsPage() {
    renderReportsList('all');
  }

  function bindReportsPage() {
    $$('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.reportFilter = tab.dataset.filter;
        renderReportsList(state.reportFilter);
      });
    });
  }

  function renderReportsList(filter) {
    const container = $('reports-list');
    const src = _liveAnalyses.length > 0 ? _liveAnalyses : [];
    const docs = filter === 'all'
      ? src
      : src.filter(d => d.sentiment === filter);

    if (docs.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--text-muted)">
          <div style="font-size:32px;margin-bottom:12px">🔍</div>
          <p style="font-size:14px">No ${filter} documents found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = docs.map(doc => `
      <div class="report-card ${doc.sentiment}" data-id="${doc.id}" role="button" tabindex="0">
        <div class="report-top">
          <div>
            <p class="report-company">${doc.name.split(' ').slice(0, 2).join(' ')}</p>
            <span class="report-doc-type">${doc.type}</span>
          </div>
          <div class="report-score-block">
            <div class="report-score ${doc.sentiment}">${doc.sentimentScore}</div>
            <p class="report-score-label">AI Score</p>
          </div>
        </div>
        <p class="report-summary">${doc.summary || ''}</p>
        <div class="report-footer">
          <div class="report-tags">
            ${(doc.tags || []).map(t => `<span class="report-tag">${t}</span>`).join('')}
          </div>
          <span class="report-date">${doc.date}</span>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.report-card').forEach(card => {
      card.addEventListener('click', () => {
        const doc = docs.find(d => d.id === card.dataset.id);
        if (doc) openDocModal(doc);
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     DOCUMENT MODAL
  ══════════════════════════════════════════════════════════ */
  function openDocModal(doc) {
    const overlay = $('doc-modal-overlay');
    const content = $('doc-modal-content');
    overlay.classList.remove('hidden');

    const sentimentColor = doc.sentiment === 'positive' ? '#22c55e'
      : doc.sentiment === 'negative' ? '#ef4444' : '#f59e0b';
    const pillBg = doc.sentiment === 'positive'
      ? 'background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.3)'
      : doc.sentiment === 'negative'
      ? 'background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3)'
      : 'background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.25)';

    let highlighted = doc.xaiText;
    doc.xaiHighlights.forEach(h => {
      const cls = h.type === 'pos' ? 'xai-pos' : 'xai-neg';
      highlighted = highlighted.replace(h.text, `<span class="${cls}">${h.text}</span>`);
    });

    content.innerHTML = `
      <div class="modal-doc-header">
        <p class="modal-doc-label">ANALYSIS REPORT</p>
        <h2 class="modal-doc-title">${doc.name}</h2>
        <div class="modal-doc-meta">
          <span>${doc.type}</span>
          <span>·</span>
          <span>${doc.sector}</span>
          <span>·</span>
          <span>${doc.date}</span>
        </div>
      </div>

      <div class="modal-sentiment-row">
        <div class="modal-sentiment-left">
          <div class="sentiment-big-val ${doc.sentiment}">${doc.sentimentScore}</div>
          <p class="sentiment-label">${capitalize(doc.sentiment)} Sentiment</p>
        </div>
        <div class="modal-confidence-block">
          <p class="modal-confidence-title">Model Confidence</p>
          <div class="confidence-bar-track">
            <div class="confidence-bar-fill" id="modal-conf-bar" style="width:0%;background:${sentimentColor}"></div>
          </div>
          <p class="confidence-val">${Math.round(doc.confidence * 100)}%</p>
        </div>
      </div>

      <div class="modal-section-title">🔍 XAI Explanation</div>
      <div class="xai-legend">
        <div class="xai-legend-item"><div class="xai-dot" style="background:rgba(239,68,68,.4)"></div><span>Negative signal</span></div>
        <div class="xai-legend-item"><div class="xai-dot" style="background:rgba(34,197,94,.35)"></div><span>Positive signal</span></div>
      </div>
      <div class="xai-text-block">${highlighted}</div>

      <div class="modal-section-title">📝 Key Takeaways</div>
      <ul class="summary-bullets">
        ${doc.keyPoints.map(p => `<li>${p}</li>`).join('')}
      </ul>

      <div class="modal-section-title">⚠️ Detected Risks</div>
      <div class="risk-list">
        ${doc.risks.map(r => `
          <div class="risk-item ${r.level}">
            <span class="risk-level-badge">${r.level.toUpperCase()}</span>
            <p class="risk-text">${r.text}</p>
          </div>
        `).join('')}
      </div>

      <button onclick="closeDocModal()" style="width:100%;margin-top:24px;padding:14px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);font-size:14px;font-weight:600;color:var(--text-secondary)">
        Close Report
      </button>
    `;

    // Animate confidence bar
    setTimeout(() => {
      const bar = $('modal-conf-bar');
      if (bar) bar.style.width = (doc.confidence * 100) + '%';
    }, 200);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDocModal();
    });

    // Swipe to close
    initSwipeToClose($('doc-modal'), closeDocModal);
  }

  window.closeDocModal = function () {
    $('doc-modal-overlay').classList.add('hidden');
  };

  /* ══════════════════════════════════════════════════════════
     SWIPE TO CLOSE
  ══════════════════════════════════════════════════════════ */
  function initSwipeToClose(el, callback) {
    let startY = 0, currentY = 0;
    el.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
      const dy = currentY - startY;
      if (dy > 0) el.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    el.addEventListener('touchend', () => {
      const dy = currentY - startY;
      if (dy > 100) {
        el.style.transition = 'transform .3s ease';
        el.style.transform = 'translateY(100%)';
        setTimeout(() => {
          el.style.transform = '';
          el.style.transition = '';
          callback();
        }, 300);
      } else {
        el.style.transform = '';
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════════════════════ */
  let toastTimer = null;

  function showToast(icon, text, iconBg = '#22c55e') {
    const toast = $('toast');
    const toastIcon = $('toast-icon');
    const toastText = $('toast-text');

    toastIcon.textContent = icon;
    toastIcon.style.background = iconBg;
    toastText.textContent = text;

    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  /* ══════════════════════════════════════════════════════════
     UTILS
  ══════════════════════════════════════════════════════════ */
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /* ── Boot ───────────────────────────────────────────────── */
  function boot() {
    initTheme();

    // Wait for Firebase to resolve auth state before showing auth screen
    // AUTH.onReady is called once onAuthStateChanged fires
    function waitForFirebase() {
      if (window.AUTH && window.AUTH.onReady && window.DB) {
        AUTH.onReady((user) => {
          if (user) {
            // Already logged in — run seed in background, don't block
            DB.seed().catch(err => console.warn('[FinAI] Seed error:', err));
            launchApp();
          } else {
            // Not logged in — show auth screen
            const authScreen = $('auth-screen');
            if (authScreen) authScreen.classList.remove('hidden');
            initAuth();
          }
        });
      } else {
        // Firebase modules haven't loaded yet — retry in 100ms
        setTimeout(waitForFirebase, 100);
      }
    }
    waitForFirebase();
  }

  // If DOM is already loaded (common with type="module"), boot immediately.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
