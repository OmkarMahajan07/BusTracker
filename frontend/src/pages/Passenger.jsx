import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import { getDistanceKm } from '../utils/math';
import { DEMO_ROUTES } from '../utils/constants';
import './Passenger.css';

// ─── Occupancy Display Config ────────────────────────────────────────────────
const OCCUPANCY_DISPLAY = {
  'AVAILABLE': { emoji: '🟢', label: 'Available',  color: '#4caf50' },
  'HALF-FULL': { emoji: '🟡', label: 'Half-Full',  color: '#ffc107' },
  'FULL':      { emoji: '🔴', label: 'Full',        color: '#f44336' },
};
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_SPEED_KMH = 30; // km/h — used when GPS speed is unavailable or ≤ 5 km/h
const MIN_ETA_MINUTES    = 1;  // never display less than 1 min
const MAX_ETA_MINUTES    = 120; // cap unrealistic ETAs
const ARRIVED_THRESHOLD_KM = 0.01; // treat bus as arrived if < 10 metres away
// ────────────────────────────────────────────────────────────────────────────

const Passenger = () => {
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('route');
  const [busLocation, setBusLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  // eta can be: null | 'Arrived' | 'Calculating...' | number (minutes)
  const [eta, setEta] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [routeStops, setRouteStops] = useState([]);
  const [isGeocodingStops, setIsGeocodingStops] = useState(false);
  const [occupancyStatus, setOccupancyStatus] = useState(null);
  const previousEtaRef = useRef(null);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const stopMarkersRef = useRef([]);

  // Resolve route from URL
  const route = DEMO_ROUTES[routeId];
  const DESTINATION = route?.destination;
  const busId = route?.busId || "Bus-9912";
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
  
  // 1. Load Google Maps
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Missing Google Maps API Key");
      return;
    }

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => initMap())
      .catch(() => setMapError("Failed to load Google Maps API"));

    return () => {};
  }, [GOOGLE_MAPS_API_KEY]);

  // 2. Initialize Map
  const initMap = async () => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const { Map } = await window.google.maps.importLibrary("maps");
      
      mapInstanceRef.current = new Map(mapRef.current, {
        center: { lat: 12.3269, lng: 76.6331 }, // Default: Mysuru
        zoom: 15,
        mapId: "PASSENGER_MAP_ID",
        disableDefaultUI: false, // Allow passengers to zoom/pan
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      // Initialize Directions API services
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true, // We already show bus marker
        polylineOptions: {
          strokeColor: "#2563EB",
          strokeOpacity: 0.8,
          strokeWeight: 5,
          zIndex: 1, // Ensure route is below the bus marker
        },
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

  // Subscribe to occupancy status
  useEffect(() => {
    if (!busId) return;
    const occupancyRef = ref(db, `buses/${busId}/occupancyStatus`);
    const unsubscribe = onValue(occupancyRef, (snapshot) => {
      const val = snapshot.val();
      setOccupancyStatus(val || null);
    });
    return () => unsubscribe();
  }, [busId]);

  // Subscribe to route stops from Firebase
  useEffect(() => {
    if (!routeId) {
      console.log('[Route Stops] No routeId provided');
      return;
    }

    console.log('[Route Stops] Subscribing to:', `routes/${routeId}/stops`);
    const routeRef = ref(db, `routes/${routeId}/stops`);

    const unsubscribe = onValue(routeRef, async (snapshot) => {
      const data = snapshot.val();
      console.log('[Route Stops] Received data:', data);
      if (data) {
        const stopsArray = Object.values(data);
        console.log('[Route Stops] Processed stops:', stopsArray.length, stopsArray);
        
        // Check if stops need geocoding (only have names, no coordinates)
        const needsGeocoding = stopsArray.some(stop => !stop.lat || !stop.lng);
        
        if (needsGeocoding && window.google && window.google.maps) {
          console.log('[Geocoding] Stops need geocoding, starting...');
          setIsGeocodingStops(true);
          
          try {
            const geocodedStops = await Promise.all(
              stopsArray.map(async (stop, index) => {
                // If stop already has coordinates, use them (backward compatible)
                if (stop.lat && stop.lng) {
                  console.log(`[Geocoding] Stop ${index} already has coordinates`);
                  return stop;
                }
                
                // Otherwise, geocode the name
                if (stop.name) {
                  try {
                    const coords = await geocodeStopName(stop.name);
                    console.log(`[Geocoding] ${stop.name} →`, coords);
                    return { ...stop, ...coords };
                  } catch (error) {
                    console.error(`[Geocoding] Failed for ${stop.name}:`, error);
                    // Return original stop without coordinates if geocoding fails
                    return stop;
                  }
                }
                
                return stop;
              })
            );
            
            // Filter out stops that failed to geocode (no coordinates)
            const validStops = geocodedStops.filter(stop => stop.lat && stop.lng);
            console.log('[Geocoding] Successfully geocoded', validStops.length, 'stops');
            setRouteStops(validStops);
          } catch (error) {
            console.error('[Geocoding] Error:', error);
            setMapError('Failed to geocode stops');
          } finally {
            setIsGeocodingStops(false);
          }
        } else {
          // Stops already have coordinates, use them directly
          setRouteStops(stopsArray);
        }
      } else {
        console.warn('[Route Stops] No stops data found in Firebase');
      }
    });

    return () => unsubscribe();
  }, [routeId]);

  // Cleanup stop markers on unmount
  useEffect(() => {
    return () => {
      stopMarkersRef.current.forEach(marker => marker.setMap(null));
      stopMarkersRef.current = [];
    };
  }, []);

  // Draw route using Directions API when destination is available
  useEffect(() => {
    if (!DESTINATION || !mapInstanceRef.current || !routeStops.length) return;

    // Origin: First stop, fallback to VVCE College
    const origin = routeStops.length > 0 
      ? { lat: routeStops[0].lat, lng: routeStops[0].lng }
      : { lat: 12.3525, lng: 76.6186 }; // VVCE College fallback

    // Waypoints: All intermediate stops (exclude first and last)
    const waypoints = routeStops.length > 2
      ? routeStops.slice(1, -1).map(stop => ({
          location: { lat: stop.lat, lng: stop.lng },
          stopover: true,
        }))
      : [];

    // Destination: Last stop or DESTINATION constant
    const destination = routeStops.length > 1
      ? { lat: routeStops[routeStops.length - 1].lat, lng: routeStops[routeStops.length - 1].lng }
      : DESTINATION;

    console.log('[Route] Drawing route with', waypoints.length, 'waypoints');
    drawRouteUsingDirections(origin, waypoints, destination);
    renderStopMarkers(routeStops);
  }, [DESTINATION, routeStops, mapInstanceRef.current]);

  // 4a. Calculate ETA — Production-level implementation
  const calculateEta = (location) => {
    if (!location || !location.lat || !location.lng) {
      setEta('Calculating...');
      return;
    }
    if (!DESTINATION) {
      setEta('Calculating...');
      return;
    }

    // ── 1. Distance ──────────────────────────────────────────────────────────
    const distanceKm = getDistanceKm(
      location.lat, location.lng,
      DESTINATION.lat, DESTINATION.lng
    );

    // ── 2. Arrived check ─────────────────────────────────────────────────────
    if (distanceKm < ARRIVED_THRESHOLD_KM) {
      previousEtaRef.current = null;
      setEta('Arrived');
      return;
    }

    // ── 3. Speed (m/s → km/h) with fallback ──────────────────────────────────
    const rawSpeedMs  = location.speed;
    const speedKmh    = (rawSpeedMs != null) ? rawSpeedMs * 3.6 : 0;
    const effectiveSpeed = speedKmh > 5 ? speedKmh : FALLBACK_SPEED_KMH;

    // ── 4. ETA formula ───────────────────────────────────────────────────────
    const rawEtaMinutes = (distanceKm / effectiveSpeed) * 60;

    // ── 5. Safety guards ─────────────────────────────────────────────────────
    if (!isFinite(rawEtaMinutes) || isNaN(rawEtaMinutes)) {
      setEta('Calculating...');
      return;
    }

    // Clamp to [MIN, MAX]
    const clampedEta = Math.min(
      Math.max(Math.round(rawEtaMinutes), MIN_ETA_MINUTES),
      MAX_ETA_MINUTES
    );

    // ── 6. Smoothing (70% previous / 30% new) ────────────────────────────────
    const smoothed = previousEtaRef.current != null
      ? Math.round((previousEtaRef.current * 0.7) + (clampedEta * 0.3))
      : clampedEta;

    previousEtaRef.current = smoothed;
    setEta(smoothed);
  };

  // Geocode place name to coordinates using Google Maps Geocoding API
  const geocodeStopName = async (placeName) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps API not loaded'));
        return;
      }

      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address: placeName }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject(new Error(`Geocoding failed for: ${placeName} (Status: ${status})`));
        }
      });
    });
  };

  // Draw route using Directions API to show real road paths with waypoints
  const drawRouteUsingDirections = (origin, waypoints, destination) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) {
      console.warn('[Directions] Services not initialized yet');
      return;
    }

    console.log('[Directions] Requesting route with', waypoints.length, 'waypoints');
    console.log('[Directions] From', origin, 'to', destination);

    directionsServiceRef.current.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false, // Keep stops in order
      },
      (result, status) => {
        if (status === "OK") {
          console.log('[Directions] Route received successfully');
          directionsRendererRef.current.setDirections(result);
          
          // Fit map to show the entire route
          const bounds = result.routes[0].bounds;
          mapInstanceRef.current.fitBounds(bounds);
        } else {
          console.error('[Directions] Request failed:', status);
          console.error('Origin:', origin, 'Waypoints:', waypoints.length, 'Destination:', destination);
        }
      }
    );
  };

  // Render stop markers on the map
  const renderStopMarkers = (stops) => {
    if (!mapInstanceRef.current || !stops.length) return;

    // Clear existing stop markers
    stopMarkersRef.current.forEach(marker => marker.setMap(null));
    stopMarkersRef.current = [];

    console.log('[Stop Markers] Rendering', stops.length, 'markers');

    stops.forEach((stop, index) => {
      const isFirst = index === 0;
      const isLast = index === stops.length - 1;

      // Color coding: Green for start, Red for destination, Blue for intermediate
      let markerColor = '#2196F3'; // Blue for intermediate stops
      let label = String(index + 1);

      if (isFirst) {
        markerColor = '#4CAF50'; // Green for start
        label = 'S';
      } else if (isLast) {
        markerColor = '#F44336'; // Red for destination
        label = 'D';
      }

      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map: mapInstanceRef.current,
        title: stop.name || `Stop ${index + 1}`,
        label: {
          text: label,
          color: 'white',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        zIndex: isFirst || isLast ? 3 : 2, // Start/Dest higher than intermediate
      });

      stopMarkersRef.current.push(marker);
    });

    console.log('[Stop Markers] Rendered', stopMarkersRef.current.length, 'markers');
  };

  // 4. Update Marker Helper
  const updateMarker = async (location) => {
    if (!mapInstanceRef.current || !window.google) return;

    const pos = { lat: location.lat, lng: location.lng };
    
    if (!markerRef.current) {
       mapInstanceRef.current.setCenter(pos);
       
       // Custom yellow bus icon image
       const busIcon = {
         url: '/bus-icon.png', // Yellow bus top-down view (transparent background)
         scaledSize: new google.maps.Size(60, 60), // Larger size for better visibility
         anchor: new google.maps.Point(30, 30), // Center point (half of size)
         rotation: location.heading || 0, // Rotate based on bus heading if available
       };

       markerRef.current = new google.maps.Marker({
         position: pos,
         map: mapInstanceRef.current,
         title: busId,
         icon: busIcon,
         zIndex: 10, // Ensure bus marker is above all stop markers
         optimized: false, // Required for rotation
       });
    } else {
      markerRef.current.setPosition(pos);
      
      // Update rotation if heading changes
      if (location.heading !== undefined && markerRef.current.getIcon()) {
        const currentIcon = markerRef.current.getIcon();
        currentIcon.rotation = location.heading;
        markerRef.current.setIcon(currentIcon);
      }
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
          {eta === null && 'ETA: Calculating...'}
          {eta === 'Calculating...' && 'ETA: Calculating...'}
          {eta === 'Arrived' && '🟢 ETA: Arrived'}
          {typeof eta === 'number' && `ETA: ${eta} mins`}
        </p>
        {/* Occupancy Status Badge */}
        {occupancyStatus && OCCUPANCY_DISPLAY[occupancyStatus] && (() => {
          const { emoji, label, color } = OCCUPANCY_DISPLAY[occupancyStatus];
          return (
            <p style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: color + '22',
              border: `1.5px solid ${color}`,
              color: color,
              fontWeight: '700',
              fontSize: '0.9rem',
            }}>
              {emoji} {label}
            </p>
          );
        })()}
        <p className="route-info">Route ID: {routeId || "None Selected"}</p>
      </div>
    </div>
  );
};

export default Passenger;
