import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import vvceLogo from "../assets/vvce.jpeg";

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function StudentDashboard() {
  const pref = JSON.parse(localStorage.getItem("studentPref"));
  const student = localStorage.getItem("studentUser");

  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    fetch("/api/routes")
      .then((r) => r.json())
      .then((data) => setStops(data[0].stops));

    const load = async () => {
      const r = await fetch("/api/buses");
      setBuses(await r.json());
    };

    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, []);

  if (!pref) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-white bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225]">
        <p>Please complete Student Setup first.</p>
      </div>
    );
  }

  if (stops.length === 0 || buses.length === 0) return null;

  const bus = buses[0];
  const board = stops.find((s) => s.id === pref.boarding);
  const dest = stops.find((s) => s.id === pref.destination);

  const d1 = getDistanceKm(bus.lat, bus.lng, board.lat, board.lng);
  const d2 = getDistanceKm(bus.lat, bus.lng, dest.lat, dest.lng);
  const speed = bus.speed || 30;

  const etaBoard = Math.max(1, Math.round((d1 / speed) * 60));
  const etaDest = Math.max(1, Math.round((d2 / speed) * 60));

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
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
            <h2 className="text-3xl font-extrabold">Welcome {student}</h2>
            <p className="text-blue-200">Your Bus Status</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/20 shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-2">Boarding Stop</h3>
            <p className="text-2xl font-bold text-yellow-300">{board.name}</p>
            <p className="mt-2 text-blue-100">Bus arrives in</p>
            <p className="text-3xl font-black mt-1">{etaBoard} min</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/20 shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-2">Destination</h3>
            <p className="text-2xl font-bold text-emerald-300">{dest.name}</p>
            <p className="mt-2 text-blue-100">Reach in</p>
            <p className="text-3xl font-black mt-1">{etaDest} min</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/20 shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-2">Bus Info</h3>
            <p className="text-blue-100">Bus: {bus.name}</p>
            <p className="text-blue-100 mt-1">Speed: {speed} km/h</p>
            <p className="text-blue-100 mt-1">
              Distance to you: {d1.toFixed(2)} km
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
