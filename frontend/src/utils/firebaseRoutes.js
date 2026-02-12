import { ref, set } from 'firebase/database';
import { db } from '../firebase';

/**
 * Upload Routes to Firebase Realtime Database
 * Run this once to populate routes for BUS-101, BUS-102, BUS-103
 */
export const uploadRoutesToFirebase = async () => {
  const routes = {
    // BUS-101: City Bus Stand → VVCE (reverse of BUS-102)
    "city_bus_stand_to_vvce": {
      "busId": "BUS-101",
      "name": "City Bus Stand → VVCE College",
      "stops": [
        { "name": "Mysuru City Bus Stand" },
        { "name": "KR Circle, Mysuru" },
        { "name": "Kuvempunagar, Mysuru" },
        { "name": "Vontikoppal Circle, Mysuru" },
        { "name": "Gokulam 3rd Stage, Mysuru" },
        { "name": "VVCE Boys Hostel" },
        { "name": "VVCE College, Mysuru" }
      ]
    },

    // BUS-102: Already exists but included for completeness
    "vvce_to_city_bus_stand": {
      "busId": "BUS-102",
      "name": "VVCE → City Bus Stand",
      "stops": [
        { "name": "VVCE College, Mysuru" },
        { "name": "VVCE Boys Hostel" },
        { "name": "Gokulam 3rd Stage, Mysuru" },
        { "name": "Vontikoppal Circle, Mysuru" },
        { "name": "Kuvempunagar, Mysuru" },
        { "name": "KR Circle, Mysuru" },
        { "name": "Mysuru City Bus Stand" }
      ]
    },

    // BUS-103: Same route as BUS-102 (evening shift)
    "vvce_to_city_bus_stand_evening": {
      "busId": "BUS-103",
      "name": "VVCE → City Bus Stand (Evening)",
      "stops": [
        { "name": "VVCE College, Mysuru" },
        { "name": "VVCE Boys Hostel" },
        { "name": "Gokulam 3rd Stage, Mysuru" },
        { "name": "Vontikoppal Circle, Mysuru" },
        { "name": "Kuvempunagar, Mysuru" },
        { "name": "KR Circle, Mysuru" },
        { "name": "Mysuru City Bus Stand" }
      ]
    }
  };

  try {
    const routesRef = ref(db, 'routes');
    await set(routesRef, routes);
    console.log('✅ Routes uploaded successfully to Firebase!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error uploading routes:', error);
    return { success: false, error };
  }
};

// Helper: Find route by busId
export const getRouteByBusId = (busId) => {
  // Map busNumber to busId format
  const busIdMap = {
    '101': 'BUS-101',
    '102': 'BUS-102',
    '103': 'BUS-103'
  };
  
  // Map busId to route key
  const routeMap = {
    'BUS-101': 'city_bus_stand_to_vvce',
    'BUS-102': 'vvce_to_city_bus_stand',
    'BUS-103': 'vvce_to_city_bus_stand_evening'
  };
  
  return routeMap[busId] || routeMap[busIdMap[busId]];
};
