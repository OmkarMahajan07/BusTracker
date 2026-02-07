import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import './RouteList.css'; // We'll create a basic CSS file for it too

const RouteList = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const routesRef = ref(db, 'routes');
    
    // Listen for routes data
    const unsubscribe = onValue(routesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array: { routeA: {...}, routeB: {...} } -> [{id: 'routeA', ...}, ...]
        const routesArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setRoutes(routesArray);
      } else {
        setRoutes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRouteSelect = (routeId) => {
    navigate(`/passenger?route=${routeId}`);
  };

  if (loading) {
    return <div className="route-list-container">Loading routes...</div>;
  }

  return (
    <div className="route-list-container">
      <h1>Select a Route</h1>
      <div className="routes-grid">
        {routes.length === 0 ? (
          <p>No active routes found.</p>
        ) : (
          routes.map((route) => (
            <div 
              key={route.id} 
              className="route-card"
              onClick={() => handleRouteSelect(route.id)}
            >
              <h2>{route.name || "Unnamed Route"}</h2>
              {route.busId && <span className="bus-badge">Bus: {route.busId}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RouteList;
