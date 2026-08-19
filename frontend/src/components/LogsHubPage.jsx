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
import useDocumentTitle from '../hooks/useDocumentTitle';

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

function computeSidebarLogHours(log) {
  const rawSegments = log?.segments || log?.duty_segments || log?.grid_intervals || [];
  if (rawSegments && rawSegments.length > 0) {
    let driveHours = 0;
    let onDutyNotDriveHours = 0;

    rawSegments.forEach((seg) => {
      const startH = seg.start_hour !== undefined ? Number(seg.start_hour) : (seg.start_min !== undefined ? seg.start_min / 60 : 0);
      const endH = seg.end_hour !== undefined ? Number(seg.end_hour) : (seg.end_min !== undefined ? seg.end_min / 60 : 24);
      const dur = Math.max(0, endH - startH);
      const combined = `${seg.duty_status || ''} ${seg.remark || ''}`.toUpperCase();

      if (combined.includes('DRIV')) {
        driveHours += dur;
      } else if (
        combined.includes('ON_DUTY') || combined.includes('ON DUTY') ||
        combined.includes('LOAD') || combined.includes('PICKUP') ||
        combined.includes('UNLOAD') || combined.includes('INSPECT') ||
        combined.includes('FUEL')
      ) {
        onDutyNotDriveHours += dur;
      }
    });

    if (driveHours > 0 || onDutyNotDriveHours > 0) {
      return {
        driving: Number(driveHours.toFixed(1)),
        onDuty: Number((driveHours + onDutyNotDriveHours).toFixed(1))
      };
    }
  }

  // Fall back to totals_hours object, then flat model fields, then totals dict
  const driving = Number(
    log?.totals_hours?.driving ??
    log?.total_driving_hours ??
    log?.totals?.DRIVING ??
    0
  );
  const onDutyNotDriving = Number(
    log?.totals_hours?.on_duty_not_driving ??
    log?.total_on_duty_hours ??
    log?.totals?.ON_DUTY_NOT_DRIVING ??
    0
  );
  return {
    driving: Number(driving.toFixed(1)),
    onDuty: Number((driving + onDutyNotDriving).toFixed(1))
  };
}

export default function LogsHubPage() {
  useDocumentTitle('Logs · MileMint');
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
        const hasRealHours = (logsArr) => logsArr.some(l => {
          const t = l?.totals_hours;
          return t && (t.driving > 0 || t.on_duty_not_driving > 0);
        });

        if (backendLogs && backendLogs.length > 0 && hasRealHours(backendLogs)) {
          setLogs(backendLogs);
        } else if (activeTrip?.daily_logs && activeTrip.daily_logs.length > 0) {
          setLogs(activeTrip.daily_logs);
        } else if (savedTrips && savedTrips.length > 0 && savedTrips[0].daily_logs && savedTrips[0].daily_logs.length > 0) {
          setLogs(savedTrips[0].daily_logs);
        } else if (backendLogs && backendLogs.length > 0) {
          // Backend has records but all zero-hours — still show them
          setLogs(backendLogs);
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
              {logs.map((log, index) => {
                const stats = computeSidebarLogHours(log);
                return (
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
                      <span>Drive: <b>{stats.driving}h</b></span>
                      <span>On-Duty: <b>{stats.onDuty}h</b></span>
                    </div>
                  </button>
                );
              })}
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
