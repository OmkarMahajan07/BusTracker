import { motion } from "framer-motion";
import { Bus, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import vvceLogo from "../assets/vvce.jpeg";

export default function BusesDashboard() {
  const buses = [
   {
      number: "101",
      startLocation: "City Bus Stand",
      stopLocation: "VVCE College",
      travelTime: "7:30 AM - 8:00 AM",
      status: "Active",
      color: "purple"
    },{
      number: "102",
      startLocation: "VVCE College",
      stopLocation: "City Bus Stand",
      travelTime: "4:00 PM - 4:30 PM",
      status: "Active",
      color: "blue"
    },
    {
      number: "103",
      startLocation: "VVCE College",
      stopLocation: "City Bus Stand",
      travelTime: "4:30 PM - 5:00 PM",
      status: "Active",
      color: "emerald"
    },
    
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-10"
        >
          <motion.img
            src={vvceLogo}
            alt="VVCE"
            className="w-14 h-14 rounded-lg drop-shadow-xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">VVCE Buses</h1>
            <p className="text-blue-200">Available bus routes and schedules</p>
          </div>
        </motion.div>

        {/* Bus Cards */}
        <div>
          {buses.map((bus, index) => (
            <Link key={bus.number} to={`/bus/${bus.number}`} className="block mb-8 last:mb-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all cursor-pointer"
              >
              <div className="flex items-center justify-between gap-6">
                {/* Bus Number */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-${bus.color}-500 to-${bus.color}-700 flex items-center justify-center shadow-lg`}>
                    <Bus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-200 mb-1">Bus Number</p>
                    <p className="text-3xl font-black">{bus.number}</p>
                  </div>
                </div>

                {/* Start Location */}
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-blue-200 mb-1">Start Location</p>
                    <p className="text-lg font-semibold">{bus.startLocation}</p>
                  </div>
                </div>

                {/* Stop Location */}
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-xs text-blue-200 mb-1">Stop Location</p>
                    <p className="text-lg font-semibold">{bus.stopLocation}</p>
                  </div>
                </div>

                {/* Travel Time */}
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-xs text-blue-200 mb-1">Travel Time</p>
                    <p className="text-lg font-semibold">{bus.travelTime}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <span className="px-4 py-2 rounded-full bg-green-500/20 text-green-300 text-sm font-semibold border border-green-500/30">
                    {bus.status}
                  </span>
                </div>
              </div>
            </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
