import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bus, MapPin, Clock, Users, Navigation, Wifi, WifiOff } from "lucide-react";
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { getRouteByBusId } from '../utils/firebaseRoutes';
import vvceLogo from "../assets/vvce.jpeg";

export default function BusDashboard() {
  const { busNumber } = useParams();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  
  const [busLocation, setBusLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Map busNumber to busId
  const busId = `BUS-${busNumber}`;
  const routeKey = getRouteByBusId(busId);

  // Demo passenger count (can be fetched from Firebase later)
  const passengerCount = {
    '101': 32,
    '102': 28,
    '103': 25
  }[busNumber] || 30;

  // 1. Subscribe to bus location from Firebase
  useEffect(() => {
    if (!busId) return;

    console.log(`[Bus ${busNumber}] Subscribing to location:`, `buses/${busId}/location`);
    const locationRef = ref(db, `buses/${busId}/location`);
    
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      console.log(`[Bus ${busNumber}] Location update:`, data);
      
      if (data && data.lat && data.lng) {
        setBusLocation({
          lat: data.lat,
          lng: data.lng,
          speed: data.speed,
          updatedAt: data.updatedAt
        });
        setLastUpdate(new Date(data.updatedAt));
        setIsOnline(true);
      } else {
        console.warn(`[Bus ${busNumber}] No location data available`);
        setIsOnline(false);
      }
    }, (error) => {
      console.error(`[Bus ${busNumber}] Firebase error:`, error);
      setIsOnline(false);
    });

    return () => unsubscribe();
  }, [busId, busNumber]);

  // 2. Subscribe to route data from Firebase
  useEffect(() => {
    if (!routeKey) {
      console.warn(`[Bus ${busNumber}] No route key found`);
      return;
    }

    console.log(`[Bus ${busNumber}] Fetching route:`, `routes/${routeKey}`);
    const routeRef = ref(db, `routes/${routeKey}`);
    
    const unsubscribe = onValue(routeRef, (snapshot) => {
      const data = snapshot.val();
      console.log(`[Bus ${busNumber}] Route data:`, data);
      
      if (data) {
        setRouteData(data);
        if (data.stops) {
          const stopsArray = Array.isArray(data.stops) 
            ? data.stops 
            : Object.values(data.stops);
          geocodeStops(stopsArray);
        }
      }
    });

    return () => unsubscribe();
  }, [routeKey, busNumber]);

  // 3. Geocode stop names to coordinates
  const geocodeStops = async (stops) => {
    if (!window.google || !window.google.maps) {
      console.warn('[Geocoding] Google Maps not loaded yet');
      return;
    }

    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();

    try {
      const geocodedStops = await Promise.all(
        stops.map(async (stop, index) => {
          // If coordinates already exist, use them
          if (stop.lat && stop.lng) {
            return { ...stop, index };
          }

          // Geocode the stop name
          if (stop.name) {
            try {
              const result = await new Promise((resolve, reject) => {
                geocoder.geocode({ address: stop.name }, (results, status) => {
                  if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                      ...stop,
                      lat: location.lat(),
                      lng: location.lng(),
                      index
                    });
                  } else {
                    console.error(`[Geocoding] Failed for ${stop.name}:`, status);
                    reject(new Error(`Geocoding failed: ${status}`));
                  }
                });
              });
              return result;
            } catch (error) {
              console.error(`[Geocoding] Error for ${stop.name}:`, error);
              return { ...stop, index }; // Return without coordinates
            }
          }
          
          return { ...stop, index };
        })
      );

      // Filter out stops without valid coordinates
      const validStops = geocodedStops.filter(stop => stop.lat && stop.lng);
      console.log(`[Geocoding] Successfully geocoded ${validStops.length}/${stops.length} stops`);
      setRouteStops(validStops);
    } catch (error) {
      console.error('[Geocoding] Error:', error);
      setMapError('Failed to geocode stops');
    } finally {
      setIsGeocoding(false);
    }
  };

  // 4. Load Google Maps Script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Missing Google Maps API Key");
      return;
    }

    const initBusMap = () => {
      initMap();
    };

    window.initBusMap = initBusMap;

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initBusMap&v=weekly&libraries=marker`;
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
      delete window.initBusMap;
      // Cleanup markers
      if (markerRef.current) markerRef.current.setMap(null);
      stopMarkersRef.current.forEach(marker => marker.setMap(null));
    };
  }, [GOOGLE_MAPS_API_KEY]);

  // 5. Initialize Map
  const initMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const { Map } = await window.google.maps.importLibrary("maps");
      
      // Default center (Mysuru area)
      const defaultCenter = { lat: 12.2958, lng: 76.6394 };
      
      mapInstanceRef.current = new Map(mapRef.current, {
        center: busLocation || defaultCenter,
        zoom: 13,
        mapId: "BUS_DASHBOARD_MAP",
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });

      // Initialize Directions API
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#3B82F6",
          strokeOpacity: 0.8,
          strokeWeight: 5,
        },
      });

      setIsMapReady(true);
      
    } catch (err) {
      console.error("Map Init Error:", err);
      setMapError("Failed to initialize map");
    }
  };

  // 6. Render stop markers when stops are ready
  useEffect(() => {
    if (!isMapReady || !routeStops.length) return;
    renderStopMarkers();
    drawRoute();
  }, [isMapReady, routeStops]);

  // 7. Update bus marker when location changes
  useEffect(() => {
    if (!isMapReady || !busLocation) return;
    updateBusMarker();
  }, [isMapReady, busLocation]);

  // Render stop markers
  const renderStopMarkers = () => {
    if (!mapInstanceRef.current || !routeStops.length) return;

    // Clear existing markers
    stopMarkersRef.current.forEach(marker => marker.setMap(null));
    stopMarkersRef.current = [];

    routeStops.forEach((stop, index) => {
      const isFirst = index === 0;
      const isLast = index === routeStops.length - 1;

      let markerColor = '#3B82F6'; // Blue
      let label = String(index + 1);

      if (isFirst) {
        markerColor = '#10B981'; // Green
        label = 'S';
      } else if (isLast) {
        markerColor = '#EF4444'; // Red
        label = 'E';
      }

      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map: mapInstanceRef.current,
        title: stop.name,
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
        zIndex: isFirst || isLast ? 3 : 2,
      });

      stopMarkersRef.current.push(marker);
    });
  };

  // Draw route using Directions API
  const drawRoute = () => {
    if (!directionsServiceRef.current || !routeStops.length || routeStops.length < 2) return;

    const origin = { lat: routeStops[0].lat, lng: routeStops[0].lng };
    const destination = { 
      lat: routeStops[routeStops.length - 1].lat, 
      lng: routeStops[routeStops.length - 1].lng 
    };
    
    const waypoints = routeStops.slice(1, -1).map(stop => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true,
    }));

    directionsServiceRef.current.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRendererRef.current.setDirections(result);
          
          // Fit map to route
          const bounds = result.routes[0].bounds;
          mapInstanceRef.current.fitBounds(bounds);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  };

  // Update bus marker with live location
  const updateBusMarker = () => {
    if (!mapInstanceRef.current || !busLocation) return;

    const pos = { lat: busLocation.lat, lng: busLocation.lng };

    if (!markerRef.current) {
      // Create new marker with bus icon
      markerRef.current = new google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: `Bus ${busNumber}`,
        icon: {
          url: '/bus-icon.png', // Bus icon from public folder
          scaledSize: new google.maps.Size(60, 60),
          anchor: new google.maps.Point(20, 20),
        },
        zIndex: 1000, // Always on top
        animation: google.maps.Animation.DROP,
      });
    } else {
      // Smooth transition to new position
      markerRef.current.setPosition(pos);
      mapInstanceRef.current.panTo(pos);
    }
  };

  // Format status based on location freshness
  const getStatus = () => {
    if (!lastUpdate) return { text: 'Waiting...', color: 'gray' };
    
    const age = Date.now() - lastUpdate.getTime();
    if (age < 10000) return { text: 'Active', color: 'green' }; // < 10s
    if (age < 60000) return { text: 'Recent', color: 'yellow' }; // < 1min
    return { text: 'Offline', color: 'red' };
  };

  const status = getStatus();

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
              <h1 className="text-2xl font-extrabold">Bus {busNumber} Tracking</h1>
              <p className="text-blue-200 text-sm">Live Route Monitoring</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
            status.color === 'green' ? 'bg-green-500/20 border-green-500/30' :
            status.color === 'yellow' ? 'bg-yellow-500/20 border-yellow-500/30' :
            status.color === 'red' ? 'bg-red-500/20 border-red-500/30' :
            'bg-gray-500/20 border-gray-500/30'
          }`}>
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="font-semibold text-sm">{status.text}</span>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Route Info + Stops Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/20 shadow-xl">
              {/* Route Info at Top */}
              <div className="mb-6 pb-6 border-b border-white/20">
                {routeData ? (
                  <>
                    <div className="mb-3">
                      <p className="text-xs text-blue-200 mb-1">Route</p>
                      <p className="text-base font-bold">{routeData.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <div>
                        <p className="text-xs text-blue-200">Bus ID</p>
                        <p className="text-sm font-semibold">{busId}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-400" />
                Route Stops
              </h2>
              
              {isGeocoding ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  <p className="text-sm text-blue-200 mt-2">Loading stops...</p>
                </div>
              ) : routeStops.length > 0 ? (
                <div className="space-y-4">
                  {routeStops.map((stop, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                          ${index === 0 ? 'bg-green-500/30 text-green-300 border-2 border-green-500' :
                            index === routeStops.length - 1 ? 'bg-red-500/30 text-red-300 border-2 border-red-500' :
                            'bg-blue-500/30 text-blue-300 border-2 border-blue-500'}`}
                        >
                          {index === 0 ? 'S' : index === routeStops.length - 1 ? 'E' : index + 1}
                        </div>
                        {index < routeStops.length - 1 && (
                          <div className="w-0.5 h-12 bg-white/20" />
                        )}
                      </div>

                      {/* Stop info */}
                      <div className="flex-1">
                        <p className="font-semibold text-white">{stop.name}</p>
                        <p className="text-xs text-blue-200 mt-1">
                          {index === 0 ? 'Starting point' : 
                           index === routeStops.length - 1 ? 'Final destination' :
                           `Stop ${index}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-blue-200">No stops available</p>
              )}
            </div>
          </motion.div>

          {/* Right: Map + Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl overflow-hidden bg-white/10 backdrop-blur border border-white/20 shadow-xl"
            >
              <div className="relative h-[500px]">
                {mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 z-10">
                    <p className="text-red-300">{mapError}</p>
                  </div>
                )}
                {!busLocation && !mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p className="text-blue-200">Waiting for bus location...</p>
                    </div>
                  </div>
                )}
                <div ref={mapRef} className="w-full h-full" />
              </div>
            </motion.div>

            {/* Bottom Info Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-xl p-4 bg-white/10 backdrop-blur border border-white/20 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Bus className="w-5 h-5 text-blue-400" />
                  <p className="text-xs text-blue-200">Bus Number</p>
                </div>
                <p className="text-2xl font-black">{busNumber}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-xl p-4 bg-white/10 backdrop-blur border border-white/20 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  <p className="text-xs text-blue-200">Total Stops</p>
                </div>
                <p className="text-2xl font-black">{routeStops.length}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="rounded-xl p-4 bg-white/10 backdrop-blur border border-white/20 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-yellow-400" />
                  <p className="text-xs text-blue-200">Passengers</p>
                </div>
                <p className="text-2xl font-black">{passengerCount}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-xl p-4 bg-white/10 backdrop-blur border border-white/20 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <p className="text-xs text-blue-200">Speed</p>
                </div>
                <p className="text-2xl font-black">
                  {busLocation?.speed 
                    ? `${Math.round(busLocation.speed * 3.6)} km/h` 
                    : '--'}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
