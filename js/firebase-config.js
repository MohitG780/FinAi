/* ============================================================
   firebase-config.js — Firebase SDK Initialization for FinAI
   Exports auth + db instances directly for peer module imports.
   ============================================================ */

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Safety check for Vite environment variables
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

if (!env.VITE_FIREBASE_API_KEY) {
  console.warn('[FinAI] Firebase environment variables not found. Ensure you are running with "npm run dev" or have a built project.');
}

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
  measurementId:     env.VITE_FIREBASE_MEASUREMENT_ID
};

const _app = initializeApp(firebaseConfig);

// Export as named exports for sibling modules to import directly
export const firebaseAuth = getAuth(_app);
export const firebaseDb   = getFirestore(_app);

// Also expose on window for non-module scripts (market.js, charts.js etc.)
window.FIREBASE_AUTH = firebaseAuth;
window.FIREBASE_DB   = firebaseDb;

console.log('[FinAI] Firebase initialized ✓');