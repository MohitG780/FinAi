/* ============================================================
   firebase-config.js — Firebase SDK Initialization for FinAI
   Exports auth + db instances directly for peer module imports.
   ============================================================ */

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyC2wecKX5MKpA4-EySQENLkRqKFC91cxCQ",
  authDomain:        "finai-33a38.firebaseapp.com",
  projectId:         "finai-33a38",
  storageBucket:     "finai-33a38.firebasestorage.app",
  messagingSenderId: "83882939879",
  appId:             "1:83882939879:web:0ff7786fddafdcf3635942",
  measurementId:     "G-HMSKY8JM5F"
};

const _app = initializeApp(firebaseConfig);

// Export as named exports for sibling modules to import directly
export const firebaseAuth = getAuth(_app);
export const firebaseDb   = getFirestore(_app);

// Also expose on window for non-module scripts (market.js, charts.js etc.)
window.FIREBASE_AUTH = firebaseAuth;
window.FIREBASE_DB   = firebaseDb;

console.log('[FinAI] Firebase initialized ✓');