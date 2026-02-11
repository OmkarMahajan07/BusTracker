import { useRef, useState } from "react";
import { motion } from "framer-motion";
import vvceLogo from "../assets/vvce.jpeg";

export default function DriverPanel() {
  const busId = Number(localStorage.getItem("busId"));
  const watchIdRef = useRef(null);
  const [tracking, setTracking] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [error, setError] = useState("");

  const startTracking = () => {
    if (!navigator.geolocation) {
      return alert("Geolocation not supported on this device");
    }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords;

        try {
          await fetch("/api/driver/update-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              busId,
              lat: latitude,
              lng: longitude,
              speed: speed || 30,
            }),
          });
          setLastSent(new Date());
          setError("");
        } catch (e) {
          setError("Failed to send location");
        }
      },
      (err) => setError(err.message),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    watchIdRef.current = id;
    setTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setTracking(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.img
            src={vvceLogo}
            alt="VVCE"
            className="w-12 h-12"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <div>
            <h2 className="text-3xl font-extrabold">Driver Panel</h2>
            <p className="text-blue-200">Bus ID: {busId}</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/20 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Tracking Status</h3>
            <p className={`text-2xl font-bold ${tracking ? "text-emerald-300" : "text-red-300"}`}>
              {tracking ? "ACTIVE" : "INACTIVE"}
            </p>
            <p className="text-blue-100 mt-2">
              {lastSent
                ? `Last sent: ${lastSent.toLocaleTimeString()}`
                : "No data sent yet"}
            </p>
            {error && <p className="text-red-300 mt-2">{error}</p>}
          </div>

          <div className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/20 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Instructions</h3>
            <ul className="text-blue-100 space-y-2 list-disc pl-5">
              <li>Enable GPS on your phone.</li>
              <li>Press Start before leaving the depot.</li>
              <li>Keep the app open during the trip.</li>
              <li>Press Stop after completing the route.</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          {!tracking ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={startTracking}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-green-500/30 text-xl font-bold"
            >
              Start Auto Tracking
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={stopTracking}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/30 text-xl font-bold"
            >
              Stop Tracking
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
