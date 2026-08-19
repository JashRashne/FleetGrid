import React, { useState, useEffect } from 'react';
import { 
  MapPin, PackageCheck, Navigation, Clock3, 
  Sparkles, ArrowRight, Play, CheckCircle2, RotateCcw, AlertCircle, ShieldCheck
} from 'lucide-react';

export const TRIP_PRESETS = [
  { label: 'Chicago → Atlanta (2-Day Standard)', current: 'Chicago, IL', pickup: 'Indianapolis, IN', dropoff: 'Atlanta, GA', cycle: 24.5, miles: '712 mi' },
  { label: 'Chicago → Columbus (1-Day Regional)', current: 'Chicago, IL', pickup: 'Indianapolis, IN', dropoff: 'Columbus, OH', cycle: 15.0, miles: '358 mi' },
  { label: 'New York → Los Angeles (Long-Haul)', current: 'New York, NY', pickup: 'Chicago, IL', dropoff: 'Los Angeles, CA', cycle: 35.0, miles: '2,790 mi' }
];

const QUICK_CITIES = ['Chicago, IL', 'Indianapolis, IN', 'Atlanta, GA', 'Columbus, OH', 'Dallas, TX', 'Los Angeles, CA', 'New York, NY'];

export default function TripInputForm({ 
  onSubmit, 
  isLoading, 
  initialValues,
  currentLocation,
  setCurrentLocation,
  pickupLocation,
  setPickupLocation,
  dropoffLocation,
  setDropoffLocation,
  cycleUsed,
  setCycleUsed,
  onApplyPreset
}) {
  const handlePresetClick = (preset) => {
    setCurrentLocation(preset.current);
    setPickupLocation(preset.pickup);
    setDropoffLocation(preset.dropoff);
    setCycleUsed(preset.cycle);
    if (onApplyPreset) onApplyPreset(preset);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentLocation.trim() || !pickupLocation.trim() || !dropoffLocation.trim()) {
      return;
    }
    onSubmit({
      current_location: currentLocation.trim(),
      pickup_location: pickupLocation.trim(),
      dropoff_location: dropoffLocation.trim(),
      current_cycle_used_hours: parseFloat(cycleUsed),
      departure_time: new Date().toISOString()
    });
  };

  const cycleHoursNum = parseFloat(cycleUsed) || 0;
  const cycleHoursLeft = Math.max(0, 70.0 - cycleHoursNum).toFixed(1);
  const cyclePct = Math.min(100, Math.round((cycleHoursNum / 70.0) * 100));

  return (
    <div className="planner-unified-card">
      <div className="planner-card-header">
        <div className="card-header-titles">
          <span className="card-kicker">DISPATCH CONFIGURATION</span>
          <h2>Route & HOS Parameters</h2>
          <p>Specify the origin, shipper pickup, consignee delivery, and prior duty hours.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="planner-unified-form">
        {/* Route Inputs Section */}
        <div className="planner-section-group">
          <div className="section-group-label">
            <span>01</span>
            <h3>Route Waypoints</h3>
          </div>

          <div className="planner-fields-stack">
            {/* Field 1: Current / Starting Location */}
            <div className="planner-input-field">
              <label htmlFor="current-location">
                <span className="label-icon start-icon"><MapPin size={16} /></span>
                <span>Starting Point (Current Location)</span>
              </label>
              <input
                id="current-location"
                type="text"
                className="planner-text-input"
                placeholder="e.g. Chicago, IL"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                required
              />
              <span className="field-hint">Where the truck and driver are currently positioned.</span>
            </div>

            {/* Field 2: Pickup / Shipper */}
            <div className="planner-input-field">
              <label htmlFor="pickup-location">
                <span className="label-icon pickup-icon"><PackageCheck size={16} /></span>
                <span>Pickup Location (Shipper Loading)</span>
              </label>
              <input
                id="pickup-location"
                type="text"
                className="planner-text-input"
                placeholder="e.g. Indianapolis, IN"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
              />
              <span className="field-hint">Includes standard 1.0 hour on-duty loading window.</span>
            </div>

            {/* Field 3: Dropoff / Delivery */}
            <div className="planner-input-field">
              <label htmlFor="dropoff-location">
                <span className="label-icon dropoff-icon"><Navigation size={16} /></span>
                <span>Delivery Location (Receiver Unloading)</span>
              </label>
              <input
                id="dropoff-location"
                type="text"
                className="planner-text-input"
                placeholder="e.g. Atlanta, GA"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                required
              />
              <span className="field-hint">Includes standard 1.0 hour on-duty unloading window.</span>
            </div>
          </div>
        </div>

        {/* HOS Hours Section */}
        <div className="planner-section-group">
          <div className="section-group-label">
            <span>02</span>
            <h3>FMCSA 70h / 8-Day Cycle Status</h3>
          </div>

          <div className="planner-cycle-box">
            <div className="cycle-box-header">
              <div>
                <label htmlFor="cycle-slider" className="cycle-label">On-duty Hours Used in Last 8 Days</label>
                <p className="cycle-sub">Accumulated on-duty & driving hours prior to departure.</p>
              </div>
              <div className="cycle-hours-pill">
                <strong>{cycleHoursNum.toFixed(1)} hrs</strong>
                <span>/ {cycleHoursLeft} hrs left</span>
              </div>
            </div>

            <div className="cycle-slider-wrapper">
              <input
                id="cycle-slider"
                type="range"
                min="0"
                max="70"
                step="0.5"
                value={cycleUsed}
                onChange={(e) => setCycleUsed(e.target.value)}
                className="planner-range-slider"
              />
              <div className="slider-ticks">
                <span>0h (Fresh 70h)</span>
                <span>35h (Half)</span>
                <span>70h (Exhausted)</span>
              </div>
            </div>

            <div className="cycle-presets-row">
              <span className="presets-label">Quick set:</span>
              <button type="button" className={`cycle-chip ${cycleHoursNum === 0 ? 'active' : ''}`} onClick={() => setCycleUsed(0)}>0h (Fresh)</button>
              <button type="button" className={`cycle-chip ${cycleHoursNum === 15 ? 'active' : ''}`} onClick={() => setCycleUsed(15)}>15h</button>
              <button type="button" className={`cycle-chip ${cycleHoursNum === 24.5 ? 'active' : ''}`} onClick={() => setCycleUsed(24.5)}>24.5h (Standard)</button>
              <button type="button" className={`cycle-chip ${cycleHoursNum === 35 ? 'active' : ''}`} onClick={() => setCycleUsed(35)}>35h (Half)</button>
            </div>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="planner-presets-section">
          <span className="presets-section-title">
            <Sparkles size={14} /> Quick Dispatch Scenarios
          </span>
          <div className="presets-button-grid">
            {TRIP_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="preset-card-btn"
                onClick={() => handlePresetClick(preset)}
              >
                <span className="preset-name">{preset.label}</span>
                <span className="preset-meta">{preset.miles} · {preset.cycle}h cycle</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="planner-submit-bar">
          <button 
            type="submit" 
            className="planner-primary-submit-btn" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" />
                <span>Calculating Route & FMCSA Logs…</span>
              </>
            ) : (
              <>
                <span>Calculate Route & Generate ELD Logs</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
