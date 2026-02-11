import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bus, MapPin, Clock, Users, Navigation } from "lucide-react";
import vvceLogo from "../assets/vvce.jpeg";

export default function BusDashboard() {
  const { busNumber } = useParams();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  
  const [mapError, setMapError] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Demo bus data
  const busData = {
    "101": {
      number: "101",
      startLocation: "City Bus Stand",
      stopLocation: "VVCE College",
      travelTime: "7:30 AM - 8:00 AM",
      status: "Active",
      currentStop: 2,
      stops: [
        { id: 1, name: "City Bus Stand", time: "7:30 AM", status: "completed", lat: 12.2958, lng: 76.6394 },
        { id: 2, name: "KR Circle", time: "7:40 AM", status: "current", lat: 12.3052, lng: 76.6551 },
        { id: 3, name: "Vontikoppal", time: "7:50 AM", status: "upcoming", lat: 12.3204, lng: 76.6481 },
        { id: 4, name: "VVCE Boys Hostel", time: "7:55 AM", status: "upcoming", lat: 12.3410, lng: 76.6380 },
        { id: 5, name: "VVCE College", time: "8:00 AM", status: "upcoming", lat: 12.3525, lng: 76.6186 }
      ],
      busLocation: { lat: 12.3052, lng: 76.6551 }, // Current location at KR Circle
      passengers: 32,
      refresh: "Every 3s"
    },
    "102": {
      number: "102",
      startLocation: "VVCE College",
      stopLocation: "City Bus Stand",
      travelTime: "4:00 PM - 4:30 PM",
      status: "Active",
      currentStop: 1,
      stops: [
        { id: 1, name: "VVCE College", time: "4:00 PM", status: "current", lat: 12.3525, lng: 76.6186 },
        { id: 2, name: "VVCE Boys Hostel", time: "4:05 PM", status: "upcoming", lat: 12.3410, lng: 76.6380 },
        { id: 3, name: "Vontikoppal", time: "4:15 PM", status: "upcoming", lat: 12.3204, lng: 76.6481 },
        { id: 4, name: "KR Circle", time: "4:25 PM", status: "upcoming", lat: 12.3052, lng: 76.6551 },
        { id: 5, name: "City Bus Stand", time: "4:30 PM", status: "upcoming", lat: 12.2958, lng: 76.6394 }
      ],
      busLocation: { lat: 12.3525, lng: 76.6186 },
      passengers: 28,
      refresh: "Every 3s"
    },
    "103": {
      number: "103",
      startLocation: "VVCE College",
      stopLocation: "City Bus Stand",
      travelTime: "4:30 PM - 5:00 PM",
      status: "Active",
      currentStop: 3,
      stops: [
        { id: 1, name: "VVCE College", time: "4:30 PM", status: "completed", lat: 12.3525, lng: 76.6186 },
        { id: 2, name: "VVCE Boys Hostel", time: "4:35 PM", status: "completed", lat: 12.3410, lng: 76.6380 },
        { id: 3, name: "Vontikoppal", time: "4:45 PM", status: "current", lat: 12.3204, lng: 76.6481 },
        { id: 4, name: "KR Circle", time: "4:55 PM", status: "upcoming", lat: 12.3052, lng: 76.6551 },
        { id: 5, name: "City Bus Stand", time: "5:00 PM", status: "upcoming", lat: 12.2958, lng: 76.6394 }
      ],
      busLocation: { lat: 12.3204, lng: 76.6481 },
      passengers: 25,
      refresh: "Every 3s"
    }
  };

  const bus = busData[busNumber] || busData["101"];

  // Load Google Maps Script
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

  // Initialize Map
  const initMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const { Map } = await window.google.maps.importLibrary("maps");
      
      mapInstanceRef.current = new Map(mapRef.current, {
        center: bus.busLocation,
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
      
      // Render stops and route
      renderStopMarkers();
      drawRoute();
      updateBusMarker();
      
    } catch (err) {
      console.error("Map Init Error:", err);
      setMapError("Failed to initialize map");
    }
  };

  // Render stop markers
  const renderStopMarkers = () => {
    if (!mapInstanceRef.current || !bus.stops.length) return;

    // Clear existing markers
    stopMarkersRef.current.forEach(marker => marker.setMap(null));
    stopMarkersRef.current = [];

    bus.stops.forEach((stop, index) => {
      const isFirst = index === 0;
      const isLast = index === bus.stops.length - 1;

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
    if (!directionsServiceRef.current || !bus.stops.length) return;

    const origin = { lat: bus.stops[0].lat, lng: bus.stops[0].lng };
    const destination = { lat: bus.stops[bus.stops.length - 1].lat, lng: bus.stops[bus.stops.length - 1].lng };
    
    const waypoints = bus.stops.slice(1, -1).map(stop => ({
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

  // Update bus marker
  const updateBusMarker = () => {
    if (!mapInstanceRef.current || !bus.busLocation) return;

    const pos = bus.busLocation;

    if (!markerRef.current) {
      const busIcon = {
        url: '/bus-icon.png',
        scaledSize: new google.maps.Size(50, 50),
        anchor: new google.maps.Point(25, 25),
      };

      markerRef.current = new google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: `Bus ${bus.number}`,
        icon: busIcon,
        zIndex: 10,
      });
    } else {
      markerRef.current.setPosition(pos);
    }
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
              <h1 className="text-2xl font-extrabold">Bus {bus.number} Tracking</h1>
              <p className="text-blue-200 text-sm">Live Route Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 font-semibold text-sm">{bus.status}</span>
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
                <div className="mb-3">
                  <p className="text-xs text-blue-200 mb-1">Route</p>
                  <p className="text-base font-bold">
                    {bus.startLocation} → {bus.stopLocation}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-blue-200">Travel Time</p>
                    <p className="text-sm font-semibold">{bus.travelTime}</p>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-400" />
                Route Stops
              </h2>
              
              <div className="space-y-4">
                {bus.stops.map((stop, index) => (
                  <div key={stop.id} className="flex gap-4 items-start">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                        ${stop.status === 'completed' ? 'bg-green-500/30 text-green-300 border-2 border-green-500' :
                          stop.status === 'current' ? 'bg-blue-500 text-white border-2 border-blue-300 animate-pulse' :
                          'bg-white/10 text-gray-400 border-2 border-white/20'}`}
                      >
                        {stop.status === 'completed' ? '✓' : 
                         stop.status === 'current' ? '●' :
                         index + 1}
                      </div>
                      {index < bus.stops.length - 1 && (
                        <div className={`w-0.5 h-12 ${stop.status === 'completed' ? 'bg-green-500/50' : 'bg-white/20'}`} />
                      )}
                    </div>

                    {/* Stop info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold ${stop.status === 'current' ? 'text-yellow-300' : 'text-white'}`}>
                          {stop.name}
                        </p>
                        {stop.status === 'current' && (
                          <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-semibold">
                            Next Stop
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-200 mt-1">{stop.time}</p>
                      {stop.status === 'completed' && (
                        <p className="text-xs text-green-400 mt-1">On time</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                <p className="text-2xl font-black">{bus.number}</p>
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
                <p className="text-2xl font-black">{bus.stops.length}</p>
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
                <p className="text-2xl font-black">{bus.passengers}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-xl p-4 bg-white/10 backdrop-blur border border-white/20 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <p className="text-xs text-blue-200">Update Rate</p>
                </div>
                <p className="text-xl font-black">{bus.refresh}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
