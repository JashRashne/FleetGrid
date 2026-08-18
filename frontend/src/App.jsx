import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TripInputForm from './components/TripInputForm';
import TripSummary from './components/TripSummary';
import RouteMap from './components/RouteMap';
import LogSheetViewer from './components/LogSheetViewer';
import EventTimeline from './components/EventTimeline';
import RouteDirections from './components/RouteDirections';
import { planTrip } from './services/api';
import { AlertCircle, RotateCcw, Info } from 'lucide-react';

export default function App() {
  const [tripData, setTripData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePlanTrip = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await planTrip(formData);
      setTripData(result);
    } catch (err) {
      setError(err.message || 'An error occurred while calculating the trip.');
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically plan initial default trip on first load
  useEffect(() => {
    handlePlanTrip({
      current_location: "Chicago, IL",
      pickup_location: "Indianapolis, IN",
      dropoff_location: "Atlanta, GA",
      current_cycle_used_hours: 24.5,
      departure_time: new Date().toISOString()
    });
  }, []);

  return (
    <div className="app-container">
      <Header />

      <main className="main-grid">
        {/* Left Column: Form & Controls */}
        <div>
          <TripInputForm onSubmit={handlePlanTrip} isLoading={isLoading} />

          {/* FMCSA HOS Compliance Rules Reference Card */}
          <div className="clay-card" style={{ padding: '20px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Info size={18} color="#3b82f6" />
              <h4 style={{ fontSize: '14px', fontWeight: 700 }}>FMCSA HOS Property Rules</h4>
            </div>
            <ul style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '18px' }}>
              <li><strong>11-Hour Driving Limit:</strong> Max 11h driving after 10h consecutive off-duty.</li>
              <li><strong>14-Hour Driving Window:</strong> No driving past 14th hour after coming on duty.</li>
              <li><strong>30-Min Rest Break:</strong> Required after 8 cumulative hours of driving. (Satisfied by fuel/pickup).</li>
              <li><strong>70-Hour / 8-Day Rule:</strong> Max 70 on-duty hours in 8 days. 34h restart resets cycle.</li>
              <li><strong>Fuel Interval:</strong> Scheduled at least once every 1,000 miles (30m On-Duty).</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Visual Dashboard Results */}
        <div>
          {error && (
            <div className="clay-card" style={{ padding: '18px', marginBottom: '24px', background: '#fef2f2', borderColor: '#fca5a5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} color="#ef4444" />
                <div style={{ flex: 1, fontSize: '14px', color: '#991b1b', fontWeight: 600 }}>
                  {error}
                </div>
                <button
                  type="button"
                  className="clay-btn"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {tripData && (
            <>
              {/* KPI Summary Metrics */}
              <TripSummary summary={tripData.summary} />

              {/* Interactive Route Map */}
              <RouteMap
                locations={tripData.locations}
                routeGeometry={tripData.route_geometry}
                events={tripData.events}
              />

              {/* FMCSA 24-Hour SVG Daily Log Sheets */}
              <LogSheetViewer dailyLogs={tripData.daily_logs} />

              {/* Chronological Event Schedule */}
              <EventTimeline events={tripData.events} />

              {/* Turn-by-Turn Route Instructions */}
              <RouteDirections steps={tripData.turn_by_turn_steps} />

              {/* Disclaimers & Attribution */}
              <div style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'center', marginTop: '30px', padding: '0 20px' }}>
                <p>{tripData.disclaimers?.routing}</p>
                <p style={{ marginTop: '4px' }}>{tripData.disclaimers?.attribution}</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
