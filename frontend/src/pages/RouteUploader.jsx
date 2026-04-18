import React, { useState } from 'react';
import { uploadRoutesToFirebase } from '../utils/firebaseRoutes';
import { motion } from 'framer-motion';

export default function RouteUploader() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    setStatus('Uploading routes to Firebase...');
    
    const result = await uploadRoutesToFirebase();
    
    if (result.success) {
      setStatus('✅ Routes uploaded successfully! You can now remove this component.');
    } else {
      setStatus(`❌ Error: ${result.error?.message || 'Unknown error'}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1b3a] via-[#102a5c] to-[#0a1225] text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-2xl p-8 bg-white/10 backdrop-blur border border-white/20 shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-4">Upload Routes to Firebase</h2>
        <p className="text-blue-200 mb-6">
          Click the button below to upload routes for Bus-9912, Bus-9915, and Bus-9918 to your Firebase Realtime Database.
        </p>
        
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? 'Uploading...' : 'Upload Routes'}
        </button>
        
        {status && (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm">{status}</p>
          </div>
        )}

        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-200">
            <strong>Note:</strong> This will create routes at:
          </p>
          <ul className="text-xs text-blue-200 mt-2 space-y-1">
            <li>• /routes/sub_urban_to_vvce_9912 (Bus-9912 Morning)</li>
            <li>• /routes/sub_urban_to_vvce_9915 (Bus-9915 Morning)</li>
            <li>• /routes/sub_urban_to_vvce_9918 (Bus-9918 Morning)</li>
            <li>• /routes/vvce_to_sub_urban_9912 (Bus-9912 Evening)</li>
            <li>• /routes/vvce_to_sub_urban_9915 (Bus-9915 Evening)</li>
            <li>• /routes/vvce_to_sub_urban_9918 (Bus-9918 Evening)</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
