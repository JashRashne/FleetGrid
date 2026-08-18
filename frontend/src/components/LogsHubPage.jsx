import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Calendar, Printer, CheckCircle2, ShieldCheck, 
  ArrowLeft, User, Truck, Clock3, AlertCircle, Sparkles, Download, PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchLogs } from '../services/api';
import AppNavbar from './AppNavbar';
import DailyLogSheet from './DailyLogSheet';

const SAMPLE_LOGS = [
  {
    day_number: 1,
    date: "2026-08-18",
    driver_name: "Alex Morgan (CDL-A)",
    carrier_name: "MileMint Logistics LLC",
    truck_number: "TRK-9042",
    trailer_number: "TLR-5510",
    total_miles_driving_today: 485.2,
    main_office_address: "100 Logistics Blvd, Suite 400, Chicago, IL",
    home_terminal_address: "770 Freight Way, Chicago, IL",
    trip_route: "Chicago, IL → Indianapolis, IN → Louisville, KY",
    totals_hours: {
      off_duty: 10.0,
      sleeper_berth: 0.0,
      driving: 8.5,
      on_duty_not_driving: 5.5,
      total: 24.0
    },
    segments: [
      { start_hour: 0, end_hour: 6.0, duty_status: "OFF_DUTY", remark: "Off-duty rest before shift", location: "Chicago, IL" },
      { start_hour: 6.0, end_hour: 7.0, duty_status: "ON_DUTY_NOT_DRIVING", remark: "Pre-trip inspection & Loading", location: "Chicago, IL" },
      { start_hour: 7.0, end_hour: 10.5, duty_status: "DRIVING", remark: "Interstate 65 Southbound", location: "Indianapolis, IN" },
      { start_hour: 10.5, end_hour: 11.5, duty_status: "ON_DUTY_NOT_DRIVING", remark: "Shipper Pickup & Cargo Check", location: "Indianapolis, IN" },
      { start_hour: 11.5, end_hour: 12.0, duty_status: "OFF_DUTY", remark: "30-min FMCSA Mandatory Rest Break", location: "Edinburgh, IN" },
      { start_hour: 12.0, end_hour: 17.0, duty_status: "DRIVING", remark: "Driving to Louisville Terminal", location: "Louisville, KY" },
      { start_hour: 17.0, end_hour: 17.5, duty_status: "ON_DUTY_NOT_DRIVING", remark: "Post-trip inspection & Fueling", location: "Louisville, KY" },
      { start_hour: 17.5, end_hour: 24.0, duty_status: "OFF_DUTY", remark: "10-Hour Sleeper/Off-Duty Reset", location: "Louisville, KY" }
    ],
    remarks: [
      { time_hour: 6.0, text: "Pre-trip inspection", location: "Chicago, IL" },
      { time_hour: 10.5, text: "Pickup freight", location: "Indianapolis, IN" },
      { time_hour: 11.5, text: "30-min rest break", location: "Edinburgh, IN" },
      { time_hour: 17.0, text: "Post-trip & fuel", location: "Louisville, KY" }
    ],
    recap: {
      on_duty_today_hours: 14.0,
      cycle_hours_at_start: 24.5,
      cycle_hours_cumulative: 38.5,
      cycle_hours_remaining: 31.5
    }
  }
];

export default function LogsHubPage() {
  const { user, activeTrip, savedTrips } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState(SAMPLE_LOGS);
  const [selectedLogIndex, setSelectedLogIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAllLogs() {
      setIsLoading(true);
      try {
        // Try backend first
        const backendLogs = await fetchLogs();
        if (backendLogs && backendLogs.length > 0) {
          setLogs(backendLogs);
        } else if (activeTrip?.daily_logs && activeTrip.daily_logs.length > 0) {
          setLogs(activeTrip.daily_logs);
        } else if (savedTrips && savedTrips.length > 0 && savedTrips[0].daily_logs && savedTrips[0].daily_logs.length > 0) {
          setLogs(savedTrips[0].daily_logs);
        } else {
          setLogs(SAMPLE_LOGS);
        }
      } catch (err) {
        console.warn("Failed to fetch logs from backend, using fallback:", err);
        setLogs(SAMPLE_LOGS);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllLogs();
  }, [activeTrip, savedTrips]);

  const handlePrint = () => {
    window.print();
  };

  const currentLog = (logs && logs.length > 0) ? (logs[selectedLogIndex] || logs[0]) : SAMPLE_LOGS[0];

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
            <button
              className="btn-plan-from-logs"
              onClick={() => navigate('/plan')}
            >
              <PlusCircle size={16} />
              <span>Plan New Trip</span>
            </button>
          </div>
        </section>

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
                    <span>Drive: <b>{log.totals_hours?.driving ?? log.totals?.DRIVING ?? 8.5}h</b></span>
                    <span>On-Duty: <b>{log.totals_hours ? ((log.totals_hours.driving || 0) + (log.totals_hours.on_duty_not_driving || 0)).toFixed(1) : (log.totals?.total_on_duty ?? 14)}h</b></span>
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
                <h2>Day {currentLog?.day_number || selectedLogIndex + 1} Log Sheet</h2>
                <span>Date: <b>{currentLog?.date || currentLog?.log_date || `Day ${selectedLogIndex + 1}`}</b> · Carrier: <b>{currentLog?.carrier_name || 'MileMint Logistics LLC'}</b></span>
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
      </main>
    </div>
  );
}
