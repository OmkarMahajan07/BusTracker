import { ref, set } from "firebase/database";
import { db } from "../firebase";

/**
 * Tracker Service
 * Handles geolocation tracking for the driver.
 */

export const startTracking = (busId, onUpdate, onError) => {
  if (!navigator.geolocation) {
    if (onError) onError(new Error("Geolocation is not supported by this browser."));
    return null;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, speed } = position.coords;
      const timestamp = Date.now();

      const locationData = {
        lat: latitude,
        lng: longitude,
        speed,
        updatedAt: timestamp,
      };
      
      // Requirement: Console log { lat, lng, speed } on every update
      console.log("GPS Update:", locationData);

      // Write to Firebase
      const locationRef = ref(db, `buses/${busId}/location`);
      set(locationRef, locationData)
        .then(() => console.log("Location sent to Firebase"))
        .catch((err) => console.error("Firebase write error:", err));

      if (onUpdate) {
        onUpdate(locationData);
      }
    },
    (error) => {
      console.error("GPS Tracking Error:", error);
      if (onError) onError(error);
    },
    options
  );

  return watchId;
};

export const stopTracking = (watchId) => {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    console.log("GPS Tracking Stopped");
  }
};
