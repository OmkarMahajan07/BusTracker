/**
 * upload-routes.mjs
 * ─────────────────
 * Run this ONCE from the frontend/ directory to push all bus routes to Firebase.
 * Stops carry only name + scheduledTime — Google Maps Geocoding resolves coords at runtime.
 *
 *   cd d:\FYP\BusTracker\frontend
 *   node upload-routes.mjs
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

// ─── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDoziSQS26yP3TAKW6BeSjQ4-3A4YfjuGk",
  authDomain:        "college-bus-tracker-66f19.firebaseapp.com",
  databaseURL:       "https://college-bus-tracker-66f19-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "college-bus-tracker-661f9",
  storageBucket:     "college-bus-tracker-66f19.firebasestorage.app",
  messagingSenderId: "910421856290",
  appId:             "1:910421856290:web:b4e39a418f4ba206683a7b",
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ─── Stop names (no coordinates — Google Maps geocodes these at runtime) ───────
const STOPS = {
  subUrban:       { name: "Sub Urban Bus Stand, Mysuru, Karnataka, India" },
  hardinge:       { name: "Hardinge Circle, Mysuru, Karnataka, India" },
  railwayStation: { name: "Mysuru Railway Station, Mysuru, Karnataka, India" },
  vontikoppal:    { name: "Vontikoppal, Mysuru, Karnataka, India" },
  vvce:           { name: "Vidyavardhaka College of Engineering, Mysuru, Karnataka, India" },
};

const mkStop = (key, scheduledTime) => ({ ...STOPS[key], scheduledTime });

// ─── Route data ───────────────────────────────────────────────────────────────
const routes = {

  // Morning: Sub Urban → VVCE
  sub_urban_to_vvce_9912: {
    busId: "Bus-9912", name: "Sub Urban → VVCE Mysuru",
    driverName: "Nagesh", plateNumber: "KA 09 AB 9912", shift: "Morning",
    stops: [
      mkStop("subUrban",       "7:15 AM"),
      mkStop("hardinge",       "7:20 AM"),
      mkStop("railwayStation", "7:30 AM"),
      mkStop("vontikoppal",    "7:40 AM"),
      mkStop("vvce",           "7:45 AM"),
    ],
  },
  sub_urban_to_vvce_9915: {
    busId: "Bus-9915", name: "Sub Urban → VVCE Mysuru", shift: "Morning",
    stops: [
      mkStop("subUrban",       "7:25 AM"),
      mkStop("hardinge",       "7:30 AM"),
      mkStop("railwayStation", "7:40 AM"),
      mkStop("vontikoppal",    "7:50 AM"),
      mkStop("vvce",           "7:55 AM"),
    ],
  },
  sub_urban_to_vvce_9918: {
    busId: "Bus-9918", name: "Sub Urban → VVCE Mysuru", shift: "Morning",
    stops: [
      mkStop("subUrban",       "7:35 AM"),
      mkStop("hardinge",       "7:40 AM"),
      mkStop("railwayStation", "7:50 AM"),
      mkStop("vontikoppal",    "8:00 AM"),
      mkStop("vvce",           "8:05 AM"),
    ],
  },

  // Evening: VVCE → Sub Urban
  vvce_to_sub_urban_9912: {
    busId: "Bus-9912", name: "VVCE Mysuru → Sub Urban",
    driverName: "Nagesh", plateNumber: "KA 09 AB 9912", shift: "Evening",
    stops: [
      mkStop("vvce",           "3:30 PM"),
      mkStop("vontikoppal",    "3:40 PM"),
      mkStop("railwayStation", "3:50 PM"),
      mkStop("hardinge",       "3:55 PM"),
      mkStop("subUrban",       "4:00 PM"),
    ],
  },
  vvce_to_sub_urban_9915: {
    busId: "Bus-9915", name: "VVCE Mysuru → Sub Urban", shift: "Evening",
    stops: [
      mkStop("vvce",           "3:40 PM"),
      mkStop("vontikoppal",    "3:50 PM"),
      mkStop("railwayStation", "4:00 PM"),
      mkStop("hardinge",       "4:05 PM"),
      mkStop("subUrban",       "4:10 PM"),
    ],
  },
  vvce_to_sub_urban_9918: {
    busId: "Bus-9918", name: "VVCE Mysuru → Sub Urban", shift: "Evening",
    stops: [
      mkStop("vvce",           "3:50 PM"),
      mkStop("vontikoppal",    "4:00 PM"),
      mkStop("railwayStation", "4:10 PM"),
      mkStop("hardinge",       "4:15 PM"),
      mkStop("subUrban",       "4:20 PM"),
    ],
  },
};

// ─── Upload ───────────────────────────────────────────────────────────────────
console.log('Uploading routes to Firebase (name-only, no hardcoded coordinates)...');
set(ref(db, 'routes'), routes)
  .then(() => {
    console.log('Routes uploaded successfully!');
    console.log('  6 routes (3 morning + 3 evening) — coordinates will be geocoded at runtime');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Upload failed:', err.message);
    process.exit(1);
  });
