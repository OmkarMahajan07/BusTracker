import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Stops data
const stops = [
  { name: "VVCE College, Mysuru" },
  { name: "Hootagalli Industrial Area, Mysuru" },
  { name: "Gokulam 3rd Stage, Mysuru" },
  { name: "Vontikoppal Circle, Mysuru" },
  { name: "Kuvempunagar, Mysuru" },
  { name: "KR Circle, Mysuru" },
  { name: "Mysuru City Bus Stand" }
];

async function addStopsToFirebase() {
  console.log("🚀 Adding stops to Firebase...\n");
  
  try {
    const routeRef = ref(db, 'routes/vvce_to_city_bus_stand/stops');
    await set(routeRef, stops);
    
    console.log("✅ Successfully added", stops.length, "stops to routes/vvce_to_city_bus_stand/stops\n");
    console.log("Stops added:");
    stops.forEach((stop, index) => {
      console.log(`  ${index}: ${stop.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding stops:", error);
    process.exit(1);
  }
}

addStopsToFirebase();
