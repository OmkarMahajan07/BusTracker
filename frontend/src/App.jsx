import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from "./pages/Home";
import StudentLogin from "./pages/StudentLogin";
import StudentSetup from "./pages/StudentSetup";
import BusesDashboard from "./pages/BusesDashboard";
import DriverLogin from "./pages/DriverLogin";
import Login from "./components/Login";
import Driver from "./pages/Driver";
import Passenger from "./pages/Passenger";
import RouteList from "./pages/RouteList";
import { AuthContext } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  const getDashboardPath = (user) => {
    // Drivers go to /driver, Passengers go to /routes (to select a route first)
    return user.email && user.email.toLowerCase().includes('driver') ? '/driver' : '/routes';
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Home Route - Landing page, redirect to dashboard if already logged in */}
          <Route 
            path="/" 
            element={user ? <Navigate to={getDashboardPath(user)} replace /> : <Home />} 
          />

          {/* Login Routes */}
          <Route 
            path="/student-login" 
            element={!user ? <StudentLogin /> : <Navigate to="/routes" replace />} 
          />
          <Route 
            path="/driver-login" 
            element={!user ? <DriverLogin /> : <Navigate to="/driver" replace />} 
          />
          <Route 
            path="/student-setup" 
            element={<StudentSetup />} 
          />
          <Route 
            path="/buses" 
            element={<BusesDashboard />} 
          />

          {/* Protected Routes */}
          <Route 
            path="/driver" 
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <Driver />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/routes" 
            element={
              <ProtectedRoute allowedRoles={['passenger']}>
                <RouteList />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/passenger" 
            element={
              <ProtectedRoute allowedRoles={['passenger']}>
                <Passenger />
              </ProtectedRoute>
            } 
          />
           
           {/* Fallback for unknown routes */}
           <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
