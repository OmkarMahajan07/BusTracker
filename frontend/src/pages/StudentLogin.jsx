import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../contexts/AuthContext";
import vvceLogo from "../assets/vvce.jpeg";

export default function StudentLogin() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccessMsg("");
  };

  const switchMode = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Client-side confirm-password check (signup only)
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        navigate("/student-setup");
      } else {
        await signup(email, password);
        // signup() signs the user out automatically after sending verification
        setSuccessMsg(
          "✅ Account created! A verification link has been sent to your VVCE email. Please verify before logging in."
        );
        resetForm();
        setMode("login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl p-8 bg-white/10 backdrop-blur border border-white/20 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.img
            src={vvceLogo}
            alt="VVCE"
            className="w-14 h-14 rounded-lg drop-shadow-xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              {mode === "login" ? "Student Login" : "Create Account"}
            </h2>
            <p className="text-blue-200 text-sm">VVCE Bus Tracking System</p>
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-white/20 mb-6">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
              mode === "login"
                ? "bg-blue-600 text-white shadow-inner"
                : "bg-white/5 text-blue-200 hover:bg-white/10"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
              mode === "signup"
                ? "bg-blue-600 text-white shadow-inner"
                : "bg-white/5 text-blue-200 hover:bg-white/10"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Success Banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm leading-relaxed"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs text-blue-200 mb-1 font-medium">
              College Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="yourname@vvce.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 transition"
            />
            <p className="text-xs text-blue-300/70 mt-1 pl-1">
              Only @vvce.ac.in addresses are accepted
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-blue-200 mb-1 font-medium">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "Min. 6 characters" : "Enter your password"}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 transition"
            />
          </div>

          {/* Confirm Password — signup only */}
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                key="confirm-password"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ overflow: "hidden" }}
              >
                <label className="block text-xs text-blue-200 mb-1 font-medium">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required={mode === "signup"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 transition"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 font-semibold disabled:opacity-60 text-white transition"
          >
            {loading
              ? mode === "login" ? "Signing in..." : "Creating account..."
              : mode === "login" ? "Login" : "Create Account"}
          </motion.button>
        </form>

        <p className="text-xs text-blue-300/60 mt-6 text-center">
          {mode === "login"
            ? "Don't have an account? Click Sign Up above."
            : "After signing up, verify your email before logging in."}
        </p>
      </motion.div>
    </div>
  );
}
