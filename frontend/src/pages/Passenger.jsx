import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import './Passenger.css';

const Passenger = () => {
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('route');
  const [busLocation, setBusLocation] = useState(null);
  const [error, setError] = useState(null);

  // Requirement: Resolve busId. For now, we assume simple mapping or hardcoded for demo as per task scope.
  // In a real app, we would fetch route details to get the assigned bus.
  // Project instructions say: buses/BUS-101/location is written by driver.
  const busId = "BUS-101"; // Hardcoded for Task 17 as per "Resolve busId (hardcoded or mapped for now)"

  useEffect(() => {
    if (!busId) return;

    const locationRef = ref(db, `buses/${busId}/location`);

    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBusLocation(data);
        // Requirement [5.2]: Store location as { lat, lng, speed, updatedAt } - which is what we get
      } else {
        // Handle no data or trip not started
      }
    }, (error) => {
      console.error("Location subscription error:", error);
      setError("Failed to track bus.");
    });

    return () => {
      // Requirement [5.3]: Cleanup Listener
      unsubscribe();
    };
  }, [busId]);

  return (
    <div className="passenger-container">
      {/* 4.1 Map Container (Full Screen) */}
      <div className="passenger-map-container">
        {/* Placeholder for Task 17/18 */}
        <p>Map will be rendered here.</p>
        {busLocation && (
          <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#555', textAlign: 'center' }}>
            <p>Live Debug Data:</p>
            <p>Lat: {busLocation.lat}</p>
            <p>Lng: {busLocation.lng}</p>
            <p>Speed: {busLocation.speed !== undefined ? busLocation.speed : 'N/A'}</p>
            <p>Updated: {new Date(busLocation.updatedAt).toLocaleTimeString()}</p>
          </div>
        )}
      </div>

      {/* 4.2 Bottom Info Card */}
      <div className="info-card">
        <h2>Bus: {busId}</h2>
        <p className="eta-text">ETA: Calculating...</p>
        <p className="route-info">Route ID: {routeId || "None Selected"}</p>
        {error && <p style={{ color: 'red', fontSize: '0.8rem' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Passenger;
