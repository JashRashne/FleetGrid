import React from 'react';
import { Route, Clock, Fuel, Coffee, Moon, BatteryCharging } from 'lucide-react';

export default function TripSummary(props) {
  const summary = props.summary || props.trip?.summary || props.trip?.summary_json || props.trip;
  if (!summary) return null;

  const totalDistance = summary.total_distance_miles ?? summary.total_miles ?? 0;
  const driveHours = summary.total_drive_time_hours ?? summary.driving_hours ?? 0;
  const driveMinutes = summary.total_drive_time_minutes ?? Math.round(driveHours * 60);
  const totalDuration = summary.total_trip_duration_hours ?? summary.total_duration_hours ?? 0;
  const fuelStops = summary.total_fuel_stops ?? summary.fuel_stops_count ?? 0;
  const restBreaks = summary.total_rest_breaks ?? 0;
  const sleeperResets = summary.total_sleeper_resets ?? 0;
  const days = summary.days_required ?? 1;
  const cycleEnding = summary.cycle_hours_ending ?? summary.cycle_hours_at_end ?? 0;
  const cycleRemaining = summary.cycle_hours_remaining ?? Math.max(0, 70 - cycleEnding).toFixed(1);

  return (
    <div className="kpi-grid">
      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">Total Distance</span>
          <Route size={18} color="#3b82f6" />
        </div>
        <div className="kpi-value">{Number(totalDistance).toLocaleString()} mi</div>
        <span className="kpi-sub">{days} Calendar Day{days > 1 ? 's' : ''}</span>
      </div>

      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">Driving Time</span>
          <Clock size={18} color="#10b981" />
        </div>
        <div className="kpi-value">{driveHours} hrs</div>
        <span className="kpi-sub">{driveMinutes} driving mins</span>
      </div>

      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">Total Span</span>
          <Moon size={18} color="#8b5cf6" />
        </div>
        <div className="kpi-value">{totalDuration} hrs</div>
        <span className="kpi-sub">Drive + Stops + Resets</span>
      </div>

      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">HOS Stops</span>
          <Coffee size={18} color="#f59e0b" />
        </div>
        <div className="kpi-value" style={{ fontSize: '18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span title="Fuel Stops">🛢️ {fuelStops}</span>
          <span title="30m Breaks">🛑 {restBreaks}</span>
          <span title="10h Sleeper Resets">🛌 {sleeperResets}</span>
        </div>
        <span className="kpi-sub">Compliance Milestones</span>
      </div>

      <div className="clay-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kpi-title">70-Hr Cycle</span>
          <BatteryCharging size={18} color="#2563eb" />
        </div>
        <div className="kpi-value" style={{ fontSize: '17px' }}>
          {cycleEnding} / 70.0 h
        </div>
        <span className="kpi-sub">{cycleRemaining} hrs left after trip</span>
      </div>
    </div>
  );
}
