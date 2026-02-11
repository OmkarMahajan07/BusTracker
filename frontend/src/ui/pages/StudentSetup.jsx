import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import vvceLogo from "../assets/vvce.jpeg";

export default function StudentSetup() {
  const [stops, setStops] = useState([]);
  const [boarding, setBoarding] = useState("");
  const [destination, setDestination] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/routes")
      .then((r) => r.json())
      .then((data) => setStops(data[0].stops));
  }, []);

  const save = () => {
    if (!boarding || !destination) {
      return alert("Select both boarding and destination");
    }

    localStorage.setItem(
      "studentPref",
      JSON.stringify({
        boarding: Number(boarding),
        destination: Number(destination),
      })
    );

    navigate("/student-dashboard");
  };

  const selectClass =
    "w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 " +
    "text-white outline-none focus:ring-2 focus:ring-blue-400 " +
    "appearance-none";

  const optionClass = "text-black bg-white";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg rounded-3xl p-8 bg-white/10 backdrop-blur border border-white/20 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <motion.img
            src={vvceLogo}
            alt="VVCE"
            className="w-14 h-14 drop-shadow-xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <div>
            <h2 className="text-2xl font-extrabold">Student Setup</h2>
            <p className="text-blue-200 text-sm">Choose your bus stops</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-blue-200 mb-1">
              Boarding Stop
            </label>
            <select
              className={selectClass}
              value={boarding}
              onChange={(e) => setBoarding(e.target.value)}
            >
              <option value="" className={optionClass}>
                Select Boarding Stop
              </option>
              {stops.map((s) => (
                <option key={s.id} value={s.id} className={optionClass}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-blue-200 mb-1">
              Destination Stop
            </label>
            <select
              className={selectClass}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="" className={optionClass}>
                Select Destination Stop
              </option>
              {stops.map((s) => (
                <option key={s.id} value={s.id} className={optionClass}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={save}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 font-semibold"
          >
            Continue
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
