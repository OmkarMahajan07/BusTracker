/**
 * Tracker Service
 * Handles geolocation tracking for the driver.
 */

export const startTracking = (onUpdate, onError) => {
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
      
      // Requirement: Console log { lat, lng, speed } on every update
      console.log("GPS Update:", { lat: latitude, lng: longitude, speed });

      if (onUpdate) {
        onUpdate({ lat: latitude, lng: longitude, speed });
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
