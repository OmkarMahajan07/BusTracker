import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWakeLock } from 'react-screen-wake-lock';
import { motion } from 'framer-motion';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, set } from 'firebase/database';
import { startTracking, stopTracking } from '../services/tracker';
import { Wifi, WifiOff, MapPin, ChevronLeft, LogOut } from 'lucide-react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import vvceLogo from "../assets/vvce.jpeg";

// ─── Occupancy Config ────────────────────────────────────────────────────────
const OCCUPANCY_OPTIONS = [
  { value: 'AVAILABLE', label: '🟢 Available',  activeClass: 'bg-green-500  border-green-400  shadow-green-500/40'  },
  { value: 'HALF-FULL', label: '🟡 Half Full',  activeClass: 'bg-yellow-500 border-yellow-400 shadow-yellow-500/40' },
  { value: 'FULL',      label: '🔴 Full',        activeClass: 'bg-red-500    border-red-400    shadow-red-500/40'    },
];
// ─────────────────────────────────────────────────────────────────────────────

const Driver = () => {
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Read the bus chosen in DriverSetup; fall back to Bus-9912
  const [selectedBus] = useState(
    () => localStorage.getItem("driverSelectedBus") || "Bus-9912"
  );
  const [lastUpdate, setLastUpdate] = useState(null);
  const [occupancyStatus, setOccupancyStatus] = useState('AVAILABLE');

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);

  const busId = selectedBus;
  const busNumber = busId.replace('Bus-', '');
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

  // Load Google Maps
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) { setMapError("Missing Google Maps API Key"); return; }

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => initMap())
      .catch(() => setMapError("Failed to load Google Maps API"));

    return () => {
      if (watchIdRef.current !== null) stopTracking(watchIdRef.current);
    };
  }, [GOOGLE_MAPS_API_KEY]);

  const initMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 12.2958, lng: 76.6394 },
        zoom: 15,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      getLocation();
    } catch (err) {
      setMapError("Failed to initialize map");
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setMapError("Geolocation not supported."); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const pos = { lat: latitude, lng: longitude };
        setCurrentPosition(pos);
        setMapError(null);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(pos);
          if (!markerRef.current) {
            markerRef.current = new google.maps.Marker({
              position: pos,
              map: mapInstanceRef.current,
              title: "Your Location",
              icon: { url: '/bus-icon.png', scaledSize: new google.maps.Size(60, 60), anchor: new google.maps.Point(30, 30) },
            });
          } else {
            markerRef.current.setPosition(pos);
          }
        }
      },
      (error) => {
        let msg = "Unable to get location. Enable GPS.";
        if (error.code === 1) msg = "Location access denied. Enable permission.";
        else if (error.code === 2) msg = "Position unavailable. Check GPS signal.";
        setGpsError(msg);
      }
    );
  };

  const handleTrackingUpdate = (data) => {
    setLastUpdate(new Date());
    setGpsError(null);
    if (markerRef.current && data.lat && data.lng) {
      const newPos = { lat: data.lat, lng: data.lng };
      markerRef.current.position = newPos;
      if (mapInstanceRef.current) mapInstanceRef.current.panTo(newPos);
    }
  };

  const handleTrackingError = (error) => {
    let msg = "GPS Error";
    if (error.code === 1) msg = "Location denied. Enable permission.";
    else if (error.code === 2) msg = "Position unavailable.";
    else if (error.code === 3) msg = "GPS Timeout.";
    setGpsError(msg);
  };

  const { isSupported, request, release } = useWakeLock({
    onRequest: () => console.log('Wake Lock: Active'),
    onRelease: () => console.log('Wake Lock: Released'),
  });

  const toggleTracking = async () => {
    if (isTracking) {
      stopTracking(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      if (isSupported) { try { await release(); } catch (e) {} }
    } else {
      setGpsError(null);
      if (!navigator.geolocation) { setGpsError("Geolocation not supported"); return; }
      watchIdRef.current = startTracking(busId, handleTrackingUpdate, handleTrackingError);
      if (watchIdRef.current === null) return;
      setIsTracking(true);
      if (isSupported) { try { await request(); } catch (e) {} }
    }
  };

  const handleOccupancyChange = async (status) => {
    setOccupancyStatus(status);
    try {
      await set(ref(db, `buses/${busId}/occupancyStatus`), status);
    } catch (err) {
      console.error('[Occupancy] Write failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white flex flex-col">

      {/* ── Compact mobile header ── */}
      <div className="sticky top-0 z-30 px-4 py-2.5 bg-[#0b1b3a]/95 backdrop-blur border-b border-white/10">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
          {/* Left: logo + bus info */}
          <div className="flex items-center gap-2.5">
            <motion.img src={vvceLogo} alt="VVCE" className="w-9 h-9 rounded-lg drop-shadow-xl flex-shrink-0"
              animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity }} />
            <div>
              <p className="text-xs text-blue-200 leading-none">Driver Panel</p>
              <p className="text-base font-extrabold text-white leading-tight">Bus {busNumber}</p>
            </div>
          </div>

          {/* Right: status pill + buttons */}
          <div className="flex items-center gap-2">
            {/* Online/Offline indicator */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
              isOnline ? 'bg-green-500/20 border-green-500/40 text-green-300'
                       : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Change bus */}
            <button
              onClick={() => navigate('/driver-setup')}
              disabled={isTracking}
              title="Change Bus"
              className="p-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Banners (GPS/Network errors) ── */}
      <div className="max-w-2xl mx-auto w-full px-4">
        {gpsError && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
            {gpsError}
          </div>
        )}
        {!isOnline && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm text-center">
            No internet connection — location updates paused
          </div>
        )}
      </div>

      {/* ── Main content (scrollable, padded for fixed bottom button) ── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 pb-36 space-y-4">

        {/* Tracking status mini-bar */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
          isTracking ? 'bg-green-500/15 border-green-500/30' : 'bg-white/10 border-white/20'}`}>
          <div>
            <p className="text-xs text-blue-200">Tracking Status</p>
            <p className={`font-black text-lg ${isTracking ? 'text-green-400' : 'text-red-400'}`}>
              {isTracking ? '● ACTIVE' : '○ INACTIVE'}
            </p>
          </div>
          {isTracking && lastUpdate && (
            <p className="text-xs text-blue-300 text-right">
              Last update<br />
              <span className="font-semibold text-white">{lastUpdate.toLocaleTimeString()}</span>
            </p>
          )}
          {!isTracking && (
            <div className="flex items-center gap-1.5 text-xs text-blue-300">
              <MapPin className="w-4 h-4" />
              Press Start below
            </div>
          )}
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-white/10">
          <div className="relative h-[280px] sm:h-[360px]">
            {mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 z-10 gap-3">
                <p className="text-red-300 text-sm text-center px-4">{mapError}</p>
                <button onClick={getLocation} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-sm font-semibold">
                  Retry
                </button>
              </div>
            )}
            {!currentPosition && !mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-500/10 z-10 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
                <p className="text-blue-200 text-sm">Loading your location…</p>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>
        </div>

        {/* Occupancy Buttons */}
        <div className="rounded-2xl p-4 bg-white/10 backdrop-blur border border-white/20 shadow-xl">
          <p className="text-sm font-bold text-white mb-1">Bus Occupancy</p>
          <p className="text-xs text-blue-200 mb-3">Tap to update — passengers see this instantly</p>
          <div className="grid grid-cols-3 gap-3">
            {OCCUPANCY_OPTIONS.map((opt) => {
              const isActive = occupancyStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleOccupancyChange(opt.value)}
                  className={`py-4 px-2 rounded-xl font-bold text-sm border-2 transition-all duration-200 active:scale-[0.96] ${
                    isActive
                      ? `${opt.activeClass} text-white shadow-lg scale-[1.03]`
                      : 'bg-white/5 border-white/20 text-blue-100 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Instructions (collapsible on mobile) */}
        <details className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 shadow-xl overflow-hidden">
          <summary className="px-4 py-3 font-bold text-sm text-white cursor-pointer list-none flex items-center justify-between select-none">
            Instructions
            <span className="text-blue-300 text-xs font-normal">tap to expand</span>
          </summary>
          <ul className="px-4 pb-4 space-y-2 text-sm text-blue-100">
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>Enable GPS on your phone.</span></li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>Press Start before leaving the depot.</span></li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>Keep the app open during the trip.</span></li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>Press Stop after completing the route.</span></li>
          </ul>
        </details>
      </div>

      {/* ── Fixed bottom Start/Stop button ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-[#0a1225] via-[#0a1225]/95 to-transparent pt-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={toggleTracking}
          disabled={!isOnline || !!mapError}
          className={`w-full max-w-2xl mx-auto block py-5 rounded-2xl font-black text-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] ${
            isTracking
              ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/40'
              : 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/40'
          }`}
        >
          {isTracking ? '⏹ Stop Tracking' : '▶ Start Tracking'}
        </motion.button>
      </div>
    </div>
  );
};

export default Driver;
