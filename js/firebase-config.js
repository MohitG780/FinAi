/* ============================================================
   firebase-config.js — Firebase SDK Initialization for FinAI
   ============================================================
   SETUP INSTRUCTIONS:
   1. Go to https://console.firebase.google.com/
   2. Click "Add Project" → name it "FinAI" → Continue
   3. Disable Google Analytics (optional) → Create Project
   4. Click "</>  Web" to register a web app → name it "FinAI"
   5. Copy the firebaseConfig object values below
   6. In Firebase Console:
      - Go to Authentication → Get Started → Enable "Email/Password"
      - Go to Firestore Database → Create database → Start in test mode
   ============================================================ */

// ── PASTE YOUR FIREBASE CONFIG HERE ─────────────────────────
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
// ─────────────────────────────────────────────────────────────

// Initialize Firebase
import { initializeApp }          from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }                from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }           from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const _app = initializeApp(firebaseConfig);

window.FIREBASE_AUTH = getAuth(_app);
window.FIREBASE_DB   = getFirestore(_app);

console.log('[FinAI] Firebase initialized ✓');
