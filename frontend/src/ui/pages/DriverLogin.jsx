import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

    try {
      setLoading(true);
      const res = await fetch("/api/driver/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setLoading(false);
        return alert("Invalid Driver ID or Password");
      }

      const data = await res.json();
      localStorage.setItem("busId", data.busId);
      navigate("/driver-panel");
    } catch (e) {
      alert("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl p-8 bg-white/10 backdrop-blur border border-white/20 shadow-2xl"
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
            <h2 className="text-2xl font-extrabold">Driver Login</h2>
            <p className="text-blue-200 text-sm">VVCE Bus Tracking System</p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="Driver ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            onClick={login}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-green-500/30 font-semibold disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </motion.button>
        </div>

        <p className="text-xs text-blue-200 mt-6 text-center">
          Use the Driver ID provided by the transport office.
        </p>
      </motion.div>
    </div>
  );
}
