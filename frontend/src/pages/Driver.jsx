import React, { useState, useEffect, useRef } from 'react';
import { useWakeLock } from 'react-screen-wake-lock';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
// Removed @vis.gl/react-google-maps dependency
import { startTracking, stopTracking } from '../services/tracker';
import './Driver.css';

const Driver = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const mapRef = useRef(null); // Reference to the map div
  const mapInstanceRef = useRef(null); // Reference to the Google Map instance
  const markerRef = useRef(null); // Reference to the user marker
  const watchIdRef = useRef(null); // Reference to the GPS watch ID
  const busId = "BUS-101"; 

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Logout error:", error));
  };

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Network Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Load Google Maps Script (Classic Callback Pattern)
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Missing Google Maps API Key");
      return;
    }

    // Define global callback
    window.initDriverMap = () => {
      initMap();
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        // Use v=weekly and libraries=marker. Callback is initDriverMap.
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initDriverMap&v=weekly&libraries=marker`;
        script.async = true;
        script.defer = true;
        script.onerror = () => setMapError("Failed to load Google Maps API");
        document.head.appendChild(script);
      }
    }

    return () => {
      // Cleanup global callback
      delete window.initDriverMap;
      // Stop tracking on unmount
      if (watchIdRef.current !== null) {
        stopTracking(watchIdRef.current);
      }
    };
  }, [GOOGLE_MAPS_API_KEY]);

  // 2. Initialize Map
  const initMap = async () => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      // Create Map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 15,
        mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
        disableDefaultUI: true,
      });

      // Attempt to get location
      getLocation();
    } catch (err) {
      console.error("Map Init Error:", err);
      setMapError("Failed to initialize map");
    }
  };

  // 3. Get User Location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setMapError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const pos = { lat: latitude, lng: longitude };
        
        setCurrentPosition(pos);
        setMapError(null);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(pos);

          // Use AdvancedMarkerElement if available (it should be with v=weekly + mapId)
          if (!markerRef.current) {
             const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");
             
             const pin = new PinElement({
                background: "#FBBC04",
                glyphColor: "#000",
                borderColor: "#000",
             });

             markerRef.current = new AdvancedMarkerElement({
               position: pos,
               map: mapInstanceRef.current,
               title: "Your Location",
               content: pin.element,
             });
          } else {
            markerRef.current.position = pos;
          }
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setMapError("Unable to retrieve location");
      }
    );
  };

  const handleTrackingUpdate = (data) => {
    // Requirements:
    // 4. Console log { lat, lng, speed } on every update (Handled in tracker.js but also can stay here if needed for debug)
    console.log("Tracking Update:", data);
    setGpsError(null); // Clear error on successful update
  };

  const handleTrackingError = (error) => {
    console.error("Tracking error:", error);
    let msg = "GPS Error";
    if (error.code === 1) msg = "Location access denied. Please enable permission.";
    else if (error.code === 2) msg = "Position unavailable. Check GPS signal.";
    else if (error.code === 3) msg = "GPS Timeout.";
    setGpsError(msg);
  };

  const { isSupported, request, release } = useWakeLock({
    onRequest: () => console.log('Screen Wake Lock: Active'),
    onRelease: () => console.log('Screen Wake Lock: Released'),
  });

  const toggleTracking = async () => {
    if (isTracking) {
      // Stop tracking
      stopTracking(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      
      // Release Wake Lock
      if (isSupported) {
        try {
          await release();
        } catch (err) {
          console.error("Wake Lock Release Error:", err);
        }
      }
    } else {
      // Start tracking
      setGpsError(null);
      
      // Pre-check for geolocation support
      if (!navigator.geolocation) {
         setGpsError("Geolocation not supported");
         return;
      }

      watchIdRef.current = startTracking(busId, handleTrackingUpdate, handleTrackingError);
      
      // If startTracking returns null immediately (e.g. no support), don't set tracking true
      if (watchIdRef.current === null) {
         return;
      }
      
      setIsTracking(true);

      // Request Wake Lock
      if (isSupported) {
        try {
          await request();
        } catch (err) {
          console.error("Wake Lock Request Error:", err);
        }
      }
    }
  };

  return (
    <div className="driver-container">
      <div className="driver-header">
        <div>
          <h1>Driver Console</h1>
          <div className="bus-id">ID: {busId}</div>
        </div>
        <button onClick={handleLogout} className="logout-btn">Sign Out</button>
      </div>

      <div className="status-ring-container">
        <div className={`status-ring ${isTracking ? 'active' : 'inactive'}`}></div>
        <div className="status-text">
          {isTracking ? "ONLINE" : "OFFLINE"}
        </div>
        {!isOnline && <div style={{color: 'red', fontSize: '0.8rem', marginTop: '4px'}}>NO INTERNET</div>}
      </div>

      {/* Map Section */}
      <div className="map-container">
        {mapError && <div className="map-error">{mapError}</div>}
        {gpsError && <div className="map-error" style={{backgroundColor: '#ffebee', color: '#c62828'}}>{gpsError}</div>}
        {!mapError && !currentPosition && !gpsError && <div className="map-loading">Locating...</div>}
        
        <div 
          ref={mapRef} 
          className="google-map" 
          style={{ width: '100%', height: '100%', borderRadius: '12px', display: (mapError || gpsError) ? 'none' : 'block' }} 
        />
      </div>

      <div className="controls">
        <button 
          className={`toggle-btn ${isTracking ? 'stop' : 'start'}`}
          onClick={toggleTracking}
          disabled={!isOnline || !!mapError} // Disable if offline or critical map error
          style={{ opacity: (!isOnline || !!mapError) ? 0.6 : 1, cursor: (!isOnline || !!mapError) ? 'not-allowed' : 'pointer'}}
        >
          {isTracking ? "Stop Trip" : "Start Trip"}
        </button>
        {(!isOnline) && <p style={{fontSize: '0.8rem', color: '#666', marginTop: '8px'}}>Waiting for connection...</p>}
      </div>
    </div>
  );
};

export default Driver;
