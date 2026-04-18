import { ref, set } from 'firebase/database';
import { db } from '../firebase';

/**
 * Upload Routes to Firebase Realtime Database
 * Run this once to populate routes for Bus-9912, Bus-9915, Bus-9918
 * Driver: Nagesh | Plate: KA 09 AB 9912
 *
 * Stops carry only `name` + `scheduledTime`.
 * Google Maps Geocoding API resolves coordinates at runtime.
 *
 * Morning (Sub Urban → VVCE Mysuru):
 *   Bus-9912: 7:15 → 7:20 → 7:30 → 7:40 → 7:45
 *   Bus-9915: 7:25 → 7:30 → 7:40 → 7:50 → 7:55
 *   Bus-9918: 7:35 → 7:40 → 7:50 → 8:00 → 8:05
 *
 * Evening (VVCE Mysuru → Sub Urban):
 *   Bus-9912: 3:30 → 3:40 → 3:50 → 3:55 → 4:00
 *   Bus-9915: 3:40 → 3:50 → 4:00 → 4:05 → 4:10
 *   Bus-9918: 3:50 → 4:00 → 4:10 → 4:15 → 4:20
 */

// ─── Stop names — coordinates resolved by Google Maps Geocoding API ───────────
const STOPS = {
  subUrban:       { name: "Sub Urban Bus Stand, Mysuru, Karnataka, India" },
  hardinge:       { name: "Hardinge Circle, Mysuru, Karnataka, India" },
  railwayStation: { name: "Mysuru Railway Station, Mysuru, Karnataka, India" },
  vontikoppal:    { name: "Vontikoppal, Mysuru, Karnataka, India" },
  vvce:           { name: "Vidyavardhaka College of Engineering, Mysuru, Karnataka, India" },
};

// Helper: build a stop with only name + scheduled time
const mkStop = (key, scheduledTime) => ({ ...STOPS[key], scheduledTime });

export const uploadRoutesToFirebase = async () => {
  const routes = {

    // ── Morning: Sub Urban → VVCE ────────────────────────────────────────────
    sub_urban_to_vvce_9912: {
      busId: "Bus-9912",
      name: "Sub Urban → VVCE Mysuru",
      driverName: "Nagesh",
      plateNumber: "KA 09 AB 9912",
      shift: "Morning",
      stops: [
        mkStop("subUrban",       "7:15 AM"),
        mkStop("hardinge",       "7:20 AM"),
        mkStop("railwayStation", "7:30 AM"),
        mkStop("vontikoppal",    "7:40 AM"),
        mkStop("vvce",           "7:45 AM"),
      ],
    },
    sub_urban_to_vvce_9915: {
      busId: "Bus-9915",
      name: "Sub Urban → VVCE Mysuru",
      shift: "Morning",
      stops: [
        mkStop("subUrban",       "7:25 AM"),
        mkStop("hardinge",       "7:30 AM"),
        mkStop("railwayStation", "7:40 AM"),
        mkStop("vontikoppal",    "7:50 AM"),
        mkStop("vvce",           "7:55 AM"),
      ],
    },
    sub_urban_to_vvce_9918: {
      busId: "Bus-9918",
      name: "Sub Urban → VVCE Mysuru",
      shift: "Morning",
      stops: [
        mkStop("subUrban",       "7:35 AM"),
        mkStop("hardinge",       "7:40 AM"),
        mkStop("railwayStation", "7:50 AM"),
        mkStop("vontikoppal",    "8:00 AM"),
        mkStop("vvce",           "8:05 AM"),
      ],
    },

    // ── Evening: VVCE → Sub Urban ────────────────────────────────────────────
    vvce_to_sub_urban_9912: {
      busId: "Bus-9912",
      name: "VVCE Mysuru → Sub Urban",
      driverName: "Nagesh",
      plateNumber: "KA 09 AB 9912",
      shift: "Evening",
      stops: [
        mkStop("vvce",           "3:30 PM"),
        mkStop("vontikoppal",    "3:40 PM"),
        mkStop("railwayStation", "3:50 PM"),
        mkStop("hardinge",       "3:55 PM"),
        mkStop("subUrban",       "4:00 PM"),
      ],
    },
    vvce_to_sub_urban_9915: {
      busId: "Bus-9915",
      name: "VVCE Mysuru → Sub Urban",
      shift: "Evening",
      stops: [
        mkStop("vvce",           "3:40 PM"),
        mkStop("vontikoppal",    "3:50 PM"),
        mkStop("railwayStation", "4:00 PM"),
        mkStop("hardinge",       "4:05 PM"),
        mkStop("subUrban",       "4:10 PM"),
      ],
    },
    vvce_to_sub_urban_9918: {
      busId: "Bus-9918",
      name: "VVCE Mysuru → Sub Urban",
      shift: "Evening",
      stops: [
        mkStop("vvce",           "3:50 PM"),
        mkStop("vontikoppal",    "4:00 PM"),
        mkStop("railwayStation", "4:10 PM"),
        mkStop("hardinge",       "4:15 PM"),
        mkStop("subUrban",       "4:20 PM"),
      ],
    },
  };

  try {
    const routesRef = ref(db, 'routes');
    await set(routesRef, routes);
    console.log('Routes uploaded successfully to Firebase!');
    return { success: true };
  } catch (error) {
    console.error('Error uploading routes:', error);
    return { success: false, error };
  }
};

// Helper: Find route key by busId + shift ('morning' | 'evening')
export const getRouteByBusId = (busId, shift = 'morning') => {
  const busIdMap = {
    '9912': 'Bus-9912',
    '9915': 'Bus-9915',
    '9918': 'Bus-9918',
  };

  const morningRoutes = {
    'Bus-9912': 'sub_urban_to_vvce_9912',
    'Bus-9915': 'sub_urban_to_vvce_9915',
    'Bus-9918': 'sub_urban_to_vvce_9918',
  };

  const eveningRoutes = {
    'Bus-9912': 'vvce_to_sub_urban_9912',
    'Bus-9915': 'vvce_to_sub_urban_9915',
    'Bus-9918': 'vvce_to_sub_urban_9918',
  };

  const id = busIdMap[busId] || busId;
  return shift === 'evening'
    ? eveningRoutes[id]
    : morningRoutes[id];
};
