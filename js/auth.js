/* ============================================================
   auth.js — FinAI Authentication (Firebase Auth)
   Imports auth/db instances directly from firebase-config.js
   ============================================================ */

import { firebaseAuth, firebaseDb } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ── Internal state ─────────────────────────────────────── */
let _currentUser       = null;
let _onReadyCallbacks  = [];
let _isReady           = false;

/* ── Gravatar Helper ────────────────────────────────────── */
async function getGravatarUrl(email) {
  if (!email) return 'U';
  try {
    const msgUint8 = new TextEncoder().encode(email.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `https://www.gravatar.com/avatar/${hashHex}?d=identicon`;
  } catch (e) {
    return 'U';
  }
}

/* ── Listen to Firebase auth state changes ──────────────── */
onAuthStateChanged(firebaseAuth, (firebaseUser) => {
  if (firebaseUser) {
    // Set _currentUser IMMEDIATELY from Firebase's cached auth data.
    // This makes onReady() fire instantly without waiting for Firestore.
    _currentUser = {
      id:       firebaseUser.uid,
      fullName: firebaseUser.displayName || 'User',
      email:    firebaseUser.email,
      avatar:   null, // will be patched below
    };

    // Signal ready right away (unblocks app boot)
    _isReady = true;
    _onReadyCallbacks.forEach(cb => cb(_currentUser));
    _onReadyCallbacks = [];

    // Silently upgrade profile from Firestore in background.
    // This does NOT block the UI boot sequence.
    (async () => {
      try {
        const avatar = await getGravatarUrl(firebaseUser.email);
        _currentUser.avatar = avatar;

        const timeoutPromise = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 3000));
        const snap = await Promise.race([
          getDoc(doc(firebaseDb, 'users', firebaseUser.uid)),
          timeoutPromise,
        ]);
        if (snap.exists()) {
          Object.assign(_currentUser, snap.data());
        }

        // Patch avatar/name into the UI if already rendered
        const avatarEls = [document.getElementById('avatar-chip'), document.getElementById('ud-avatar')];
        const nameEl    = document.getElementById('ud-name');
        const emailEl   = document.getElementById('ud-email');
        const greetEl   = document.getElementById('greeting-name');

        avatarEls.forEach(el => {
          if (!el) return;
          if (_currentUser.avatar && _currentUser.avatar.startsWith('http')) {
            el.textContent = '';
            el.style.backgroundImage = `url(${_currentUser.avatar})`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
          } else {
            el.textContent = (_currentUser.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            el.style.backgroundImage = 'none'; // Clear if no avatar
          }
        });

        if (nameEl)  nameEl.textContent  = _currentUser.fullName;
        if (emailEl) emailEl.textContent = _currentUser.email;
        if (greetEl) greetEl.textContent = _currentUser.fullName;
      } catch (e) {
        // non-critical — app already running
        console.warn('[AUTH] Background profile load:', e.message);
      }
    })();

  } else {
    _currentUser = null;
    _isReady = true;
    _onReadyCallbacks.forEach(cb => cb(_currentUser));
    _onReadyCallbacks = [];
  }
});

/* ── Public API ──────────────────────────────────────────── */
window.AUTH = {

  /** Register a callback that fires once Firebase auth state is known.
   *  user = null  →  not logged in
   *  user = {...} →  logged in */
  onReady(cb) {
    if (_isReady) cb(_currentUser);
    else          _onReadyCallbacks.push(cb);
  },

  isLoggedIn() { return !!_currentUser; },
  getUser()    { return _currentUser;   },

  /* ── Sign Up ──────────────────────────────────────────── */
  async signup(fullName, email, password) {
    try {
      const cred   = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user   = cred.user;
      const avatar = await getGravatarUrl(email);

      updateProfile(user, { displayName: fullName.trim() }).catch(e => console.warn(e));

      const profile = {
        id:        user.uid,
        fullName:  fullName.trim(),
        email:     email.toLowerCase().trim(),
        avatar,
        createdAt: serverTimestamp(),
      };
      
      // Do not await setDoc to avoid hanging the UI
      setDoc(doc(firebaseDb, 'users', user.uid), profile).catch(e => console.warn(e));

      // Set immediately so launchApp() can read it
      _currentUser = { id: user.uid, fullName: fullName.trim(), email: email.toLowerCase().trim(), avatar };
      return { ok: true };
    } catch (err) {
      console.error('[AUTH] signup error:', err);
      return { ok: false, msg: _friendlyError(err.code) };
    }
  },

  /* ── Sign In ──────────────────────────────────────────── */
  async login(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = cred.user;

      // Load profile immediately so app has user data right away
      // Race with timeout so it doesn't hang UI forever if Firestore is slow
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
        const snap = await Promise.race([
          getDoc(doc(firebaseDb, 'users', user.uid)),
          timeoutPromise
        ]);
        _currentUser = snap.exists()
          ? snap.data()
          : { id: user.uid, fullName: user.displayName || 'User', email: user.email,
              avatar: await getGravatarUrl(user.email) };
      } catch {
        _currentUser = { id: user.uid, fullName: user.displayName || 'User', email: user.email, avatar: await getGravatarUrl(user.email) };
      }

      return { ok: true };
    } catch (err) {
      console.error('[AUTH] login error:', err);
      return { ok: false, msg: _friendlyError(err.code) };
    }
  },

  /* ── Sign Out ─────────────────────────────────────────── */
  async logout() {
    try {
      await signOut(firebaseAuth);
    } catch (e) { /* ignore */ }
    _currentUser = null;
    location.reload();
  },
};

/* ── Error code → user-friendly message ──────────────────── */
function _friendlyError(code) {
  const map = {
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/too-many-requests':       'Too many attempts. Please try again later.',
    'auth/network-request-failed':  'Network error. Check your internet connection.',
    'auth/invalid-credential':      'Invalid email or password.',
    'auth/operation-not-allowed':   'Email/password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
    'auth/configuration-not-found': 'Firebase Auth not configured. Please enable Email/Password in Firebase Console → Authentication → Sign-in method.',
  };
  return map[code] || `Authentication error (${code}). Please try again.`;
}

console.log('[FinAI] Auth module loaded ✓');
