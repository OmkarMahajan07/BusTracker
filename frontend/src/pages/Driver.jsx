import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWakeLock } from 'react-screen-wake-lock';
import { motion } from 'framer-motion';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { startTracking, stopTracking } from '../services/tracker';
import vvceLogo from "../assets/vvce.jpeg";

const Driver = () => {
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedBus, setSelectedBus] = useState("BUS-101");
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);
  
  const busId = selectedBus;
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Logout error:", error));
  };

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

  // Load Google Maps Script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Missing Google Maps API Key");
      return;
    }

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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initDriverMap&v=weekly&libraries=marker`;
        script.async = true;
        script.defer = true;
        script.onerror = () => setMapError("Failed to load Google Maps API");
        document.head.appendChild(script);
      }
    }

    return () => {
      delete window.initDriverMap;
      if (watchIdRef.current !== null) {
        stopTracking(watchIdRef.current);
      }
    };
  }, [GOOGLE_MAPS_API_KEY]);

  // Initialize Map
  const initMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 12.2958, lng: 76.6394 }, // Mysuru default
        zoom: 15,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });

      getLocation();
    } catch (err) {
      console.error("Map Init Error:", err);
      setMapError("Failed to initialize map");
    }
  };

  // Get User Location
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

          if (!markerRef.current) {
            // Use standard Marker with bus icon instead of AdvancedMarkerElement
            markerRef.current = new google.maps.Marker({
              position: pos,
              map: mapInstanceRef.current,
              title: "Your Location",
              icon: {
                url: '/bus-icon.png',
                scaledSize: new google.maps.Size(60, 60),
                anchor: new google.maps.Point(30, 30),
              },
            });
          } else {
            markerRef.current.setPosition(pos);
          }
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGpsError("Unable to retrieve location. Please enable GPS.");
      }
    );
  };

  const handleTrackingUpdate = (data) => {
    console.log("Tracking Update:", data);
    setLastUpdate(new Date());
    setGpsError(null);
    
    // Update marker position if map is ready
    if (markerRef.current && data.lat && data.lng) {
      const newPos = { lat: data.lat, lng: data.lng };
      markerRef.current.position = newPos;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newPos);
      }
    }
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
      
      if (!navigator.geolocation) {
        setGpsError("Geolocation not supported");
        return;
      }

      watchIdRef.current = startTracking(busId, handleTrackingUpdate, handleTrackingError);
      
      if (watchIdRef.current === null) {
        return;
      }
      
      setIsTracking(true);

      if (isSupported) {
        try {
          await request();
        } catch (err) {
          console.error("Wake Lock Request Error:", err);
        }
      }
    }
  };

  const getBusNumber = () => {
    return busId.replace('BUS-', '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-4 bg-white/5 backdrop-blur border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.img
              src={vvceLogo}
              alt="VVCE"
              className="w-12 h-12 rounded-lg drop-shadow-xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <div>
              <h1 className="text-2xl font-extrabold">Driver Panel</h1>
              <p className="text-blue-200 text-sm">Bus ID: {getBusNumber()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              disabled={isTracking}
              className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="BUS-101" className="bg-[#0b1b3a] text-white">Bus 101</option>
              <option value="BUS-102" className="bg-[#0b1b3a] text-white">Bus 102</option>
              <option value="BUS-103" className="bg-[#0b1b3a] text-white">Bus 103</option>
            </select>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-colors font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Status Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tracking Status Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/20 shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4">Tracking Status</h2>
              <div className={`text-2xl font-black mb-2 ${isTracking ? 'text-green-400' : 'text-red-400'}`}>
                {isTracking ? 'ACTIVE' : 'INACTIVE'}
              </div>
              <p className="text-sm text-blue-200">
                {isTracking 
                  ? lastUpdate 
                    ? `Last update: ${lastUpdate.toLocaleTimeString()}`
                    : 'Tracking in progress...'
                  : 'No data sent yet'}
              </p>
              {gpsError && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                  <p className="text-xs text-red-300">{gpsError}</p>
                </div>
              )}
              {!isOnline && (
                <div className="mt-3 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                  <p className="text-xs text-yellow-300">No internet connection</p>
                </div>
              )}
            </motion.div>

            {/* Instructions Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/20 shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4">Instructions</h2>
              <ul className="space-y-3 text-sm text-blue-100">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Enable GPS on your phone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Press Start before leaving the depot.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Keep the app open during the trip.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Press Stop after completing the route.</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Right: Map + Button */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map Container */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl overflow-hidden bg-white/10 backdrop-blur border border-white/20 shadow-xl"
            >
              <div className="relative h-[500px]">
                {mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 z-10">
                    <div className="text-center">
                      <p className="text-red-300 mb-2">{mapError}</p>
                      <button 
                        onClick={getLocation}
                        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
                {!currentPosition && !mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p className="text-blue-200">Loading your location...</p>
                    </div>
                  </div>
                )}
                <div ref={mapRef} className="w-full h-full" />
              </div>
            </motion.div>

            {/* Start/Stop Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center"
            >
              <button
                onClick={toggleTracking}
                disabled={!isOnline || !!mapError}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isTracking
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:scale-105 shadow-lg shadow-red-500/50'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:scale-105 shadow-lg shadow-green-500/50'
                }`}
              >
                {isTracking ? 'Stop Auto Tracking' : 'Start Auto Tracking'}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Driver;
