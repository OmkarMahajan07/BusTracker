import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, MapPin, Clock, ChevronRight, CheckCircle } from "lucide-react";
import vvceLogo from "../assets/vvce.jpeg";

const BUS_OPTIONS = [
  {
    id: "BUS-101",
    number: "101",
    color: "purple",
    startLocation: "City Bus Stand",
    stopLocation: "VVCE College",
    travelTime: "7:30 AM – 8:00 AM",
    routeName: "City Bus Stand → VVCE College",
    stops: [
      "Mysuru City Bus Stand",
      "KR Circle, Mysuru",
      "Kuvempunagar, Mysuru",
      "Vontikoppal Circle, Mysuru",
      "Gokulam 3rd Stage, Mysuru",
      "VVCE Boys Hostel",
      "VVCE College, Mysuru",
    ],
  },
  {
    id: "BUS-102",
    number: "102",
    color: "blue",
    startLocation: "VVCE College",
    stopLocation: "City Bus Stand",
    travelTime: "4:00 PM – 4:30 PM",
    routeName: "VVCE College → City Bus Stand",
    stops: [
      "VVCE College, Mysuru",
      "VVCE Boys Hostel",
      "Gokulam 3rd Stage, Mysuru",
      "Vontikoppal Circle, Mysuru",
      "Kuvempunagar, Mysuru",
      "KR Circle, Mysuru",
      "Mysuru City Bus Stand",
    ],
  },
  {
    id: "BUS-103",
    number: "103",
    color: "emerald",
    startLocation: "VVCE College",
    stopLocation: "City Bus Stand",
    travelTime: "4:30 PM – 5:00 PM",
    routeName: "VVCE College → City Bus Stand (Evening)",
    stops: [
      "VVCE College, Mysuru",
      "VVCE Boys Hostel",
      "Gokulam 3rd Stage, Mysuru",
      "Vontikoppal Circle, Mysuru",
      "Kuvempunagar, Mysuru",
      "KR Circle, Mysuru",
      "Mysuru City Bus Stand",
    ],
  },
];

const COLOR_MAP = {
  purple:  { gradient: "from-purple-500 to-purple-700",   ring: "ring-purple-500/60",  border: "border-purple-500/50",  bg: "bg-purple-500/20"  },
  blue:    { gradient: "from-blue-500 to-blue-700",       ring: "ring-blue-500/60",    border: "border-blue-500/50",    bg: "bg-blue-500/20"    },
  emerald: { gradient: "from-emerald-500 to-emerald-700", ring: "ring-emerald-500/60", border: "border-emerald-500/50", bg: "bg-emerald-500/20" },
};

export default function DriverSetup() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (!selected) return;
    localStorage.setItem("driverSelectedBus", selected.id);
    navigate("/driver");
  };

  const bus = BUS_OPTIONS.find((b) => b.id === selected?.id) || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-[#0b1b3a]/90 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <motion.img
            src={vvceLogo}
            alt="VVCE"
            className="w-9 h-9 rounded-lg drop-shadow-xl flex-shrink-0"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <div>
            <h1 className="text-base font-extrabold text-white leading-tight">Select Your Bus</h1>
            <p className="text-blue-200 text-xs">Tap a bus to see route details</p>
          </div>
        </div>
      </div>

      {/* Scrollable content — pb-32 leaves room for the sticky confirm button */}
      <div className="max-w-xl mx-auto px-4 pt-4 pb-36 space-y-4">
        {/* Bus Selection Cards */}
        {BUS_OPTIONS.map((bus, index) => {
          const c = COLOR_MAP[bus.color];
          const isSelected = selected?.id === bus.id;

          return (
            <motion.div
              key={bus.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.07 }}
              onClick={() => setSelected(bus)}
              className={`cursor-pointer rounded-2xl p-4 backdrop-blur border-2 transition-all duration-200 shadow-lg active:scale-[0.98]
                ${isSelected
                  ? `${c.bg} ${c.border} ring-2 ${c.ring}`
                  : "bg-white/10 border-white/20"
                }`}
            >
              {/* Top row: Bus number + check */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                    <Bus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200">Bus Number</p>
                    <p className="text-2xl font-black text-white leading-tight">{bus.number}</p>
                  </div>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <CheckCircle className="w-7 h-7 text-green-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Route info - stacked on mobile */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span className="text-blue-200 text-xs">From</span>
                  <span className="text-white font-medium text-xs">{bus.startLocation}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="text-blue-200 text-xs">To</span>
                  <span className="text-white font-medium text-xs">{bus.stopLocation}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                  <span className="text-white font-medium text-xs">{bus.travelTime}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Route stop timeline — expands below on selection */}
        <AnimatePresence>
          {bus && (
            <motion.div
              key={bus.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
              className="rounded-2xl p-4 bg-white/10 backdrop-blur border border-white/20 shadow-lg"
            >
              <h3 className="font-bold text-sm text-white mb-3">Route Stops</h3>
              <div className="space-y-2">
                {bus.stops.map((stop, i) => {
                  const isFirst = i === 0;
                  const isLast = i === bus.stops.length - 1;
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs
                          ${isFirst ? "bg-green-500/30 text-green-300 border-2 border-green-500"
                          : isLast  ? "bg-red-500/30 text-red-300 border-2 border-red-500"
                          :           "bg-blue-500/30 text-blue-300 border-2 border-blue-500"}`}
                        >
                          {isFirst ? "S" : isLast ? "E" : i}
                        </div>
                        {i < bus.stops.length - 1 && <div className="w-0.5 h-5 bg-white/20 mt-0.5" />}
                      </div>
                      <p className="text-sm text-white pt-0.5">{stop}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom confirm button */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-[#0a1225] via-[#0a1225]/95 to-transparent pt-8">
        <motion.button
          whileTap={{ scale: selected ? 0.97 : 1 }}
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full max-w-xl mx-auto block py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {selected ? `Start Driving Bus ${selected.number} →` : "Select a bus above"}
        </motion.button>
      </div>
    </div>
  );
}
