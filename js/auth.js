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
onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
  if (firebaseUser) {
    try {
      const snap = await getDoc(doc(firebaseDb, 'users', firebaseUser.uid));
      _currentUser = snap.exists()
        ? snap.data()
        : {
            id:       firebaseUser.uid,
            fullName: firebaseUser.displayName || 'User',
            email:    firebaseUser.email,
            avatar:   await getGravatarUrl(firebaseUser.email),
          };
    } catch (e) {
      console.warn('[AUTH] Could not load profile from Firestore:', e.message);
      _currentUser = {
        id:       firebaseUser.uid,
        fullName: firebaseUser.displayName || 'User',
        email:    firebaseUser.email,
        avatar:   await getGravatarUrl(firebaseUser.email),
      };
    }
  } else {
    _currentUser = null;
  }

  _isReady = true;
  _onReadyCallbacks.forEach(cb => cb(_currentUser));
  _onReadyCallbacks = [];
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

      await updateProfile(user, { displayName: fullName.trim() });

      const profile = {
        id:        user.uid,
        fullName:  fullName.trim(),
        email:     email.toLowerCase().trim(),
        avatar,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(firebaseDb, 'users', user.uid), profile);

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
      try {
        const snap = await getDoc(doc(firebaseDb, 'users', user.uid));
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
