import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './Passenger.css';

const Passenger = () => {
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('route');

  return (
    <div className="passenger-container">
      {/* 4.1 Map Container (Full Screen) */}
      <div className="passenger-map-container">
        {/* Placeholder for Task 17/18 */}
        <p>Map will be rendered here.</p>
      </div>

      {/* 4.2 Bottom Info Card */}
      <div className="info-card">
        <h2>Bus: BUS-101</h2>
        <p className="eta-text">ETA: Calculating...</p>
        <p className="route-info">Route ID: {routeId || "None Selected"}</p>
      </div>
    </div>
  );
};

export default Passenger;
