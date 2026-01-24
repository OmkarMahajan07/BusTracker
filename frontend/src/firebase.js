import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

/**
 * Firebase Configuration
 * 
 * Supports both VITE_ (standard) and REACT_APP_ (legacy/CRA) prefixes 
 * to ensure compatibility with the provided .env file.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || import.meta.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Services
export const auth = getAuth(app);
export const db = getDatabase(app);

// Default export for the app instance
export default app;

/* 
===================================================================
  TEMPORARY - TEST WRITE FUNCTION
  Usage: Import this in App.jsx and call it inside a useEffect to 
  verify connection. Delete after verification.
===================================================================
*/
export const testFirebaseConnection = () => {
  console.log("🔥 Testing Firebase Connection...");
  // console.log("Config (Partial):", { dbURL: firebaseConfig.databaseURL }); 

  const testRef = ref(db, "_connection_test");
  set(testRef, {
    connected: true,
    timestamp: Date.now(),
    message: "Vibe check passed! 🚀"
  })
  .then(() => console.log("✅ Firebase Write Successful! Check your Realtime Database."))
  .catch((err) => console.error("❌ Firebase Write Failed:", err));
};
