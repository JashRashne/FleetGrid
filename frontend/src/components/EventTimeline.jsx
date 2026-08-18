import React, { useState } from 'react';
import { Clock, Shield, Fuel, Coffee, Moon, Flag, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  DRIVING: { label: "Driving", pillClass: "clay-pill-blue", icon: Flag },
  ON_DUTY_NOT_DRIVING: { label: "On Duty (Not Driving)", pillClass: "clay-pill-amber", icon: Fuel },
  OFF_DUTY: { label: "Off Duty", pillClass: "clay-pill-purple", icon: Coffee },
  SLEEPER_BERTH: { label: "Sleeper Berth", pillClass: "clay-pill-green", icon: Moon },
};

export default function EventTimeline({ events }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!events || events.length === 0) return null;

  return (
    <div className="clay-card timeline-card">
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} color="#3b82f6" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
            Chronological Trip Schedule & Milestones ({events.length} Events)
          </h3>
        </div>
        <button type="button" className="clay-pill" style={{ border: 'none', cursor: 'pointer' }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="timeline-list">
          {events.map((evt, idx) => {
            const config = STATUS_CONFIG[evt.duty_status] || STATUS_CONFIG.OFF_DUTY;
            const Icon = config.icon;

            return (
              <div key={evt.event_id || idx} className="timeline-item">
                <div style={{ paddingTop: '2px' }}>
                  <span className={`clay-pill ${config.pillClass}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                    <Icon size={12} />
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{evt.remark}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {evt.duration_minutes} mins ({roundHours(evt.duration_minutes)}h)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#94a3b8" />
                      {evt.location_name}
                    </span>
                    <span>• Cumulative: {evt.route_distance_miles} mi</span>
                    <span>• Status: <strong style={{ color: '#1e293b' }}>{config.label}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function roundHours(mins) {
  return (mins / 60.0).toFixed(1);
}
