/* ============================================================
   auth.js — FinAI Authentication Module
   ============================================================ */

(function () {
  'use strict';

  /* ── Storage Keys ─────────────────────────────────────── */
  const USERS_KEY   = 'finai_users';
  const SESSION_KEY = 'finai_session';

  /* ── Helpers ──────────────────────────────────────────── */
  function getUsers()        { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  function saveUsers(users)  { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  function getSession()      { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  function saveSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
  function clearSession()    { localStorage.removeItem(SESSION_KEY); }

  function hashSimple(str) {
    // Lightweight deterministic hash (not cryptographic – demo only)
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return h.toString(16);
  }

  /* ── Public API ───────────────────────────────────────── */
  window.AUTH = {

    isLoggedIn() {
      return !!getSession();
    },

    getUser() {
      return getSession();
    },

    signup(fullName, email, password) {
      const users = getUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, msg: 'An account with this email already exists.' };
      }
      const user = {
        id: Date.now(),
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashSimple(password),
        createdAt: new Date().toISOString(),
        avatar: fullName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      };
      users.push(user);
      saveUsers(users);
      saveSession({ id: user.id, fullName: user.fullName, email: user.email, avatar: user.avatar });
      return { ok: true };
    },

    login(email, password) {
      const users = getUsers();
      const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) return { ok: false, msg: 'No account found with this email.' };
      if (user.passwordHash !== hashSimple(password)) return { ok: false, msg: 'Incorrect password.' };
      saveSession({ id: user.id, fullName: user.fullName, email: user.email, avatar: user.avatar });
      return { ok: true };
    },

    logout() {
      clearSession();
      location.reload();
    },
  };

})();
