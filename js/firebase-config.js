/* Auto-generated at deploy time — keys injected from GitHub Secrets */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "",
  authDomain:        "",
  projectId:         "",
  storageBucket:     "",
  messagingSenderId: "",
  appId:             "",
  measurementId:     ""
};

const _app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(_app);
export const firebaseDb   = getFirestore(_app);

window.FIREBASE_AUTH = firebaseAuth;
window.FIREBASE_DB   = firebaseDb;

console.log('[FinAI] Firebase initialized ✓');
