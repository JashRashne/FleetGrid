import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Calendar, Printer, CheckCircle2, ShieldCheck, 
  ArrowLeft, User, Truck, Clock3, AlertCircle, Sparkles, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchLogs } from '../services/api';
import AppNavbar from './AppNavbar';
import DailyLogSheet from './DailyLogSheet';

export default function LogsHubPage() {
  const { user, activeTrip, savedTrips } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [selectedLogIndex, setSelectedLogIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAllLogs() {
      setIsLoading(true);
      // Try backend first
      const backendLogs = await fetchLogs();
      if (backendLogs && backendLogs.length > 0) {
        setLogs(backendLogs);
      } else if (activeTrip?.daily_logs && activeTrip.daily_logs.length > 0) {
        setLogs(activeTrip.daily_logs);
      } else if (savedTrips && savedTrips.length > 0 && savedTrips[0].daily_logs) {
        setLogs(savedTrips[0].daily_logs);
      }
      setIsLoading(false);
    }
    loadAllLogs();
  }, [activeTrip, savedTrips]);

  const handlePrint = () => {
    window.print();
  };

  const currentLog = logs[selectedLogIndex] || logs[0];

  return (
    <div className="logs-hub-page">
      <AppNavbar />

      <main className="logs-hub-main">
        {/* Top Header Banner */}
        <section className="logs-hero-banner">
          <div className="logs-hero-left">
            <span className="logs-eyebrow">
              <ShieldCheck size={15} />
              <span>FMCSA RODS / 24-Hour Duty Logs</span>
            </span>
            <h1>Driver Electronic Logbook</h1>
            <p>
              Official 49 CFR Part 395 Record of Duty Status (RODS) sheets. Complete with 24-hour quarter-hour grid, remarks table, and 70-hour/8-day driver recap.
            </p>
          </div>

          <div className="logs-hero-actions">
            <button 
              className="btn-print-log" 
              onClick={handlePrint}
              title="Print standard 8.5x11 FMCSA log sheet"
            >
              <Printer size={16} />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </section>

        {logs && logs.length > 0 ? (
          <div className="logs-content-layout">
            {/* Left Log Sheets Selector */}
            <aside className="logs-selector-sidebar">
              <div className="sidebar-title">
                <Calendar size={16} />
                <h3>Logbook Sheets ({logs.length})</h3>
              </div>

              <div className="log-sheets-tabs">
                {logs.map((log, index) => (
                  <button
                    key={log.id || `log_${index}`}
                    className={`log-sheet-tab-btn ${selectedLogIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedLogIndex(index)}
                  >
                    <div className="tab-top-row">
                      <span className="tab-day-badge">Day {log.day_number || index + 1}</span>
                      <span className="tab-date">{log.date || log.log_date || `Day ${index + 1}`}</span>
                    </div>
                    {log.trip_route && (
                      <span className="tab-route">{log.trip_route}</span>
                    )}
                    <div className="tab-hours-summary">
                      <span>Drive: <b>{log.totals?.DRIVING || log.total_driving_hours || 0}h</b></span>
                      <span>On-Duty: <b>{log.totals?.total_on_duty || log.total_on_duty_hours || 0}h</b></span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="compliance-cert-card">
                <div className="cert-header">
                  <CheckCircle2 size={16} />
                  <b>FMCSA Certification</b>
                </div>
                <p>
                  "I certify these entries are true and correct in compliance with 49 CFR § 395.8."
                </p>
                <div className="driver-signature-preview">
                  <span className="sig-label">Driver Signature:</span>
                  <span className="sig-name">{user?.name || currentLog?.driver_name || 'Alex Morgan'}</span>
                </div>
              </div>
            </aside>

            {/* Right Active Daily Log Sheet Viewer */}
            <section className="active-log-sheet-container">
              <div className="sheet-top-controls">
                <div className="sheet-meta">
                  <h2>Day {currentLog.day_number || selectedLogIndex + 1} Log Sheet</h2>
                  <span>Date: <b>{currentLog.date || currentLog.log_date || `Day ${selectedLogIndex + 1}`}</b> · Carrier: <b>{currentLog.carrier_name || 'MileMint Logistics LLC'}</b></span>
                </div>
                <button className="btn-print-compact" onClick={handlePrint}>
                  <Printer size={15} />
                  <span>Print Sheet</span>
                </button>
              </div>

              <div className="printable-log-sheet-area">
                <DailyLogSheet 
                  logData={currentLog} 
                  dayIndex={selectedLogIndex} 
                  totalDays={logs.length} 
                />
              </div>
            </section>
          </div>
        ) : (
          <div className="empty-logs-state">
            <FileText size={40} />
            <h2>No Log Sheets Generated Yet</h2>
            <p>Plan a compliant route to automatically generate FMCSA 24-hour log sheets for your trip.</p>
            <button 
              className="btn-plan-primary" 
              onClick={() => navigate('/plan')}
            >
              <span>Plan a Trip to Generate Logs</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
