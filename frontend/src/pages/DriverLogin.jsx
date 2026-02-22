import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bus, Lock, User } from "lucide-react";
import vvceLogo from "../assets/vvce.jpeg";

export default function DriverLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    if (!username.trim() || !password.trim()) {
      return alert("Enter Driver ID and Password");
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/driver-setup');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white flex flex-col items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm rounded-3xl p-7 bg-white/10 backdrop-blur border border-white/20 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <motion.img
            src={vvceLogo}
            alt="VVCE"
            className="w-14 h-14 rounded-xl drop-shadow-xl flex-shrink-0"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <div>
            <h2 className="text-xl font-extrabold text-white leading-tight">Driver Login</h2>
            <p className="text-blue-200 text-xs mt-0.5">VVCE Bus Tracking System</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Driver ID */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-300/60 outline-none focus:ring-2 focus:ring-emerald-400 text-base"
              placeholder="Driver ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
            <input
              type="password"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-300/60 outline-none focus:ring-2 focus:ring-emerald-400 text-base"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            onClick={login}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-green-500/30 font-bold text-lg disabled:opacity-60 text-white mt-2"
          >
            {loading ? "Signing in…" : "Login"}
          </motion.button>
        </div>

        <p className="text-xs text-blue-300/60 mt-6 text-center">
          Use the Driver ID provided by the transport office.
        </p>
      </motion.div>
    </div>
  );
}
