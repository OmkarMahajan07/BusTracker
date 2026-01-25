import React, { useState } from 'react';
import './Driver.css';

const Driver = () => {
  const [isTracking, setIsTracking] = useState(false);
  const busId = "BUS-101"; // Mocked for now

  const toggleTracking = () => {
    setIsTracking((prev) => !prev);
  };

  return (
    <div className="driver-container">
      <div className="driver-header">
        <h1>Driver Console</h1>
        <div className="bus-id">ID: {busId}</div>
      </div>

      <div className="status-ring-container">
        <div className={`status-ring ${isTracking ? 'active' : 'inactive'}`}></div>
        <div className="status-text">
          {isTracking ? "ONLINE" : "OFFLINE"}
        </div>
      </div>

      <div className="controls">
        <button 
          className={`toggle-btn ${isTracking ? 'stop' : 'start'}`}
          onClick={toggleTracking}
        >
          {isTracking ? "Stop Trip" : "Start Trip"}
        </button>
      </div>
    </div>
  );
};

export default Driver;
