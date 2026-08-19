import React from 'react';
import { Route, Clock, Moon, Coffee, BatteryCharging, Fuel, Bed, AlertOctagon } from 'lucide-react';

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
      {/* 01: Total Distance */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <span className="kpi-title">TOTAL DISTANCE</span>
          <span className="kpi-icon-wrap icon-blue">
            <Route size={16} />
          </span>
        </div>
        <div className="kpi-value">{Number(totalDistance).toLocaleString()} <span className="kpi-unit">mi</span></div>
        <div className="kpi-sub">{days} Calendar Day{days > 1 ? 's' : ''}</div>
      </div>

      {/* 02: Driving Time */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <span className="kpi-title">DRIVING TIME</span>
          <span className="kpi-icon-wrap icon-green">
            <Clock size={16} />
          </span>
        </div>
        <div className="kpi-value">{driveHours} <span className="kpi-unit">hrs</span></div>
        <div className="kpi-sub">{driveMinutes.toLocaleString()} driving mins</div>
      </div>

      {/* 03: Total Duration */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <span className="kpi-title">TOTAL SPAN</span>
          <span className="kpi-icon-wrap icon-purple">
            <Moon size={16} />
          </span>
        </div>
        <div className="kpi-value">{totalDuration} <span className="kpi-unit">hrs</span></div>
        <div className="kpi-sub">Drive + Stops + Resets</div>
      </div>

      {/* 04: HOS Milestones */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <span className="kpi-title">HOS STOPS</span>
          <span className="kpi-icon-wrap icon-amber">
            <Coffee size={16} />
          </span>
        </div>
        <div className="kpi-milestones-row">
          <span className="milestone-chip" title="Fuel Stops">
            <Fuel size={13} /> {fuelStops} Fuel
          </span>
          <span className="milestone-chip" title="30-Min Rest Breaks">
            <Coffee size={13} /> {restBreaks} Rest
          </span>
          <span className="milestone-chip" title="10-Hour Sleeper Resets">
            <Bed size={13} /> {sleeperResets} Sleep
          </span>
        </div>
        <div className="kpi-sub">Compliance Milestones</div>
      </div>

      {/* 05: 70-Hr Cycle */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <span className="kpi-title">70-HR CYCLE</span>
          <span className="kpi-icon-wrap icon-indigo">
            <BatteryCharging size={16} />
          </span>
        </div>
        <div className="kpi-value">{cycleEnding} <span className="kpi-unit">/ 70.0 h</span></div>
        <div className="kpi-sub">{cycleRemaining} hrs remaining</div>
      </div>
    </div>
  );
}

