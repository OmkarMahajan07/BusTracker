import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import './Passenger.css';

const Passenger = () => {
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('route');
  const [busLocation, setBusLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Requirement: Resolve busId.
  const busId = "BUS-101"; 
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
        // If script already exists (e.g. from Driver page), just wait/check or manually trigger
        // In SPA, global 'initPassengerMap' might not be called if script loaded previously.
        // We will try to init immediately if google is ready.
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
      }
    }, (error) => {
      console.error("Location subscription error:", error);
      setMapError("Failed to track bus.");
    });

    return () => unsubscribe();
  }, [busId]);

  // 4. Update Marker Helper
  const updateMarker = async (location) => {
    if (!mapInstanceRef.current || !window.google) return;

    const pos = { lat: location.lat, lng: location.lng };

    // Center map on FIRST update only, or always? 
    // "Center map on bus location" - usually means initially or if user tracks.
    // For now, let's strictly follow: "Center map on bus location".
    // I'll update center if it's the first time marker is added, to valid jump.
    // Or if map center is at default 0,0 (but I set default to Goa).
    // Let's just panTo on every update for now to keep bus in view, 
    // providing a "Live Tracking" feel.
    // mapInstanceRef.current.panTo(pos); 
    // Actually, forcing panTo might be annoying if user wants to look around.
    // Better: Only pan if it's the first update (marker doesn't exist yet).
    
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
      {/* 4.1 Map Container */}
      <div className="passenger-map-container">
        {mapError && <div style={{color: 'red', zIndex: 10}}>{mapError}</div>}
        
        <div 
          ref={mapRef} 
          style={{ width: '100%', height: '100%' }} 
        />
        
        {/* Overlay Debug Data (Optional, kept for now but made smaller/hidden if map works) */}
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
        <p className="eta-text">ETA: Calculating...</p>
        <p className="route-info">Route ID: {routeId || "None Selected"}</p>
      </div>
    </div>
  );
};

export default Passenger;
