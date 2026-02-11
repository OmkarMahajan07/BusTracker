import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Bus, MapPin } from "lucide-react";
import vvceLogo from "../assets/vvce.jpeg";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white">
      {/* Decorative glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-yellow-300/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center min-h-screen">
        {/* Left: Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.img
              src={vvceLogo}
              alt="VVCE"
              className="w-20 h-20 rounded-lg drop-shadow-2xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">VVCE Bus Tracker</h1>
              <p className="text-blue-200 text-sm md:text-base">Vidyavardhaka College of Engineering, Mysuru</p>

            </div>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Track Your College Bus
            <span className="block text-yellow-300">In Real Time</span>
          </h2>
          <p className="text-blue-100 text-base md:text-lg max-w-xl mb-8">
            Smart, live GPS tracking for students and drivers. Know when your bus
            arrives, plan your day better, and travel stress-free.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/student-login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 font-semibold text-white"
              >
                <User className="w-5 h-5" /> Student Login
              </motion.button>
            </Link>

            <Link to="/driver-login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-green-500/30 font-semibold text-white"
              >
                <Bus className="w-5 h-5" /> Driver Login
              </motion.button>
            </Link>

            <Link to="/map">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-colors text-white"
              >
                <MapPin className="w-5 h-5" /> Live Map
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Right: Feature Cards */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {[{
            title: "Live GPS",
            desc: "See buses moving on the map in real time.",
          },{
            title: "Smart ETA",
            desc: "Know exactly when your bus arrives.",
          },{
            title: "Student Friendly",
            desc: "Choose boarding & destination stops.",
          },{
            title: "Driver Panel",
            desc: "One-tap auto tracking for drivers.",
          }].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-5 bg-white/10 backdrop-blur border border-white/20 shadow-xl"
            >
              <h3 className="font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-blue-100">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  );
}
