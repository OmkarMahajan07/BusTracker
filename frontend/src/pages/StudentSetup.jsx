import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Navigation } from "lucide-react";
import vvceLogo from "../assets/vvce.jpeg";

// ─── Glassmorphic custom dropdown ────────────────────────────────────────────
function GlassDropdown({ label, icon: Icon, iconColor, placeholder, value, onChange, options, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => String(o.id) === String(value));

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-semibold text-blue-200 mb-2 flex items-center gap-1.5">
        {Icon && <Icon className={`w-3.5 h-3.5 ${iconColor}`} />}
        {label}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`
          w-full flex items-center justify-between px-4 py-3.5 rounded-xl
          border text-left transition-all duration-200
          ${disabled
            ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
            : open
              ? "bg-white/20 border-blue-400/60 shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30"
              : "bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
          }
        `}
      >
        <span className={selected ? "text-white font-medium" : "text-white/40"}>
          {selected ? selected.name : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-4 h-4 ${open ? "text-blue-300" : "text-white/40"}`} />
        </motion.span>
      </button>

      {/* Glassmorphic dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute z-50 left-0 right-0 mt-2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(8, 20, 60, 0.97)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 8px 32px rgba(0,0,50,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {options.map((opt, idx) => {
              const isSelected = String(opt.id) === String(value);
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => { onChange(String(opt.id)); setOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left text-sm
                    transition-all duration-150 relative group
                    ${isSelected
                      ? "bg-blue-500/25 text-white font-semibold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {/* Left accent line for selected */}
                  {isSelected && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-r-full" />
                  )}

                  {/* Stop number badge */}
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-blue-500/30 text-blue-300 border border-blue-500/50">
                    {idx + 1}
                  </span>

                  <span>{opt.name}</span>

                  {isSelected && (
                    <span className="ml-auto text-blue-400 text-xs">✓</span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentSetup() {
  const [stops, setStops] = useState([]);
  const [boarding, setBoarding] = useState("");
  const [destination, setDestination] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/routes")
      .then((r) => r.json())
      .then((data) => setStops(data[0].stops))
      .catch(() => {
        // Fallback stops — matches the live Firebase route (Sub Urban → VVCE Mysuru)
        setStops([
          { id: 0, name: "Sub Urban" },
          { id: 1, name: "R Gate" },
          { id: 2, name: "Railway Station" },
          { id: 3, name: "Vontikoppal" },
          { id: 4, name: "VVCE College" },
        ]);
      });
  }, []);

  // Reset destination when boarding stop changes
  useEffect(() => {
    setDestination("");
  }, [boarding]);

  // All stops except the currently selected boarding stop
  const availableDestinations = stops.filter(s => String(s.id) !== String(boarding));

  const save = () => {
    if (boarding === "" || destination === "") {
      return alert("Select both starting location and destination");
    }

    localStorage.setItem(
      "studentPref",
      JSON.stringify({
        boarding:    Number(boarding),
        destination: Number(destination),
      })
    );

    navigate("/buses");
  };

  const isReady = boarding !== "" && destination !== "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg rounded-3xl p-8 bg-white/10 backdrop-blur border border-white/20 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <motion.img
            src={vvceLogo}
            alt="VVCE"
            className="w-14 h-14 rounded-lg drop-shadow-xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <div>
            <h2 className="text-2xl font-extrabold text-white">Student Setup</h2>
            <p className="text-blue-200 text-sm">Choose your bus stops</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Starting Location */}
          <GlassDropdown
            label="Starting Location"
            icon={MapPin}
            iconColor="text-green-400"
            placeholder="Select your boarding stop"
            value={boarding}
            onChange={setBoarding}
            options={stops}
          />

          {/* Destination */}
          <GlassDropdown
            label="Destination Stop"
            icon={Navigation}
            iconColor="text-red-400"
            placeholder={boarding !== "" ? "Select destination stop" : "Select boarding stop first"}
            value={destination}
            onChange={setDestination}
            options={availableDestinations}
            disabled={boarding === ""}
          />

          {/* Continue button */}
          <motion.button
            whileHover={isReady ? { scale: 1.03 } : {}}
            whileTap={isReady ? { scale: 0.97 } : {}}
            onClick={save}
            disabled={!isReady}
            className={`
              w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300
              ${isReady
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                : "bg-white/10 text-white/30 cursor-not-allowed"
              }
            `}
          >
            {isReady ? "Continue →" : "Select both stops to continue"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
