import React, { useState } from 'react';
import { MapPin, Navigation, Clock, Play, RotateCcw, Sparkles } from 'lucide-react';

const PRESETS = [
  {
    label: "Short Trip (1 Day)",
    current: "Chicago, IL",
    pickup: "Indianapolis, IN",
    dropoff: "Columbus, OH",
    cycle: 15.0
  },
  {
    label: "Midwest-South (2 Days)",
    current: "Chicago, IL",
    pickup: "Indianapolis, IN",
    dropoff: "Atlanta, GA",
    cycle: 24.5
  },
  {
    label: "Coast-to-Coast (4 Days)",
    current: "New York, NY",
    pickup: "Chicago, IL",
    dropoff: "Los Angeles, CA",
    cycle: 35.0
  }
];

export default function TripInputForm({ onSubmit, isLoading }) {
  const [currentLocation, setCurrentLocation] = useState("Chicago, IL");
  const [pickupLocation, setPickupLocation] = useState("Indianapolis, IN");
  const [dropoffLocation, setDropoffLocation] = useState("Atlanta, GA");
  const [cycleUsed, setCycleUsed] = useState(24.5);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used_hours: parseFloat(cycleUsed),
      departure_time: new Date().toISOString()
    });
  };

  const applyPreset = (preset) => {
    setCurrentLocation(preset.current);
    setPickupLocation(preset.pickup);
    setDropoffLocation(preset.dropoff);
    setCycleUsed(preset.cycle);
  };

  return (
    <div className="clay-card form-card">
      <h2 className="form-title">
        <Navigation size={20} color="#3b82f6" />
        Trip Parameters
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">1. Current Location (Start)</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="clay-input"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              placeholder="e.g. Chicago, IL"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">2. Pickup Location (Shipper)</label>
          <input
            type="text"
            className="clay-input"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder="e.g. Indianapolis, IN"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">3. Dropoff Location (Receiver)</label>
          <input
            type="text"
            className="clay-input"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            placeholder="e.g. Atlanta, GA"
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label className="form-label">4. Current Cycle Used (0–70 Hrs)</label>
            <span style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'JetBrains Mono, monospace' }}>
              {parseFloat(cycleUsed).toFixed(1)} hrs
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="70"
            step="0.5"
            value={cycleUsed}
            onChange={(e) => setCycleUsed(e.target.value)}
            style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>0 hrs (Fresh)</span>
            <span>35 hrs</span>
            <span>70 hrs (Max)</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="clay-btn clay-btn-primary"
          style={{ width: '100%', marginTop: '10px' }}
        >
          {isLoading ? (
            <>
              <RotateCcw size={18} className="animate-spin" />
              Calculating Route & HOS Log...
            </>
          ) : (
            <>
              <Play size={18} />
              Generate Trip & ELD Logs
            </>
          )}
        </button>
      </form>

      <div style={{ marginTop: '22px', borderTop: '1px solid rgba(203, 213, 225, 0.5)', paddingTop: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={14} color="#f59e0b" />
          Quick Test Presets
        </div>
        <div className="preset-pills">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-pill"
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
