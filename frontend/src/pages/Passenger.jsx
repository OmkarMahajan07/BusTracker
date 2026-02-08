import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { getDistanceKm } from '../utils/math';
import { DEMO_ROUTES } from '../utils/constants';
import './Passenger.css';

const Passenger = () => {
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('route');
  const [busLocation, setBusLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [eta, setEta] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Resolve route from URL
  const route = DEMO_ROUTES[routeId];
  const DESTINATION = route?.destination;
  const busId = route?.busId || "BUS-101";
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
  
  // 1. Load Google Maps Script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Missing Google Maps API Key");
      return;
    }

    const initPassengerMap = () => {
      initMap();
    };

    window.initPassengerMap = initPassengerMap;

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        // Use libraries=marker for AdvancedMarkerElement
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initPassengerMap&v=weekly&libraries=marker`;
        script.async = true;
        script.defer = true;
        script.onerror = () => setMapError("Failed to load Google Maps API");
        document.head.appendChild(script);
      } else {
         if (window.google && window.google.maps) {
          initMap();
        }
      }
    }

    return () => {
      delete window.initPassengerMap;
    };
  }, [GOOGLE_MAPS_API_KEY]);

  // 2. Initialize Map
  const initMap = async () => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const { Map } = await window.google.maps.importLibrary("maps");
      
      mapInstanceRef.current = new Map(mapRef.current, {
        center: { lat: 15.2993, lng: 74.1240 }, // Default fallback (e.g. Goa)
        zoom: 15,
        mapId: "PASSENGER_MAP_ID",
        disableDefaultUI: false, // Allow passengers to zoom/pan
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

    } catch (err) {
      console.error("Map Init Error:", err);
      setMapError("Failed to initialize map");
    }
  };

  // 3. Subscribe to Location & Update Marker
  useEffect(() => {
    if (!busId) return;

    const locationRef = ref(db, `buses/${busId}/location`);

    const unsubscribe = onValue(locationRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBusLocation(data);
        updateMarker(data);
        calculateEta(data);
      }
    }, (error) => {
      console.error("Location subscription error:", error);
      setMapError("Failed to track bus.");
    });

    return () => unsubscribe();
  }, [busId]);

  // 4a. Calculate ETA
  const calculateEta = (location) => {
    if (!location || !location.lat || !location.lng) return;
    if (!DESTINATION) return; // Safe guard: no destination = no ETA
    
    // Distance in km
    const distanceKm = getDistanceKm(location.lat, location.lng, DESTINATION.lat, DESTINATION.lng);
    
    // Speed: GPS gives m/s. Convert to km/h. Fallback to 30km/h.
    let speedKmh = (location.speed || 0) * 3.6;
    if (speedKmh < 5) speedKmh = 30; // Fallback if stopped or slow

    // Time = Distance / Speed
    const hours = distanceKm / speedKmh;
    const minutes = Math.ceil(hours * 60);

    setEta(minutes < 1 ? 1 : minutes);
  };

  // 4. Update Marker Helper
  const updateMarker = async (location) => {
    // ... (existing updateMarker logic)
    if (!mapInstanceRef.current || !window.google) return;

    const pos = { lat: location.lat, lng: location.lng };
    
    if (!markerRef.current) {
       mapInstanceRef.current.setCenter(pos);
       
       const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");
       
       const pin = new PinElement({
          background: "#4285F4",
          glyphColor: "#FFF",
          borderColor: "#FFF",
          scale: 1.1,
       });

       markerRef.current = new AdvancedMarkerElement({
         position: pos,
         map: mapInstanceRef.current,
         title: busId,
         content: pin.element,
       });
    } else {
      markerRef.current.position = pos;
    }
  };

  return (
    <div className="passenger-container">
      {/* Network Status Overlay */}
      {!isOnline && (
        <div style={{
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          backgroundColor: '#d32f2f', 
          color: 'white', 
          textAlign: 'center', 
          padding: '8px',
          zIndex: 2000,
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          Reconnecting...
        </div>
      )}

      {/* 4.1 Map Container */}
      <div className="passenger-map-container">
        {mapError && <div style={{color: 'red', zIndex: 10}}>{mapError}</div>}
        
        <div 
          ref={mapRef} 
          style={{ width: '100%', height: '100%' }} 
        />
        
        {/* Overlay Debug Data */}
        {!mapInstanceRef.current && !mapError && (
             <p>Loading Map...</p>
        )}
      </div>

      {/* 4.2 Bottom Info Card */}
      <div className="info-card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2>Bus: {busId}</h2>
          {busLocation && (
             <span style={{fontSize: '0.8rem', color: '#4caf50', fontWeight: 'bold'}}>
                LIVE
             </span>
          )}
        </div>
        <p className="eta-text">
            {eta !== null ? `ETA: ${eta} mins` : "ETA: Calculating..."}
        </p>
        <p className="route-info">Route ID: {routeId || "None Selected"}</p>
      </div>
    </div>
  );
};

export default Passenger;
