import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import TripsPage from './components/TripsPage';
import PlannerExperience from './components/PlannerExperience';
import LogsHubPage from './components/LogsHubPage';

/**
 * Route protection wrapper:
 * Redirects unauthenticated visitors to /login and preserves their intended target route in state.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Authentication Page */}
          <Route path="/login" element={<AuthPage />} />

          {/* Protected Driver Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Trip History & Archive */}
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <TripsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Trip Planner */}
          <Route
            path="/plan"
            element={
              <ProtectedRoute>
                <PlannerExperience />
              </ProtectedRoute>
            }
          />

          {/* Protected Trip Result by UUID */}
          <Route
            path="/trip/:tripId"
            element={
              <ProtectedRoute>
                <PlannerExperience />
              </ProtectedRoute>
            }
          />

          {/* Protected ELD Daily Logs Hub */}
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <LogsHubPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
