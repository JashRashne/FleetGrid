import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import PlannerExperience from './components/PlannerExperience';
import LogsHubPage from './components/LogsHubPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Page */}
          <Route path="/login" element={<AuthPage />} />

          {/* Driver Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Trip Planner */}
          <Route path="/plan" element={<PlannerExperience />} />

          {/* Specific Trip Result by UUID */}
          <Route path="/trip/:tripId" element={<PlannerExperience />} />

          {/* Dedicated ELD Daily Logs Hub */}
          <Route path="/logs" element={<LogsHubPage />} />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
