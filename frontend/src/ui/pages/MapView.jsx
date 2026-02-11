import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import vvceLogo from "../assets/vvce.jpeg";

// Fix Leaflet icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView() {
  const [buses, setBuses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [routeStops, setRouteStops] = useState([]);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch("/api/buses");
        const data = await res.json();
        setBuses(data);
      } catch (err) {
        console.error("Failed to fetch buses", err);
      }
    };

    const fetchRoute = async () => {
      try {
        const r = await fetch("/api/routes");
        const data = await r.json();
        // Using the first (and only) route
        setRouteStops(data[0]?.stops || []);
      } catch (e) {
        console.error("Failed to fetch routes", e);
      }
    };

    fetchBuses();
    fetchRoute();
    const interval = setInterval(fetchBuses, 3000);
    return () => clearInterval(interval);
  }, []);

  const routePositions = routeStops.map((s) => [s.lat, s.lng]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white relative">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3">
        <motion.img
          src={vvceLogo}
          alt="VVCE"
          className="w-10 h-10"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div>
          <h2 className="text-2xl font-extrabold">Live Bus Map</h2>
          <p className="text-blue-200 text-sm">Real-time positions</p>
        </div>
      </div>

      <div className="relative h-[70vh] mx-6 mb-6 rounded-2xl overflow-hidden shadow-2xl">
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route Line */}
          {routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: "#facc15", weight: 5, opacity: 0.9 }}
            />
          )}

          {/* Route Stop Markers */}
          {routeStops.map((s) => (
            <Marker key={`stop-${s.id}`} position={[s.lat, s.lng]}>
              <Popup>{s.name}</Popup>
            </Marker>
          ))}

          {/* Buses */}
          {buses.map((bus) => (
            <Marker
              key={bus.id}
              position={[bus.lat, bus.lng]}
              eventHandlers={{ click: () => setSelected(bus) }}
            >
              <Popup>
                <strong>{bus.name}</strong>
                <br />
                Speed: {bus.speed || 30} km/h
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Info Card */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 rounded-2xl p-5 bg-white/10 backdrop-blur border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">{selected.name}</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-blue-200 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-blue-100 text-sm">Lat: {selected.lat.toFixed(5)}</p>
              <p className="text-blue-100 text-sm">Lng: {selected.lng.toFixed(5)}</p>
              <p className="text-blue-100 text-sm mt-1">Speed: {selected.speed || 30} km/h</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Stats */}
      <div className="px-6 pb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 bg-white/10 backdrop-blur border border-white/20">
          <p className="text-blue-200 text-sm">Active Buses</p>
          <p className="text-3xl font-black">{buses.length}</p>
        </div>
        <div className="rounded-2xl p-4 bg-white/10 backdrop-blur border border-white/20">
          <p className="text-blue-200 text-sm">Stops</p>
          <p className="text-3xl font-black">{routeStops.length}</p>
        </div>
        <div className="rounded-2xl p-4 bg-white/10 backdrop-blur border border-white/20">
          <p className="text-blue-200 text-sm">Route</p>
          <p className="text-lg font-semibold">College → City</p>
        </div>
        <div className="rounded-2xl p-4 bg-white/10 backdrop-blur border border-white/20">
          <p className="text-blue-200 text-sm">Refresh</p>
          <p className="text-lg font-semibold">Every 3s</p>
        </div>
      </div>
    </div>
  );
}
