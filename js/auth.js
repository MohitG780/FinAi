/* ============================================================
   auth.js — FinAI Authentication Module (Firebase Auth)
   ============================================================ */

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
let _currentUser = null;   // { id, fullName, email, avatar }
let _onReadyCallbacks = [];
let _isReady = false;

/* ── Wait for Firebase to resolve auth state on page load ── */
onAuthStateChanged(window.FIREBASE_AUTH, async (firebaseUser) => {
  if (firebaseUser) {
    // Load the profile from Firestore
    const snap = await getDoc(doc(window.FIREBASE_DB, 'users', firebaseUser.uid));
    if (snap.exists()) {
      _currentUser = snap.data();
    } else {
      // Fallback: build from Firebase user object
      _currentUser = {
        id:       firebaseUser.uid,
        fullName: firebaseUser.displayName || 'User',
        email:    firebaseUser.email,
        avatar:   (firebaseUser.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      };
    }
  } else {
    _currentUser = null;
  }

  _isReady = true;
  _onReadyCallbacks.forEach(cb => cb(_currentUser));
  _onReadyCallbacks = [];
});

/* ── Public API ───────────────────────────────────────────── */
window.AUTH = {

  /** Call cb(user) once auth state is known. user=null if logged out. */
  onReady(cb) {
    if (_isReady) { cb(_currentUser); }
    else          { _onReadyCallbacks.push(cb); }
  },

  isLoggedIn() { return !!_currentUser; },
  getUser()    { return _currentUser; },

  async signup(fullName, email, password) {
    try {
      const cred = await createUserWithEmailAndPassword(window.FIREBASE_AUTH, email, password);
      const user = cred.user;

      const avatar = fullName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      // Update Firebase display name
      await updateProfile(user, { displayName: fullName.trim() });

      // Save user profile to Firestore
      const profile = {
        id:        user.uid,
        fullName:  fullName.trim(),
        email:     email.toLowerCase().trim(),
        avatar,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(window.FIREBASE_DB, 'users', user.uid), profile);

      _currentUser = { id: user.uid, fullName: fullName.trim(), email: email.toLowerCase().trim(), avatar };
      return { ok: true };
    } catch (err) {
      return { ok: false, msg: _friendlyError(err.code) };
    }
  },

  async login(email, password) {
    try {
      await signInWithEmailAndPassword(window.FIREBASE_AUTH, email, password);
      // onAuthStateChanged will update _currentUser automatically
      return { ok: true };
    } catch (err) {
      return { ok: false, msg: _friendlyError(err.code) };
    }
  },

  async logout() {
    await signOut(window.FIREBASE_AUTH);
    _currentUser = null;
    location.reload();
  },
};

function _friendlyError(code) {
  const map = {
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/too-many-requests':       'Too many attempts. Please try again later.',
    'auth/network-request-failed':  'Network error. Check your internet connection.',
    'auth/invalid-credential':      'Invalid email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
