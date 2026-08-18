import React from 'react';
import { Route, Clock, Fuel, Coffee, Moon, BatteryCharging } from 'lucide-react';

export default function TripSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="kpi-grid">
      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">Total Distance</span>
          <Route size={18} color="#3b82f6" />
        </div>
        <div className="kpi-value">{summary.total_distance_miles.toLocaleString()} mi</div>
        <span className="kpi-sub">{summary.days_required} Calendar Day{summary.days_required > 1 ? 's' : ''}</span>
      </div>

      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">Driving Time</span>
          <Clock size={18} color="#10b981" />
        </div>
        <div className="kpi-value">{summary.total_drive_time_hours} hrs</div>
        <span className="kpi-sub">{summary.total_drive_time_minutes} driving mins</span>
      </div>

      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">Total Span</span>
          <Moon size={18} color="#8b5cf6" />
        </div>
        <div className="kpi-value">{summary.total_trip_duration_hours} hrs</div>
        <span className="kpi-sub">Drive + Stops + Resets</span>
      </div>

      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">HOS Stops</span>
          <Coffee size={18} color="#f59e0b" />
        </div>
        <div className="kpi-value" style={{ fontSize: '18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span title="Fuel Stops">🛢️ {summary.total_fuel_stops}</span>
          <span title="30m Breaks">🛑 {summary.total_rest_breaks}</span>
          <span title="10h Sleeper Resets">🛌 {summary.total_sleeper_resets}</span>
        </div>
        <span className="kpi-sub">Compliance Milestones</span>
      </div>

      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">70-Hr Cycle</span>
          <BatteryCharging size={18} color="#2563eb" />
        </div>
        <div className="kpi-value" style={{ fontSize: '17px' }}>
          {summary.cycle_hours_ending} / 70.0 h
        </div>
        <span className="kpi-sub">{summary.cycle_hours_remaining} hrs left after trip</span>
      </div>
    </div>
  );
}
