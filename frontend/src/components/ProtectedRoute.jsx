import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a nice spinner
  }

  if (!user) {
    // Redirect to login page, but save the current location they were trying to go to
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // MOCK ROLE LOGIC
  const userRole = user.email.toLowerCase().includes('driver') ? 'driver' : 'passenger';

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If user is authenticated but doesn't have the right role, redirect to their home
    return <Navigate to={`/${userRole}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
